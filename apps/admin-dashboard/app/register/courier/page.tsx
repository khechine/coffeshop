import Link from 'next/link';
import { Truck, MapPin, Search, ShieldCheck } from 'lucide-react';

export default function RegisterCourierPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '40px' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '48px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: 64, height: 64, background: '#4F46E5', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Truck size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B', marginBottom: '12px' }}>Devenir Livreur partenaire</h1>
          <p style={{ color: '#64748B', fontSize: '15px' }}>Proposez vos services de livraison aux cafés et fournisseurs B2B de Tunisie.</p>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Type de véhicule</label>
            <select style={{ padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}>
              <option value="bike">Moto / Scooter</option>
              <option value="car">Voiture</option>
              <option value="truck">Utilitaire / Camion</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Zone de service principale</label>
            <input type="text" placeholder="ex: Tunis, Sousse..." style={{ padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Tarification estimée (DT/km)</label>
             <input type="number" step="0.1" placeholder="ex: 1.500" style={{ padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '16px', fontWeight: 800, marginTop: '12px' }}>
            Envoyer ma candidature
          </button>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#64748B' }}>
            Déjà membre ? <Link href="/auth/login" style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
