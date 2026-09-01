/**
 * Tests unitaires du domaine NACEF — construction du ticket fiscal.
 *
 * Le builder transforme une vente interne en payload NACEF v1.1.4
 * conforme (contrôles de longueur, mapping paiement, remise, TVA).
 */
import { describe, it, expect } from 'vitest';
import { NacefTicketBuilder } from '../../nacef/nacef-ticket.builder';

const builder = new NacefTicketBuilder();

const baseSale: any = {
  id: 'sale1',
  fiscalNumber: 'FAC-2026-000001',
  total: 11.9,
  totalHt: 10,
  totalTax: 1.9,
  isVoid: false,
  paymentMethod: 'CASH',
  paymentDetails: undefined,
  baristaId: 'barista1',
  terminalId: 'TERMINAL-123',
  storeId: 'store1',
  createdAt: new Date('2026-09-01T12:00:00.000Z'),
  discount: 0,
};

const baseStore: any = {
  id: 'store1',
  name: 'Central Perk',
  commercialName: 'Central Perk Tunis',
  matriculeFiscal: '1234567A',
  accreditationReference: 'ACC-2026-0001',
  imdf: 'IMDF1234567890',
  establishmentReference: '000',
  address: 'Avenue Habib',
  city: 'Tunis',
};

const baseItems: any[] = [
  {
    productId: 'p1',
    product: { name: 'Cappuccino', taxCode: 'TVA19' },
    quantity: 1,
    price: 11.9,
    unitPriceHt: 10,
    taxRate: 0.19,
  },
];

describe('NacefTicketBuilder.buildTicket', () => {
  it('builds_a_valid_v1_1_4_ticket_with_sale_summary', () => {
    const ticket = builder.buildTicket(baseSale, baseStore, baseItems);

    expect(ticket.version).toBe('1.1.4');
    expect(ticket.transaction.operation.op_type).toBe('TICKET');
    expect(ticket.sale_summary.total_incl_tax).toBe(11900); // millimes
    expect(ticket.sale_summary.total_excl_tax).toBe(10000);
    expect(ticket.sale_summary.total_tax).toBe(1900);
  });

  it('maps_payment_method_to_collection_details', () => {
    const ticket = builder.buildTicket(baseSale, baseStore, baseItems);
    expect(ticket.payment_details.collection_details).toEqual([
      { method: 'cash', amount: 11900 },
    ]);
  });

  it('handles_mixed_payment_split', () => {
    const sale = {
      ...baseSale,
      paymentMethod: 'MIXED',
      paymentDetails: { cash: 5, card: 6.9, points: 0 },
    };
    const ticket = builder.buildTicket(sale, baseStore, baseItems);
    expect(ticket.payment_details.collection_details).toEqual([
      { method: 'cash', amount: 5000 },
      { method: 'bank_card', amount: 6900 },
    ]);
  });

  it('uses_refund_operation_type_when_sale_is_void', () => {
    const ticket = builder.buildTicket({ ...baseSale, isVoid: true }, baseStore, baseItems);
    expect(ticket.transaction.operation.op_type).toBe('REFUND');
  });

  it('uses_delivery_details_when_carrier_valid', () => {
    const sale = {
      ...baseSale,
      paymentDetails: { carrierId: '1234567A' },
    };
    const ticket = builder.buildTicket(sale, baseStore, baseItems);
    expect(ticket.delivery_details.type).toBe('DELIVERY');
    expect(ticket.delivery_details.carrier_id).toBe('1234567A');
  });

  it('defaults_to_self_pickup_without_valid_carrier', () => {
    const ticket = builder.buildTicket(baseSale, baseStore, baseItems);
    expect(ticket.delivery_details.type).toBe('SELF_PICKUP');
  });

  it('builds_tax_summary_per_tax_code', () => {
    const ticket = builder.buildTicket(baseSale, baseStore, baseItems);
    expect(Array.isArray(ticket.tax_summary)).toBe(true);
    expect(ticket.tax_summary).toContainEqual(
      expect.objectContaining({ tax_code: 'TVA19' }),
    );
  });

  it('truncates_serial_number_to_32_chars', () => {
    const sale = { ...baseSale, terminalId: 'X'.repeat(80) };
    const ticket = builder.buildTicket(sale, baseStore, baseItems);
    expect(ticket.transaction.originator.cash_register_serialnumber.length).toBeLessThanOrEqual(32);
  });

  it('encodes_to_base64_without_loss', () => {
    const ticket = builder.buildTicket(baseSale, baseStore, baseItems);
    const b64 = builder.toBase64(ticket);
    const decoded = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    expect(decoded.transaction.id).toBe(ticket.transaction.id);
  });
});
