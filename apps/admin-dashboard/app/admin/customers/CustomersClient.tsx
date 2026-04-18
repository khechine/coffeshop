'use client';

import { useState } from 'react';
import { Search, Plus, FileText, UserPlus, Users } from 'lucide-react';
import Modal from '../../../components/Modal';

import { createCustomer } from '../../actions';

export default function CustomersClient({ initialCustomers, storeId }: { initialCustomers: any[], storeId: string }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  
  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCustomer({
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email
      });
      // Simulate immediate UI update (optimistic)
      const newCust = {
        id: `c_${Date.now()}`,
        name: newCustomer.name,
        phone: newCustomer.phone,
        totalSpent: 0,
        loyaltyPoints: 0,
        createdAt: new Date().toLocaleDateString('fr-FR')
      };
      setCustomers([newCust, ...customers]);
      setIsAddModalOpen(false);
      setNewCustomer({ name: '', phone: '', email: '' });
    } catch (err) {
      alert("Erreur lors de la création du client");
    }
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} color="#6366F1" /> Base Clients & Fidélité
          </h1>
          <p>Gérez vos clients, consultez leurs historiques et points de fidélité.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Nom ou numéro..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', width: '250px' }}
            />
          </div>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => setIsAddModalOpen(true)}
          >
            <UserPlus size={16} /> Ajouter un client
          </button>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>CLIENT</th>
              <th>TÉLÉPHONE</th>
              <th>TOTAL DÉPENSÉ</th>
              <th>SOLDE POINTS</th>
              <th className="mobile-hide">DATE CRÉATION</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr key={customer.id}>
                <td style={{ fontWeight: 800, color: '#1E293B' }}>{customer.name}</td>
                <td style={{ color: '#64748B' }}>{customer.phone}</td>
                <td style={{ fontWeight: 800, color: '#10B981', fontSize: '15px' }}>{customer.totalSpent.toFixed(3)} DT</td>
                <td>
                  <span style={{ padding: '6px 12px', background: '#FEF3C7', color: '#D97706', borderRadius: '100px', fontSize: '13px', fontWeight: 800 }}>
                    ⭐ {customer.loyaltyPoints}
                  </span>
                </td>
                <td className="mobile-hide" style={{ color: '#94A3B8', fontSize: '13px' }}>{customer.createdAt}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ padding: '8px', color: '#6366F1' }} title="Consulter l'historique">
                    <FileText size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>Aucun client trouvé.</div>
        )}
      </div>

      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Ajouter un nouveau client">
        <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Nom complet</label>
            <input 
              required
              type="text" 
              value={newCustomer.name}
              onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', width: '100%', outline: 'none' }}
              placeholder="Ex: Ahmed Ben Ali"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Téléphone</label>
            <input 
              required
              type="text" 
              value={newCustomer.phone}
              onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', width: '100%', outline: 'none' }}
              placeholder="Ex: 22 333 444"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Email (Optionnel)</label>
            <input 
              type="email" 
              value={newCustomer.email}
              onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', width: '100%', outline: 'none' }}
              placeholder="Ex: ahmed@email.com"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsAddModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary">Créer le client</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
