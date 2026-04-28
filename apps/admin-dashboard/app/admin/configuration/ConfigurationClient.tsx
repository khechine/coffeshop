'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, LayoutGrid, Users, CreditCard, BarChart3,
  FileText, Tablet, Settings, ChevronRight, Plus, Trash2,
  Shield, Eye, EyeOff, QrCode
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard, color: '#6366F1' },
  { id: 'tables', label: 'Plan de Salle', icon: LayoutGrid, color: '#0EA5E9' },
  { id: 'staff', label: 'Équipe & Accès', icon: Users, color: '#EC4899' },
  { id: 'expenses', label: 'Gestion Dépenses', icon: CreditCard, color: '#F59E0B' },
  { id: 'metrics', label: 'Metrics & Analytics', icon: BarChart3, color: '#10B981' },
  { id: 'reports', label: 'Rapports Z (NACEF)', icon: FileText, color: '#8B5CF6' },
  { id: 'terminals', label: 'Terminaux POS', icon: Tablet, color: '#14B8A6' },
];

export default function ConfigurationClient({
  store, staff, tables, terminals, totalExpenses, recentExpenses,
  salesCount, revenue, isFiscalEnabled
}: {
  store: any; staff: any[]; tables: any[]; terminals: any[];
  totalExpenses: number; recentExpenses: any[];
  salesCount: number; revenue: number; isFiscalEnabled: boolean;
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const netProfit = revenue - totalExpenses;

  return (
    <div className="page-content" style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px', color: '#0F172A' }}>
          Configuration Admin
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '6px' }}>
          Pilotage business, équipe, dépenses et terminaux — tout en un seul endroit.
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px',
        marginBottom: '32px', borderBottom: '1px solid #E2E8F0',
        scrollbarWidth: 'none',
      }}>
        {TABS.filter(t => t.id !== 'reports' || isFiscalEnabled).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 18px', borderRadius: '12px 12px 0 0',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                fontSize: '13px', fontWeight: isActive ? 800 : 600,
                background: isActive ? '#fff' : 'transparent',
                color: isActive ? tab.color : '#64748B',
                borderBottom: isActive ? `3px solid ${tab.color}` : '3px solid transparent',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 -4px 12px rgba(0,0,0,0.04)' : 'none',
              }}
            >
              <Icon size={16} />
              <span className="tab-label-desktop">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab store={store} salesCount={salesCount} revenue={revenue} netProfit={netProfit} totalExpenses={totalExpenses} staff={staff} />}
      {activeTab === 'tables' && <TablesTab tables={tables} />}
      {activeTab === 'staff' && <StaffTab staff={staff} />}
      {activeTab === 'expenses' && <ExpensesTab totalExpenses={totalExpenses} recentExpenses={recentExpenses} revenue={revenue} />}
      {activeTab === 'metrics' && <MetricsTab revenue={revenue} salesCount={salesCount} totalExpenses={totalExpenses} />}
      {activeTab === 'reports' && <ReportsTab />}
      {activeTab === 'terminals' && <TerminalsTab terminals={terminals} />}
    </div>
  );
}

/* ─── OVERVIEW TAB ─── */
function OverviewTab({ store, salesCount, revenue, netProfit, totalExpenses, staff }: any) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <GradientCard label="Chiffre d'Affaires" value={`${revenue.toFixed(3)} DT`} gradient="linear-gradient(135deg, #4F46E5, #7C3AED)" />
        <GradientCard label="Tickets" value={salesCount} gradient="linear-gradient(135deg, #0EA5E9, #06B6D4)" />
        <GradientCard label="Profit Net" value={`${netProfit.toFixed(3)} DT`} gradient={netProfit >= 0 ? 'linear-gradient(135deg, #059669, #10B981)' : 'linear-gradient(135deg, #DC2626, #EF4444)'} />
        <GradientCard label="Dépenses" value={`${totalExpenses.toFixed(3)} DT`} gradient="linear-gradient(135deg, #F59E0B, #D97706)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <GlassCard title="Infos Établissement">
          <InfoRow label="Nom" value={store.name} />
          <InfoRow label="Ville" value={store.city || 'Non défini'} />
          <InfoRow label="Téléphone" value={store.phone || 'Non renseigné'} />
          <InfoRow label="Adresse" value={store.address || 'Non définie'} />
        </GlassCard>
        <GlassCard title="Équipe Active">
          {staff.slice(0, 5).map((s: any) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#4F46E5', fontSize: 13 }}>
                {(s.name || 'U').charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>{s.name || 'Utilisateur'}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{(s.role || '').replace('_', ' ')}</div>
              </div>
            </div>
          ))}
        </GlassCard>
      </div>
    </div>
  );
}

