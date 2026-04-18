import * as Print from 'expo-print';
import { PrinterSettings } from '../store/types';

export interface PrintData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  sale: any; // Sale object from API or local SaleEvent
  items: any[];
}

export class PrintService {
  /**
   * Génère et imprime un ticket thermique NACEF
   */
  static async printTicket(data: PrintData, settings: PrinterSettings, planName?: string | null) {
    const html = this.generateTicketHtml(data, settings, planName);
    
    try {
      if (settings.ip) {
        // Pour les imprimantes IP, on pourrait utiliser des commandes ESC/POS directes 
        // Mais expo-print est plus sûr pour une implémentation générique initiale.
        await Print.printAsync({ html });
      } else {
        // Utilise le dialogue d'impression du système
        await Print.printAsync({ html });
      }
    } catch (error) {
      console.error("❌ Erreur d'impression:", error);
      throw error;
    }
  }

  private static generateTicketHtml(data: PrintData, settings: PrinterSettings, planName?: string | null) {
    const { storeName, storeAddress, storePhone, sale, items } = data;
    const is80mm = settings.paperSize === '80mm';
    const width = is80mm ? '80mm' : '58mm';
    const isStarter = planName?.toUpperCase() === 'STARTER';
    
    const dateStr = new Date(sale.createdAt || sale.timestamp).toLocaleString('fr-FR');
    const fiscalNumber = sale.fiscalNumber || 'TICKET PROVISOIRE';
    const totalAmount = Number(sale.total || sale.totalPrice).toFixed(3);
    
    // Construction des lignes d'articles
    const itemsHtml = items.map(item => `
      <div class="item-row">
        <div class="item-main">
          <span class="item-qty">${item.quantity}x</span>
          <span class="item-name">${item.product?.name || item.name || 'Produit'}</span>
        </div>
        <span class="item-price">${Number(item.price * item.quantity).toFixed(3)}</span>
      </div>
    `).join('');

    // NACEF Specific: Fiscal Hash & Signature (short version)
    const fiscalInfo = (!isStarter && sale.hash) ? `
      <div class="fiscal-section">
        <div class="separator"></div>
        <p class="fiscal-title">CONFORMITÉ NACEF</p>
        <p class="fiscal-hash">HASH: ${sale.hash.substring(0, 16)}...</p>
        <p class="fiscal-number">N° FISCAL: ${fiscalNumber}</p>
        <div class="qr-placeholder">
           <!-- Simulation de QR Code -->
           <div style="width: 60px; height: 60px; background: #000; margin: 10px auto;"></div>
        </div>
      </div>
    ` : isStarter ? '' : `
      <div class="fiscal-section">
        <div class="separator"></div>
        <p class="fiscal-warning">MODE SIMPLE (NON FISCALISÉ)</p>
      </div>
    `;

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
              color: #000;
              font-size: 12px;
            }
            .header { text-align: center; margin-bottom: 15px; }
            .store-name { font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0; }
            .store-info { font-size: 10px; margin: 2px 0; }
            
            .ticket-info { margin-bottom: 10px; font-size: 11px; }
            .ticket-info p { margin: 2px 0; }
            
            .separator { border-top: 1px dashed #000; margin: 10px 0; }
            
            .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .item-main { display: flex; gap: 5px; flex: 1; }
            .item-qty { font-weight: bold; min-width: 25px; }
            .item-name { flex: 1; }
            .item-price { font-weight: bold; }
            
            .totals { margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-top: 5px; }
            
            .fiscal-section { text-align: center; margin-top: 15px; font-size: 9px; }
            .fiscal-title { font-weight: bold; text-decoration: underline; margin-bottom: 4px; }
            .fiscal-hash { word-break: break-all; }
            .fiscal-warning { font-style: italic; color: #666; }
            
            .footer { text-align: center; margin-top: 20px; font-size: 10px; font-style: italic; }
            
            @media print {
              body { width: 100%; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="store-name">${storeName}</h1>
            ${storeAddress ? `<p class="store-info">${storeAddress}</p>` : ''}
            ${storePhone ? `<p class="store-info">Tél: ${storePhone}</p>` : ''}
          </div>

          <div class="ticket-info">
            <p><strong>Date:</strong> ${dateStr}</p>
            <p><strong>Ticket:</strong> #${sale.id.substring(0, 8)}</p>
          </div>

          <div class="separator"></div>

          <div class="items">
            ${itemsHtml}
          </div>

          <div class="separator"></div>

          <div class="totals">
            <div class="total-row">
              <span>TOTAL TTC</span>
              <span>${totalAmount} DT</span>
            </div>
          </div>

          ${fiscalInfo}

          <div class="footer">
            <p>Merci de votre visite !</p>
            <p>logiciel par ELKASSA</p>
          </div>
        </body>
      </html>
    `;
  }
}
