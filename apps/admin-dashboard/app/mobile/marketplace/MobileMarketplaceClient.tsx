'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, ShoppingCart, Plus, ChevronRight, Star, Heart } from 'lucide-react';
import { sanitizeUrl } from '../../lib/imageUtils';
import { useCart } from '../../marketplace/CartContext';
import { useVault } from '../../marketplace/VaultContext';
import CartDrawer from '../../marketplace/CartDrawer';

const ProductItem = ({ p, addToCart, onOpenDetails }: { p: any, addToCart: any, onOpenDetails: (p: any) => void }) => {
  const { maskName } = useVault(p.vendor?.id, p.vendor?.isPremium);
  
  return (
    <div 
      onClick={() => onOpenDetails(p)}
      style={{ 
        background: '#fff', borderRadius: '24px', padding: '12px',
        border: '1px solid #F3F4F6', display: 'flex', gap: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.02)', cursor: 'pointer'
      }}
    >
      <div style={{ width: '100px', height: '100px', borderRadius: '16px', overflow: 'hidden', background: '#F9FAFB', flexShrink: 0 }}>
        <img src={sanitizeUrl(p.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <div style={{ fontSize: '11px', fontWeight: 800, color: '#E31E24', textTransform: 'uppercase' }}>{maskName(p.vendor?.companyName)}</div>
             <Heart size={16} color="#D1D5DB" />
          </div>
          <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>{p.name}</h4>
          <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>{p.unit}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '17px', fontWeight: 950, color: '#111827' }}>
             {Number(p.price).toFixed(2)} <span style={{ fontSize: '12px' }}>DT</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              addToCart(p, 1);
            }}
            style={{ 
              width: '36px', height: '36px', borderRadius: '12px', 
              background: '#E31E24', color: '#fff', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(227,30,36,0.2)'
            }}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MobileMarketplaceClient({ initialData }: { initialData: any }) {
  const { addToCart, cartCount } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { products = [], categories = [] } = initialData || {};

  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCat === 'all' || p.categoryId === selectedCat;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCat]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px' }}>
      
      {/* Search Bar - Integrated & Mobile First */}
      <div style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={20} />
        <input 
          type="text" 
          placeholder="Rechercher un produit..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            width: '100%', padding: '16px 16px 16px 52px', 
            borderRadius: '16px', border: '1px solid #E5E7EB', 
            fontSize: '16px', outline: 'none', background: '#fff',
            boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
          }}
        />
      </div>

      {/* Categories Horizontal Scroll */}
      <div style={{ 
        display: 'flex', gap: '10px', overflowX: 'auto', 
        paddingBottom: '4px', scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }} className="no-scrollbar">
        <button 
          onClick={() => setSelectedCat('all')}
          style={{ 
            whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px',
            background: selectedCat === 'all' ? '#111827' : '#fff',
            color: selectedCat === 'all' ? '#fff' : '#4B5563',
            fontSize: '14px', fontWeight: 700, border: '1px solid #E5E7EB',
            transition: '0.2s'
          }}
        >
          Tous
        </button>
        {categories.map((cat: any) => (
          <button 
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            style={{ 
              whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px',
              background: selectedCat === cat.id ? '#111827' : '#fff',
              color: selectedCat === cat.id ? '#fff' : '#4B5563',
              fontSize: '14px', fontWeight: 700, border: '1px solid #E5E7EB',
              transition: '0.2s'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: 0 }}>
          {selectedCat === 'all' ? 'Tous les produits' : categories.find((c:any) => c.id === selectedCat)?.name}
        </h3>
        <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>{filteredProducts.length} articles</span>
      </div>

      {/* Product List - Optimized Vertical View */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredProducts.map((p: any) => (
          <ProductItem key={p.id} p={p} addToCart={addToCart} onOpenDetails={setSelectedProduct} />
        ))}
        {filteredProducts.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9CA3AF' }}>
            <Search size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px', fontWeight: 700 }}>Aucun produit trouvé</div>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>Essayez d'ajuster votre recherche ou filtre.</p>
          </div>
        )}
      </div>

      {/* Floating Cart Indicator (Mobile Exclusive) */}
      {cartCount > 0 && (
        <button 
          onClick={() => setCartOpen(true)}
          style={{ 
            position: 'fixed', bottom: '100px', right: '20px',
            background: '#111827', color: '#fff', padding: '12px 24px',
            borderRadius: '100px', border: 'none', display: 'flex', alignItems: 'center', gap: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 1001,
            animation: 'slideUp 0.3s ease-out'
          }}
        >
           <div style={{ position: 'relative' }}>
             <ShoppingCart size={20} />
             <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#E31E24', width: '18px', height: '18px', borderRadius: '50%', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               {cartCount}
             </div>
           </div>
           <span style={{ fontWeight: 800, fontSize: '14px' }}>Voir le Panier</span>
        </button>
      )}

      {/* Cart Drawer */}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}

      {/* Product Details Modal (Bottom Sheet) */}
      {selectedProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 2000,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
        }} onClick={() => setSelectedProduct(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
              padding: '24px', paddingBottom: '40px', maxHeight: '85vh', overflowY: 'auto',
              animation: 'slideUp 0.3s ease-out', position: 'relative'
            }}
          >
            <div style={{ width: '40px', height: '4px', background: '#E5E7EB', borderRadius: '2px', margin: '0 auto 20px' }} />
            
            <div style={{ width: '100%', height: '240px', borderRadius: '20px', background: '#F9FAFB', overflow: 'hidden', marginBottom: '20px' }}>
              <img src={sanitizeUrl(selectedProduct.image)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 950, color: '#111827', margin: 0 }}>{selectedProduct.name}</h2>
              <div style={{ fontSize: '20px', fontWeight: 950, color: '#111827' }}>
                 {Number(selectedProduct.price).toFixed(2)} <span style={{ fontSize: '14px' }}>DT</span>
              </div>
            </div>

            <div style={{ display: 'inline-block', background: '#F3F4F6', color: '#4B5563', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, marginBottom: '20px' }}>
              Unité : {selectedProduct.unit}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>Description</h3>
              <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
                {selectedProduct.description || "Aucune description détaillée n'est disponible pour ce produit."}
              </p>
            </div>

            <button 
              onClick={() => {
                addToCart(selectedProduct, 1);
                setSelectedProduct(null);
              }}
              style={{ 
                width: '100%', padding: '16px', borderRadius: '16px', 
                background: '#E31E24', color: '#fff', border: 'none',
                fontSize: '16px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 10px 25px rgba(227,30,36,0.2)'
              }}
            >
              <ShoppingCart size={20} />
              Ajouter au panier
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
