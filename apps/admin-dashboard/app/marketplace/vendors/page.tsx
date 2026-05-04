'use client';

import React from 'react';
import MarketplaceHeader from '../components/MarketplaceHeader';
import { Rocket, TrendingUp, ShieldCheck, Headphones } from 'lucide-react';

export default function VendorsPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketplaceHeader />
      
      <main className="pt-24 pb-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest mb-8">
              <Rocket size={14} /> Devenir Vendeur
            </div>
            <h1 className="text-5xl font-black text-slate-900 mb-8 tracking-tight">
              Boostez vos ventes B2B avec <br />
              <span className="text-indigo-600">ElKassa Marketplace.</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
              Exposez vos produits à des milliers de professionnels (cafés, restaurants, hôtels) et gérez vos commandes en toute simplicité.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-24">
            {[
              {
                icon: <TrendingUp />,
                title: "Visibilité Accrue",
                desc: "Touchez une nouvelle clientèle professionnelle activement à la recherche de vos produits.",
                color: "indigo"
              },
              {
                icon: <ShieldCheck />,
                title: "Paiements Sécurisés",
                desc: "Garantissez vos revenus grâce à notre système de paiement et de facturation intégré.",
                color: "indigo"
              },
              {
                icon: <Rocket />,
                title: "Outils de Gestion",
                desc: "Interface dédiée pour gérer vos stocks, vos prix et vos promotions en temps réel.",
                color: "indigo"
              },
              {
                icon: <Headphones />,
                title: "Accompagnement",
                desc: "Notre équipe vous aide à optimiser votre catalogue et à maximiser vos ventes.",
                color: "indigo"
              }
            ].map((item, i) => (
              <div key={i} className="p-10 rounded-3xl border border-slate-100 hover:border-indigo-100 transition-all bg-white shadow-sm group">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {React.cloneElement(item.icon as React.ReactElement, { size: 28 })}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 rounded-4xl p-16 text-center text-white">
            <h2 className="text-3xl font-black mb-6">Prêt à rejoindre l'aventure ?</h2>
            <p className="text-slate-400 mb-10 max-w-xl mx-auto text-lg">L'inscription est gratuite et ne prend que quelques minutes. Nos experts valident votre profil sous 48h.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/vendor/register" className="px-10 py-5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors">
                Créer mon compte vendeur
              </a>
              <a href="/login" className="px-10 py-5 bg-white/10 text-white rounded-xl font-black uppercase tracking-widest hover:bg-white/20 transition-colors border border-white/20">
                Se connecter
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
