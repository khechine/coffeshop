'use client';

import React from 'react';
import MarketplaceHeader from '../components/MarketplaceHeader';
import { MapPin, Zap, Users, BarChart3 } from 'lucide-react';

export default function ConceptPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketplaceHeader />
      
      <main className="pt-24 pb-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-widest mb-8">
              <MapPin size={14} /> Le Concept Proximité
            </div>
            <h1 className="text-5xl font-black text-slate-900 mb-8 tracking-tight">
              Pourquoi choisir la <span className="text-emerald-600">Proximité</span> ?
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
              Réduisez vos coûts, votre empreinte carbone et soutenez l'économie locale en commandant auprès de fournisseurs situés à moins de 50km de votre établissement.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 mb-24">
            {[
              {
                icon: <Zap />,
                title: "Réactivité Maximale",
                desc: "Des délais de livraison ultra-courts grâce à la proximité géographique. Ne tombez plus jamais en rupture de stock.",
                color: "bg-amber-50 text-amber-600"
              },
              {
                icon: <Users />,
                title: "Relations Humaines",
                desc: "Renouez le contact avec vos fournisseurs. La proximité facilite les échanges, les tests de produits et le SAV.",
                color: "bg-blue-50 text-blue-600"
              },
              {
                icon: <BarChart3 />,
                title: "Économies Logistiques",
                desc: "Moins de kilomètres parcourus, c'est moins de frais de port et un prix final plus compétitif pour vos clients.",
                color: "bg-purple-50 text-purple-600"
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-8 p-12 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-colors bg-white shadow-sm">
                <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center ${item.color}`}>
                  {React.cloneElement(item.icon as React.ReactElement, { size: 32 })}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4">{item.title}</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-emerald-900 rounded-4xl p-16 text-center text-white">
            <h2 className="text-3xl font-black mb-6">Prêt à passer au local ?</h2>
            <p className="text-emerald-100 mb-10 max-w-xl mx-auto text-lg">Rejoignez des centaines de professionnels qui font déjà confiance au concept ElKassa Proximité.</p>
            <a href="/marketplace" className="inline-block px-10 py-5 bg-white text-emerald-900 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-50 transition-colors">
              Explorer les offres locales
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
