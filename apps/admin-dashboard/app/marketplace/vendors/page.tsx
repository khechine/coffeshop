'use client';

import React from 'react';
import MarketplaceHeader from '../components/MarketplaceHeader';
import MarketplaceFooter from '../components/MarketplaceFooter';
import { Rocket, TrendingUp, ShieldCheck, Headphones, ArrowRight } from 'lucide-react';

export default function VendorsPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <MarketplaceHeader />
      
      <main className="flex-grow pt-24 sm:pt-32 pb-16 sm:pb-32 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-200/30 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/2 right-10 w-[300px] h-[300px] bg-violet-200/20 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Hero Section */}
          <div className="text-center mb-16 sm:mb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-600 text-xs font-black uppercase tracking-widest mb-6 sm:mb-8">
              <Rocket size={14} className="animate-pulse" /> Devenir Vendeur
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 mb-6 sm:mb-8 tracking-tight leading-tight sm:leading-none">
              Boostez vos ventes B2B avec <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">ElKassa Marketplace.</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-slate-500 leading-relaxed max-w-3xl mx-auto font-medium">
              Exposez vos produits à des milliers de professionnels (cafés, restaurants, hôtels, supérettes) en Tunisie et gérez vos commandes en toute simplicité grâce à nos outils intelligents.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-16 sm:mb-24">
            {[
              {
                icon: <TrendingUp />,
                title: "Visibilité B2B Accrue",
                desc: "Touchez une nouvelle clientèle professionnelle en recherche active de vos produits, directement sur la plateforme leader en Tunisie.",
                badge: "Croissance"
              },
              {
                icon: <ShieldCheck />,
                title: "Paiements & Facturation",
                desc: "Sécurisez vos encaissements et profitez d'une facturation automatisée conforme aux réglementations en vigueur.",
                badge: "Sécurité"
              },
              {
                icon: <Rocket />,
                title: "Outils de Pilotage",
                desc: "Un tableau de bord intuitif pour mettre à jour vos prix, suivre vos stocks, créer des packs promo et analyser vos marges en direct.",
                badge: "Gestion"
              },
              {
                icon: <Headphones />,
                title: "Support Dédié",
                desc: "Bénéficiez d'un accompagnement personnalisé par nos experts pour intégrer vos produits et maximiser votre taux de conversion.",
                badge: "Accompagnement"
              }
            ].map((item, i) => (
              <div key={i} className="p-6 sm:p-8 lg:p-10 rounded-[28px] border border-slate-100 hover:border-indigo-100/80 transition-all bg-white shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50/50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 transform group-hover:scale-110">
                      {React.cloneElement(item.icon as React.ReactElement, { size: 26 })}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                  <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-2 text-xs font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  En savoir plus <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action Banner */}
          <div className="relative overflow-hidden bg-slate-900 rounded-[32px] sm:rounded-[40px] p-8 sm:p-16 text-center text-white shadow-2xl">
            {/* Background design */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/80 via-slate-900 to-slate-900" />
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-violet-500/20 blur-3xl rounded-full" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-black mb-4 tracking-tight">Prêt à propulser vos ventes ?</h2>
              <p className="text-slate-400 mb-8 sm:mb-10 text-sm sm:text-base lg:text-lg font-medium leading-relaxed">
                L'inscription est gratuite et ne prend que quelques minutes. Rejoignez notre réseau de fournisseurs agréés et commencez à vendre en gros dès aujourd'hui.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <a href="/vendor/register" className="px-6 py-4 sm:px-8 sm:py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm hover:bg-indigo-500 transition-all transform active:scale-95 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2">
                  Créer mon compte <ArrowRight size={16} />
                </a>
                <a href="/login" className="px-6 py-4 sm:px-8 sm:py-5 bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center">
                  Se connecter
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
}
