'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Target, Layers, Map as MapIcon, Compass, ChevronRight, Package, Truck, Mail, MapPin, Phone } from 'lucide-react';
import Modal from '../../../components/Modal';

export default function MarketplaceMapClient({ data }: { data: any }) {
   const mapContainer = useRef<HTMLDivElement>(null);
   const mapInstance = useRef<any>(null);
   const [isSatellite, setIsSatellite] = useState(false);
   const [selectedId, setSelectedId] = useState<string | null>(null);
   const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeType, setActiveType] = useState<string>('ALL');

  const CATEGORY_COLORS: Record<string, string> = {
    'Café Grain': '#78350F',
    'Lait & Crèmerie': '#3B82F6',
    'Sirops & Arômes': '#EC4899',
    'Accessoires Barista': '#6366F1',
    'Snacks & Biscuits': '#F59E0B',
    'Entretien Machine': '#8B5CF6',
  };

  const getColor = (categories: string[]) => {
    if (!categories || categories.length === 0) return '#EF4444';
    return CATEGORY_COLORS[categories[0]] || '#EF4444';
  };

  const filteredVendors = data.vendors.filter((v: any) => 
    (activeType === 'ALL' || activeType === 'VENDOR') &&
    (activeCategory === 'all' || v.categories.includes(activeCategory))
  );

  const filteredExtra = (data.extraPoints || []).filter((p: any) => 
    activeType === 'ALL' || activeType === p.type
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainer.current) return;

    const L = require('leaflet');
    // We already have the link in page.tsx, but this is a safeguard for dynamic leaflet
    require('leaflet/dist/leaflet.css');

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapContainer.current);
      
      const bounds = L.latLngBounds([data.store.lat, data.store.lng]);
      data.vendors.forEach((v: any) => bounds.extend([v.lat, v.lng]));
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
      
      (mapInstance.current as any).osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.current);

      (mapInstance.current as any).satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri — Source: Esri'
      });
      
      (mapInstance.current as any).pointsLayer = L.layerGroup().addTo(mapInstance.current);
    }

    const { pointsLayer } = mapInstance.current as any;
    pointsLayer.clearLayers();

    // Render Vendors
    filteredVendors.forEach((v: any) => {
      const color = getColor(v.categories);
      L.marker([v.lat, v.lng], {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `<div style='background-color:${color}; width:20px; height:20px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 10px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px'>🏭</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(pointsLayer).bindPopup(`<b>Vendeur: ${v.name}</b><br>${v.categories.join(', ')}`);
    });

    // Render Extra Points (Stores & Couriers)
    filteredExtra.forEach((p: any) => {
      const isStore = p.type === 'STORE';
      const color = isStore ? '#4F46E5' : '#10B981';
      const emoji = isStore ? '☕' : '🚚';
      
      L.marker([p.lat || 36.8, p.lng || 10.2], {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `<div style='background-color:${color}; width:24px; height:24px; border-radius:8px; border:2px solid #fff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 15px ${color}50; font-size:14px'>${emoji}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(pointsLayer).bindPopup(`<b>${p.name}</b><br>Type: ${p.type}`);
    });

  }, [data, activeCategory, activeType, filteredVendors, filteredExtra]);

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const toggleSatellite = () => {
    if (!mapInstance.current) return;
    const m = mapInstance.current;
    if (isSatellite) {
      m.removeLayer(m.satLayer);
      m.addLayer(m.osmLayer);
    } else {
      m.removeLayer(m.osmLayer);
      m.addLayer(m.satLayer);
    }
    setIsSatellite(!isSatellite);
  };

  const centerMap = () => {
    if (mapInstance.current) {
      mapInstance.current.flyTo([data.store.lat, data.store.lng], 13);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', background: '#F8FAFC', padding: '24px', gap: '24px', position: 'relative' }}>
      
      {/* Sidebar Controls */}
      <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 1000 }}>
         {/* Filter Active Actors */}
         <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filtres de réseau</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
               {['ALL', 'STORE', 'VENDOR', 'COURIER'].map(type => (
                 <button 
                  key={type}
                  onClick={() => setActiveType(type)}
                  style={{ padding: '10px', borderRadius: '12px', border: '1.5px solid', borderColor: activeType === type ? '#4F46E5' : '#F1F5F9', background: activeType === type ? '#4F46E5' : '#fff', color: activeType === type ? '#fff' : '#64748B', fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: '0.2s' }}
                 >
                   {type === 'ALL' ? 'Tous' : type === 'STORE' ? 'Cafés' : type === 'VENDOR' ? 'Vendeurs' : 'Livreurs'}
                 </button>
               ))}
            </div>
         </div>

         {/* View Mode */}
         <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Vue Satellite</h3>
            <button 
              onClick={toggleSatellite} 
              className="btn btn-outline" 
              style={{ width: '100%', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '14px', border: '1.5px solid #F1F5F9', background: isSatellite ? '#1E293B' : '#fff', color: isSatellite ? '#fff' : '#1E293B' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={18} /> {isSatellite ? 'Fonds Satellite' : 'Fonds Plan'}
              </div>
            </button>
         </div>

         {/* Category Filter */}
         <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filtre Catégorie</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button 
                onClick={() => setActiveCategory('all')} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid', 
                  borderColor: activeCategory === 'all' ? '#4F46E5' : '#F1F5F9',
                  background: activeCategory === 'all' ? '#4F46E508' : '#fff',
                  color: activeCategory === 'all' ? '#4F46E5' : '#64748B',
                  fontWeight: activeCategory === 'all' ? 800 : 500, fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', border: '2px solid #fff', boxShadow: '0 0 5px rgba(0,0,0,0.1)' }}></div>
                Tout afficher
              </button>
              {data.categories?.map((cat: any) => (
                <button 
                  key={cat.id} 
                  onClick={() => setActiveCategory(cat.name)} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid', 
                    borderColor: activeCategory === cat.name ? '#4F46E5' : '#F1F5F9',
                    background: activeCategory === cat.name ? '#4F46E508' : '#fff',
                    color: activeCategory === cat.name ? '#4F46E5' : '#64748B',
                    fontWeight: activeCategory === cat.name ? 800 : 500, fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: CATEGORY_COLORS[cat.name] || '#EF4444', border: '2px solid #fff', boxShadow: '0 0 5px rgba(0,0,0,0.1)' }}></div>
                  {cat.name}
                </button>
              ))}
            </div>
         </div>

         {/* Vendors List */}
         <div className="card" style={{ flex: 1, padding: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fournisseurs ({filteredVendors.length})</h3>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
               {filteredVendors.map((v: any) => (
                 <div 
                   key={v.id} 
                   onClick={() => {
                     setSelectedId(v.id);
                     if (mapInstance.current) mapInstance.current.flyTo([v.lat, v.lng], 15);
                   }}
                   style={{ 
                     padding: '12px', borderRadius: '14px', background: selectedId === v.id ? '#4F46E508' : '#fff', cursor: 'pointer', border: '1.5px solid', borderColor: selectedId === v.id ? '#4F46E5' : '#F1F5F9', transition: 'all 0.2s'
                   }}
                 >
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: getColor(v.categories) }}></div>
                     <div style={{ fontWeight: 800, fontSize: '13px', color: '#1E293B' }}>{v.name}</div>
                   </div>
                   <div style={{ fontSize: '11px', color: '#94A3B8', marginLeft: '16px' }}>{v.categories.join(', ')}</div>
                 </div>
               ))}
               {filteredVendors.length === 0 && (
                 <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: '12px' }}>Aucun résultat</div>
               )}
            </div>
         </div>
      </div>

      {/* Map Container */}
      <div className="card" style={{ flex: 1, position: 'relative', overflow: 'hidden', border: '1.5px solid #E2E8F0', borderRadius: '32px' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%', zIndex: 1 }} />
        
        <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 1000 }}>
           <button onClick={centerMap} style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#fff', border: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
             <Target size={22} color="#4F46E5" />
           </button>
        </div>

        {selectedId && (
          <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0', zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, background: '#F1F5F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <MapIcon size={20} color="#4F46E5" />
                </div>
                <div>
                   <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900 }}>{data.vendors.find((v: any) => v.id === selectedId)?.name}</h3>
                   <span style={{ fontSize: '12px', color: '#64748B' }}>{data.vendors.find((v: any) => v.id === selectedId)?.categories.join(' • ')}</span>
                </div>
             </div>
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setSelectedVendor(data.vendors.find((v: any) => v.id === selectedId))}>
                 <ChevronRight size={18} /> Voir la fiche complète
              </button>
           </div>
        )}
      </div>

      {/* Vendor Detail Modal (Same as Table) */}
      <Modal open={!!selectedVendor} onClose={() => setSelectedVendor(null)} title="Fiche Fournisseur Certifié">
         {selectedVendor && (
           <div style={{ width: '850px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', background: '#F8FAFC', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                 <div style={{ width: 80, height: 80, background: '#4F46E5', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '32px', fontWeight: 900 }}>{selectedVendor.name.charAt(0)}</div>
                 <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{selectedVendor.name}</h3>
                    <p style={{ margin: '0 0 16px', color: '#64748B', fontSize: '14px' }}>{selectedVendor.description || 'Description du fournisseur indisponible.'}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                       <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {selectedVendor.user?.email || 'N/A'}</div>
                       <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {selectedVendor.phone || 'Pas de tel'}</div>
                       <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {selectedVendor.city}</div>
                    </div>
                 </div>
              </div>

              <div>
                 <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={18} color="#6366F1" /> Catalogue de produits ({selectedVendor.products?.length || 0})
                 </h4>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', maxHeight: '450px', overflowY: 'auto', padding: '4px' }}>
                    {selectedVendor.products?.map((p: any) => (
                      <div key={p.id} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '16px', border: '1px solid #F1F5F9', background: '#fff' }}>
                         <div style={{ width: 44, height: 44, borderRadius: '8px', overflow: 'hidden', background: '#F8FAFC' }}>
                            <img src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=100&auto=format&fit=crop'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         </div>
                         <div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>{p.name}</div>
                            <div style={{ fontSize: '12px', color: '#4F46E5', fontWeight: 700 }}>{Number(p.price).toFixed(3)} DT / {p.unit}</div>
                         </div>
                      </div>
                    ))}
                    {(!selectedVendor.products || selectedVendor.products.length === 0) && (
                      <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '32px', color: '#94A3B8', fontSize: '14px' }}>Aucun produit dans le catalogue.</div>
                    )}
                 </div>
              </div>

              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '20px', display: 'flex', gap: '12px' }}>
                 <button onClick={() => setSelectedVendor(null)} className="btn btn-outline" style={{ flex: 1 }}>Fermer</button>
              </div>
           </div>
         )}
      </Modal>

      <style jsx global>{`
        .custom-div-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          background: #F8FAFC !important;
        }
      `}</style>
    </div>
  );
}
