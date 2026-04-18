import * as Print from 'expo-print';

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
    const html = this.generateTicketHtml(data, settings, planName);
    
    try {
      await Print.printAsync({ html });
    } catch (error) {
      console.error("❌ Erreur d'impression:", error);
      throw error;
    }
  }

  private static generateTicketHtml(data: PrintData, settings: PrinterSettings, planName?: string | null) {
    const { storeName, storeAddress, storePhone, sale, items } = data;
    const width = settings.paperSize === '80mm' ? '80mm' : '58mm';
    const isStarter = planName?.toUpperCase() === 'STARTER';
    
    const dateStr = new Date(sale.createdAt || sale.timestamp || new Date()).toLocaleString('fr-FR');
    const totalAmount = Number(sale.total || 0).toFixed(3);
    
    const itemsHtml = items.map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <div style="flex: 1;">
          <span style="font-weight: bold;">${item.quantity}x</span> 
          <span>${item.name}</span>
        </div>
        <span style="font-weight: bold;">${(item.price * item.quantity).toFixed(3)}</span>
      </div>
    `).join('');

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: ${width}; 
              margin: 0; 
              padding: 10px; 
              font-size: 12px;
              color: #000;
            }
            .center { text-align: center; }
            .header { margin-bottom: 15px; }
            .separator { border-top: 1px dashed #000; margin: 10px 0; }
            .total { font-size: 14px; font-weight: bold; margin-top: 10px; display: flex; justify-content: space-between; }
            .footer { margin-top: 20px; font-size: 10px; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header center">
            <h1 style="font-size: 18px; margin: 0; text-transform: uppercase;">${storeName}</h1>
            ${storeAddress ? `<p style="font-size: 10px; margin: 2px 0;">${storeAddress}</p>` : ''}
            ${storePhone ? `<p style="font-size: 10px; margin: 2px 0;">Tél: ${storePhone}</p>` : ''}
          </div>

          <div style="font-size: 11px;">
            <p><strong>DATE:</strong> ${dateStr}</p>
            <div style="display: flex; justify-content: space-between;">
              <span><strong>TICKET:</strong> #${(sale.id || 'PRO-FORMA').substring(0, 8)}</span>
              ${sale.fiscalNumber ? `<span><strong>FACT:</strong> ${sale.fiscalNumber}</span>` : ''}
            </div>
          </div>

          <div class="separator"></div>
          <div class="items">${itemsHtml}</div>
          <div class="separator"></div>

          <div class="total">
            <span>TOTAL TTC</span>
            <span>${totalAmount} DT</span>
          </div>

          ${!isStarter && sale.hash ? `
            <div style="margin-top: 15px; font-size: 9px; border: 1px solid #000; padding: 5px;">
              <p class="center" style="margin-bottom: 5px;"><strong>CONFORMITÉ NACEF</strong></p>
              <p style="word-break: break-all; margin-bottom: 4px;"><strong>HASH:</strong> ${sale.hash}</p>
              ${sale.signature ? `<p style="word-break: break-all;"><strong>SIGNATURE:</strong> ${sale.signature}</p>` : ''}
            </div>
          ` : `
            <div class="center" style="margin-top: 10px; font-size: 10px;">TICKET PRO-FORMA</div>
          `}

          <div class="footer center">
            <p>Merci de votre visite !</p>
            <p>logiciel par ELKASSA</p>
          </div>
        </body>
      </html>
    `;
  }
}
