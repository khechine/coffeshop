'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingBag, Search, LayoutGrid, ShoppingCart, 
  MapPin, ChevronRight, X, Menu, User, ArrowRight,
  ChevronDown, Globe, HelpCircle, Smartphone, Languages,
  MessageSquare
} from 'lucide-react';
import { useCart } from '../CartContext';
import CartDrawer from '../CartDrawer';

export default function MarketplaceHeader({ isVendor = false }: { isVendor?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cartCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [searchScope, setSearchScope] = useState(searchParams.get('scope') || 'PRODUCT');

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}&scope=${searchScope}`);
  };

  return (
    <>
      <header style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 1000 }}>
        {/* Top Slim Bar */}
        <div style={{ background: '#F9FAFB', borderBottom: '1px solid #F1F5F9', padding: '6px 24px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6B7280' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>Français <ChevronDown size={12} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>DT (TND) <ChevronDown size={12} /></div>
            </div>
            
            <div style={{ display: 'flex', gap: '24px', fontWeight: 600 }}>
              <span style={{ cursor: 'pointer' }}>Aide</span>
              <span style={{ cursor: 'pointer' }}>Applications</span>
              <span style={{ cursor: 'pointer' }}>Vendre sur ElKassa</span>
            </div>
          </div>
        </div>

        {/* Main Header Area */}
        <div style={{ padding: '16px 24px' }}>
           <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '40px' }}>
              {/* Logo */}
              <Link href="/marketplace" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 44, height: 44, background: '#E31E24', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <ShoppingBag size={28} strokeWidth={2.5} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '22px', fontWeight: 900, color: '#111827', letterSpacing: '-1.2px', lineHeight: 1 }}>ElKassa Marketplace</span>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#E31E24', letterSpacing: '0.1em' }}>المنصة التونسية للمحترفين</span>
                </div>
              </Link>

              {/* Search Bar */}
              <form 
                onSubmit={handleSearch}
                style={{ flex: 1, display: 'flex', maxWidth: '800px', border: '3px solid #E31E24', borderRadius: '100px', overflow: 'hidden', height: '48px', background: '#fff' }}
              >
                <select 
                  value={searchScope}
                  onChange={(e) => setSearchScope(e.target.value)}
                  style={{ padding: '0 20px', background: '#F9FAFB', borderRight: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none', fontWeight: 700, fontSize: '13px', outline: 'none' }}
                >
                  <option value="PRODUCT">Produits</option>
                  <option value="VENDOR">Fournisseurs</option>
                  <option value="CATEGORY">Catégories</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Quel produit cherchez-vous ?" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, border: 'none', outline: 'none', padding: '0 20px', fontSize: '15px', fontWeight: 500 }}
                />
                <button 
                  type="submit"
                  style={{ background: '#E31E24', color: '#fff', border: 'none', padding: '0 28px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'opacity 0.2s' }}
                >
                  <Search size={22} />
                </button>
              </form>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: '#E31E24' }}>
                  <MessageSquare size={24} />
                  <span style={{ fontSize: '11px', fontWeight: 800, marginTop: '2px' }}>RFQ</span>
                </div>
                
                {!isVendor && (
                  <div 
                    onClick={() => setCartOpen(true)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: '#374151', position: 'relative' }}
                  >
                    <ShoppingCart size={24} />
                    <span style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>Panier</span>
                    {cartCount > 0 && (
                      <span style={{ position: 'absolute', top: -5, right: -2, background: '#E31E24', color: '#fff', fontSize: '9px', width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, border: '2px solid #fff' }}>
                        {cartCount}
                      </span>
                    )}
                  </div>
                )}

                <Link href="/admin" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: '#374151' }}>
                  <User size={24} />
                  <span style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>Compte</span>
                </Link>
              </div>
           </div>
        </div>
      </header>

      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </>
  );
}
