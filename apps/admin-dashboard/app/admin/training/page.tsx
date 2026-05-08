'use client';

import React from 'react';
import { BookOpen, Monitor, ShoppingCart, Wallet, Package, ArrowRight, PlayCircle, CheckCircle2 } from 'lucide-react';

export default function ClientTrainingPage() {
  const steps = [
    {
      title: "Prise de commande POS",
      icon: Monitor,
      description: "Apprenez à utiliser l'interface de vente rapide pour servir vos clients sur place ou à emporter.",
      image: "pos_training_interface",
      features: ["Sélection de produits par catégorie", "Gestion des modifications de commandes", "Encaissement multi-moyen"]
    },
    {
      title: "Approvisionnement Marketplace",
      icon: ShoppingCart,
      description: "Commandez vos matières premières directement auprès de nos fournisseurs certifiés au meilleur prix.",
      image: "marketplace_training_interface",
      features: ["Comparaison des prix grossistes", "Suivi des livraisons en temps réel", "Gestion des factures centralisée"]
    },
    {
      title: "Gestion Financière & Wallet",
      icon: Wallet,
      description: "Suivez votre solde, vos abonnements et les commissions automatiques sur vos achats.",
      image: "wallet_training_interface",
      features: ["Rechargement sécurisé du wallet", "Historique détaillé des commissions", "Téléchargement des reçus fiscaux"]
    },
    {
      title: "Gestion des Stocks",
      icon: Package,
      description: "Automatisez votre inventaire et recevez des alertes avant la rupture de stock.",
      image: "stock_training_interface",
      features: ["Mise à jour automatique après vente", "Alertes de seuils critiques", "Gestion des pertes et gaspillages"]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-10">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Centre de Formation Client</h1>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
          Maîtrisez votre espace de gestion en quelques minutes grâce à nos guides interactifs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-24">
        {steps.map((step, idx) => (
          <div key={idx} className={`flex flex-col lg:flex-row gap-12 items-center ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
            <div className="flex-1 space-y-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                <step.icon size={32} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{step.title}</h2>
              <p className="text-slate-500 text-lg leading-relaxed">{step.description}</p>
              
              <ul className="space-y-3">
                {step.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <button className="flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
                Démarrer le tutoriel <ArrowRight size={16} />
              </button>
            </div>

            <div className="flex-[1.2] w-full">
              <div className="relative group cursor-pointer overflow-hidden rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white">
                <img 
                  src={`/${step.image}.png`} // We assume the images will be served from public
                  alt={step.title}
                  className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <PlayCircle size={80} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-600 rounded-[48px] p-12 text-center text-white space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full" />
        <h2 className="text-3xl font-black relative z-10">Besoin d'une assistance personnalisée ?</h2>
        <p className="text-indigo-100 max-w-md mx-auto relative z-10 font-medium">Nos experts sont disponibles pour vous accompagner dans la configuration de votre établissement.</p>
        <button className="px-10 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all relative z-10">
          Contacter le Support
        </button>
      </div>
    </div>
  );
}
