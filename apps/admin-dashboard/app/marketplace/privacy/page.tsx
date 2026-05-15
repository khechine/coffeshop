'use client';

import React from 'react';
import MarketplaceHeader from '../components/MarketplaceHeader';
import { ShieldCheck, Eye, Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketplaceHeader />
      
      <main className="pt-24 pb-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest mb-8">
              <ShieldCheck size={14} /> Confidentialité & Protection
            </div>
            <h1 className="text-5xl font-black text-slate-900 mb-8 tracking-tight">
              Politique de <span className="text-indigo-600">Confidentialité</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
              Dernière mise à jour : 06 Mai 2026. <br />
              Nous accordons une importance capitale à la protection de vos données professionnelles.
            </p>
          </div>

          <div className="space-y-16 text-slate-600 leading-relaxed text-lg">
            <section>
              <h2 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">1</div>
                Collecte des Données
              </h2>
              <p>
                Nous collectons uniquement les données nécessaires au bon fonctionnement de vos transactions B2B : informations de contact, adresse de livraison, et données de facturation professionnelles.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">2</div>
                Utilisation des Informations
              </h2>
              <p>
                Vos données sont utilisées pour traiter vos commandes, faciliter la communication avec les fournisseurs, et améliorer votre expérience sur ElKassa Marketplace. Nous ne revendons jamais vos données à des tiers.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">3</div>
                Sécurité et Cookies
              </h2>
              <p>
                Nous utilisons des cookies techniques pour maintenir votre session active et mémoriser vos préférences (comme le rayon de recherche). Toutes les transactions sont cryptées via le protocole SSL.
              </p>
            </section>

            <section className="p-12 rounded-4xl bg-slate-900 text-white">
              <h2 className="text-3xl font-black mb-6 flex items-center gap-4 text-white">
                <Lock size={32} className="text-indigo-400" />
                Vos Droits
              </h2>
              <p className="text-slate-400">
                Conformément à la loi tunisienne sur la protection des données personnelles, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Contactez-nous pour toute demande.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
