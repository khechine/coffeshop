'use client';

import React, { useState } from 'react';
import MarketplaceHeader from '../components/MarketplaceHeader';
import { HelpCircle, Plus, Minus, ChevronRight } from 'lucide-react';

const faqs = [
  {
    q: "Comment passer commande sur ElKassa ?",
    a: "C'est simple ! Parcourez le catalogue, ajoutez les produits à votre panier et validez votre commande. Votre fournisseur recevra une notification instantanée."
  },
  {
    q: "Quels sont les frais de livraison ?",
    a: "Les frais de livraison sont fixés par chaque vendeur. Grâce à notre concept de proximité, ils sont généralement très réduits, voire gratuits selon le montant de la commande."
  },
  {
    q: "Comment devenir vendeur sur la plateforme ?",
    a: "Cliquez sur 'Devenir Vendeur' dans le menu, remplissez le formulaire d'inscription et notre équipe vous contactera pour valider votre catalogue sous 48h."
  },
  {
    q: "Le paiement est-il sécurisé ?",
    a: "Oui, nous utilisons des protocoles de sécurité avancés. Vous pouvez payer par carte bancaire ou via d'autres méthodes de paiement locales sécurisées."
  },
  {
    q: "Que faire en cas de problème avec une commande ?",
    a: "Vous pouvez contacter directement le vendeur via la plateforme. En cas de litige non résolu, notre support client intervient pour trouver une solution."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white">
      <MarketplaceHeader />
      
      <main className="pt-24 pb-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest mb-8">
              <HelpCircle size={14} /> Aide & Support
            </div>
            <h1 className="text-5xl font-black text-slate-900 mb-8 tracking-tight">
              Foire aux <span className="text-indigo-600">Questions</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
              Tout ce que vous devez savoir pour utiliser ElKassa Marketplace efficacement.
            </p>
          </div>

          <div className="space-y-4 mb-24">
            {faqs.map((faq, i) => (
              <div key={i} className={`rounded-2xl border transition-all ${openIndex === i ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-indigo-100'}`}>
                <button 
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-8 text-left"
                >
                  <span className="text-xl font-bold text-slate-900">{faq.q}</span>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${openIndex === i ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {openIndex === i ? <Minus size={18} /> : <Plus size={18} />}
                  </div>
                </button>
                {openIndex === i && (
                  <div className="px-8 pb-8">
                    <p className="text-lg text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-12 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Vous n'avez pas trouvé votre réponse ?</h3>
              <p className="text-slate-500 text-lg">Notre équipe est à votre disposition pour vous aider.</p>
            </div>
            <a href="mailto:support@elkassa.tn" className="px-8 py-4 bg-white border border-slate-200 rounded-xl font-black uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-3">
              Contactez-nous <ChevronRight size={18} />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
