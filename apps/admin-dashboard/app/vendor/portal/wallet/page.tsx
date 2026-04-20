import React from 'react';
import { getVendorPortalData } from '../../../actions';
import WalletClient from './WalletClient';

export const dynamic = 'force-dynamic';

export default async function WalletPage() {
  const portalData = await getVendorPortalData();

  if (!portalData) {
    return <div className="p-8">Profil non trouvé...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-900">Mon Portefeuille</h1>
        <p className="text-slate-500 text-sm">Gérez votre solde et suivez vos commissions marketplace.</p>
      </div>

      <WalletClient 
        initialWallet={portalData.wallet} 
        orders={portalData.orders}
        commissionRate={portalData.commissionRate}
        initialDepositRequests={portalData.depositRequests}
        isGracePeriodActive={portalData.isGracePeriodActive}
      />
    </div>
  );
}
