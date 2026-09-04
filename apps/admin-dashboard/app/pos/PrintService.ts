import QRCode from 'qrcode';

/**
 * PrintService pour le Dashboard Admin (Web)
 * Utilise window.print() pour générer des tickets thermiques
 */
export interface PrintData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  storeCity?: string;
  matriculeFiscal?: string;
  raisonSociale?: string;
  commercialName?: string;
  establishmentReference?: string;
  imdf?: string;
  logoUrl?: string | null;
  ticketConfig?: {
    headerText?: string;
    footerText?: string;
    showTax?: boolean;
    showTableName?: boolean;
    showCashierName?: boolean;
    showLogo?: boolean;
    autoPrint?: boolean;
    copies?: number;
  };
  sale: any;
  items: any[];
}

export interface PrinterSettings {
  paperSize: '58mm' | '80mm';
}

export class PrintService {
  static async printTicket(data: PrintData, settings: PrinterSettings, planName?: string | null) {
    const html = await this.generateTicketHtml(data, settings, planName);
    
    // Create a hidden iframe to hold the print content
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      // Wait for content to load then print
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  }

  private static async generateTicketHtml(data: PrintData, settings: PrinterSettings, planName?: string | null) {
    const { 
      storeName, 
      storeAddress, 
      storePhone, 
      storeCity,
      matriculeFiscal,
      raisonSociale,
      commercialName,
      establishmentReference,
      imdf,
      ticketConfig, 
      sale, 
      items 
    } = data;

    const width = settings.paperSize === '80mm' ? '80mm' : '58mm';
    const isDuplicate = !!(sale.isDuplicate || sale.nacefOperationType === 'DUPLICATA' || sale.nacefOperationType === 'COPIE' || sale.reprint || sale.isReprint || sale.isCopy);
    const isOffline = !!(sale.isOffline || sale.offline || String(sale.id).startsWith('offline') || sale.nacefOperationType === 'VENTE_OFFLINE' || sale.nacefOperationType === 'VENTE - HORS LIGNE');
    const isFiscal = sale.isFiscal !== false;

    // ISO Date with timezone format
    const nowObj = sale.createdAt ? new Date(sale.createdAt) : new Date();
    const isoDateStr = nowObj.toISOString().replace('Z', '+01:00');

    const totalAmount = Number(sale.total || 0).toFixed(3);
    const change = Number(sale.change || 0);

    // Compute Tax Breakdown (Fam, Code Taxe, Taux, Valeur)
    let totalTaxAmount = 0;
    const taxRows: Array<{ fam: string; code: string; taux: string; valeur: number }> = [];

    // Timbre fiscal fixe (Code 20: 0,100 TND si fiscalisé NACEF)
    const fiscalStamp = isFiscal ? 0.100 : 0;
    
    // Group items by Tax Family / Rate
    const taxGroups: Record<string, { code: string; rateNum: number; taxVal: number }> = {};

    items.forEach((item) => {
      const saleItem = sale.items?.find((si: any) => (si.productId === item.productId || si.id === item.id)) || null;
      const taxRate = Number(saleItem?.taxRate ?? item.taxRate ?? 0.19);
      const ttcPrice = Number(item.price);
      const qty = Number(item.quantity);
      const itemTotalTtc = ttcPrice * qty;
      const unitPriceHt = ttcPrice / (1 + taxRate);
      const lineHt = unitPriceHt * qty;
      const lineTax = itemTotalTtc - lineHt;

      totalTaxAmount += lineTax;

      // Assign Tax Code: 7% -> Code 10 (Fam 01), 13% -> Code 11 (Fam 02), 19% -> Code 12 (Fam 03)
      let taxCode = '12';
      let famCode = '01';
      if (Math.abs(taxRate - 0.07) < 0.01) { taxCode = '10'; famCode = '01'; }
      else if (Math.abs(taxRate - 0.13) < 0.01) { taxCode = '11'; famCode = '02'; }
      else if (Math.abs(taxRate - 0.19) < 0.01) { taxCode = '12'; famCode = '03'; }
      
      const key = `${famCode}_${taxCode}`;
      if (!taxGroups[key]) {
        taxGroups[key] = { code: taxCode, rateNum: taxRate * 100, taxVal: 0 };
      }
      taxGroups[key].taxVal += lineTax;
      (item as any)._famCode = famCode;
    });

    // Populate tax rows
    Object.entries(taxGroups).forEach(([key, val]) => {
      const famCode = key.split('_')[0];
      taxRows.push({
        fam: famCode,
        code: val.code,
        taux: `${val.rateNum.toFixed(2).replace('.', ',')}%`,
        valeur: val.taxVal
      });
    });

    if (fiscalStamp > 0) {
      taxRows.push({
        fam: '20',
        code: '20',
        taux: 'fixe',
        valeur: fiscalStamp
      });
      totalTaxAmount += fiscalStamp;
    }

    // QR Code Generation for NACEF
    let qrCodeDataUrl = '';
    if (isFiscal && (sale.hash || sale.signature || sale.qrCodeData)) {
      try {
        const qrString = sale.qrCodeData || `ST:${storeName}|MF:${matriculeFiscal || '1976379Q'}|DT:${isoDateStr}|TOT:${totalAmount}|HASH:${(sale.hash || sale.signature || '').substring(0, 20)}`;
        qrCodeDataUrl = await QRCode.toDataURL(qrString, { margin: 1, width: 160 });
      } catch (err) {
        console.error('Failed to generate QR Code', err);
      }
    }

    const itemsRowsHtml = items.map(item => {
      const famCode = (item as any)._famCode || '01';
      const ttcPrice = Number(item.price);
      const qty = Number(item.quantity);
      const lineTtc = ttcPrice * qty;
      const optionsList = (item as any).options || [];
      const notes = (item as any).notes || '';
      const hasExtras = optionsList.length > 0 || !!notes;

      return `
        <tr>
          <td style="text-align: left;">${famCode}</td>
          <td style="text-align: left; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 110px;">${item.name}</td>
          <td style="text-align: right;">${ttcPrice.toFixed(3).replace('.', ',')}</td>
          <td style="text-align: center;">${qty}</td>
          <td style="text-align: right; font-weight: bold;">${lineTtc.toFixed(3).replace('.', ',')}</td>
        </tr>
        ${hasExtras ? `
          <tr>
            <td></td>
            <td colspan="4" style="font-size: 8px; color: #333; font-style: italic; padding-bottom: 2px;">
              ${optionsList.length > 0 ? `* ${optionsList.join(', ')}` : ''}
              ${notes ? ` [Note: ${notes}]` : ''}
            </td>
          </tr>
        ` : ''}
      `;
    }).join('');

    const taxRowsHtml = taxRows.map(tr => `
      <tr>
        <td style="text-align: left;">${tr.fam}</td>
        <td style="text-align: left;">${tr.code}</td>
        <td style="text-align: right;">${tr.taux}</td>
        <td style="text-align: right;">${tr.valeur.toFixed(3).replace('.', ',')}</td>
      </tr>
    `).join('');

    const cashierName = sale.barista?.name || sale.takenBy?.name || sale.cashierName || 'Maha';
    const mdfRef = (sale.signature || sale.hash || '876C472C457F66DCAC1A').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 20);

