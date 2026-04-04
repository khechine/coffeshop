import { prisma } from '@coffeeshop/database';
import { Tag, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getStore } from '../../../actions';
import CategoryListClient from './CategoryListClient';

export const dynamic = 'force-dynamic';

export default async function StoreCategoriesPage() {
  const store = await getStore();
  const categories = await prisma.category.findMany({
    where: { storeId: store?.id },
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="page-content max-w-5xl mx-auto">
      <div className="flex flex-col gap-6 mb-10">
        <Link 
          href="/admin/products" 
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-black uppercase tracking-widest bg-slate-100 w-fit px-4 py-2 rounded-xl border border-slate-200"
        >
          <ArrowLeft size={14} /> Retour au Catalogue
        </Link>
        
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mes Catégories POS</h1>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Gérez l'organisation de vos produits sur la caisse</p>
          </div>
        </div>
      </div>

      <CategoryListClient initialCategories={categories as any} />
    </div>
  );
}
