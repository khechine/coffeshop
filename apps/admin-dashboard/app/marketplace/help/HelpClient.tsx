'use client';

import React from 'react';
import MarketplaceHeader from '../components/MarketplaceHeader';
import MarketplaceFooter from '../components/MarketplaceFooter';
import { 
  ShoppingCart, MessageSquare, Target, Box, 
  ShieldCheck, HelpCircle, ArrowRight, Zap,
  CheckCircle2, Info
} from 'lucide-react';
import Link from 'next/link';

export default function HelpClient({ store }: { store: any }) {
  const sections = [
    {
      id: 'ordering',
      title: 'Panier & Commandes Directes',
      icon: <ShoppingCart className="text-blue-600" size={32} />,
      description: "Achetez directement depuis le catalogue des fournisseurs. Ajoutez des produits à votre panier et validez votre commande en quelques clics.",
      features: [
        "Recherche avancée par catégorie et tag",
        "Gestion facile des quantités",
        "Historique des commandes centralisé",
        "Re-commande rapide en un clic"
      ],
      image: "https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: 'rfq',
      title: 'Demandes de Devis (RFQ)',
      icon: <Target className="text-red-600" size={32} />,
      description: "Pour vos besoins spécifiques ou de gros volumes, créez une demande de devis (RFQ) et recevez des offres personnalisées de plusieurs fournisseurs.",
      features: [
        "Publication d'appels d'offres ciblés",
        "Comparaison des offres reçues",
        "Négociation directe sur le prix",
        "Acceptation et paiement sécurisé"
      ],
      image: "https://images.unsplash.com/photo-1454165833767-027ffea9e787?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: 'messaging',
      title: 'TradeMessager',
      icon: <MessageSquare className="text-emerald-600" size={32} />,
      description: "Discutez en toute sécurité avec vos fournisseurs. Posez vos questions sur les produits et finalisez les détails logistiques.",
      features: [
        "Discussion anonyme et sécurisée",
        "Partage de contexte produit automatique",
        "Notifications en temps réel",
        "Filtrage anti-fraude intégré"
      ],
      image: "https://images.unsplash.com/photo-1577563908411-5077b6ac7624?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: 'security',
      title: 'Sécurité & Garantie',
      icon: <ShieldCheck className="text-amber-600" size={32} />,
      description: "ElKassa protège vos transactions B2B. Nous nous assurons que vos fonds sont en sécurité et que les fournisseurs respectent leurs engagements.",
      features: [
        "Paiements via wallet sécurisé",
        "Vérification des profils fournisseurs",
        "Protection contre les fuites de données",
        "Support dédié en cas de litige"
      ],
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1000&auto=format&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <MarketplaceHeader store={store} />

      {/* Hero Section */}
      <section className="bg-slate-900 py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Comment fonctionne <span className="text-red-600">ElKassa B2B</span> ?
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Tout ce que vous devez savoir pour optimiser vos achats professionnels, 
            négocier avec les meilleurs fournisseurs et sécuriser vos approvisionnements.
          </p>
        </div>
      </section>

      {/* Content Sections */}
      <section className="max-w-6xl mx-auto py-20 px-6 space-y-32">
        {sections.map((section, idx) => (
          <div key={section.id} className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-16 items-center`}>
            <div className="flex-1 space-y-8">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                {section.icon}
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">{section.title}</h2>
              <p className="text-lg text-slate-600 leading-relaxed font-medium">
                {section.description}
              </p>
              <ul className="space-y-4">
                {section.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-3 text-slate-700 font-bold">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                 <Link 
                  href={section.id === 'messaging' ? '/marketplace/messages' : section.id === 'rfq' ? '/marketplace/my-requests' : '/marketplace'}
                  className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-red-600 transition-all shadow-xl shadow-slate-200"
                 >
                   Essayer maintenant <ArrowRight size={20} />
                 </Link>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute -inset-4 bg-red-600/5 rounded-[40px] rotate-2" />
                <img 
                  src={section.image} 
                  alt={section.title} 
                  className="relative rounded-[32px] shadow-2xl border border-white/50 w-full h-[400px] object-cover"
                />
                <div className="absolute top-8 left-8 bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-white shadow-lg flex items-center gap-2">
                   <Zap size={16} className="text-amber-500 fill-amber-500" />
                   <span className="text-xs font-black uppercase tracking-widest text-slate-900">Premium B2B</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Floating Action Button */}
      <div className="fixed bottom-10 right-10 z-[100]">
        <Link 
          href="/marketplace/help"
          className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-red-200 hover:scale-110 transition-transform group"
          title="Besoin d'aide ?"
        >
          <HelpCircle size={32} className="group-hover:rotate-12 transition-transform" />
        </Link>
      </div>

      {/* FAQ Banner */}
      <section className="bg-white border-y border-slate-200 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
           <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
             <Info size={14} /> Foire aux questions
           </div>
           <h3 className="text-3xl font-black text-slate-900">Vous avez d'autres questions ?</h3>
           <p className="text-slate-600 font-medium text-lg">
             Notre équipe support est disponible du Lundi au Vendredi de 9h à 18h pour vous accompagner dans votre transformation digitale.
           </p>
           <div className="flex flex-wrap justify-center gap-4">
              <a href="mailto:support@elkassa.com" className="px-8 py-4 bg-slate-100 rounded-2xl font-black text-slate-900 hover:bg-slate-200 transition-all">
                Nous contacter
              </a>
              <Link href="/marketplace/messages" className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg shadow-red-100">
                Ouvrir un ticket
              </Link>
           </div>
        </div>
      </section>

      <MarketplaceFooter />
    </div>
  );
}
