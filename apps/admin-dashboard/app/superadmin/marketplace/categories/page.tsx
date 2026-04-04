import { getMarketplaceCategoryTree, getPendingCategoryProposals, getUser } from '../../../actions';
import CategoryManagementClient from './CategoryManagementClient';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const [categoryTree, pendingProposals, user] = await Promise.all([
    getMarketplaceCategoryTree(),
    getPendingCategoryProposals(),
    getUser(),
  ]);

  if (user?.role !== 'SUPERADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
          <XCircle size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Accès restreint</h2>
        <p className="text-slate-500 max-w-sm">Cette page est exclusivement réservée aux super-administrateurs de la plateforme.</p>
        <Link href="/" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20">Retour au dashboard</Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Gestion des Catégories</h1>
          <p className="text-slate-500 font-medium mt-2">Arborescence du catalogue marketplace · Approbation des propositions vendeurs</p>
        </div>
        {pendingProposals.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider">{pendingProposals.length} proposition(s) à valider</span>
          </div>
        )}
      </div>

      <CategoryManagementClient
        categoryTree={categoryTree as any}
        pendingProposals={pendingProposals as any}
        userRole={user?.role || 'CASHIER'}
      />
    </div>
  );
}
