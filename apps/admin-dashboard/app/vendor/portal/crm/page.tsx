import React from 'react';
import { getVendorPortalData, getVendorClientListsAction, getVendorMarketingTemplatesAction } from '../../../actions';
import { redirect } from 'next/navigation';
import VendorCrmClient from './VendorCrmClient';

export const dynamic = 'force-dynamic';

export default async function VendorCrmPage() {
  const portalData = await getVendorPortalData();
  const initialLists = await getVendorClientListsAction();
  const initialTemplates = await getVendorMarketingTemplatesAction();

  if (!portalData) {
    redirect('/login');
  }

  // Serialize complex objects before passing to client component
  const serializedCustomers = (portalData.customers || []).map((c: any) => ({
    ...c,
    totalSpent: Number(c.totalSpent || 0),
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
    store: c.store ? { 
      ...c.store,
      supplierOrders: (c.store.orders || []).map((o: any) => ({
        ...o,
        total: Number(o.total),
        createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
        items: (o.items || []).map((it: any) => ({
          ...it,
          price: Number(it.price),
          quantity: Number(it.quantity)
        }))
      }))
    } : null
  }));

  const serializedCampaigns = (portalData.campaigns || []).map((c: any) => ({
    ...c,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    sentAt: c.sentAt instanceof Date ? c.sentAt.toISOString() : c.sentAt
  }));

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">CRM & Marketing B2B</h1>
        <p className="text-slate-500 font-medium mt-1">Gérez vos relations avec les points de vente (Coffeeshops) et lancez des campagnes ciblées.</p>
      </div>
      
      <React.Suspense fallback={<div className="animate-pulse bg-slate-100 h-96 rounded-[40px]" />}>
        <VendorCrmClient 
          initialCustomers={serializedCustomers} 
          initialCampaigns={serializedCampaigns} 
          initialLists={initialLists}
          initialTemplates={initialTemplates}
        />
      </React.Suspense>
    </div>
  );
}
