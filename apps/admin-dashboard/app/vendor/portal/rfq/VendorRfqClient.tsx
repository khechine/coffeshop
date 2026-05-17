'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, Calendar, Package, MapPin, Target, ChevronRight, Info, Check } from 'lucide-react';
import { submitMarketplaceQuote } from '../../../actions';

export default function VendorRfqClient({ rfqs, inquiries = [], vendorId }: { rfqs: any[], inquiries?: any[], vendorId: string }) {
  const [activeTab, setActiveTab] = useState<'rfqs' | 'inquiries'>('rfqs');
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if a quote already exists for the selected RFQ
  const existingQuote = selectedRfq?.quotes?.find((q: any) => q.vendorId === vendorId);
  const acceptedQuote = selectedRfq?.quotes?.find((q: any) => q.status === 'ACCEPTED');


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
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Opportunités & Demandes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez vos opportunités RFQ et répondez aux demandes d'informations directes.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
          <button onClick={() => setActiveTab('rfqs')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'rfqs' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Appels d'offres (RFQ)</button>
          <button onClick={() => setActiveTab('inquiries')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'inquiries' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Demandes directes {inquiries.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{inquiries.length}</span>}</button>
        </div>
      </div>

      {activeTab === 'rfqs' && (

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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        rfq.quotes.find((q: any) => q.vendorId === vendorId).status === 'REJECTED' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' 
                          : rfq.quotes.find((q: any) => q.vendorId === vendorId).status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                      }`}>
                        {rfq.quotes.find((q: any) => q.vendorId === vendorId).status === 'REJECTED' 
                          ? 'Refusé' 
                          : rfq.quotes.find((q: any) => q.vendorId === vendorId).status === 'ACCEPTED'
                          ? 'Accepté'
                          : 'Déjà répondu'}
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
                <div className={`p-4 rounded-2xl flex flex-col gap-2 font-black ${
                  existingQuote?.status === 'REJECTED' 
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                    : existingQuote?.status === 'ACCEPTED'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <Check size={20} /> 
                    {existingQuote?.status === 'REJECTED' 
                      ? 'Offre refusée' 
                      : existingQuote?.status === 'ACCEPTED'
                      ? 'Offre acceptée !'
                      : existingQuote ? 'Proposition en cours d\'examen' : 'Devis envoyé avec succès !'}
                  </div>
                  {existingQuote?.status === 'REJECTED' && acceptedQuote && (
                    <div className="text-sm opacity-80 flex items-center gap-2 mt-1 bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                      <Target size={14} /> Offre acceptée pour un autre fournisseur au prix de : {Number(acceptedQuote.price).toFixed(2)} DT
                    </div>
                  )}
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
                {existingQuote?.status === 'REJECTED' 
                  ? 'Cette requête a été clôturée.'
                  : existingQuote?.status === 'ACCEPTED'
                  ? 'Félicitations, vous avez remporté cette demande !'
                  : existingQuote ? 'L\'acheteur est en train d\'analyser les offres.' : 'L\'acheteur sera immédiatement notifié de votre proposition.'}
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
      )}

      {activeTab === 'inquiries' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {inquiries.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="text-slate-300 dark:text-slate-600" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Aucune demande</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                Vous n'avez pas encore reçu de demandes directes depuis votre vitrine.
              </p>
            </div>
          ) : inquiries.map((inquiry: any) => (
            <div 
              key={inquiry.id}
              onClick={() => setSelectedInquiry(inquiry)}
              className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 transition-all cursor-pointer hover:shadow-xl hover:shadow-indigo-500/5 ${selectedInquiry?.id === inquiry.id ? 'border-indigo-600' : 'border-transparent shadow-sm'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-wider">
                    Inquiry
                  </span>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Calendar size={12} /> {new Date(inquiry.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{inquiry.metadata?.subject || 'Demande d\'information'}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-6">{inquiry.metadata?.message}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">
                    {inquiry.store?.name?.charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{inquiry.store?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                  Voir Détails <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          {selectedInquiry ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl sticky top-24">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">
                Détails de la demande
              </h2>
              
              <div className="space-y-6 mb-8">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">De la part de</h4>
                  <div className="font-bold text-slate-900 dark:text-white">{selectedInquiry.store?.name}</div>
                  {selectedInquiry.store?.phone && <div className="text-sm text-slate-500">{selectedInquiry.store.phone}</div>}
                  {selectedInquiry.store?.email && <div className="text-sm text-slate-500">{selectedInquiry.store.email}</div>}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Message</span>
                  <div className="font-bold text-slate-900 dark:text-white mb-2">{selectedInquiry.metadata?.subject}</div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{selectedInquiry.metadata?.message}</p>
                </div>
              </div>

              <a 
                href="/admin-dashboard/vendor/portal/messages"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-2xl font-black text-lg shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-3 transition-all active:scale-95 text-center no-underline"
              >
                <MessageSquare size={20} /> Répondre par Message
              </a>
            </div>
          ) : (
            <div className="bg-slate-100 dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center h-[500px] flex flex-col items-center justify-center">
              <Target className="text-slate-300 dark:text-slate-600 mb-4" size={48} />
              <p className="text-slate-500 dark:text-slate-400 font-bold">Sélectionnez une demande pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
