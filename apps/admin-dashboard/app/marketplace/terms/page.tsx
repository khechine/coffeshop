'use client';

import React from 'react';
import MarketplaceHeader from '../components/MarketplaceHeader';
import { ShieldCheck, Scale, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketplaceHeader />
      
      <main className="pt-24 pb-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest mb-8">
              <ShieldCheck size={14} /> Légalité & Transparence
            </div>
            <h1 className="text-5xl font-black text-slate-900 mb-8 tracking-tight">
              Conditions <span className="text-indigo-600">Générales</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
              Dernière mise à jour : 04 Mai 2026. <br />
              Veuillez lire attentivement nos conditions d'utilisation de la plateforme.
            </p>
          </div>

          <div className="space-y-16 text-slate-600 leading-relaxed text-lg">
            <section>
              <h2 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">1</div>
                Objet du Service
              </h2>
              <p>
                ElKassa Marketplace fournit une plateforme de mise en relation entre vendeurs professionnels et acheteurs professionnels. Nous agissons en tant qu'intermédiaire technique et facilitateur de transactions.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">2</div>
                Compte Utilisateur
              </h2>
              <p>
                L'utilisation de la plateforme nécessite la création d'un compte professionnel. Vous êtes responsable de la confidentialité de vos identifiants et de l'exactitude des informations fournies lors de l'inscription.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">3</div>
                Commandes et Paiements
              </h2>
              <p>
                Toute commande passée sur la plateforme constitue un engagement ferme. Les paiements sont sécurisés et transitent par nos partenaires bancaires agréés en Tunisie.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">4</div>
                Livraisons et Retours
              </h2>
              <p>
                Les délais et frais de livraison sont gérés par les vendeurs. En cas de non-conformité, l'acheteur dispose d'un délai de 48h pour signaler un problème via l'interface dédiée.
              </p>
            </section>

            <section className="p-12 rounded-4xl bg-slate-900 text-white">
              <h2 className="text-3xl font-black mb-6 flex items-center gap-4 text-white">
                <Scale size={32} className="text-indigo-400" />
                Droit Applicable
              </h2>
              <p className="text-slate-400">
                Les présentes conditions sont régies par le droit tunisien. Tout litige relatif à leur interprétation ou leur exécution sera de la compétence exclusive des tribunaux de Tunis.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