    return `
      <html>
        <head>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: ${width}; 
              margin: 0 auto; 
              padding: 10px; 
              font-size: 11px;
              color: #000;
              background: #fff;
              line-height: 1.35;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line-dashed { border-top: 1px dashed #000; margin: 6px 0; }
            .line-solid { border-top: 1px solid #000; margin: 6px 0; }
            .line-double { border-top: 3px double #000; margin: 6px 0; }
            table { width: 100%; font-size: 10px; border-collapse: collapse; }
            th, td { padding: 2px 0; }
          </style>
        </head>
        <body>
          <!-- HEADER -->
          <div class="center" style="font-size: 18px; font-weight: 900; margin-bottom: 4px; letter-spacing: 1px;">Ticket</div>
          ${isDuplicate ? `
            <div class="center bold" style="font-size: 12px; border: 1px dashed #000; padding: 2px 6px; margin: 4px auto 8px auto; display: inline-block;">*** DUPLICATA - COPIE TICKET ***</div>
          ` : isOffline ? `
            <div class="center bold" style="font-size: 12px; border: 1px dashed #000; padding: 2px 6px; margin: 4px auto 8px auto; display: inline-block;">*** VENTE HORS LIGNE (OFFLINE) ***</div>
          ` : ''}
          
          <div style="font-size: 10px;">
            <div>Matricule fiscal : ${matriculeFiscal || '1976379Q'}</div>
            <div>Nom Commercial : ${commercialName || storeName || 'WOW'}</div>
            <div>Raison Sociale : ${raisonSociale || storeName || 'AROME SAVEUR'}</div>
            <div>Adresse : ${storeAddress || 'MAGASIN N29 RDC IMMEUBLE SAADI, El Menzah 1, El Menzah, Tunis, 1004'}</div>
            <div>Ville : ${storeCity || 'Tunis'}</div>
            <div>Telephone : ${storePhone || '+21655680681'}</div>
            <div>Store ID : ${establishmentReference || '000'}</div>
          </div>

          <div class="line-dashed"></div>

          <!-- IDENTIFIANTS CAISSE & MDF -->
          <div style="font-size: 10px;">
            <div>Id Agent : ${sale.barista?.pinCode || sale.barista?.id?.slice(-5) || '12345'}</div>
            <div>IMDF : ${imdf || '20261976379001'}</div>
            <div>N° serie caisse : ${sale.terminal?.serialNumber || 'QNST23B302Z4502625'}</div>
            <div>Caisse : ${(sale.terminalId || sale.deviceId || '227c0ee0c819483a').slice(0, 16)} - 2.0.0</div>
          </div>

          <div class="line-dashed"></div>

          <!-- METADONNÉES TRANSACTION -->
          <div style="font-size: 10px;">
            <div>Date : ${isoDateStr}</div>
            <div>ID transaction : ${sale.fiscalNumber || sale.sequenceNumber || (sale.id ? sale.id.slice(-10) : '2600000058')}</div>
            <div class="line-dashed"></div>
            <div>Type transaction : ${sale.isVoid ? 'ANNULATION' : (isDuplicate ? 'DUPLICATA' : (isOffline ? 'VENTE - HORS LIGNE' : (sale.nacefOperationType || 'VENTE - NORMALE')))}</div>
            <div>Categorie client : ${sale.customerCategory || 'NP'}</div>
            <div>Avantage fiscal : ${sale.fiscalAdvantage || 'SA'}</div>
          </div>

          <div class="line-double"></div>

          <!-- ARTICLES -->
          <div style="font-size: 11px; font-weight: bold; margin-bottom: 4px;">Articles :</div>
          <table>
            <thead>
              <tr style="border-bottom: 1px dashed #000;">
                <th style="text-align: left; width: 10%;">Fam</th>
                <th style="text-align: left; width: 42%;">Design.</th>
                <th style="text-align: right; width: 20%;">PU TTC</th>
                <th style="text-align: center; width: 10%;">Qte</th>
                <th style="text-align: right; width: 18%;">TTC</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>

          <div class="line-double"></div>

          <!-- TAXES -->
          <div style="font-size: 11px; font-weight: bold; margin-bottom: 4px;">Taxes :</div>
          <table>
            <thead>
              <tr style="border-bottom: 1px dashed #000;">
                <th style="text-align: left; width: 15%;">Fam</th>
                <th style="text-align: left; width: 35%;">Code Taxe</th>
                <th style="text-align: right; width: 25%;">Taux</th>
                <th style="text-align: right; width: 25%;">Valeur</th>
              </tr>
            </thead>
            <tbody>
              ${taxRowsHtml}
            </tbody>
          </table>

          <div class="line-dashed"></div>

          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold;">
            <span>Total Taxes :</span>
            <span>${totalTaxAmount.toFixed(3).replace('.', ',')}</span>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 4px;">
            <span>Montant remises :</span>
            <span>${Number(sale.discount || 0).toFixed(3).replace('.', ',')}</span>
          </div>

          <div class="line-double"></div>

          <!-- TOTAL TTC -->
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; margin: 6px 0;">
            <span>TOTAL TTC A PAYER :</span>
            <span>${totalAmount.replace('.', ',')} TND</span>
          </div>

          <div class="line-double"></div>

          <!-- PAIEMENT & CAISSIER -->
          <div style="font-size: 10px;">
            <div>Mode de reglement :</div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 2px;">
              <span>${
                sale.paymentMethod === 'MEAL_VOUCHER' || sale.paymentMethod === 'PLUXEE' || sale.paymentMethod === 'RESTAURANT_TICKET' 
                  ? 'Ticket Resto' 
                  : sale.paymentMethod === 'CARD' 
                  ? 'Carte Bancaire' 
                  : sale.paymentMethod === 'MIXED' 
                  ? 'Paiement Mixte' 
                  : 'Especes'
              }</span>
              <span>${totalAmount.replace('.', ',')} TND</span>
            </div>
            <div class="line-dashed"></div>
            <div style="display: flex; justify-content: space-between;">
              <span>Monnaie rendue</span>
              <span>${change.toFixed(3).replace('.', ',')} TND</span>
            </div>
            <div class="line-dashed"></div>
            <div>Caissier : ${cashierName}</div>
            <div class="line-dashed"></div>
          </div>

          <!-- SIGNATURE MDF & QR CODE -->
          <div style="margin-top: 10px; font-size: 10px;">
            <div>Ref. Transaction MDF : ${mdfRef}</div>
            
            ${qrCodeDataUrl ? `
              <div style="display: flex; justify-content: center; margin-top: 12px;">
                <img src="${qrCodeDataUrl}" style="width: 140px; height: 140px; image-rendering: pixelated;" />
              </div>
            ` : ''}
          </div>
        </body>
      </html>
    `;
  }

  static async printShiftReport(data: any, settings: PrinterSettings) {
    const html = this.generateShiftReportHtml(data, settings);
    
    // Create a hidden iframe to hold the print content
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  }

  private static generateShiftReportHtml(data: any, settings: PrinterSettings) {
    const width = settings.paperSize === '80mm' ? '80mm' : '58mm';
    return `
      <html>
        <head>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: ${width}; 
              margin: 0; 
              padding: 10px; 
              font-size: 11px;
              color: #000;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 15px; font-size: 16px; text-transform: uppercase; }
            .separator { border-top: 1px dashed #000; margin: 10px 0; }
            .line { display: flex; justify-content: space-between; margin: 4px 0; }
            .footer { margin-top: 20px; font-size: 9px; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header center">
            <div>${data.storeName || 'Boutique'}</div>
            <div style="font-size: 12px; margin-top: 5px;">RAPPORT DE CLÔTURE (Z)</div>
          </div>
          
          <div class="line"><span>Ouverture:</span><span>${new Date(data.openTime).toLocaleString('fr-FR')}</span></div>
          <div class="line"><span>Fermeture:</span><span>${new Date(data.closeTime).toLocaleString('fr-FR')}</span></div>
          
          <div class="separator"></div>
          
          <div class="line"><span>Fond initial:</span><span>${(data.openingCash || 0).toFixed(3)} DT</span></div>
          <div class="line bold"><span>Total Ventes (TTC):</span><span>${(data.totalSales || data.salesCashTotal || 0).toFixed(3)} DT</span></div>
          <div class="line" style="padding-left: 10px; font-size: 10px;"><span>• Dont Espèces:</span><span>${(data.salesCashTotal || 0).toFixed(3)} DT</span></div>
          ${data.salesCardTotal ? `<div class="line" style="padding-left: 10px; font-size: 10px;"><span>• Dont Carte:</span><span>${Number(data.salesCardTotal).toFixed(3)} DT</span></div>` : ''}
          ${data.salesVoucherTotal ? `<div class="line" style="padding-left: 10px; font-size: 10px;"><span>• Dont Tickets:</span><span>${Number(data.salesVoucherTotal).toFixed(3)} DT</span></div>` : ''}
          ${data.salesCount ? `<div class="line" style="padding-left: 10px; font-size: 10px;"><span>• Nb Tickets:</span><span>${data.salesCount}</span></div>` : ''}
          
          <div class="separator"></div>
          
          <div class="line bold" style="font-size: 12px;"><span>Total Attendu:</span><span>${data.expectedTotal.toFixed(3)} DT</span></div>
          <div class="line bold" style="font-size: 12px;"><span>Total Compté:</span><span>${data.countedTotal.toFixed(3)} DT</span></div>
          
          <div class="separator"></div>
          
          <div class="line bold"><span>Écart:</span><span>${data.difference.toFixed(3)} DT</span></div>
          <div class="line"><span>Fond conservé:</span><span>${data.fondDeCaisse.toFixed(3)} DT</span></div>
          <div class="line bold" style="font-size: 14px; margin-top: 8px;"><span>Montant à Déposer:</span><span>${data.montantDepot.toFixed(3)} DT</span></div>
          
          <div class="separator"></div>
          
          <div style="margin-top: 20px;">
            <p>Signature Caissier:</p>
            <br/><br/>
            <p>Signature Manager:</p>
            <br/><br/>
          </div>
          
          <div class="footer center">
            <p>logiciel par ELKASSA</p>
          </div>
        </body>
      </html>
    `;
  }

  static async printOpeningReport(data: any, settings: PrinterSettings) {
    const html = this.generateOpeningReportHtml(data, settings);
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  }

  private static generateOpeningReportHtml(data: any, settings: PrinterSettings) {
    const width = settings.paperSize === '80mm' ? '80mm' : '58mm';
    
    // Sort denominations descending
    const denominations = Object.keys(data.counts || {})
      .map(Number)
      .sort((a, b) => b - a);

    const countDetailsHtml = denominations.map(val => {
      const qty = data.counts[val] || 0;
      if (qty > 0) {
        return `<div class="line"><span>${val >= 1 ? val + ' DT' : (val * 1000) + ' Millimes'} x ${qty}</span><span>${(val * qty).toFixed(3)} DT</span></div>`;
      }
      return '';
    }).filter(Boolean).join('');

    return `
      <html>
        <head>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: ${width}; 
              margin: 0; 
              padding: 10px; 
              font-size: 11px;
              color: #000;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 15px; font-size: 16px; text-transform: uppercase; }
            .separator { border-top: 1px dashed #000; margin: 10px 0; }
            .line { display: flex; justify-content: space-between; margin: 4px 0; }
            .footer { margin-top: 20px; font-size: 9px; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header center">
            <div>${data.storeName || 'Boutique'}</div>
            <div style="font-size: 12px; margin-top: 5px;">RAPPORT D'OUVERTURE</div>
          </div>
          
          <div class="line"><span>Date:</span><span>${new Date(data.openTime).toLocaleString('fr-FR')}</span></div>
          ${data.cashierName ? `<div class="line"><span>Caissier:</span><span>${data.cashierName}</span></div>` : ''}
          
          <div class="separator"></div>
          <div class="bold center" style="margin-bottom: 5px;">DÉTAIL DU COMPTAGE</div>
          ${countDetailsHtml}
          <div class="separator"></div>
          
          <div class="line bold" style="font-size: 14px; margin-top: 8px;"><span>Total en Caisse:</span><span>${Number(data.openingCash || 0).toFixed(3)} DT</span></div>
          
          <div class="separator"></div>
          
          <div style="margin-top: 20px;">
            <p>Signature Caissier:</p>
            <br/><br/>
            <p>Signature Manager:</p>
            <br/><br/>
          </div>
          
          <div class="footer center">
            <p>logiciel par ELKASSA</p>
          </div>
        </body>
      </html>
    `;
  }
}

