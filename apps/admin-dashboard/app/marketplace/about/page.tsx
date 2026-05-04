'use client';

import React from 'react';
import MarketplaceHeader from '../components/MarketplaceHeader';
import { Sparkles, Heart, Shield, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketplaceHeader />
      
      <main className="pt-24 pb-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest mb-8">
              <Sparkles size={14} /> Notre Histoire
            </div>
            <h1 className="text-5xl font-black text-slate-900 mb-8 tracking-tight">
              Rapprocher les professionnels, <br />
              <span className="text-indigo-600">simplement.</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
              ElKassa Marketplace est la première plateforme B2B dédiée à la proximité en Tunisie, connectant les meilleurs fournisseurs locaux aux commerçants exigeants.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-32">
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-6">Notre Vision</h3>
              <p className="text-slate-600 leading-relaxed text-lg">
                Nous croyons que le futur du commerce B2B réside dans la localité et l'efficacité. Notre mission est de digitaliser les échanges entre fournisseurs et acheteurs pour dynamiser l'économie locale.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-6">Notre Engagement</h3>
              <p className="text-slate-600 leading-relaxed text-lg">
                Transparence, fiabilité et qualité sont au cœur de notre démarche. Chaque fournisseur sur ElKassa est rigoureusement sélectionné pour garantir une expérience d'achat optimale.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-4xl p-16">
            <div className="grid grid-cols-3 gap-12 text-center">
              <div>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm mx-auto mb-6">
                  <Heart size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Passion</h4>
                <p className="text-slate-500">Dédiés à la réussite de nos partenaires.</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm mx-auto mb-6">
                  <Shield size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Sécurité</h4>
                <p className="text-slate-500">Transactions et données protégées.</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm mx-auto mb-6">
                  <Globe size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Local</h4>
                <p className="text-slate-500">Priorité aux circuits courts.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
