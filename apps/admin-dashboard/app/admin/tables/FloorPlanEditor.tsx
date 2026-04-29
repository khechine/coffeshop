'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Move, Plus, Trash2, Maximize2, Layers, 
  ChevronRight, Circle, Square, Save, 
  MousePointer2, Sliders, LayoutGrid
} from 'lucide-react';
import { updateTablePositionAction, updateTableAction, createTableAction, deleteTableAction, createZoneAction, updateZoneAction, deleteZoneAction } from '../../actions';

interface Table {
  id: string;
  label: string;
  capacity: number;
  posX: number;
  posY: number;
  width: number;
  height: number;
  shape: 'SQUARE' | 'ROUND';
  zoneId?: string | null;
}

interface Zone {
  id: string;
  name: string;
}

export default function FloorPlanEditor({ initialTables, initialZones }: { initialTables: any[], initialZones: any[] }) {
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(initialZones[0]?.id || null);
  const [tables, setTables] = useState<Table[]>(initialTables.map(t => ({
    ...t,
    posX: t.posX ?? 50,
    posY: t.posY ?? 50,
    width: t.width ?? 80,
    height: t.height ?? 80,
    shape: t.shape ?? 'SQUARE'
  })));
  
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTables = tables.filter(t => t.zoneId === activeZoneId);
  const selectedTable = tables.find(t => t.id === selectedTableId);

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    e.stopPropagation();
    setSelectedTableId(tableId);
    setIsDragging(true);
    
    const table = tables.find(t => t.id === tableId);
    if (table && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - table.posX,
        y: e.clientY - rect.top - table.posY
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedTableId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let newX = e.clientX - rect.left - dragOffset.x;
    let newY = e.clientY - rect.top - dragOffset.y;

    // Constrain to container
    newX = Math.max(0, Math.min(newX, rect.width - (selectedTable?.width || 0)));
    newY = Math.max(0, Math.min(newY, rect.height - (selectedTable?.height || 0)));

    setTables(prev => prev.map(t => 
      t.id === selectedTableId ? { ...t, posX: newX, posY: newY } : t
    ));
  };

  const handleMouseUp = async () => {
    if (isDragging && selectedTableId) {
      const table = tables.find(t => t.id === selectedTableId);
      if (table) {
        setIsSaving(true);
        await updateTablePositionAction(table.id, table.posX, table.posY);
        setIsSaving(false);
      }
    }
    setIsDragging(false);
  };

  const updateTableProperty = async (id: string, updates: Partial<Table>) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    setIsSaving(true);
    await updateTableAction(id, updates as any);
    setIsSaving(false);
  };

  const addNewTable = async () => {
    if (!activeZoneId) return;
    const newTable = {
      label: `T-${tables.length + 1}`,
      capacity: 2,
      zoneId: activeZoneId,
      posX: 50,
      posY: 50,
      shape: 'SQUARE',
      width: 80,
      height: 80
    };
    await createTableAction(newTable as any);
    window.location.reload(); // Refresh to get the real ID
  };

  const removeTable = async (id: string) => {
    if (confirm('Supprimer cette table ?')) {
      setTables(prev => prev.filter(t => t.id !== id));
      setSelectedTableId(null);
      await deleteTableAction(id);
    }
  };

  const handleAddZone = async () => {
    const name = prompt('Nom de la nouvelle zone (ex: Terrasse) :');
    if (name) {
      setIsSaving(true);
      const zone = await createZoneAction(name);
      if (zone) {
        setZones(prev => [...prev, zone]);
        setActiveZoneId(zone.id);
      }
      setIsSaving(false);
    }
  };

  const handleRenameZone = async (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    const newName = prompt('Nouveau nom de la zone :', currentName);
    if (newName && newName !== currentName) {
      setIsSaving(true);
      await updateZoneAction(id, newName);
      setZones(prev => prev.map(z => z.id === id ? { ...z, name: newName } : z));
      setIsSaving(false);
    }
  };

  const handleRemoveZone = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Supprimer cette zone ? Les tables seront conservées mais n\'auront plus de zone.')) {
      setIsSaving(true);
      await deleteZoneAction(id);
      setZones(prev => prev.filter(z => z.id !== id));
      if (activeZoneId === id) setActiveZoneId(null);
      setTables(prev => prev.map(t => t.zoneId === id ? { ...t, zoneId: null } : t));
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-[700px] bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
      
      {/* Left Sidebar: Zones & Controls */}
      <div className="w-80 border-right border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/20">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers size={18} className="text-indigo-600" /> Zones de Service
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configurez vos espaces</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {zones.map(z => (
            <div key={z.id} className="relative group">
              <button
                onClick={() => setActiveZoneId(z.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                  activeZoneId === z.id 
                    ? 'bg-white dark:bg-slate-800 shadow-lg border border-indigo-100 dark:border-indigo-900/30' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-900/50'
                }`}
              >
                <span className={`text-xs font-black uppercase tracking-widest ${activeZoneId === z.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {z.name}
                </span>
                <ChevronRight size={14} className={activeZoneId === z.id ? 'text-indigo-600' : 'text-slate-300'} />
              </button>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => handleRenameZone(e, z.id, z.name)} className="p-1 hover:text-indigo-600 text-slate-300"><Sliders size={12} /></button>
                <button onClick={(e) => handleRemoveZone(e, z.id)} className="p-1 hover:text-rose-600 text-slate-300"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          <button 
            onClick={handleAddZone}
            className="w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Ajouter une Zone
          </button>
        </div>

        {selectedTable && (
          <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Éditer : {selectedTable.label}</h4>
              <button onClick={() => removeTable(selectedTable.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Label</label>
                <input 
                  type="text" 
                  value={selectedTable.label} 
                  onChange={(e) => updateTableProperty(selectedTable.id, { label: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border-none text-xs font-bold outline-none ring-1 ring-slate-100 dark:ring-slate-800 focus:ring-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Places</label>
                  <input 
                    type="number" 
                    value={selectedTable.capacity} 
                    onChange={(e) => updateTableProperty(selectedTable.id, { capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border-none text-xs font-bold outline-none ring-1 ring-slate-100 dark:ring-slate-800 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Forme</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateTableProperty(selectedTable.id, { shape: 'SQUARE' })}
                      className={`flex-1 p-3 rounded-xl border ${selectedTable.shape === 'SQUARE' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-400'}`}
                    >
                      <Square size={16} className="mx-auto" />
                    </button>
                    <button 
                      onClick={() => updateTableProperty(selectedTable.id, { shape: 'ROUND' })}
                      className={`flex-1 p-3 rounded-xl border ${selectedTable.shape === 'ROUND' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-400'}`}
                    >
                      <Circle size={16} className="mx-auto" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Largeur</label>
                  <input 
                    type="number" 
                    value={selectedTable.width} 
                    onChange={(e) => updateTableProperty(selectedTable.id, { width: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border-none text-xs font-bold outline-none ring-1 ring-slate-100 dark:ring-slate-800 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Hauteur</label>
                  <input 
                    type="number" 
                    value={selectedTable.height} 
                    onChange={(e) => updateTableProperty(selectedTable.id, { height: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border-none text-xs font-bold outline-none ring-1 ring-slate-100 dark:ring-slate-800 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Zone de Service</label>
                <select 
                  value={selectedTable.zoneId || ''} 
                  onChange={(e) => updateTableProperty(selectedTable.id, { zoneId: e.target.value || null })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border-none text-xs font-bold outline-none ring-1 ring-slate-100 dark:ring-slate-800 focus:ring-indigo-500 appearance-none"
                >
                  <option value="">Sans zone</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content: Canvas */}
      <div className="flex-1 flex flex-col relative bg-slate-50 dark:bg-slate-950">
        
        {/* Toolbar */}
        <div className="p-6 flex justify-between items-center absolute top-0 left-0 right-0 z-20 pointer-events-none">
          <div className="flex gap-2 pointer-events-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white dark:border-slate-800 shadow-xl">
             <div className="px-4 py-2 flex items-center gap-2 border-r border-slate-100 dark:border-slate-800">
                <LayoutGrid size={16} className="text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Plan de Salle</span>
             </div>
             <button onClick={addNewTable} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-2 px-4">
                <Plus size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Nouvelle Table</span>
             </button>
          </div>
          
          <div className="flex gap-2 pointer-events-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white dark:border-slate-800 shadow-xl">
             <div className="px-4 py-2 flex items-center gap-2 text-emerald-600">
                <Save size={16} className={isSaving ? "animate-pulse" : ""} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {isSaving ? "Sauvegarde..." : "Auto-Save Actif"}
                </span>
             </div>
          </div>
        </div>

        {/* The Grid / Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden relative select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => setSelectedTableId(null)}
          style={{
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}
        >
          {activeTables.map(table => (
            <div
              key={table.id}
              onMouseDown={(e) => handleMouseDown(e, table.id)}
              className={`absolute cursor-move flex flex-col items-center justify-center transition-shadow group ${
                selectedTableId === table.id ? 'ring-4 ring-indigo-500 ring-offset-4 dark:ring-offset-slate-950 z-10 shadow-2xl scale-105' : 'shadow-md hover:shadow-xl'
              }`}
              style={{
                left: table.posX,
                top: table.posY,
                width: table.width,
                height: table.height,
                backgroundColor: selectedTableId === table.id ? '#6366F1' : 'white',
                color: selectedTableId === table.id ? 'white' : '#1E293B',
                borderRadius: table.shape === 'ROUND' ? '50%' : '20px',
                border: '1px solid #E2E8F0'
              }}
            >
              <span className="text-sm font-black tracking-tight">{table.label}</span>
              <span className="text-[9px] font-bold opacity-60 uppercase">{table.capacity}p</span>
              
              <div className={`absolute -top-3 -right-3 w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${selectedTableId === table.id ? 'opacity-100' : ''}`}>
                 <Move size={10} className="text-indigo-600" />
              </div>
            </div>
          ))}

          {!activeZoneId && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 bg-white/50 backdrop-blur-sm z-30">
               <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-[40px] flex items-center justify-center text-indigo-600 mb-8 shadow-inner">
                  <Layers size={48} />
               </div>
               <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Sélectionnez une Zone</h3>
               <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">Vous devez choisir ou créer une zone de service pour commencer à placer vos tables.</p>
               <button 
                onClick={handleAddZone}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all"
               >
                 Créer ma première Zone
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
