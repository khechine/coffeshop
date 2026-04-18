import QRCode from 'qrcode';

/**
 * PrintService pour le Dashboard Admin (Web)
 * Utilise window.print() pour générer des tickets thermiques
 */
export interface PrintData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
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
    const { storeName, storeAddress, storePhone, sale, items } = data;
    const width = settings.paperSize === '80mm' ? '80mm' : '58mm';
    const isStarter = planName?.toUpperCase() === 'STARTER';
    const isFiscal = !!sale.isFiscal;
    
    const dateStr = new Date(sale.createdAt || sale.timestamp || new Date()).toLocaleString('fr-FR');
    const totalAmount = Number(sale.total || 0).toFixed(3);
    const totalHt = Number(sale.totalHt || 0);
    const totalTax = Number(sale.totalTax || 0);
    const change = Number(sale.change || 0);

    // QR Code Generation for NACEF
    let qrCodeDataUrl = '';
    if (isFiscal && sale.hash) {
      try {
        const qrString = `ST:${storeName}|DT:${dateStr}|TOT:${totalAmount}|HASH:${sale.hash.substring(0, 16)}...`;
        qrCodeDataUrl = await QRCode.toDataURL(qrString, { margin: 1, width: 120 });
      } catch (err) {
        console.error('Failed to generate QR Code', err);
      }
    }

    // Tax Breakdown Formatting
    let taxHtml = '';
    if (isFiscal && sale.taxBreakdown) {
      const breakdown = typeof sale.taxBreakdown === 'string' ? JSON.parse(sale.taxBreakdown) : sale.taxBreakdown;
      taxHtml = Object.entries(breakdown).map(([rate, amount]) => `
        <div style="display: flex; justify-content: space-between; font-size: 8px;">
           <span>TVA ${rate}</span>
           <span>${Number(amount).toFixed(3)}</span>
        </div>
      `).join('');
    }

    const itemsHtml = items.map(item => {
      const saleItem = sale.items?.find((si: any) => (si.productId === item.productId || si.id === item.id)) || null;
      const taxRate = Number(saleItem?.taxRate ?? item.taxRate ?? 0.19);
      const ttcPrice = Number(item.price);
      const unitPriceHt = ttcPrice / (1 + taxRate);
      const lineHt = unitPriceHt * item.quantity;
      const lineTax = lineHt * taxRate;
      const lineTtc = lineHt + lineTax;

      return `
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between;">
          <div><span style="font-weight: bold;">${item.quantity}x</span> <span>${item.name}</span></div>
          <span style="font-weight: bold;">${lineTtc.toFixed(3)}</span>
        </div>
        <div style="font-size: 8px; color: #555; padding-left: 16px;">
          HT: ${lineHt.toFixed(3)} + TVA ${Math.round(taxRate * 100)}%: ${lineTax.toFixed(3)}
        </div>
      </div>
    `}).join('');

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
              background: #fff;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 15px; }
            .separator { border-top: 1px dashed #000; margin: 10px 0; }
            .total-line { display: flex; justify-content: space-between; margin: 2px 0; }
            .total-ttc { font-size: 14px; font-weight: bold; margin-top: 6px; display: flex; justify-content: space-between; border-top: 1px solid #000; padding-top: 4px; }
            .footer { margin-top: 20px; font-size: 9px; font-style: italic; }
            .fiscal-box { margin-top: 15px; font-size: 8px; border: 1px solid #000; padding: 8px; border-radius: 4px; }
            .qr-container { display: flex; justify-content: center; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header center">
            <div style="font-size: 16px; font-weight: bold; text-transform: uppercase;">${storeName}</div>
            ${storeAddress ? `<div style="font-size: 9px;">${storeAddress}</div>` : ''}
            ${storePhone ? `<div style="font-size: 9px;">Tél: ${storePhone}</div>` : ''}
          </div>

          <div style="font-size: 10px; margin-bottom: 8px;">
            <div>DATE: ${dateStr}</div>
            <div style="display: flex; justify-content: space-between;">
              <span>TICKET: #${(sale.id || 'PRO-FORMA').substring(0, 8)}</span>
              ${sale.fiscalNumber ? `<span class="bold">FACT: ${sale.fiscalNumber}</span>` : ''}
            </div>
            ${sale.sequenceNumber ? `<div>Séq: ${sale.sequenceNumber} | Caisse: ${sale.terminalId?.slice(-4) || 'N/A'}</div>` : ''}
          </div>

          <div class="separator"></div>
          <div>${itemsHtml}</div>
          <div class="separator"></div>

          <!-- Ventilation TVA -->
          ${taxHtml ? `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 9px; font-weight: bold; margin-bottom: 2px;">Vérification TVA:</div>
              ${taxHtml}
            </div>
          ` : ''}

          <div class="total-line"><span>Total HT</span><span>${totalHt.toFixed(3)} DT</span></div>
          <div class="total-line"><span>TVA Totale</span><span>${totalTax.toFixed(3)} DT</span></div>
          
          <div class="total-ttc">
            <span>TOTAL TTC</span>
            <span>${totalAmount} DT</span>
          </div>
          ${change > 0 ? `<div class="total-line" style="margin-top:4px;"><span>Monnaie rendue</span><span>${change.toFixed(3)} DT</span></div>` : ''}

          ${isFiscal && sale.hash ? `
            <div class="fiscal-box">
              <div class="bold center" style="margin-bottom: 6px; font-size: 9px;">CONFORMITÉ NACEF (Tunisie)</div>
              <div style="word-break: break-all; margin-bottom: 4px; font-family: monospace;"><strong>HASH:</strong> ${sale.hash}</div>
              ${sale.signature ? `<div style="word-break: break-all; font-family: monospace;"><strong>SIGNATURE:</strong> ${sale.signature}</div>` : ''}
              
              ${qrCodeDataUrl ? `
                <div class="qr-container">
                  <img src="${qrCodeDataUrl}" style="width: 100px; height: 100px; image-rendering: pixelated;" />
                </div>
              ` : ''}
              
              <div class="center" style="font-size: 7px; margin-top: 8px; opacity: 0.7;">Document digital signé électroniquement</div>
            </div>
          ` : `
            <div class="center bold" style="margin-top: 15px; font-size: 10px; border: 1px solid #ccc; padding: 10px;">TICKET PRO-FORMA</div>
          `}

          <div class="footer center">
            <div>Merci de votre visite !</div>
            <div>Logiciel certifié par ELKASSA</div>
          </div>
        </body>
      </html>
    `;
  }
}
