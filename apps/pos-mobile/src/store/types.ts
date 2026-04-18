export interface CartItem {
  productId: string;
  quantity: number;
}

export interface SaleEvent {
  id: string;
  items: CartItem[];
  totalPrice: number;
  timestamp: number;
  status: 'pending' | 'synced';
  paymentStatus?: 'PAID' | 'UNPAID' | 'CANCELLED';
  baristaId?: string;
  mode?: 'NORMAL' | 'RACHMA';
  consumeType?: 'DINE_IN' | 'TAKEAWAY';
  fiscalNumber?: string;
  hash?: string;
  signature?: string;
  createdAt?: string; // Optional if from backend
}

export interface PrinterSettings {
  ip?: string;
  autoPrint: boolean;
  paperSize: '58mm' | '80mm';
}

export type UserRole = 'owner' | 'cashier' | 'vendor' | 'superadmin' | null;
export type AuthMode = 'TERMINAL' | 'ACCOUNT' | null;

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  categoryName?: string;
  color: string;
}
