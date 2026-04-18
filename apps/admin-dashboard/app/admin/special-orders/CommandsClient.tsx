'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Edit, Truck, Package, PackageCheck, ClipboardList } from 'lucide-react';
import Modal from '../../../components/Modal';

export default function CommandsClient({ initialOrders, storeId }: { initialOrders: any[], storeId: string }) {
  const [orders, setOrders] = useState(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  
  const filtered = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': 
        return <span style={{ padding: '6px 12px', background: '#FEF3C7', color: '#D97706', borderRadius: '100px', fontSize: '12px', fontWeight: 800 }}>En Attente</span>;
      case 'IN_PROGRESS': 
        return <span style={{ padding: '6px 12px', background: '#DBEAFE', color: '#2563EB', borderRadius: '100px', fontSize: '12px', fontWeight: 800 }}>En Préparation</span>;
      case 'READY': 
        return <span style={{ padding: '6px 12px', background: '#D1FAE5', color: '#059669', borderRadius: '100px', fontSize: '12px', fontWeight: 800 }}>Prête</span>;
      case 'DELIVERED': 
        return <span style={{ padding: '6px 12px', background: '#F1F5F9', color: '#64748B', borderRadius: '100px', fontSize: '12px', fontWeight: 800 }}>Livrée</span>;
      default: 
        return <span style={{ padding: '6px 12px', background: '#F1F5F9', color: '#64748B', borderRadius: '100px', fontSize: '12px', fontWeight: 800 }}>{status}</span>;
    }
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList size={24} color="#6366F1" /> Commandes Spéciales
          </h1>
          <p>Pilotez les commandes de gâteaux, miniardises et évènements sur mesure.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="N° de commande ou client..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', width: '250px' }}
            />
          </div>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => router.push('/pos')}
          >
            <Plus size={16} /> Créer (via POS)
          </button>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>N° CMD</th>
              <th>CLIENT</th>
              <th style={{ maxWidth: '250px' }}>PRODUIT / DÉTAIL</th>
              <th>LIVRAISON</th>
              <th>PRIX / ACOMPTE</th>
              <th>STATUT</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id}>
                <td style={{ fontWeight: 800, color: '#6366F1' }}>{order.orderNumber}</td>
                <td>
                  <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '14px' }}>{order.clientName}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{order.clientPhone}</div>
                </td>
                <td style={{ maxWidth: '250px', whiteSpace: 'normal' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', lineHeight: '1.4' }}>{order.productName}</div>
                  {order.customFields && typeof order.customFields === 'object' && (
                    <div style={{ fontSize: '12px', color: '#6366F1', marginTop: '4px' }}>
                      {order.customFields.modele ? `Modèle: ${order.customFields.modele}` : ''}
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: '#1E293B', fontSize: '13px' }}>
                    {order.isDelivery ? <Truck size={14} color="#3B82F6" /> : <Package size={14} color="#10B981"/>}
                    {order.deliveryDate}
                  </div>
                  {order.deliveryTime && <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Heure: {order.deliveryTime}</div>}
                </td>
                <td>
                  <div style={{ fontWeight: 900, color: '#10B981', fontSize: '15px' }}>{order.totalPrice.toFixed(3)} DT</div>
                  {order.depositAmount > 0 && (
                    <div style={{ fontSize: '12px', color: '#059669', marginTop: '2px', fontWeight: 700 }}>
                      Acompte: {order.depositAmount.toFixed(3)} DT
                    </div>
                  )}
                </td>
                <td>
                  {getStatusBadge(order.status)}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn btn-ghost" style={{ padding: '8px', color: '#64748B' }} title="Modifier le statut">
                    <Edit size={16} />
                  </button>
                  <button className="btn btn-ghost" style={{ padding: '8px', color: '#10B981', marginLeft: '4px' }} title="Valider l'étape">
                    <PackageCheck size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>Aucune commande spéciale trouvée.</div>
        )}
      </div>
    </div>
  );
}
