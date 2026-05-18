'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ShoppingCart, Trash2, ShieldCheck, 
  Send, X, Plus, Minus, Building2, ShoppingBag, CheckCircle2 
} from 'lucide-react';
import { useCart } from '../CartContext';
import { useVault } from '../VaultContext';
import MarketplaceHeader from '../components/MarketplaceHeader';
import MarketplaceFooter from '../components/MarketplaceFooter';
import { sanitizeUrl } from '../../lib/imageUtils';

const fmt = (n: any) => Number(n).toFixed(2);

export default function CartPage() {
  const { 
    cart, updateQty, removeItem, clearCart, cartTotal, 
    handleCheckout, isOrdering, orderStatus, orderError, dismissError 
  } = useCart();

  // Helper to mask vendor names based on premium status
  const maskVendorName = (vendorId: string, companyName: string, isPremium: boolean) => {
    const { maskName } = useVault(vendorId, isPremium);
    return maskName(companyName);
  };

  // Group cart items by vendor
  const groupedItems = cart.reduce((acc: Record<string, { vendor: any; items: typeof cart }>, item) => {
    const vendorId = item.vendor?.id || 'unknown';
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendor: item.vendor || { id: 'unknown', companyName: 'Fournisseur Vérifié' },
        items: []
      };
    }
    acc[vendorId].items.push(item);
    return acc;
  }, {});

  const subtotal = cartTotal / 1.19;
  const tva = cartTotal - subtotal;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <MarketplaceHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-12">
        {/* Back Link & Title */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/marketplace" 
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Mon Panier B2B</h1>
            <p className="text-slate-500 mt-1">Gérez vos commandes professionnelles directes</p>
          </div>
        </div>

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto my-8">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={40} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Votre panier est vide</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Vous n'avez pas encore ajouté de produits. Parcourez notre catalogue B2B pour trouver des offres directes d'usine et de grossistes.
            </p>
            <Link 
              href="/marketplace" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors shadow-lg shadow-red-600/10"
            >
              Retourner au Marketplace
            </Link>
          </div>
        ) : (
          /* Cart Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Vendor Grouped Cart Items */}
            <div className="lg:col-span-8 space-y-6">
              {Object.entries(groupedItems).map(([vendorId, group]: any) => (
                <div 
                  key={vendorId} 
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                >
                  {/* Vendor Header */}
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                    <Building2 size={18} className="text-red-500" />
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fournisseur</span>
                      <Link 
                        href={`/marketplace/vendor/${vendorId}`}
                        className="text-sm font-extrabold text-slate-800 hover:text-red-600 transition-colors"
                      >
                        {group.vendor?.companyName || 'Fournisseur Vérifié'}
                      </Link>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-slate-100">
                    {group.items.map((item: any) => {
                      const minQty = item.minOrderQty || 1;
                      const isAtMin = item.quantity <= minQty;

                      return (
                        <div 
                          key={item.id} 
                          className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6"
                        >
                          {/* Image */}
                          <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                            <img 
                              src={sanitizeUrl(item.image) || '/images/elkassa-logo.png'} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={item.isBundle ? `/marketplace/product/${item.id}?isBundle=true` : `/marketplace/product/${item.id}`}
                              className="text-base font-bold text-slate-900 hover:text-red-600 transition-colors line-clamp-2"
                            >
                              {item.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-slate-500 font-semibold">{fmt(item.price)} DT / {item.unit || 'Pièce'}</span>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <span className="text-xs text-slate-400 line-through font-medium">{fmt(item.originalPrice)} DT</span>
                              )}
                            </div>
                            
                            {/* MOQ Warning */}
                            {item.minOrderQty && item.minOrderQty > 1 && (
                              <span className="inline-flex text-[10px] bg-red-50 text-red-600 font-extrabold px-2 py-0.5 rounded mt-2">
                                Quantité Minimum (MOQ) : {item.minOrderQty} {item.unit || 'Pièces'}
                              </span>
                            )}
                          </div>

                          {/* Actions / Quantity */}
                          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                              <button 
                                onClick={() => {
                                  if (isAtMin) return;
                                  updateQty(item.id, -1);
                                }}
                                disabled={isAtMin}
                                className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                                  isAtMin 
                                    ? 'text-slate-300 cursor-not-allowed' 
                                    : 'text-slate-600 hover:bg-white hover:text-slate-900 shadow-sm'
                                }`}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-12 text-center text-sm font-extrabold text-slate-800">
                                {item.quantity}
                              </span>
                              <button 
                                onClick={() => updateQty(item.id, 1)}
                                className="w-8 h-8 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors shadow-sm"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            {/* Line Subtotal */}
                            <div className="text-right min-w-[100px]">
                              <div className="text-base font-black text-slate-900">
                                {fmt(item.price * item.quantity)} DT
                              </div>
                              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total</span>
                            </div>

                            {/* Remove Button */}
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                              aria-label="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Pricing Summary & Checkout */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Order Error Notification */}
              {orderError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-3 items-start animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0 text-sm">
                    ⚠️
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-extrabold text-red-900">Erreur de transaction</h4>
                    <p className="text-xs text-red-700 mt-1 font-medium leading-relaxed">{orderError}</p>
                  </div>
                  <button 
                    onClick={dismissError} 
                    className="text-red-400 hover:text-red-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Summary Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4 mb-4">
                  Résumé de la commande
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-slate-500 font-semibold">
                    <span>Sous-total HT</span>
                    <span>{fmt(subtotal)} DT</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500 font-semibold">
                    <span>TVA (19%)</span>
                    <span>{fmt(tva)} DT</span>
                  </div>
                  <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-baseline">
                    <span className="text-base font-bold text-slate-800">Total TTC</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-red-600">{fmt(cartTotal)} DT</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">TVA Incluse</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button 
                  disabled={isOrdering || !!orderError}
                  onClick={handleCheckout}
                  className={`w-full py-4 px-6 rounded-full font-extrabold text-white text-base shadow-lg transition-all flex items-center justify-center gap-3 ${
                    isOrdering 
                      ? 'bg-slate-400 shadow-none cursor-not-allowed'
                      : orderStatus === 'SUCCESS'
                        ? 'bg-green-600 shadow-green-600/10'
                        : 'bg-red-600 hover:bg-red-700 shadow-red-600/10 hover:shadow-red-600/20 active:scale-95'
                  }`}
                >
                  {isOrdering ? (
                    <>Traitement en cours...</>
                  ) : orderStatus === 'SUCCESS' ? (
                    <><CheckCircle2 size={20} /> ✓ Commande validée !</>
                  ) : (
                    <><Send size={18} /> Valider la Commande</>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-400 mt-4 leading-relaxed font-medium">
                  En validant votre panier, vous transmettez directement vos intentions d'achat aux vendeurs sur ElKassa B2B.
                </p>
              </div>

              {/* Security Banner */}
              <div className="bg-slate-100 rounded-2xl border border-slate-200/60 p-5 flex gap-4 items-start">
                <ShieldCheck className="text-blue-600 flex-shrink-0" size={24} />
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                    Garantie de Sourcing Direct
                  </h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Toutes vos transactions et demandes de devis sont gérées de manière anonyme ou authentifiée pour protéger vos contacts commerciaux et tarifs.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      <MarketplaceFooter />
    </div>
  );
}