/* ─── TABLES TAB ─── */
function TablesTab({ tables }: { tables: any[] }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Plan de Salle</h2>
        <Link href="/admin/tables" className="btn btn-primary" style={{ fontSize: '13px' }}>
          <LayoutGrid size={16} /> Gérer les Tables
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
        {tables.map((t: any) => (
          <div key={t.id} style={{
            padding: '20px', borderRadius: '18px', textAlign: 'center',
            background: t.status === 'OCCUPIED' ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)' : '#F8FAFC',
            border: `2px solid ${t.status === 'OCCUPIED' ? '#F59E0B' : '#E2E8F0'}`,
          }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B' }}>{t.name}</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: t.status === 'OCCUPIED' ? '#92400E' : '#64748B', marginTop: '6px', textTransform: 'uppercase' }}>
              {t.status === 'OCCUPIED' ? 'Occupée' : 'Libre'}
            </div>
            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>{t.capacity || '?'} places</div>
          </div>
        ))}
        {tables.length === 0 && <p style={{ color: '#94A3B8', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Aucune table configurée.</p>}
      </div>
    </div>
  );
}

/* ─── STAFF TAB ─── */
function StaffTab({ staff }: { staff: any[] }) {
  const roleColors: any = { STORE_OWNER: '#6366F1', CASHIER: '#10B981', MANAGER: '#F59E0B' };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Équipe & Accès</h2>
        <Link href="/admin/staff" className="btn btn-primary" style={{ fontSize: '13px' }}>
          <Users size={16} /> Gérer l'Équipe
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {staff.map((s: any) => (
          <div key={s.id} style={{
            padding: '24px', borderRadius: '20px', background: '#fff',
            border: '1px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${roleColors[s.role] || '#94A3B8'}22, ${roleColors[s.role] || '#94A3B8'}11)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: roleColors[s.role] || '#94A3B8', fontSize: 18 }}>
                {(s.name || 'U').charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>{s.name || 'Sans nom'}</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${roleColors[s.role] || '#94A3B8'}15`, color: roleColors[s.role] || '#94A3B8', textTransform: 'uppercase' }}>
                  {(s.role || 'STAFF').replace('_', ' ')}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{s.email || 'Pas d\'email'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── EXPENSES TAB ─── */
function ExpensesTab({ totalExpenses, recentExpenses, revenue }: any) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Gestion Dépenses</h2>
        <Link href="/admin/expenses" className="btn btn-primary" style={{ fontSize: '13px' }}>
          <CreditCard size={16} /> Voir Tout
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <GradientCard label="Total Dépenses" value={`${totalExpenses.toFixed(3)} DT`} gradient="linear-gradient(135deg, #EF4444, #DC2626)" />
        <GradientCard label="Marge" value={`${revenue > 0 ? ((1 - totalExpenses / revenue) * 100).toFixed(1) : 0}%`} gradient="linear-gradient(135deg, #10B981, #059669)" />
      </div>
      <GlassCard title="Dépenses Récentes">
        {recentExpenses.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center', padding: 20 }}>Aucune dépense enregistrée.</p>}
        {recentExpenses.slice(0, 10).map((e: any, i: number) => (
          <div key={e.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>{e.label || e.description || 'Dépense'}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>{new Date(e.createdAt).toLocaleDateString('fr-FR')}</div>
            </div>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#EF4444' }}>-{Number(e.amount || 0).toFixed(3)} DT</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

/* ─── METRICS TAB ─── */
function MetricsTab({ revenue, salesCount, totalExpenses }: any) {
  const avg = salesCount > 0 ? revenue / salesCount : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Metrics & Analytics</h2>
        <Link href="/admin/metrics" className="btn btn-primary" style={{ fontSize: '13px' }}>
          <BarChart3 size={16} /> Tableau Complet
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <GradientCard label="Panier Moyen" value={`${avg.toFixed(3)} DT`} gradient="linear-gradient(135deg, #6366F1, #8B5CF6)" />
        <GradientCard label="Volume Ventes" value={salesCount} gradient="linear-gradient(135deg, #0EA5E9, #06B6D4)" />
        <GradientCard label="CA Total" value={`${revenue.toFixed(3)} DT`} gradient="linear-gradient(135deg, #10B981, #059669)" />
      </div>
      <GlassCard title="Analyse Rapide">
        <InfoRow label="Taux de marge" value={`${revenue > 0 ? ((1 - totalExpenses / revenue) * 100).toFixed(1) : 0}%`} />
        <InfoRow label="Dépenses / Vente" value={`${salesCount > 0 ? (totalExpenses / salesCount).toFixed(3) : 0} DT`} />
        <InfoRow label="CA / Jour (est.)" value={`${(revenue / 30).toFixed(3)} DT`} />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link href="/admin/metrics" style={{ fontSize: 13, fontWeight: 700, color: '#6366F1' }}>
            Voir les analyses détaillées →
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

/* ─── REPORTS TAB ─── */
function ReportsTab() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Rapports Z (NACEF)</h2>
        <Link href="/admin/reports" className="btn btn-primary" style={{ fontSize: '13px' }}>
          <FileText size={16} /> Ouvrir les Rapports
        </Link>
      </div>
      <GlassCard title="Module Fiscal">
        <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.8 }}>
          Consultez et générez vos rapports Z conformes à la réglementation NACEF.
          Ce module vous permet de clôturer les journées comptables et d'exporter les données fiscales.
        </p>
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link href="/admin/reports" className="btn btn-primary">Accéder aux Rapports Z</Link>
        </div>
      </GlassCard>
    </div>
  );
}

/* ─── TERMINALS TAB ─── */
function TerminalsTab({ terminals }: { terminals: any[] }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Gestion Terminaux POS</h2>
        <Link href="/admin/terminals" className="btn btn-primary" style={{ fontSize: '13px' }}>
          <Tablet size={16} /> Gérer les Terminaux
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {terminals.map((t: any) => (
          <div key={t.id} style={{
            padding: '24px', borderRadius: '20px', background: '#fff',
            border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #0F766E22, #14B8A611)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tablet size={20} color="#14B8A6" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>{t.name || 'Terminal'}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>Code: {t.pairingCode || '—'}</div>
                </div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                background: t.isActive ? '#D1FAE5' : '#FEE2E2',
                color: t.isActive ? '#065F46' : '#991B1B',
              }}>
                {t.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        ))}
        {terminals.length === 0 && <p style={{ color: '#94A3B8', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Aucun terminal enregistré.</p>}
      </div>
    </div>
  );
}

/* ─── REUSABLE COMPONENTS ─── */
function GradientCard({ label, value, gradient }: { label: string; value: any; gradient: string }) {
  return (
    <div style={{
      padding: '24px', borderRadius: '20px', background: gradient,
      color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>{value}</div>
    </div>
  );
}

function GlassCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: '24px', borderRadius: '20px', background: '#fff',
      border: '1px solid #F1F5F9', boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>{value}</span>
    </div>
  );
}
