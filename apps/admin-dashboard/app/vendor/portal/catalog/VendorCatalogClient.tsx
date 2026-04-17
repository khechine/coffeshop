'use client';

import React, { useState, useTransition, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, Package, Clock, FileSpreadsheet, Download,
  CheckCircle2, AlertCircle, Loader2, BarChart3, TrendingUp, TrendingDown,
  Minus, ChevronDown, Tag, Sparkles
} from 'lucide-react';
import Modal from '../../../../components/Modal';
import {
  createMarketplaceProductAction, updateMarketplaceProductAction,
  deleteMarketplaceProductAction, importCsvProductsAction,
  proposeSubCategoryAction,
} from '../../../actions';

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

  const selectedParent = categoryTree.find(c => c.id === parentId);
  const hasSubcategories = selectedParent && (selectedParent.subcategories?.length || 0) > 0;

  const handleParentChange = (id: string) => {
    setParentId(id);
    onChange(id); // select parent if no sub-cat
  };
  const handleSubcategoryChange = (id: string) => onChange(parentId, id);

  return (
    <div className="space-y-3">
      {/* Catégorie parente (niveau 1) */}
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

      {/* Sous-catégorie (niveau 2) */}
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

      {/* Si pas de sous-catégories, montrer bouton proposer sous la catégorie parente */}
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
  initialProducts, categoryTree, globalUnits, benchmarkData = [], vendorId, mktSectors = [],
}: {
  initialProducts: any[];
  categoryTree: RootCategory[];
  globalUnits: any[];
  benchmarkData?: BenchmarkRow[];
  vendorId: string;
  mktSectors?: any[];
}) {
  const [activeTab, setActiveTab]           = useState<'catalog' | 'benchmark'>('catalog');
  const [modalOpen, setModalOpen]           = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [toast, setToast]                   = useState<{ show: boolean; message: string; error?: boolean } | null>(null);
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [isPending, startTransition]        = useTransition();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterBrand, setFilterBrand]       = useState<string>('all');

  // CSV state
  const [csvStep, setCsvStep]   = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [csvRows, setCsvRows]   = useState<any[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvResult, setCsvResult] = useState<{ created: number; updated: number; skipped: number; errors: string[]; newCategories: string[] } | null>(null);

  // Propose subcategory state
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

  // Flat list of all categories (root + subcategories) for display
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

  const [form, setForm] = useState<any>({
    name: '', price: '', unit: 'kg', categoryId: '', subcategoryId: '', brand: '', image: '', imagePreview: '', showUrlInput: false,
    isFeatured: false, isFlashSale: false, discount: '', flashStart: '', flashEnd: '', minOrderQty: '1',
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
    });
    setModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setForm({ name: '', price: '', unit: 'kg', categoryId: '', subcategoryId: '', brand: '', image: '', imagePreview: '', showUrlInput: false, isFeatured: false, isFlashSale: false, discount: '', flashStart: '', flashEnd: '', minOrderQty: '1' });
    setModalOpen(true);
  };

  const handleExportCsv = () => {
    const header = 'Nom,Prix,Unite,Categorie,SousCategorie,QteMin,Marque,ImageURL,Description,Stock';
    const rows = initialProducts.map(p => {
      const catLabel = getCategoryLabel(p.categoryId);
      const subLabel = (p as any).subcategoryId ? getSubcategoryLabel((p as any).subcategoryId) : '';
      return `"${p.name}",${Number(p.price).toFixed(3)},${p.unit},"${catLabel}","${subLabel}",${Number(p.minOrderQty || 1)},"${(p as any).brand || ''}","${p.image || ''}","${(p.description || '').replace(/"/g, '""')}","${(p.stockStatus || 'IN_STOCK')}"`;
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
        // Handle commas inside quoted strings
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
        const imageIdx = getIdx('imageurl');
        const image = imageIdx >= 0 ? cols[imageIdx] : '';
        const descIdx = getIdx('description');
        const description = descIdx >= 0 ? cols[descIdx] : '';
        const stockIdx = getIdx('stock');
        const stockStatus = stockIdx >= 0 ? cols[stockIdx] : 'IN_STOCK';
        
        const price = parseFloat(priceRaw.replace(',', '.'));
        const minOrderQty = minOrderQtyRaw ? parseFloat(minOrderQtyRaw.replace(',', '.')) : 1;
        
        if (!name) { errors.push(`Ligne ${i + 2}: Nom manquant`); return; }
        if (isNaN(price) || price <= 0) { errors.push(`Ligne ${i + 2} (${name}): Prix invalide "${priceRaw}"`); return; }
        if (!unit) { errors.push(`Ligne ${i + 2} (${name}): Unité manquante`); return; }
        
        parsed.push({ 
          name, 
          price, 
          unit, 
          categoryName, 
          subcategoryName: subcategoryName || undefined,
          brand: brand || null, 
          image: image?.startsWith('http') ? image : '',
          minOrderQty: isNaN(minOrderQty) ? 1 : minOrderQty,
          description: description || undefined,
          stockStatus: stockStatus || 'IN_STOCK'
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
        brand: form.brand || null,
        discount:   form.isFlashSale ? parseFloat(form.discount) : null,
        flashStart: form.isFlashSale && form.flashStart ? new Date(form.flashStart).toISOString() : null,
        flashEnd:   form.isFlashSale && form.flashEnd   ? new Date(form.flashEnd).toISOString()   : null,
      };
      if (editingId) await updateMarketplaceProductAction(editingId, payload);
      else           await createMarketplaceProductAction(payload);
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

  // ── Benchmark filters ──
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
    <div className="flex flex-col gap-6">

      {/* ── TOOLBAR ── */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 gap-4 shadow-sm">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
          <button onClick={() => setActiveTab('catalog')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab === 'catalog' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Package size={16} /> Catalogue
          </button>
          <button onClick={() => setActiveTab('benchmark')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab === 'benchmark' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <BarChart3 size={16} /> Benchmark
            {benchmarkData.length > 0 && <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">{benchmarkData.length}</span>}
          </button>
        </div>
        {activeTab === 'catalog' && (
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handleExportCsv} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 hover:text-emerald-600 transition-all">
              <Download size={16} /> Exporter
            </button>
            <button onClick={() => { setCsvStep('upload'); setImportModalOpen(true); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 hover:text-blue-600 transition-all">
              <FileSpreadsheet size={16} /> Importer
            </button>
            <button onClick={handleCreateNew} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md">
              <Plus size={16} /> Ajouter
            </button>
          </div>
        )}
      </div>

      {/* ── CATALOG TAB ── */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {initialProducts.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md group">
              <div className="h-40 bg-slate-100 relative overflow-hidden">
                <img src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400&auto=format&fit=crop'} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                  {p.isFeatured  && <div className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-semibold">Vedette</div>}
                  {p.isFlashSale && <div className="bg-rose-500 text-white px-2 py-1 rounded-full text-xs font-semibold">-{p.discount}%</div>}
                </div>
              </div>
              <div className="p-4 flex flex-1 flex-col">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs text-slate-500 font-medium">{getCategoryLabel(p.categoryId)}</span>
                  {(p as any).brand && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{(p as any).brand}</span>}
                </div>
                <h4 className="text-base font-semibold text-slate-900 leading-tight mb-3 group-hover:text-blue-600 transition-colors">{p.name}</h4>
                <div className="mt-auto flex justify-between items-end">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-slate-900">{Number(p.price).toFixed(3)}</span>
                      <span className="text-xs text-slate-500">DT / {p.unit}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(p)} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
                {p.isFlashSale && p.flashEnd && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg">
                    <Clock size={12} /> Fin : {new Date(p.flashEnd).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
          {initialProducts.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <Package size={48} className="mx-auto text-slate-300 mb-4" />
              <div className="text-lg font-black text-slate-900 dark:text-white mb-2">Catalogue vide</div>
              <div className="text-slate-500 text-sm mb-6">Ajoutez vos premiers produits ou importez un CSV.</div>
              <button onClick={handleCreateNew} className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 shadow-lg shadow-indigo-600/20">
                <Plus size={16} className="inline mr-2" />Ajouter un produit
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── BENCHMARK TAB ── */}
      {activeTab === 'benchmark' && (() => {
        const myRows     = filteredBenchmark.filter(r => r.myPrice !== null);
        const othersRows = filteredBenchmark.filter(r => r.myPrice === null);

        const renderRow = (row: BenchmarkRow, i: number, highlight = false) => {
          const cfg = positionConfig[row.position] ?? positionConfig.unset;
          return (
            <tr key={i} className={`transition-colors ${highlight ? 'bg-indigo-50/40 dark:bg-indigo-500/5 hover:bg-indigo-50' : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'}`}>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  {highlight && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                  <div>
                    <div className="font-black text-slate-900 dark:text-white text-sm">{row.displayCategory}</div>
                    {row.brand && <span className="text-[9px] font-black text-violet-500 uppercase"><Tag size={8} className="inline mr-0.5" />{row.brand}</span>}
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase">{row.unit}</td>
              <td className="px-5 py-3.5">
                {row.myPrice !== null
                  ? <span className="font-black text-slate-900 dark:text-white">{row.myPrice.toFixed(3)} DT</span>
                  : <span className="text-slate-400 text-xs italic">—</span>}
              </td>
              <td className="px-5 py-3.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">{row.min !== null ? `${row.min.toFixed(3)} DT` : '—'}</td>
              <td className="px-5 py-3.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm">{row.avg !== null ? `${row.avg.toFixed(3)} DT` : '—'}</td>
              <td className="px-5 py-3.5 text-amber-600 dark:text-amber-400 font-bold text-sm">{row.max !== null ? `${row.max.toFixed(3)} DT` : '—'}</td>
              <td className="px-5 py-3.5 text-center">
                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black text-slate-600 dark:text-slate-300">
                  {row.competitorCount === 0 ? '—' : `${row.competitorCount} vendeur${row.competitorCount > 1 ? 's' : ''}`}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black whitespace-nowrap w-fit ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </span>
              </td>
            </tr>
          );
        };

        return (
          <div className="space-y-5">
            {/* Filter pills — category */}
            <div className="flex flex-wrap gap-2 items-center">
              <ChevronDown size={14} className="text-slate-400 rotate-[-90deg]" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Catégorie :</span>
              {(['all', ...benchCats] as string[]).map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all ${filterCategory === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600'}`}>
                  {cat === 'all' ? 'Tout' : cat}
                </button>
              ))}
            </div>

            {/* Filter pills — brand */}
            {benchBrands.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <Tag size={12} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Marque :</span>
                {(['all', ...benchBrands, 'Générique'] as string[]).map(b => (
                  <button key={b} onClick={() => setFilterBrand(b)}
                    className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all ${filterBrand === b ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-violet-400 hover:text-violet-600'}`}>
                    {b === 'all' ? 'Toutes' : b}
                  </button>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(positionConfig).filter(([k]) => k !== 'unset').map(([, cfg]) => (
                <div key={cfg.label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </div>
              ))}
            </div>

            {filteredBenchmark.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/40 border-2 border-dashed border-slate-200 rounded-[40px] p-16 text-center">
                <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Aucune donnée</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">Ajoutez des produits à votre catalogue ou changez de filtre.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-[32px] overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-3">
                  <BarChart3 size={18} className="text-indigo-500" />
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    {filteredBenchmark.length} segment(s) de marché · {myRows.length} dans votre catalogue
                  </h2>
                  <span className="ml-auto text-[10px] text-slate-400 font-medium italic">Les prix concurrents sont anonymisés</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950/40">
                      <tr>
                        {['Segment (catégorie › sous-cat.)', 'Unité', 'Mon Prix', 'Min marché', 'Moy. marché', 'Max marché', 'Concurrence', 'Position'].map(h => (
                          <th key={h} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                      {myRows.length > 0 && (
                        <tr className="bg-indigo-600">
                          <td colSpan={8} className="px-5 py-2 text-[10px] font-black text-white uppercase tracking-widest">
                            📦 Mes segments — {myRows.length} référence(s) dans mon catalogue
                          </td>
                        </tr>
                      )}
                      {myRows.map((r, i) => renderRow(r, i, true))}

                      {myRows.length > 0 && othersRows.length > 0 && (
                        <tr className="bg-slate-100 dark:bg-slate-800/60">
                          <td colSpan={8} className="px-5 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            🔍 Opportunités marché — {othersRows.length} segment(s) absents de votre catalogue
                          </td>
                        </tr>
                      )}
                      {othersRows.map((r, i) => renderRow(r, i, false))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── MODAL PRODUIT ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifier le Produit' : 'Nouveau Produit Marketplace'} width={620}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Nom du produit</label>
            <input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="ex: Charbon Naturel Coco" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Prix (DT)</label>
              <input className={inputClass} type="number" step="0.001" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
            </div>
            <div>
              <label className={labelClass}>Unité</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} required>
                <option value="">Choisir...</option>
                {globalUnits.map((u: any) => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Qte Min</label>
              <input className={inputClass} type="number" step="0.5" value={form.minOrderQty} onChange={e => setForm({...form, minOrderQty: e.target.value})} required />
            </div>
          </div>

          <div>
            <label className={labelClass}>Catégorie</label>
            {mktSectors.length === 0 && (
              <div className="mb-2 p-3 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                ⚠️ Aucun secteur configuré dans vos paramètres. Toutes les catégories sont affichées.
              </div>
            )}
            <CategorySelector
              categoryTree={filteredCategoryTree}
              value={form.categoryId}
              onChange={(catId, subcatId) => setForm({...form, categoryId: catId, subcategoryId: subcatId || null})}
              onPropose={() => setProposeModalOpen(true)}
              inputClass={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}><Tag size={11} className="inline mr-1" />Marque (optionnel)</label>
            <input className={inputClass} value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder='ex: Al Fakher, Fumari, Tangiers — laisser vide si générique' list="brand-list" />
            <datalist id="brand-list">
              {Array.from(new Set(initialProducts.map((p: any) => p.brand).filter(Boolean))).map((b: any) => <option key={b} value={b} />)}
            </datalist>
          </div>

          <div>
            <label className={labelClass}>Photo du produit</label>
            <div className="space-y-3">
              {/* Preview de l'image */}
              {(form.image || form.imagePreview) && (
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800">
                  <img 
                    src={form.imagePreview || form.image} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({...form, image: '', imagePreview: ''})}
                    className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-rose-600"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Boutons d'upload */}
              <div className="flex gap-2 flex-wrap">
                {/* Bouton Upload fichier */}
                <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors text-sm font-bold">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setForm({...form, image: file.name, imagePreview: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Importer
                </label>

                {/* Bouton Caméra (mobile) */}
                <label className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-colors text-sm font-bold">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setForm({...form, image: file.name, imagePreview: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Caméra
                </label>

                {/* Bouton URL (optionnel) */}
                <button
                  type="button"
                  onClick={() => setForm({...form, showUrlInput: !form.showUrlInput})}
                  className="px-4 py-2.5 text-slate-500 hover:text-slate-700 text-sm font-medium"
                >
                  {form.showUrlInput ? '← Masquer URL' : 'Ou via URL'}
                </button>
              </div>

              {/* Input URL (caché par défaut) */}
              {form.showUrlInput && (
                <input 
                  className={inputClass} 
                  value={form.image} 
                  onChange={e => setForm({...form, image: e.target.value, imagePreview: ''})} 
                  placeholder="https://exemple.com/photo.jpg" 
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded-lg" checked={form.isFeatured} onChange={e => setForm({...form, isFeatured: e.target.checked})} />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">🔥 Produit Vedette</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded-lg" checked={form.isFlashSale} onChange={e => setForm({...form, isFlashSale: e.target.checked})} />
              <span className="text-sm font-bold text-rose-600">⚡ Vente Flash</span>
            </label>
          </div>

          {form.isFlashSale && (
            <div className="bg-rose-50 dark:bg-rose-500/5 border border-rose-100 p-4 rounded-2xl space-y-4">
              <div><label className={labelClass + ' !text-rose-600'}>Remise (%)</label>
                <input className={inputClass} type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelClass + ' !text-rose-600'}>Début</label>
                  <input className={inputClass} type="datetime-local" value={form.flashStart} onChange={e => setForm({...form, flashStart: e.target.value})} required /></div>
                <div><label className={labelClass + ' !text-rose-600'}>Fin</label>
                  <input className={inputClass} type="datetime-local" value={form.flashEnd} onChange={e => setForm({...form, flashEnd: e.target.value})} required /></div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" className="flex-1 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 font-bold hover:bg-slate-50 transition-colors" onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" className="flex-[2] px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 disabled:opacity-50" disabled={isPending}>
              {isPending ? 'Enregistrement...' : (editingId ? 'Mettre à jour' : 'Publier le produit')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL PROPOSER UNE SOUS-CATÉGORIE ── */}
      <Modal open={proposeModalOpen} onClose={() => { setProposeModalOpen(false); setProposeStatus('idle'); setProposeSubName(''); }} title="Proposer une sous-catégorie" width={480}>
        {proposeStatus === 'done' ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"><CheckCircle2 size={32} /></div>
            <div className="text-center">
              <div className="font-black text-slate-900 dark:text-white text-lg mb-1">Proposition envoyée !</div>
              <p className="text-slate-500 text-sm">Votre suggestion sera examinée par notre équipe. Vous serez notifié dès son approbation.</p>
            </div>
            <button onClick={() => { setProposeModalOpen(false); setProposeStatus('idle'); setProposeSubName(''); }} className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500">Fermer</button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl text-sm text-amber-700 dark:text-amber-300 font-medium">
              💡 Votre proposition sera soumise à validation avant d'être disponible pour tous les vendeurs.
            </div>
            <div>
              <label className={labelClass}>Catégorie parente</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={proposeParentId} onChange={e => setProposeParentId(e.target.value)} required>
                <option value="">Choisir une catégorie principale...</option>
                {categoryTree.map(c => <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Nom de la nouvelle sous-catégorie</label>
              <input className={inputClass} value={proposeSubName} onChange={e => setProposeSubName(e.target.value)} placeholder="ex: Charbons naturel coco, Têtes en verre..." />
            </div>
            {proposeStatus === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-bold">
                <AlertCircle size={16} /> Cette sous-catégorie existe déjà.
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setProposeModalOpen(false)} className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50">Annuler</button>
              <button type="button" onClick={handleProposeSubcat} disabled={!proposeSubName.trim() || !proposeParentId || proposeStatus === 'sending'} className="flex-[2] px-4 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500 disabled:opacity-50">
                {proposeStatus === 'sending' ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Envoyer la proposition'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL CSV IMPORT ── */}
      <Modal open={importModalOpen} onClose={handleImportModalClose} title="Importer votre catalogue (CSV)" width={600}>
        <div className="space-y-6">
          {csvStep === 'upload' && (
            <>
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <p className="text-xs text-slate-500 font-medium">Colonnes requises: <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">Nom, Prix, Unite, Categorie</code></p>
                <p className="text-xs text-slate-400">Optionnelles: <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded font-mono">SousCategorie, QteMin, Marque, ImageURL, Description, Stock</code></p>
                <button onClick={() => { const b = new Blob(['Nom,Prix,Unite,Categorie,SousCategorie,QteMin,Marque,ImageURL,Description,Stock\nCharbon Coco King,12.500,kg,Charbons,,1,CocoKing,https://example.com/image.jpg,Charbon de qualité,IN_STOCK\nTabac Al Fakher Pomme,8.900,50g,Tabac,Flavored,10,Al Fakher,,Fruit,LOW_STOCK'], { type: 'text/csv' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'modele_catalogue.csv'; a.click(); }} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 text-indigo-600 font-black text-xs hover:bg-indigo-50 transition-colors">
                  <Download size={14} /> Télécharger le modèle
                </button>
              </div>
              <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[24px] p-10 flex flex-col items-center gap-3 group hover:border-indigo-500/50 cursor-pointer transition-colors">
                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors"><FileSpreadsheet size={28} /></div>
                <div className="text-sm font-black text-slate-900 dark:text-white">Glissez votre CSV ici</div>
                <div className="text-xs text-slate-500">ou cliquez pour choisir un fichier</div>
                <input type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) parseCsvFile(f); }} />
              </label>
            </>
          )}
          {csvStep === 'preview' && (
            <>
              {csvErrors.length > 0 && <div className="space-y-2">{csvErrors.map((err, i) => <div key={i} className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold"><AlertCircle size={14} className="shrink-0 mt-0.5" />{err}</div>)}</div>}
              {csvRows.length > 0 ? (
                <>
                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest">{csvRows.length} produits prêts à importer</div>
                  <div className="overflow-auto max-h-64 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/50"><tr>{['Nom', 'Prix', 'Unité', 'Catégorie', 'Marque'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase">{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {csvRows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{r.name}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.price.toFixed(3)} DT</td>
                            <td className="px-4 py-3 text-slate-500">{r.unit}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md font-bold">{r.categoryName || '—'}</span></td>
                            <td className="px-4 py-3">{r.brand ? <span className="px-2 py-0.5 bg-violet-50 text-violet-600 rounded-md font-bold">{r.brand}</span> : <span className="text-slate-400">—</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setCsvStep('upload')} className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50">Retour</button>
                    <button onClick={handleConfirmImport} disabled={isPending} className="flex-[2] px-4 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 disabled:opacity-50">✅ Confirmer l'importation</button>
                  </div>
                </>
              ) : <div className="text-center py-10 text-slate-400 font-bold text-sm">Aucune ligne valide trouvée.</div>}
            </>
          )}
          {csvStep === 'importing' && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 size={36} className="text-indigo-500 animate-spin" />
              <div className="text-sm font-black text-slate-900 dark:text-white">Import en cours...</div>
              <div className="text-xs text-slate-500">{csvRows.length} produits à traiter</div>
            </div>
          )}
          {csvStep === 'done' && csvResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0"><CheckCircle2 size={24} /></div>
                <div>
                  <div className="font-black text-emerald-700">{csvResult.created} créé(s) · {csvResult.updated} mis à jour</div>
                  {csvResult.skipped > 0 && <div className="text-xs text-slate-500 mt-1">{csvResult.skipped} ignoré(s)</div>}
                </div>
              </div>
              {csvResult.newCategories.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <div className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2">Nouvelles catégories (en attente d'approbation)</div>
                  {csvResult.newCategories.map((msg, i) => (
                    <div key={i} className="text-xs text-amber-600 font-medium">{msg}</div>
                  ))}
                </div>
              )}
              {csvResult.errors.length > 0 && <div className="space-y-1.5">{csvResult.errors.map((err, i) => <div key={i} className="text-xs text-rose-600 font-bold flex items-center gap-2 bg-rose-50 px-3 py-2 rounded-xl"><AlertCircle size={12} />{err}</div>)}</div>}
              <button onClick={handleImportModalClose} className="w-full px-4 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500">Fermer et voir le catalogue</button>
            </div>
          )}
        </div>
      </Modal>

      {/* ── TOAST ── */}
      {toast?.show && (
        <div className={`fixed bottom-10 right-10 p-4 pr-8 rounded-3xl border shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-500 z-[999] ${toast.error ? 'bg-rose-50 border-rose-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${toast.error ? 'bg-rose-500' : 'bg-emerald-500'}`}>
            {toast.error ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          </div>
          <div>
            <div className="font-black text-sm text-slate-900 dark:text-white">{toast.error ? 'Erreur' : 'Succès !'}</div>
            <div className="text-xs text-slate-500 font-medium">{toast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
