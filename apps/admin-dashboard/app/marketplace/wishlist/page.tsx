'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../CartContext';
import MarketplaceHeader from '../components/MarketplaceHeader';
import MarketplaceFooter from '../components/MarketplaceFooter';
import { sanitizeUrl } from '../../lib/imageUtils';

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useCart();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <MarketplaceHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <Link href="/marketplace" className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors shadow-sm">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-900">Ma Liste d'Envies</h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">Retrouvez tous vos produits favoris sauvegardés ({wishlist.length})</p>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl md:rounded-3xl p-8 md:p-16 text-center border border-slate-200">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Heart size={32} className="text-red-400 md:size-10" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-2">Votre liste est vide</h2>
            <p className="text-xs md:text-sm text-slate-500 mb-6 md:mb-8 max-w-md mx-auto">Vous n'avez pas encore ajouté d'articles à vos favoris. Parcourez notre catalogue et cliquez sur le cœur pour sauvegarder vos produits préférés.</p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-red-600 text-white text-sm md:text-base font-bold rounded-full hover:bg-red-700 transition-colors">
              Découvrir les produits
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-white rounded-xl md:rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all flex flex-col group">
                <div className="relative aspect-square bg-slate-50">
                  <img src={sanitizeUrl(item.image) || '/images/elkassa-logo.png'} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <button 
                    onClick={() => toggleWishlist(item)}
                    className="absolute top-2 right-2 md:top-3 md:right-3 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 backdrop-blur-sm border border-slate-100 shadow-sm flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} className="md:size-4" />
                  </button>
                </div>
                <div className="p-3 md:p-5 flex flex-col flex-1">
                  <Link href={`/marketplace/product/${item.id}`} className="text-xs md:text-base font-bold text-slate-900 mb-1 hover:text-red-600 transition-colors line-clamp-2 leading-tight">
                    {item.name}
                  </Link>
                  <div className="mt-auto pt-2 md:pt-4 flex items-center justify-between">
                    <span className="text-sm md:text-lg font-black text-slate-900">{Number(item.price).toFixed(2)} DT</span>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart(item, 1);
                      }}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                    >
                      <ShoppingCart size={14} className="md:size-[18px]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <MarketplaceFooter />
    </div>
  );
}
