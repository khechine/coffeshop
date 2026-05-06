'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, Calendar, Package, MapPin, Target, ChevronRight, Info, Check } from 'lucide-react';
import { submitMarketplaceQuote } from '../../../actions';

export default function VendorRfqClient({ rfqs, vendorId }: { rfqs: any[], vendorId: string }) {
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if a quote already exists for the selected RFQ
  const existingQuote = selectedRfq?.quotes?.find((q: any) => q.vendorId === vendorId);

  const handleSendQuote = async () => {
    if (!quotePrice || existingQuote) return;
    setLoading(true);
    try {
      await submitMarketplaceQuote({
        rfqId: selectedRfq.id,
        vendorId: vendorId,
        price: Number(quotePrice),
        notes: quoteNotes
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        // We don't reset selectedRfq here anymore to let the vendor see their confirmed quote
        // window.location.reload(); // Simple way to refresh data for now
      }, 2000);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erreur lors de l\'envoi du devis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Opportunités RFQ</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Répondez aux demandes de devis ciblées sur vos secteurs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RFQ List */}
        <div className="lg:col-span-2 space-y-4">
          {rfqs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="text-slate-300 dark:text-slate-600" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Aucune demande en attente</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                Dès qu'un client postera une demande dans vos secteurs d'activité, elle apparaîtra ici.
              </p>
            </div>
          ) : rfqs.map((rfq) => {
            const hasQuote = rfq.quotes?.some((q: any) => q.vendorId === vendorId);
            return (
              <div 
                key={rfq.id}
                onClick={() => {
                  setSelectedRfq(rfq);
                  setSuccess(false);
                  if (hasQuote) {
                    const q = rfq.quotes.find((q: any) => q.vendorId === vendorId);
                    setQuotePrice(q.price.toString());
                    setQuoteNotes(q.notes || '');
                  } else {
                    setQuotePrice('');
                    setQuoteNotes('');
                  }
                }}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 transition-all cursor-pointer hover:shadow-xl hover:shadow-blue-500/5 ${selectedRfq?.id === rfq.id ? 'border-blue-600' : 'border-transparent shadow-sm'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-wider">
                      {rfq.category}
                    </span>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Calendar size={12} /> {new Date(rfq.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="block text-sm font-black text-slate-900 dark:text-white">{rfq.quantity} unité(s)</span>
                    {rfq.budget && <span className="text-xs font-bold text-emerald-500">Budget: {rfq.budget} DT</span>}
                    {hasQuote && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded text-[10px] font-black uppercase">
                        Déjà répondu
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{rfq.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-6">{rfq.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">
                      {rfq.store?.name?.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{rfq.store?.name}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10} /> {rfq.store?.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                    Voir Détails <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail & Quote Panel */}
        <div className="lg:col-span-1">
          {selectedRfq ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl sticky top-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">
                {existingQuote ? 'Votre Proposition' : 'Proposer une Offre'}
              </h2>
              
              <div className="space-y-6 mb-8">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Détails de la demande</span>
                  <p className="text-slate-700 dark:text-slate-300 text-sm italic">"{selectedRfq.description}"</p>
                  {selectedRfq.deadline && (
                    <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-bold">
                      <Target size={14} /> Échéance : {new Date(selectedRfq.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-900 dark:text-white mb-2">Votre Prix (DT)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      placeholder="0.000"
                      value={quotePrice}
                      onChange={e => setQuotePrice(e.target.value)}
                      disabled={!!existingQuote}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-lg font-black focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-70"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">DT</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-900 dark:text-white mb-2">Notes & Conditions</label>
                  <textarea 
                    placeholder="Délai de livraison, validité de l'offre, caractéristiques spécifiques..."
                    rows={4}
                    value={quoteNotes}
                    onChange={e => setQuoteNotes(e.target.value)}
                    disabled={!!existingQuote}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none disabled:opacity-70"
                  />
                </div>
              </div>

              {success || existingQuote ? (
                <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl flex items-center justify-center gap-2 font-black">
                  <Check size={20} /> {existingQuote ? 'Proposition déjà envoyée' : 'Devis envoyé avec succès !'}
                </div>
              ) : (
                <button 
                  disabled={loading || !quotePrice}
                  onClick={handleSendQuote}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-black text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? 'Envoi...' : <><Send size={20} /> Envoyer l'offre</>}
                </button>
              )}
              
              <div className="mt-6 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                <Info size={14} className="shrink-0" />
                {existingQuote ? 'Cette proposition est en cours d\'examen par l\'acheteur.' : 'L\'acheteur sera immédiatement notifié de votre proposition.'}
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center h-[500px] flex flex-col items-center justify-center">
              <Target className="text-slate-300 dark:text-slate-600 mb-4" size={48} />
              <p className="text-slate-500 dark:text-slate-400 font-bold">Sélectionnez une demande pour proposer une offre</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
