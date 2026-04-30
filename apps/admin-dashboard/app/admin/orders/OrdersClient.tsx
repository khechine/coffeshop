'use client';

import React, { useState, useTransition } from 'react';
import { Truck, Star, CheckCircle, Clock, Package, MessageSquare, ChevronRight, StarHalf, MapPin } from 'lucide-react';
import Modal from '../../../components/Modal';
import { rateVendorAction } from '../../actions';

export default function OrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [ratingTarget, setRatingTarget] = useState<any | null>(null);
  const [ratingForm, setRatingForm] = useState({
    speed: 5,
    quality: 5,
    reliability: 5,
    delivery: 5,
    comment: ''
  });

  const handleRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingTarget) return;

    startTransition(async () => {
      await rateVendorAction({
        orderId: ratingTarget.id,
        vendorId: ratingTarget.vendorId,
        ratingSpeed: ratingForm.speed,
        ratingQuality: ratingForm.quality,
        ratingReliability: ratingForm.reliability,
        ratingDelivery: ratingForm.delivery,
        comment: ratingForm.comment
      });
      setRatingTarget(null);
      setRatingForm({ speed: 5, quality: 5, reliability: 5, delivery: 5, comment: '' });
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED': return <span className="badge green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={10} /> Livré</span>;
      case 'PENDING': return <span className="badge gray" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> En attente</span>;
      case 'CONFIRMED': return <span className="badge blue" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Package size={10} /> Confirmé</span>;
      default: return <span className="badge gray">{status}</span>;
    }
  };

  return (
    <>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>Mes Commandes B2B</h1>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>Gérez vos approvisionnements et évaluez vos fournisseurs.</p>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Commande</th>
                <th>Fournisseur</th>
                <th>Montant</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialOrders.map(order => (
                <tr key={order.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: '#1E293B' }}>#{order.id.slice(-6).toUpperCase()}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🏪</div>
                       <div style={{ fontWeight: 700 }}>{order.vendor?.companyName || order.supplier?.name || 'Inconnu'}</div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 900, color: '#1E1B4B' }}>{Number(order.total).toFixed(3)} DT</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {order.status === 'DELIVERED' && !order.rating && (
                      <button 
                        className="btn btn-sm btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setRatingTarget(order)}
                      >
                        <Star size={12} fill="#fff" /> Noter
                      </button>
                    )}
                    {order.rating && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F59E0B', fontWeight: 800, fontSize: '13px', justifyContent: 'flex-end' }}>
                        <Star size={14} fill="#F59E0B" /> {((order.rating.speedScore + order.rating.qualityScore + order.rating.reliabilityScore + order.rating.deliveryScore) / 4).toFixed(1)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {initialOrders.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
                    <Truck size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                    <p style={{ fontWeight: 600 }}>Aucune commande marketplace pour le moment.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rating Modal */}
      <Modal open={!!ratingTarget} onClose={() => setRatingTarget(null)} title={`Évaluer le Fournisseur: ${ratingTarget?.vendor?.companyName}`}>
        <form onSubmit={handleRate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
            Votre avis aide la communauté Alkassa à choisir les meilleurs fournisseurs. Merci pour votre retour !
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <RatingField label="Vitesse de service" value={ratingForm.speed} onChange={(v) => setRatingForm(f => ({ ...f, speed: v }))} />
            <RatingField label="Qualité des produits" value={ratingForm.quality} onChange={(v) => setRatingForm(f => ({ ...f, quality: v }))} />
            <RatingField label="Sérieux / Fiabilité" value={ratingForm.reliability} onChange={(v) => setRatingForm(f => ({ ...f, reliability: v }))} />
            <RatingField label="Livraison" value={ratingForm.delivery} onChange={(v) => setRatingForm(f => ({ ...f, delivery: v }))} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Commentaire (optionnel)</label>
            <textarea 
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', minHeight: '80px', outline: 'none' }}
              value={ratingForm.comment}
              onChange={e => setRatingForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="Racontez votre expérience..."
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
             <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setRatingTarget(null)}>Plus tard</button>
             <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>
                {isPending ? 'Envoi...' : 'Publier mon évaluation'}
             </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function RatingField({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase' }}>{label}</label>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            size={18} 
            style={{ cursor: 'pointer' }} 
            fill={star <= value ? '#F59E0B' : 'transparent'} 
            stroke={star <= value ? '#F59E0B' : '#CBD5E1'}
            onClick={() => onChange(star)}
          />
        ))}
      </div>
    </div>
  );
}
