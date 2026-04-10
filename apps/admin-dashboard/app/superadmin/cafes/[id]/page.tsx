import { prisma } from '@coffeeshop/database';
import { notFound } from 'next/navigation';
import { Store, MapPin, Phone, Building2, ShieldCheck, FileCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StoreDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const store = await prisma.store.findUnique({ 
    where: { id: params.id },
    include: { 
      subscription: { include: { plan: true } },
      owners: true
    }
  });
  
  if (!store) notFound();

  return (
    <div className="flex flex-col gap-10 p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <a href="/superadmin/cafes" className="text-sm text-slate-500 hover:text-slate-700">← Retour</a>
      </div>

      <div className="flex items-center gap-6">
        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center">
          <Store size={36} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900">{store.name}</h1>
          <p className="text-slate-500 font-medium">ID: {store.id}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <Building2 size={18} /> Informations
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-slate-400" />
              <div>
                <div className="text-xs text-slate-400">Adresse</div>
                <div className="font-medium">{store.address || 'Non défini'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-slate-400" />
              <div>
                <div className="text-xs text-slate-400">Ville</div>
                <div className="font-medium">{store.city || 'Non défini'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-slate-400" />
              <div>
                <div className="text-xs text-slate-400">Téléphone</div>
                <div className="font-medium">{store.phone || 'Non défini'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck size={18} /> Statut & Abonnement
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium">Statut</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                store.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                store.status === 'PENDING_VERIFICATION' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {store.status}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium">Vérifié</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${store.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {store.isVerified ? 'Oui' : 'Non'}
              </span>
            </div>
            {store.subscription && (
              <div className="p-3 bg-indigo-50 rounded-xl">
                <div className="text-xs text-indigo-600 font-bold uppercase">Plan</div>
                <div className="font-black text-indigo-900">{store.subscription.plan?.name || 'Standard'}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
          <FileCheck size={18} /> Documents Officiels
        </h3>
        {(store.officialDocs as any[])?.length > 0 ? (
          <div className="space-y-3">
            {(store.officialDocs as any[]).map((doc: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors">
                <div className="flex flex-col">
                  <span className="font-black text-slate-900 text-sm">{doc.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{doc.fileName || doc.type}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    doc.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 
                    doc.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {doc.status}
                  </span>
                  {doc.url && (
                    <a 
                      href={doc.url} 
                      download={doc.fileName || `${doc.type}_${store.name}.dat`}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm"
                    >
                      Télécharger
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
            <p className="text-slate-400 text-sm font-medium">Aucun document téléchargé</p>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="font-black text-slate-900 mb-4">Équipe ({store.owners?.length || 0})</h3>
        <div className="space-y-2">
          {store.owners?.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded">{user.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
