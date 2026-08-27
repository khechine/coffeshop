import { Injectable, Logger } from '@nestjs/common';
import { dtToMillimes, mapPaymentMethod, mapOperationType, taxRateToCode, generateTransactionId, truncateNacef } from './nacef.helpers';

@Injectable()
export class NacefTicketBuilder {
  private readonly logger = new Logger(NacefTicketBuilder.name);

  /**
   * Build a NACEF-compliant ticket payload (schema v1.1.4)
   * from internal Sale + Store data
   */
  buildTicket(sale: any, store: any, items: any[]): NacefTicket {
    const transactionId = generateTransactionId(sale.fiscalNumber || sale.id);
    const timestamp = (sale.createdAt || new Date()).toISOString();

    // Determine operation type
    const opType = mapOperationType(
      sale.isVoid,
      sale.nacefOperationType === 'DUPLICATE',
      sale.nacefOperationType === 'PROFORMA'
    );

    // Map payment methods to NACEF collection_details
    const collectionDetails = this.buildCollectionDetails(sale);
    const returnedChange = this.buildReturnedChange(sale);

    // [E0204-GAP-1] cash_register_serialnumber must be 8-32 chars
    // Prefer dedicated terminalId, fallback to store.id truncated (UUID → 32 chars max)
    const rawSerialNumber = sale.terminalId || store.id || 'UNKNOWN';
    const cashRegisterSerial = truncateNacef(rawSerialNumber, 32);

    // [E0209-GAP-1] Map sale.discount to general_discount
    const discountDt = Number(sale.discount) || 0;
    const totalTtc = Number(sale.total) || 0;
    const discountPercent = totalTtc > 0 && discountDt > 0
      ? Math.min(100, parseFloat(((discountDt / (totalTtc + discountDt)) * 100).toFixed(4)))
      : 0;

    // [E0213-GAP-1] Delivery mode: use paymentDetails.carrierId if present
    const carrierId: string | undefined = sale.paymentDetails?.carrierId;
    const deliveryDetails: NacefTicket['delivery_details'] =
      carrierId && /^\d{7}[A-Z]$/.test(carrierId)
        ? { type: 'DELIVERY', carrier_id: carrierId }
        : { type: 'SELF_PICKUP' };

    return {
      data_type: 'ncf.cashier.operation',
      version: '1.1.4',
      transaction: {
        id: transactionId,
        timestamp,
        operation: {
          op_type: opType as any,
          context: (sale.nacefContext || 'SALE') as any,
          ...(opType === 'DUPLICATE' && sale.nacefDuplicateOf
            ? { duplicated_transaction_identifier: sale.nacefDuplicateOf }
            : {}),
        },
        originator: {
          // [E0204] All fields must respect min/max length constraints
          agent_identifier: truncateNacef(sale.baristaId || sale.barista?.name || 'UNKNOWN', 32),
          imdf: store.imdf || '',
          cash_register_serialnumber: cashRegisterSerial,
          cash_register_software: truncateNacef('CoffeeShopPOS v1.0.0', 32),
          accreditation_reference: truncateNacef(store.accreditationReference || '', 32),
        },
      },
      merchant_identity: {
        id: store.matriculeFiscal || '',
        id_type: 'MF',
        taxpayer_establishment: {
          commercial_name: truncateNacef(store.commercialName || store.name, 64),
          reference: store.establishmentReference || '000',
          address: truncateNacef(store.address || '', 128),
          city: truncateNacef(store.city || '', 32),
        },
      },
      customer_identity: this.buildCustomerIdentity(sale),
      sale_details: items.map((item) => this.buildSaleItem(item)),
      tax_summary: this.buildTaxSummary(items),
      // [E0209-GAP-1] Mapper la remise globale si présente
      general_discount: {
        percent: discountPercent,
        value: dtToMillimes(discountDt),
      },
      // [E0210-GAP-1] Utiliser 'EXONERE' au lieu de 'NONE' (code non valide NACEF)
      additional_tax: { type: 'percent', value: 0, tax_code: 'EXONERE' },
      payment_details: {
        collection_details: collectionDetails,
        returned_change: returnedChange,
      },
      sale_summary: {
        total_excl_tax: dtToMillimes(Number(sale.totalHt) || 0),
        total_incl_tax: dtToMillimes(Number(sale.total) || 0),
        total_tax: dtToMillimes(Number(sale.totalTax) || 0),
      },
      delivery_details: deliveryDetails,
    };
  }

  /**
   * Build base64-encoded ticket for signing
   */
  toBase64(ticket: NacefTicket): string {
    return Buffer.from(JSON.stringify(ticket)).toString('base64');
  }

