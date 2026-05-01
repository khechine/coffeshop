'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { placeMarketplaceOrder } from '../actions';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  unit: string;
  vendor?: {
    id: string;
    companyName: string;
  };
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any) => void;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  handleCheckout: () => Promise<void>;
  isOrdering: boolean;
  orderStatus: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderStatus, setOrderStatus] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('elkassa_mkt_cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('elkassa_mkt_cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const addToCart = (p: any) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      
      const vendorInfo = p.vendor || p.vendorInfo;
      return [...prev, { 
        id: p.id, 
        name: p.name, 
        price: Number(p.price), 
        image: p.image, 
        unit: p.unit,
        quantity: 1, 
        vendor: vendorInfo ? { id: vendorInfo.id, companyName: vendorInfo.companyName } : undefined
      }];
    });
  };

  const updateQty = (id: string, delta: number) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsOrdering(true);
    try {
      // Group by vendor for multi-vendor ordering if supported by backend, 
      // or just send as one if backend handles it.
      // Current placeMarketplaceOrder seems to take one vendorId.
      const grouped = cart.reduce((acc: Record<string, CartItem[]>, item) => {
        const vid = item.vendor?.id || 'unknown';
        if (!acc[vid]) acc[vid] = [];
        acc[vid].push(item);
        return acc;
      }, {});

      for (const [vendorId, items] of Object.entries(grouped)) {
        if (vendorId === 'unknown') continue;
        await placeMarketplaceOrder({
          vendorId,
          total: items.reduce((s, i) => s + Number(i.price) * i.quantity, 0),
          items: items.map(i => ({
            productId: i.id,
            quantity: i.quantity,
            price: Number(i.price),
            name: i.name
          }))
        });
      }

      setOrderStatus('SUCCESS');
      setCart([]);
      setTimeout(() => setOrderStatus(''), 3000);
    } catch (e) {
      setOrderStatus('ERROR');
      setTimeout(() => setOrderStatus(''), 3000);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, updateQty, removeItem, clearCart, 
      cartTotal, cartCount, handleCheckout, isOrdering, orderStatus 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
