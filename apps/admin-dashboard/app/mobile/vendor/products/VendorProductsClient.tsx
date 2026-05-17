'use client';

import React, { useState } from 'react';
import { Package, Search, Plus, Settings2, X, Save, Trash2 } from 'lucide-react';
import { sanitizeUrl } from '../../../lib/imageUtils';
import { getVendorProductsForUpsellAction, getVendorProductUpsellsAction, configureVendorProductUpsellAction, deleteVendorProductUpsellAction } from '../../../actions';

export default function VendorProductsClient({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Upsell Modal State
  const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [upsells, setUpsells] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isLoadingUpsells, setIsLoadingUpsells] = useState(false);
  
  // Form State
  const [targetProductId, setTargetProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [text, setText] = useState('');

  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const openUpsellModal = async (product: any) => {
    setSelectedProduct(product);
    setIsUpsellModalOpen(true);
    setIsLoadingUpsells(true);
    try {
      const [allProducts, existingUpsells] = await Promise.all([
        getVendorProductsForUpsellAction(),
        getVendorProductUpsellsAction(product.id)
      ]);
      setAvailableProducts(allProducts.filter((p: any) => p.id !== product.id));
      setUpsells(existingUpsells);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingUpsells(false);
    }
  };

  const handleAddUpsell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !targetProductId) return;
    
    try {
      await configureVendorProductUpsellAction({
        sourceProductId: selectedProduct.id,
        targetProductId,
        quantity,
        discountPercent,
        text
      });
      
      const updatedUpsells = await getVendorProductUpsellsAction(selectedProduct.id);
      setUpsells(updatedUpsells);
      
      // Reset form
      setTargetProductId('');
      setQuantity(1);
      setDiscountPercent(0);
      setText('');
    } catch (e) {
      alert("Erreur lors de l'ajout de l'upsell");
    }
  };

  const handleDeleteUpsell = async (id: string) => {
    try {
      await deleteVendorProductUpsellAction(id);
      setUpsells(upsells.filter(u => u.id !== id));
    } catch (e) {
      alert("Erreur lors de la suppression");
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h1 style={{ fontSize: '24px', fontWeight: 950, color: '#111827', margin: 0 }}>Catalogue</h1>
         <span style={{ fontSize: '12px', fontWeight: 800, color: '#6B7280', background: '#F3F4F6', padding: '4px 10px', borderRadius: '100px' }}>
            {products.length} articles
         </span>
      </div>
      
      <div style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={20} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un produit..." 
          style={{ 
            width: '100%', padding: '16px 16px 16px 52px', 
            borderRadius: '16px', border: '1px solid #E5E7EB', 
            fontSize: '16px', outline: 'none', background: '#fff',
            boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
          }}
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
          <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p style={{ fontWeight: 700 }}>Aucun produit trouvé.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredProducts.map((p: any) => (
            <div key={p.id} style={{ background: '#fff', borderRadius: '20px', padding: '12px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#F3F4F6', overflow: 'hidden', flexShrink: 0 }}>
                {p.image ? (
                  <img src={sanitizeUrl(p.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.name} />
                ) : (
                  <Package size={24} style={{ margin: '18px auto', color: '#9CA3AF' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800, color: '#111827' }}>{p.name}</h4>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                   <span style={{ fontSize: '14px', fontWeight: 900, color: '#111827' }}>{Number(p.price).toFixed(2)} DT</span>
                   <span style={{ fontSize: '12px', color: '#6B7280' }}>/ {p.unit}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 <button 
                   onClick={() => openUpsellModal(p)}
                   style={{ padding: '8px 12px', borderRadius: '8px', background: '#EEF2FF', color: '#4F46E5', border: 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                 >
                   <Settings2 size={14} /> Upsell
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upsell Configuration Modal */}
      {isUpsellModalOpen && selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Configuration Upsell</h3>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6B7280' }}>Pour: {selectedProduct.name}</p>
              </div>
              <button onClick={() => setIsUpsellModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                <X size={24} />
              </button>
            </div>

            {isLoadingUpsells ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Chargement...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Existing Upsells */}
                {upsells.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800, color: '#374151' }}>Upsells Actifs</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {upsells.map((u: any) => (
                        <div key={u.id} style={{ padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>{u.targetProduct?.name}</div>
                            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                              Qté: {Number(u.quantity)} | -{Number(u.discountPercent)}%
                              {u.text && <><br/>"{u.text}"</>}
                            </div>
                          </div>
                          <button onClick={() => handleDeleteUpsell(u.id)} style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Upsell */}
                <form onSubmit={handleAddUpsell} style={{ background: '#F3F4F6', padding: '16px', borderRadius: '16px' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} /> Ajouter un produit recommandé
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6B7280', marginBottom: '4px' }}>Produit à proposer</label>
                      <select 
                        value={targetProductId} 
                        onChange={e => setTargetProductId(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                      >
                        <option value="">Sélectionner un produit...</option>
                        {availableProducts.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name} - {Number(p.price)} DT</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6B7280', marginBottom: '4px' }}>Quantité</label>
                        <input 
                          type="number" min="1" step="1"
                          value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6B7280', marginBottom: '4px' }}>Remise (%)</label>
                        <input 
                          type="number" min="0" max="100" step="1"
                          value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6B7280', marginBottom: '4px' }}>Message d'accroche (optionnel)</label>
                      <input 
                        type="text"
                        value={text} onChange={e => setText(e.target.value)}
                        placeholder="Ex: Profitez de 10% de remise sur le sucre !"
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                      />
                    </div>

                    <button 
                      type="submit"
                      style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', background: '#6366F1', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Save size={16} /> Sauvegarder
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