  private buildCollectionDetails(sale: any): any[] {
    // Handle MIXED payments
    if (sale.paymentMethod === 'MIXED' && sale.paymentDetails) {
      const details = sale.paymentDetails;
      const collections: any[] = [];

      if (details.cash && details.cash > 0) {
        collections.push({ method: 'cash', amount: dtToMillimes(details.cash) });
      }
      if (details.card && details.card > 0) {
        collections.push({ method: 'bank_card', amount: dtToMillimes(details.card) });
      }
      if (details.points && details.points > 0) {
        collections.push({ method: 'contre_bon', amount: dtToMillimes(details.points) });
      }

      return collections.length > 0 ? collections : [{ method: 'cash', amount: dtToMillimes(Number(sale.total) || 0) }];
    }

    // Single payment method
    return [{
      method: mapPaymentMethod(sale.paymentMethod || 'CASH'),
      amount: dtToMillimes(Number(sale.total) || 0),
    }];
  }

  private buildReturnedChange(sale: any): any[] {
    const changeAmount = Number(sale.change) || 0;
    if (changeAmount > 0) {
      return [{ method: 'cash', amount: dtToMillimes(changeAmount) }];
    }
    return [];
  }

  private buildCustomerIdentity(sale: any): any {
    if (sale.customerId && sale.customer?.fiscalId) {
      return {
        id_type: 'PP',
        id: sale.customer.fiscalId,
      };
    }
    return { id_type: 'NP' };
  }

  private buildSaleItem(item: any): any {
    const taxRate = Number(item.taxRate) || 0.19;
    const unitPriceHt = Number(item.unitPriceHt) || (Number(item.price) / (1 + taxRate));
    const quantity = item.quantity || 1;
    const taxCode = item.product?.taxCode || taxRateToCode(taxRate);

    // [E0207-GAP-1] family_code : utiliser taxCode du produit si disponible car
    // categoryId est un CUID non adapté. En attendant un champ familyCode dédié
    // dans le schéma, on encode le code taxe (ex: "TVA19") sur 2-8 chars.
    const rawFamilyCode = item.product?.taxCode
      ? item.product.taxCode.slice(0, 8)          // "TVA19" → conforme
      : (item.product?.categoryId || 'F001').slice(0, 8);  // CUID tronqué → fallback
    const familyCode = rawFamilyCode.length >= 2 ? rawFamilyCode : 'F001';

    return {
      product: {
        family_code: familyCode,
        name: truncateNacef(item.product?.name || item.productId, 64),
        price_pre_tax: Math.max(1, dtToMillimes(unitPriceHt)), // mininum: 1 millime
      },
      taxation: [{
        type: 'percent',
        // [E0207-GAP-2] Valeur en float (ex: 19.0 pour 19%) et non entier×100
        value: parseFloat((taxRate * 100).toFixed(2)),
        tax_code: taxCode,
      }],
      quantity,
      discount_per_unit: { percent: 0, value: 0 },
    };
  }

  private buildTaxSummary(items: any[]): any[] {
    const taxMap: Record<string, number> = {};

    for (const item of items) {
      const taxRate = Number(item.taxRate) || 0.19;
      const taxCode = item.product?.taxCode || taxRateToCode(taxRate);
      const unitPriceHt = Number(item.unitPriceHt) || (Number(item.price) / (1 + taxRate));
      const quantity = item.quantity || 1;
      const taxAmount = unitPriceHt * quantity * taxRate;

      taxMap[taxCode] = (taxMap[taxCode] || 0) + taxAmount;
    }

    return Object.entries(taxMap).map(([tax_code, total_amount]) => ({
      tax_code,
      total_amount: dtToMillimes(total_amount),
    }));
  }
}

/**
 * NACEF Ticket type definition (schema v1.1.4)
 */
export interface NacefTicket {
  data_type: 'ncf.cashier.operation';
  version: '1.1.4';
  transaction: {
    id: string;
    timestamp: string;
    operation: {
      op_type: 'TICKET' | 'PROFORMA' | 'REFUND' | 'DUPLICATE';
      context: 'SALE' | 'TRAINING';
      duplicated_transaction_identifier?: string;
    };
    originator: {
      agent_identifier: string;
      imdf: string;
      cash_register_serialnumber: string;
      cash_register_software: string;
      accreditation_reference: string;
    };
  };
  merchant_identity: {
    id: string;
    id_type: 'MF';
    taxpayer_establishment: {
      commercial_name: string;
      reference: string;
      address: string;
      city: string;
    };
  };
  customer_identity: {
    id_type: 'PP' | 'NP';
    id?: string;
    fiscal_advantages?: string;
  };
  sale_details: any[];
  tax_summary: any[];
  general_discount: { percent: number; value: number };
  additional_tax: { type: string; value: number; tax_code: string };
  payment_details: {
    collection_details: any[];
    returned_change: any[];
  };
  sale_summary: {
    total_excl_tax: number;
    total_incl_tax: number;
    total_tax: number;
  };
  delivery_details: {
    type: 'SELF_PICKUP' | 'DELIVERY';
    carrier_id?: string;
  };
}
