'use client';

import React, { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus, Edit2, Trash2, Package, Clock, FileSpreadsheet, Download,
  CheckCircle2, AlertCircle, Loader2, BarChart3, TrendingUp, TrendingDown,
  Minus, ChevronDown, Tag, Sparkles, ShoppingBag, Search, X
} from 'lucide-react';
import Modal from '../../../../components/Modal';
import {
  createMarketplaceProductAction, updateMarketplaceProductAction,
  deleteMarketplaceProductAction, importCsvProductsAction,
  proposeSubCategoryAction, createMarketplaceBundleAction, deleteMarketplaceBundleAction
} from '../../../actions';
import { sanitizeUrl } from '../../../lib/imageUtils';

// ─── Types ────────────────────────────────────────────────────────────────────
type SubCategory = { id: string; name: string; icon?: string | null };
type RootCategory = SubCategory & { subcategories?: SubCategory[] };
type BenchmarkRow = {
  categoryId: string | null;
  categoryName: string;
  parentCategoryName: string | null;
  displayCategory: string;
  unit: string;
  brand: string | null;
  myPrice: number | null;
  min: number | null; max: number | null; avg: number | null;
  competitorCount: number;
  position: 'cheapest' | 'competitive' | 'expensive' | 'exclusive' | 'unset';
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const positionConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  cheapest:    { label: 'Compétitif',                   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20', icon: <TrendingDown size={12} /> },
  competitive: { label: 'Dans la moyenne',              color: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20',    icon: <Minus size={12} /> },
  expensive:   { label: 'Au-dessus du marché',          color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20',         icon: <TrendingUp size={12} /> },
  exclusive:   { label: 'Exclusif — pas de concurrent', color: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20',    icon: <Sparkles size={12} /> },
  unset:       { label: 'Hors catalogue',               color: 'text-slate-500 dark:text-slate-400',    bg: 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50',         icon: <Minus size={12} /> },
};

// ─── Hierarchical Category Selector ──────────────────────────────────────────
function CategorySelector({
  categoryTree, value, onChange, onPropose, inputClass,
}: {
  categoryTree: RootCategory[];
  value: string;
  onChange: (catId: string, subcatId?: string) => void;
  onPropose: () => void;
  inputClass: string;
}) {
  const [parentId, setParentId] = useState<string>('');

  React.useEffect(() => {
    if (!value) return;
    if (categoryTree.some(c => c.id === value)) {
      setParentId(value);
    } else {
      const parent = categoryTree.find(c => c.subcategories?.some(s => s.id === value));
      if (parent) setParentId(parent.id);
    }
  }, [value, categoryTree]);

  const selectedParent = categoryTree.find(c => c.id === parentId);
  const hasSubcategories = selectedParent && (selectedParent.subcategories?.length || 0) > 0;

  const handleParentChange = (id: string) => {
    setParentId(id);
    onChange(id);
  };
  const handleSubcategoryChange = (id: string) => onChange(parentId, id);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
          Catégorie parente
        </label>
        <select
          className={`${inputClass} appearance-none cursor-pointer bg-white dark:bg-slate-900`}
          value={parentId}
          onChange={e => handleParentChange(e.target.value)}
          required
        >
          <option value="">Sélectionner...</option>
          {categoryTree.map(c => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ` : ''}{c.name}
              {(c.subcategories?.length || 0) > 0 ? ` ›${c.subcategories?.length} sous-catégories` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedParent && hasSubcategories && (
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Sous-catégorie
            </label>
            <select
              className={`${inputClass} appearance-none cursor-pointer bg-white dark:bg-slate-900`}
              value={value && value !== parentId ? value : ''}
              onChange={e => handleSubcategoryChange(e.target.value || parentId)}
            >
              <option value="">Toute la catégorie</option>
              {(selectedParent.subcategories || []).map((c: any) => (
                <option key={c.id} value={c.id}>→ {c.name}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={onPropose}
            title="Proposer une nouvelle sous-catégorie"
            className="shrink-0 mt-5 px-3 py-2 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-500 text-xs font-black hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
          >
            + Proposer
          </button>
        </div>
      )}

      {selectedParent && !hasSubcategories && (
        <button
          type="button"
          onClick={onPropose}
          className="text-xs text-indigo-500 font-medium hover:underline"
        >
          + Proposer une sous-catégorie pour "{selectedParent.name}"
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VendorCatalogClient({
  initialProducts, initialBundles = [], categoryTree, globalUnits, benchmarkData = [], vendorId, mktSectors = [], collections = [],
}: {
  initialProducts: any[];
  initialBundles?: any[];
  categoryTree: RootCategory[];
  globalUnits: any[];
  benchmarkData?: BenchmarkRow[];
  vendorId: string;
  mktSectors?: any[];
  collections?: any[];
}) {
  const [activeTab, setActiveTab]           = useState<'catalog' | 'benchmark' | 'bundles' | 'collections'>('catalog');
  const [modalOpen, setModalOpen]           = useState(false);
  const [bundleModalOpen, setBundleModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [rayonModalOpen, setRayonModalOpen]     = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [assignSearch, setAssignSearch]         = useState('');
  
  const [toast, setToast]                   = useState<{ show: boolean; message: string; error?: boolean } | null>(null);
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [isPending, startTransition]        = useTransition();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterBrand, setFilterBrand]       = useState<string>('all');
  const [filterCollection, setFilterCollection] = useState<string>('all');

  // CSV state
  const [csvStep, setCsvStep]   = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [csvRows, setCsvRows]   = useState<any[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvResult, setCsvResult] = useState<{ created: number; updated: number; skipped: number; errors: string[]; newCategories: string[] } | null>(null);

  // Bundle state
  const [bundleForm, setBundleForm] = useState<any>({
    name: '', description: '', price: '', image: '', imagePreview: '', showUrlInput: false, items: [] 
  });
  const [proposeParentId, setProposeParentId]   = useState('');
  const [proposeSubName, setProposeSubName]     = useState('');
  const [proposeStatus, setProposeStatus]       = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const showToast = (message: string, error = false) => {
    setToast({ show: true, message, error });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredCategoryTree = useMemo(() => {
    if (!mktSectors || mktSectors.length === 0) return categoryTree;
    const sectorIds = mktSectors.map(s => s.id);
    return categoryTree.filter(cat => sectorIds.includes(cat.id));
  }, [categoryTree, mktSectors]);

  const allCategories = useMemo(() => {
    const flat: { id: string; name: string; parentName?: string }[] = [];
    for (const root of categoryTree) {
      flat.push({ id: root.id, name: root.name });
      for (const child of (root.subcategories || [])) {
        flat.push({ id: child.id, name: child.name, parentName: root.name });
      }
    }
    return flat;
  }, [categoryTree]);

  const getCategoryLabel = (id?: string | null) => {
    if (!id) return 'Sans catégorie';
    const cat = allCategories.find(c => c.id === id);
    if (!cat) return 'Sans catégorie';
    return cat.parentName ? `${cat.parentName} › ${cat.name}` : cat.name;
  };

  const getSubcategoryLabel = (id?: string | null) => {
    if (!id) return '';
    const cat = allCategories.find(c => c.id === id);
    if (!cat) return '';
    return cat.name;
  };

  const handleUpload = async (file: File, isGallery = false) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.coffeeshop.elkassa.com';
      const res = await fetch(`${API_URL}/management/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        const cleanUrl = sanitizeUrl(data.url);
        if (isGallery) {
          setForm((f: any) => ({ ...f, images: [...(f.images || []), cleanUrl].slice(0, 5) }));
        } else {
          setForm((f: any) => ({ ...f, image: cleanUrl, imagePreview: cleanUrl }));
        }
      }
    } catch (e) {
      alert('Erreur upload');
    }
  };

  const [form, setForm] = useState<any>({
    name: '', price: '', unit: 'kg', categoryId: '', subcategoryId: '', brand: '', image: '', imagePreview: '', showUrlInput: false,
    description: '', tags: '', images: [],
    isFeatured: false, isFlashSale: false, discount: '', flashStart: '', flashEnd: '', minOrderQty: '1', stockQuantity: '0',
    collectionIds: []
  });

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name, price: p.price.toString(), unit: p.unit, categoryId: p.categoryId || '', subcategoryId: (p as any).subcategoryId || '',
      brand: (p as any).brand || '', image: p.image || '', imagePreview: p.image || '', showUrlInput: false,
      isFeatured: p.isFeatured, isFlashSale: p.isFlashSale,
      discount: p.discount ? p.discount.toString() : '',
      flashStart: p.flashStart ? new Date(p.flashStart).toISOString().slice(0, 16) : '',
      flashEnd:   p.flashEnd   ? new Date(p.flashEnd).toISOString().slice(0, 16) : '',
      minOrderQty: p.minOrderQty ? p.minOrderQty.toString() : '1',
      stockQuantity: p.stockQuantity ? p.stockQuantity.toString() : '0',
      description: p.description || '',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
      images: p.images || [],
      collectionIds: (p.collections || []).map((c: any) => c.id)
    });
    setModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setForm({ 
      name: '', price: '', unit: 'kg', categoryId: '', subcategoryId: '', brand: '', image: '', imagePreview: '', 
      showUrlInput: false, isFeatured: false, isFlashSale: false, discount: '', flashStart: '', flashEnd: '', 
      minOrderQty: '1', stockQuantity: '0', description: '', tags: '', images: [], collectionIds: [] 
    });
    setModalOpen(true);
  };

  const handleExportCsv = () => {
    const header = 'Nom,Prix,Unite,Categorie,SousCategorie,QteMin,Marque,ImageURL,Description,Stock';
    const rows = initialProducts.map(p => {
      const catLabel = getCategoryLabel(p.categoryId);
      const subLabel = (p as any).subcategoryId ? getSubcategoryLabel((p as any).subcategoryId) : '';
      return `"${p.name}",${Number(p.price).toFixed(3)},${p.unit},"${catLabel}","${subLabel}",${Number(p.minOrderQty || 1)},"${(p as any).brand || ''}","${p.image || ''}","${(p.description || '').replace(/"/g, '""')}","${(p.stockStatus || 'IN_STOCK')}",${Number(p.stockQuantity || 0)}`;
    }).join('\n');
    const blob = new Blob([`${header}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `catalogue_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n').filter(Boolean);
      if (lines.length < 2) { setCsvErrors(['Fichier vide ou sans données']); setCsvStep('preview'); return; }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const requiredCols = ['nom', 'prix', 'unite', 'categorie'];
      const missing = requiredCols.filter(r => !headers.includes(r));
      if (missing.length > 0) { setCsvErrors([`Colonnes manquantes : ${missing.join(', ')}`]); setCsvStep('preview'); return; }
      const parsed: any[] = [];
      const errors: string[] = [];
      const getIdx = (name: string) => headers.indexOf(name);
      
      lines.slice(1).forEach((line, i) => {
        const cols: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') { inQuotes = !inQuotes; }
          else if (char === ',' && !inQuotes) { cols.push(current.trim().replace(/^"|"$/g, '')); current = ''; }
          else { current += char; }
        }
        cols.push(current.trim().replace(/^"|"$/g, ''));
        
        const name = cols[getIdx('nom')] || '';
        const priceRaw = cols[getIdx('prix')] || '';
        const unit = cols[getIdx('unite')] || '';
        const categoryName = cols[getIdx('categorie')] || '';
        const subcategoryName = getIdx('souscategorie') >= 0 ? cols[getIdx('souscategorie')] : '';
        const minOrderQtyRaw = getIdx('qtemin') >= 0 ? cols[getIdx('qtemin')] : '';
        const brand = getIdx('marque') >= 0 ? cols[getIdx('marque')] : '';
        const image = getIdx('imageurl') >= 0 ? cols[getIdx('imageurl')] : '';
        const description = getIdx('description') >= 0 ? cols[getIdx('description')] : '';
        const stockStatus = getIdx('stock') >= 0 ? cols[getIdx('stock')] : 'IN_STOCK';
        const stockQuantity = getIdx('stockquantity') >= 0 ? parseFloat(cols[getIdx('stockquantity')].replace(',', '.')) : 0;
        
        const price = parseFloat(priceRaw.replace(',', '.'));
        const minOrderQty = minOrderQtyRaw ? parseFloat(minOrderQtyRaw.replace(',', '.')) : 1;
        
        if (!name) { errors.push(`Ligne ${i + 2}: Nom manquant`); return; }
        if (isNaN(price) || price <= 0) { errors.push(`Ligne ${i + 2} (${name}): Prix invalide "${priceRaw}"`); return; }
        if (!unit) { errors.push(`Ligne ${i + 2} (${name}): Unité manquante`); return; }
        
        parsed.push({ 
          name, price, unit, categoryName, subcategoryName: subcategoryName || undefined,
          brand: brand || null, image: image?.startsWith('http') ? image : '',
          minOrderQty: isNaN(minOrderQty) ? 1 : minOrderQty, description: description || undefined,
          stockStatus: stockStatus || 'IN_STOCK', stockQuantity: isNaN(stockQuantity) ? 0 : stockQuantity
        });
      });
      setCsvRows(parsed); setCsvErrors(errors); setCsvStep('preview');
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (csvRows.length === 0) return;
    setCsvStep('importing');
    startTransition(async () => {
      const result = await importCsvProductsAction(csvRows);
      setCsvResult(result); setCsvStep('done');
    });
  };

  const handleImportModalClose = () => {
    setImportModalOpen(false); setCsvStep('upload'); setCsvRows([]); setCsvErrors([]); setCsvResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        minOrderQty: parseFloat(form.minOrderQty),
        stockQuantity: parseFloat(form.stockQuantity),
        brand: form.brand || null,
        discount:   form.isFlashSale ? parseFloat(form.discount) : null,
        flashStart: form.isFlashSale && form.flashStart ? new Date(form.flashStart).toISOString() : null,
        flashEnd:   form.isFlashSale && form.flashEnd   ? new Date(form.flashEnd).toISOString()   : null,
      };
      if (editingId) await updateMarketplaceProductAction(editingId, payload);
      else           await createMarketplaceProductAction(payload);
      
      if (editingId) {
        const { updateVendorProductCollectionsAction } = await import('../../../actions');
        await updateVendorProductCollectionsAction(editingId, form.collectionIds);
      }
      
      setModalOpen(false);
      showToast(editingId ? 'Produit mis à jour ✓' : 'Produit publié ✓');
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      startTransition(async () => { await deleteMarketplaceProductAction(id); });
    }
  };

  const handleProposeSubcat = async () => {
    if (!proposeSubName.trim() || !proposeParentId) return;
    setProposeStatus('sending');
    const res = await proposeSubCategoryAction(proposeSubName.trim(), proposeParentId);
    if ((res as any).error) { setProposeStatus('error'); }
    else { setProposeStatus('done'); showToast('Proposition envoyée — en attente de validation admin'); }
  };

  const handleCreateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bundleForm.items.length === 0) return alert('Ajoutez au moins un produit au pack');
    startTransition(async () => {
      await createMarketplaceBundleAction({
        name: bundleForm.name, description: bundleForm.description,
        price: parseFloat(bundleForm.price), image: bundleForm.imagePreview || bundleForm.image,
        items: bundleForm.items
      });
      setBundleModalOpen(false);
      showToast('Pack créé avec succès ✓');
    });
  };

  const handleDeleteBundle = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce pack ?')) {
      startTransition(async () => {
        await deleteMarketplaceBundleAction(id);
        showToast('Pack supprimé');
      });
    }
  };

  const addProductToBundle = (productId: string) => {
    if (bundleForm.items.find((it: any) => it.vendorProductId === productId)) return;
    setBundleForm({ ...bundleForm, items: [...bundleForm.items, { vendorProductId: productId, quantity: 1 }] });
  };

  const removeProductFromBundle = (productId: string) => {
    setBundleForm({ ...bundleForm, items: bundleForm.items.filter((it: any) => it.vendorProductId !== productId) });
  };

  const updateBundleItemQty = (productId: string, qty: number) => {
    setBundleForm({
      ...bundleForm,
      items: bundleForm.items.map((it: any) => it.vendorProductId === productId ? { ...it, quantity: Math.max(1, qty) } : it)
    });
  };

  const benchCats  = useMemo(() => Array.from(new Set(benchmarkData.map(r => r.displayCategory).filter(Boolean))), [benchmarkData]);
  const benchBrands = useMemo(() => Array.from(new Set(benchmarkData.map(r => r.brand).filter(Boolean))) as string[], [benchmarkData]);
  const filteredBenchmark = useMemo(() => benchmarkData.filter(r => {
    if (filterCategory !== 'all' && r.displayCategory !== filterCategory) return false;
    if (filterBrand     !== 'all' && (r.brand ?? 'Générique') !== filterBrand) return false;
    return true;
  }), [benchmarkData, filterCategory, filterBrand]);

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-slate-600 mb-2";

  return (
    <div className="flex flex-col gap-8">

      {/* ── TOOLBAR ── */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-[20px] w-fit overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('catalog')} className={`flex items-center gap-2 px-6 py-3 rounded-[16px] font-black text-xs transition-all whitespace-nowrap ${activeTab === 'catalog' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500'}`}><Package size={14} /> Catalogue</button>
            <button onClick={() => setActiveTab('bundles')} className={`flex items-center gap-2 px-6 py-3 rounded-[16px] font-black text-xs transition-all whitespace-nowrap ${activeTab === 'bundles' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500'}`}><Sparkles size={14} /> Packs & Offres</button>
            <button onClick={() => setActiveTab('benchmark')} className={`flex items-center gap-2 px-6 py-3 rounded-[16px] font-black text-xs transition-all whitespace-nowrap ${activeTab === 'benchmark' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500'}`}><BarChart3 size={14} /> Benchmark</button>
            <button onClick={() => setActiveTab('collections')} className={`flex items-center gap-2 px-6 py-3 rounded-[16px] font-black text-xs transition-all whitespace-nowrap ${activeTab === 'collections' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500'}`}><Tag size={14} /> Mes Rayons</button>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            {activeTab === 'catalog' && (
              <>
                <div className="flex bg-slate-50 dark:bg-slate-950 rounded-2xl p-1 border border-slate-200 dark:border-slate-800">
                  <button onClick={handleExportCsv} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-emerald-600 transition-all"><Download size={14} className="inline mr-1" /> Exporter</button>
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 self-center" />
                  <button onClick={() => { setCsvStep('upload'); setImportModalOpen(true); }} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-blue-600 transition-all"><FileSpreadsheet size={14} className="inline mr-1" /> Importer</button>
                </div>
                <Link href="/marketplace" className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-sm hover:bg-indigo-100 transition-all border border-indigo-100 dark:border-indigo-500/20"><ShoppingBag size={18} /> Marketplace</Link>
                <button onClick={handleCreateNew} className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm shadow-xl shadow-slate-900/20"><Plus size={18} /> Ajouter</button>
              </>
            )}
            {activeTab === 'bundles' && (
               <button onClick={() => { setBundleForm({name:'', description:'', price:'', image:'', items:[]}); setBundleModalOpen(true); }} className="px-8 py-3.5 rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-xl shadow-indigo-600/20"><Sparkles size={18} className="inline mr-2" /> Créer un Pack</button>
            )}
            {activeTab === 'collections' && (
              <button onClick={() => { setSelectedCollection(null); setRayonModalOpen(true); }} className="px-8 py-3.5 rounded-2xl bg-violet-600 text-white font-black text-sm shadow-xl shadow-violet-600/20"><Plus size={18} className="inline mr-2" /> Nouveau Rayon</button>
            )}
          </div>
        </div>

        {activeTab === 'catalog' && (
          <div className="flex flex-wrap items-center gap-2 px-2">
            <button onClick={() => setFilterCollection('all')} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterCollection === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-500'}`}>Tous les produits</button>
            {collections.map((col: any) => (
              <button key={col.id} onClick={() => setFilterCollection(col.id)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterCollection === col.id ? 'bg-violet-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-500'}`}>{col.name}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── CATALOG ── */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {initialProducts.filter(p => filterCollection === 'all' || (p.collections || []).some((c: any) => c.id === filterCollection)).map(p => {
            const bench = benchmarkData.find(r => r.categoryId === p.categoryId && r.unit === p.unit);
            return (
              <div key={p.id} className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col hover:shadow-2xl transition-all group">
                <div className="h-48 bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                  <img src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400&auto=format&fit=crop'} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {p.isFeatured && <div className="bg-amber-500 text-white px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Vedette</div>}
                    {p.isFlashSale && <div className="bg-rose-500 text-white px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">-{p.discount}%</div>}
                  </div>
                  {bench && (
                    <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-xl backdrop-blur-md flex items-center gap-1 ${positionConfig[bench.position]?.bg} ${positionConfig[bench.position]?.color}`}>
                      {positionConfig[bench.position]?.icon} {positionConfig[bench.position]?.label}
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">{getCategoryLabel(p.categoryId)}</div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-4">{p.name}</h4>
                  <div className="mt-auto flex justify-between items-end">
                    <div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">{Number(p.price).toFixed(3)} <span className="text-[10px] text-slate-400 uppercase">DT / {p.unit}</span></div>
                      <div className="mt-2 text-[10px] font-black text-slate-500 flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${Number(p.stockQuantity) > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} /> Stock: {p.stockQuantity}</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleEdit(p)} className="p-3 bg-slate-50 dark:bg-slate-950 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-slate-100 dark:border-slate-800"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-3 bg-slate-50 dark:bg-slate-950 text-slate-400 hover:text-rose-500 rounded-2xl transition-all border border-slate-100 dark:border-slate-800"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BUNDLES ── */}
      {activeTab === 'bundles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {initialBundles.map((b: any) => (
            <div key={b.id} className="bg-white rounded-[40px] border border-slate-100 p-8 flex flex-col hover:shadow-2xl transition-all group">
              <div className="h-56 bg-slate-100 rounded-3xl relative mb-6 overflow-hidden">
                <img src={b.image || 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=400&auto=format&fit=crop'} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-indigo-600 text-white px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl"><Sparkles size={14} /> Pack Promo</div>
                <button onClick={() => handleDeleteBundle(b.id)} className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-2xl text-rose-500 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"><Trash2 size={18} /></button>
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-2">{b.name}</h4>
              <p className="text-slate-500 text-sm font-medium mb-6 line-clamp-2">{b.description || 'Offre groupée'}</p>
              <div className="space-y-2 mb-8">
                {b.items?.map((it: any, i: number) => <div key={i} className="text-xs font-bold text-slate-600 flex items-center justify-between"><span>• {it.vendorProduct?.name}</span><span className="text-indigo-600">x{it.quantity}</span></div>)}
              </div>
              <div className="mt-auto flex justify-between items-center"><div className="text-3xl font-black text-indigo-600">{Number(b.price).toFixed(3)} DT</div><div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${b.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>{b.isActive ? 'Actif' : 'Off'}</div></div>
            </div>
          ))}
        </div>
      )}

      {/* ── BENCHMARK ── */}
      {activeTab === 'benchmark' && (
        <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center flex-wrap gap-4">
            <h3 className="text-2xl font-black text-slate-900">Analyse Marché</h3>
            <div className="flex gap-2">
              <select className="px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-black" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}><option value="all">Catégories</option>{benchCats.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <select className="px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-black" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}><option value="all">Marques</option>{benchBrands.map(b => <option key={b} value={b}>{b}</option>)}</select>
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50"><tr className="border-b border-slate-100">{['Segment', 'Mon Prix', 'Marché (Moy)', 'Position'].map(h => <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBenchmark.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6"><div className="font-bold text-slate-900">{row.displayCategory}</div><div className="text-[10px] font-black text-slate-400 uppercase mt-0.5">{row.brand || 'Générique'} · {row.unit}</div></td>
                  <td className="px-8 py-6 font-black text-slate-900">{row.myPrice ? `${row.myPrice.toFixed(3)} DT` : '—'}</td>
                  <td className="px-8 py-6 font-black text-blue-600">{row.avg?.toFixed(3)} DT</td>
                  <td className="px-8 py-6"><span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${positionConfig[row.position].bg} ${positionConfig[row.position].color}`}>{positionConfig[row.position].icon} {positionConfig[row.position].label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── RAYONS ── */}
      {activeTab === 'collections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((col: any) => (
            <div key={col.id} className="bg-white rounded-[40px] border border-slate-100 p-8 flex flex-col hover:shadow-xl transition-all group">
              <div className="flex justify-between items-center mb-6">
                <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-[22px] flex items-center justify-center"><Tag size={28} /></div>
                <div className="text-right"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produits</div><div className="text-2xl font-black text-slate-900">{(col.products || []).length}</div></div>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-6 group-hover:text-violet-600 transition-colors">{col.name}</h3>
              <div className="flex-1 space-y-3 mb-8 max-h-48 overflow-y-auto no-scrollbar">
                {(col.products || []).slice(0, 3).map((p: any) => <div key={p.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl"><div className="w-8 h-8 rounded-lg overflow-hidden bg-white shrink-0"><img src={p.image || ''} className="w-full h-full object-cover" /></div><span className="text-xs font-bold truncate">{p.name}</span></div>)}
                {(col.products || []).length === 0 && <div className="py-10 text-center text-slate-400 font-bold text-xs italic bg-slate-50 rounded-3xl">Rayon vide</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedCollection(col); setRayonModalOpen(true); }} className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"><Edit2 size={12} className="inline mr-1" /> Renommer</button>
                <button onClick={() => { setSelectedCollection(col); setAssignmentModalOpen(true); }} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl"><Package size={14} className="inline mr-1" /> Gérer</button>
              </div>
            </div>
          ))}
          {collections.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
               <Tag size={48} className="mx-auto text-slate-300 mb-4" />
               <div className="text-lg font-black text-slate-900 mb-2">Aucun rayon interne</div>
               <button onClick={() => { setSelectedCollection(null); setRayonModalOpen(true); }} className="px-8 py-4 rounded-2xl bg-violet-600 text-white font-black text-sm shadow-xl shadow-violet-600/20">Créer mon premier rayon</button>
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* MODAL PRODUIT */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifier le Produit' : 'Nouveau Produit'} width={620}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div><label className={labelClass}>Nom du produit</label><input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nom public..." required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Prix (DT)</label><input className={inputClass} type="number" step="0.001" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
                <div><label className={labelClass}>Unité</label><select className={inputClass} value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} required>{globalUnits.map((u: any) => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Qte Min</label><input className={inputClass} type="number" value={form.minOrderQty} onChange={e => setForm({...form, minOrderQty: e.target.value})} required /></div>
                <div><label className={labelClass}>Stock Réel</label><input className={inputClass} type="number" value={form.stockQuantity} onChange={e => setForm({...form, stockQuantity: e.target.value})} required /></div>
              </div>
            </div>
            <div className="space-y-4">
               <CategorySelector categoryTree={filteredCategoryTree} value={form.categoryId} onChange={(catId, subcatId) => setForm({...form, categoryId: catId, subcategoryId: subcatId || null})} onPropose={() => setProposeModalOpen(true)} inputClass={inputClass} />
               <div><label className={labelClass}>Marque</label><input className={inputClass} value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="Marque ou Générique" /></div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Image Upload */}
                <div className="md:col-span-1">
                   <label className={labelClass}>Image Produit</label>
                   <div className="relative group aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                      {form.imagePreview ? (
                        <img src={form.imagePreview} className="w-full h-full object-cover" />
                      ) : (
                        <Plus size={24} className="text-slate-300" />
                      )}
                      <input type="file" id="prod-img" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                      <label htmlFor="prod-img" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-all font-black text-[10px] uppercase tracking-widest">
                         Changer
                      </label>
                   </div>
                </div>

                {/* Gallery Upload */}
                <div className="md:col-span-2 space-y-4">
                   <label className={labelClass}>Galerie (Max 5 images)</label>
                   <div className="flex flex-wrap gap-2">
                      {(form.images || []).map((img: string, idx: number) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                           <img src={img} className="w-full h-full object-cover" />
                           <button type="button" onClick={() => setForm((f: any) => ({ ...f, images: f.images.filter((_: any, i: number) => i !== idx) }))} className="absolute top-0 right-0 p-1 bg-rose-500 text-white rounded-bl-lg">
                              <X size={10} />
                           </button>
                        </div>
                      ))}
                      {(form.images || []).length < 5 && (
                        <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 cursor-pointer hover:border-indigo-400 hover:text-indigo-400 transition-all">
                           <Plus size={20} />
                           <input type="file" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], true)} />
                        </label>
                      )}
                   </div>
                   
                   <div>
                     <label className={labelClass}>Description & Origine (B2B)</label>
                     <textarea className={`${inputClass} min-h-[100px] py-3 resize-none`} placeholder="Décrivez l'origine, la qualité, conseils..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                   </div>
                   <div>
                     <label className={labelClass}>Mots-clés / Labels (séparés par virgule)</label>
                     <input className={inputClass} placeholder="ex: Bio, Artisanal, Made in Tunisia..." value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
                   </div>
                </div>
             </div>
          </div>

          <div className="flex gap-4 pt-4"><button type="button" className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm" onClick={() => setModalOpen(false)}>Annuler</button><button type="submit" className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl" disabled={isPending}>{isPending ? <Loader2 className="animate-spin mx-auto" /> : (editingId ? 'Mettre à jour' : 'Publier')}</button></div>
        </form>
      </Modal>

      {/* MODAL BUNDLE */}
      <Modal open={bundleModalOpen} onClose={() => setBundleModalOpen(false)} title="Créer un Pack Promo" width={800}>
        <form onSubmit={handleCreateBundle} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="space-y-6">
              <div><label className={labelClass}>Nom du Pack</label><input className={inputClass} value={bundleForm.name} onChange={e => setBundleForm({...bundleForm, name: e.target.value})} required /></div>
              <div><label className={labelClass}>Prix du Pack (DT)</label><input className={inputClass} type="number" step="0.001" value={bundleForm.price} onChange={e => setBundleForm({...bundleForm, price: e.target.value})} required /></div>
              <div className="flex gap-4"><button type="button" className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm" onClick={() => setBundleModalOpen(false)}>Annuler</button><button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl">Créer le Pack</button></div>
           </div>
           <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 overflow-y-auto max-h-[400px]">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Produits inclus</div>
              {bundleForm.items.map((item: any) => (
                <div key={item.vendorProductId} className="bg-white p-3 rounded-2xl mb-2 flex items-center justify-between border border-slate-100">
                  <span className="text-xs font-black truncate max-w-[150px]">{initialProducts.find(p => p.id === item.vendorProductId)?.name}</span>
                  <div className="flex items-center gap-2"><button type="button" onClick={() => updateBundleItemQty(item.vendorProductId, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">-</button><span className="text-xs font-black">{item.quantity}</span><button type="button" onClick={() => updateBundleItemQty(item.vendorProductId, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">+</button></div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-slate-200"><div className="flex flex-wrap gap-2">{initialProducts.slice(0, 10).map(p => <button key={p.id} type="button" onClick={() => addProductToBundle(p.id)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black hover:border-indigo-500">+ {p.name}</button>)}</div></div>
           </div>
        </form>
      </Modal>

      {/* MODAL PROPOSER SOUS-CATÉGORIE */}
      <Modal open={proposeModalOpen} onClose={() => setProposeModalOpen(false)} title="Proposer une sous-catégorie" width={480}>
        <div className="space-y-6">
          <div><label className={labelClass}>Catégorie parente</label><select className={inputClass} value={proposeParentId} onChange={e => setProposeParentId(e.target.value)} required><option value="">Sélectionner...</option>{categoryTree.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className={labelClass}>Nom suggéré</label><input className={inputClass} value={proposeSubName} onChange={e => setProposeSubName(e.target.value)} placeholder="ex: Charbons Naturels..." /></div>
          <div className="flex gap-3"><button onClick={() => setProposeModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm">Annuler</button><button onClick={handleProposeSubcat} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl">Envoyer</button></div>
        </div>
      </Modal>

      {/* MODAL RAYON */}
      <Modal open={rayonModalOpen} onClose={() => setRayonModalOpen(false)} title={selectedCollection ? 'Modifier le Rayon' : 'Nouveau Rayon'} width={400}>
        <div className="space-y-6">
          <div><label className={labelClass}>Nom du rayon</label><input className={inputClass} defaultValue={selectedCollection?.name || ''} id="rayon-name-input" placeholder="ex: Sélection Premium..." /></div>
          <div className="flex gap-3">
            <button className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm" onClick={() => setRayonModalOpen(false)}>Annuler</button>
            <button className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-black text-sm shadow-xl" onClick={async () => {
                const name = (document.getElementById('rayon-name-input') as HTMLInputElement).value;
                if (!name) return;
                startTransition(async () => {
                  const { createVendorCollectionAction } = await import('../../../actions');
                  if (selectedCollection) { /* Rename logic could be added here if backend supports it */ }
                  else { await createVendorCollectionAction(name); }
                  window.location.reload();
                });
              }}>Enregistrer</button>
          </div>
        </div>
      </Modal>

      {/* MODAL AFFECTATION */}
      <Modal open={assignmentModalOpen} onClose={() => setAssignmentModalOpen(false)} title={`Produits: ${selectedCollection?.name}`} width={600}>
        <div className="space-y-6">
          <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-[24px] font-black text-sm" placeholder="Rechercher..." value={assignSearch} onChange={e => setAssignSearch(e.target.value)} /></div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2 no-scrollbar">
            {initialProducts.filter(p => p.name.toLowerCase().includes(assignSearch.toLowerCase())).map(p => {
              const isAssigned = (p.collections || []).some((c: any) => c.id === selectedCollection?.id);
              return (
                <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-[28px] border border-transparent hover:border-slate-200 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white shrink-0 shadow-sm"><img src={p.image || ''} className="w-full h-full object-cover" /></div>
                      <div><div className="font-black text-slate-900 text-sm">{p.name}</div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{getCategoryLabel(p.categoryId)}</div></div>
                   </div>
                   <button onClick={async () => {
                      startTransition(async () => {
                        const { updateVendorProductCollectionsAction } = await import('../../../actions');
                        const currentIds = (p.collections || []).map((c: any) => c.id);
                        const newIds = isAssigned ? currentIds.filter((id: string) => id !== selectedCollection.id) : [...currentIds, selectedCollection.id];
                        await updateVendorProductCollectionsAction(p.id, newIds);
                      });
                    }} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isAssigned ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-900 hover:text-white'}`}>{isAssigned ? 'Retirer' : 'Ajouter'}</button>
                </div>
              );
            })}
          </div>
          <button className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm shadow-2xl" onClick={() => window.location.reload()}>Terminer & Actualiser</button>
        </div>
      </Modal>

      {/* IMPORT MODAL */}
      <Modal open={importModalOpen} onClose={handleImportModalClose} title="Importer via CSV" width={600}>
        <div className="space-y-6">
           {csvStep === 'upload' && (
             <label className="border-4 border-dashed border-slate-100 rounded-[40px] p-16 flex flex-col items-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all group">
                <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-slate-300 group-hover:text-indigo-500 shadow-xl shadow-slate-100 transition-all"><FileSpreadsheet size={32} /></div>
                <div className="text-center"><div className="text-sm font-black text-slate-900">Cliquez ou glissez votre CSV</div><div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Fichiers .csv</div></div>
                <input type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) parseCsvFile(f); }} />
             </label>
           )}
           {csvStep === 'preview' && (
             <div className="space-y-6">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{csvRows.length} produits trouvés</div>
                <div className="flex gap-4"><button onClick={() => setCsvStep('upload')} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm">Retour</button><button onClick={handleConfirmImport} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/20">Importer tout</button></div>
             </div>
           )}
           {csvStep === 'importing' && <div className="py-20 flex flex-col items-center gap-6"><Loader2 size={48} className="text-indigo-500 animate-spin" /><div className="font-black text-slate-900">Importation...</div></div>}
           {csvStep === 'done' && <div className="py-10 text-center space-y-6"><div className="w-20 h-20 bg-emerald-500 rounded-[30px] flex items-center justify-center text-white shadow-2xl mx-auto"><CheckCircle2 size={40} /></div><button onClick={handleImportModalClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm">Fermer</button></div>}
        </div>
      </Modal>

      {/* TOAST */}
      {toast?.show && (
        <div className={`fixed bottom-10 right-10 p-5 pr-10 rounded-[32px] border shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-500 z-[999] ${toast.error ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}>
          <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center text-white shadow-xl ${toast.error ? 'bg-rose-500' : 'bg-emerald-500'}`}>{toast.error ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}</div>
          <div><div className="font-black text-sm text-slate-900">{toast.error ? 'Oups !' : 'Parfait !'}</div><div className="text-xs text-slate-500 font-bold">{toast.message}</div></div>
        </div>
      )}
    </div>
  );
}
