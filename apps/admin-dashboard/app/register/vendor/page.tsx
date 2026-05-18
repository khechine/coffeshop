"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Mail, Lock, Phone, MapPin, Send, CheckCircle, Store, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { registerVendorAction, checkEmailAvailability } from '../../actions';

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default function VendorRegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    phone: '',
    address: '',
    city: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Debounced email check
  const checkEmail = useCallback(
    debounce(async (email: string) => {
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        setEmailStatus('idle');
        return;
      }
      setEmailStatus('checking');
      try {
        const res = await checkEmailAvailability(email);
        if (res && typeof res.available === 'boolean') {
          setEmailStatus(res.available ? 'available' : 'taken');
        } else {
          setEmailStatus('idle');
        }
      } catch (err) {
        setEmailStatus('idle');
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (form.email) {
      checkEmail(form.email);
    }
  }, [form.email, checkEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone || form.phone.trim().length < 8) {
      alert("Le numéro de téléphone mobile est obligatoire et doit contenir au moins 8 chiffres.");
      return;
    }
    setLoading(true);
    try {
      await registerVendorAction(form);
      setStep(3);
    } catch (err: any) {
      alert('Erreur: ' + (err.message || "Une erreur est survenue"));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = { 
    width: '100%', 
    padding: '12px 16px', 
    borderRadius: '12px', 
    border: '1.5px solid #E2E8F0', 
    fontSize: '15px', 
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 700,
    color: '#475569',
    marginBottom: '8px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '500px', width: '100%', background: '#fff', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', padding: '40px', position: 'relative', overflow: 'hidden' }}>
        
        {/* Progress header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', background: '#4F46E510', color: '#4F46E5', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Building2 size={32} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', margin: '0 0 8px' }}>Devenir Fournisseur</h1>
          <p style={{ color: '#64748B', fontSize: '15px' }}>Rejoignez le premier écosystème B2B pour Cafés en Tunisie</p>
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Votre Nom complet</label>
              <div style={{ position: 'relative' }}>
                <input style={inputStyle} placeholder="ex: Ahmed Ben Ali" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Email Professionnel</label>
              <input 
                type="email" 
                style={{ 
                  ...inputStyle, 
                  borderColor: emailStatus === 'taken' ? '#F43F5E' : emailStatus === 'available' ? '#10B981' : '#E2E8F0' 
                }} 
                placeholder="nom@entreprise.tn" 
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
              />
              {emailStatus === 'checking' && <span style={{ fontSize: '12px', color: '#64748B' }}>Vérification...</span>}
              {emailStatus === 'taken' && <span style={{ fontSize: '12px', color: '#F43F5E' }}>Cet email est déjà utilisé</span>}
              {emailStatus === 'available' && <span style={{ fontSize: '12px', color: '#10B981' }}>Email disponible</span>}
            </div>
            <div>
              <label style={labelStyle}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  style={{ ...inputStyle, paddingRight: '48px' }} 
                  placeholder="••••••••" 
                  value={form.password} 
                  onChange={e => setForm({...form, password: e.target.value})} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button 
              onClick={() => {
                if (emailStatus === 'taken') {
                  alert("Cet email est déjà utilisé. Veuillez en choisir un autre.");
                  return;
                }
                if (emailStatus === 'checking') {
                  alert("Veuillez patienter pendant la vérification de l'email.");
                  return;
                }
                setStep(2);
              }}
              disabled={!form.email || !form.password}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#4F46E5', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', marginTop: '12px', opacity: (!form.email || !form.password) ? 0.5 : 1 }}
            >
              Continuer →
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#64748B' }}>
              Déjà un compte ? <Link href="/login" style={{ color: '#4F46E5', fontWeight: 700 }}>Se connecter</Link>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Nom de l'Entreprise</label>
              <input style={inputStyle} placeholder="ex: Ben Yaghlane Distribution" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Téléphone</label>
                <input style={inputStyle} placeholder="+216 71..." value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
              </div>
              <div>
                <label style={labelStyle}>Ville</label>
<select 
                  style={{ ...inputStyle, cursor: 'pointer', background: '#white' }} 
                  value={form.city} 
                  onChange={e => setForm({...form, city: e.target.value})} 
                  required
                >
                  <option value="">Sélectionnez votre ville</option>
                  <optgroup label="Tunis">
                    <option value="Tunis">Tunis</option>
                    <option value="Marsa">Marsa</option>
                    <option value="Carthage">Carthage</option>
                    <option value="Sidi Bou Saïd">Sidi Bou Saïd</option>
                    <option value="Kram">Kram</option>
                    <option value="Bardo">Bardo</option>
                    <option value="La Kasbah (Tunis)">La Kasbah (Tunis)</option>
                    <option value="La Goulette">La Goulette</option>
                    <option value="Sidi Hassine">Sidi Hassine</option>
                  </optgroup>
                  <optgroup label="Ariana">
                    <option value="Ariana">Ariana</option>
                    <option value="Soukra">Soukra</option>
                    <option value="Raoued">Raoued</option>
                    <option value="Sidi Thabet">Sidi Thabet</option>
                    <option value="Kalaat El Andalous">Kalaat El Andalous</option>
                    <option value="Ettadhamen / Mnihla">Ettadhamen / Mnihla</option>
                  </optgroup>
                  <optgroup label="Manouba">
                    <option value="Manouba">Manouba</option>
                    <option value="Den Den">Den Den</option>
                    <option value="Douar Hicher">Douar Hicher</option>
                    <option value="Oued Ellil">Oued Ellil</option>
                    <option value="Jedaida">Jedaida</option>
                    <option value="Tebourba">Tebourba</option>
                    <option value="El Battan">El Battan</option>
                    <option value="Borj El Amri">Borj El Amri</option>
                    <option value="Mornaguia">Mornaguia</option>
                  </optgroup>
                  <optgroup label="Ben Arous">
                    <option value="Ben Arous">Ben Arous</option>
                    <option value="El Mourouj">El Mourouj</option>
                    <option value="Megrine">Megrine</option>
                    <option value="Radès">Radès</option>
                    <option value="Hammam Lif">Hammam Lif</option>
                    <option value="Hammam Chott">Hammam Chott</option>
                    <option value="Ezzahra">Ezzahra</option>
                    <option value="Mornag">Mornag</option>
                    <option value="Boumhel">Boumhel</option>
                    <option value="Mohamedia / Fouchana">Mohamedia / Fouchana</option>
                    <option value="Khalidia">Khalidia</option>
                  </optgroup>
                  <optgroup label="Nabeul">
                    <option value="Nabeul">Nabeul</option>
                    <option value="Dar Chaabane">Dar Chaabane</option>
                    <option value="Béni Khiar">Béni Khiar</option>
                    <option value="Somaa">Somaa</option>
                    <option value="Maamoura">Maamoura</option>
                    <option value="Tazarka">Tazarka</option>
                    <option value="Korba">Korba</option>
                    <option value="Mida">Mida</option>
                    <option value="Menzel Horr">Menzel Horr</option>
                    <option value="Menzel Temime">Menzel Temime</option>
                    <option value="Kelibia">Kelibia</option>
                    <option value="Azmour">Azmour</option>
                    <option value="Hammam Khezaz">Hammam Khezaz</option>
                    <option value="Dar Allouch">Dar Allouch</option>
                    <option value="El Haouaria">El Haouaria</option>
                    <option value="Takelsa">Takelsa</option>
                    <option value="Korbous">Korbous</option>
                    <option value="Soliman">Soliman</option>
                    <option value="Menzel Bouzelfa">Menzel Bouzelfa</option>
                    <option value="Béni Khalled">Béni Khalled</option>
                    <option value="Zaouiet Jedidi">Zaouiet Jedidi</option>
                    <option value="Grombalia">Grombalia</option>
                    <option value="Bouargoub">Bouargoub</option>
                    <option value="Hammamet">Hammamet</option>
                  </optgroup>
                  <optgroup label="Bizerte">
                    <option value="Bizerte">Bizerte</option>
                    <option value="Mateur">Mateur</option>
                    <option value="Menzel Bourguiba">Menzel Bourguiba</option>
                    <option value="Sejnane">Sejnane</option>
                    <option value="Ras Jebel">Ras Jebel</option>
                    <option value="Al Alia">Al Alia</option>
                    <option value="Rafraf">Rafraf</option>
                    <option value="Metline">Metline</option>
                    <option value="Ghar El Melh">Ghar El Melh</option>
                    <option value="Aousja">Aousja</option>
                    <option value="Menzel Jemil">Menzel Jemil</option>
                    <option value="Menzel Abderrahmane">Menzel Abderrahmane</option>
                    <option value="Tinja">Tinja</option>
                  </optgroup>
                  <optgroup label="Zaghouan">
                    <option value="Zaghouan">Zaghouan</option>
                    <option value="El Fahs">El Fahs</option>
                    <option value="Zriba">Zriba</option>
                    <option value="Bir Mcherga">Bir Mcherga</option>
                    <option value="Nadhour">Nadhour</option>
                    <option value="Jebel Oust">Jebel Oust</option>
                  </optgroup>
                  <optgroup label="Sousse">
                    <option value="Sousse">Sousse</option>
                    <option value="Hammam Sousse">Hammam Sousse</option>
                    <option value="Msaken">Msaken</option>
                    <option value="Kalaa Kebira">Kalaa Kebira</option>
                    <option value="Kalaa Seghira">Kalaa Seghira</option>
                    <option value="Akouda">Akouda</option>
                    <option value="Bouficha">Bouficha</option>
                    <option value="Enfidha">Enfidha</option>
                    <option value="Sidi Bou Ali">Sidi Bou Ali</option>
                    <option value="Messaadine">Messaadine</option>
                    <option value="Zaouia Sousse">Zaouia Sousse</option>
                    <option value="Hergla">Hergla</option>
                    <option value="Ezzouhour">Ezzouhour</option>
                    <option value="Ksibet Sousse">Ksibet Sousse</option>
                    <option value="Sidi El Heni">Sidi El Heni</option>
                    <option value="Kondar">Kondar</option>
                  </optgroup>
                  <optgroup label="Monastir">
                    <option value="Bekalta">Bekalta</option>
                    <option value="Bouhjar">Bouhjar</option>
                    <option value="Lamta">Lamta</option>
                    <option value="Moknine">Moknine</option>
                    <option value="Ksar Hellal">Ksar Hellal</option>
                    <option value="Menzel Hayet">Menzel Hayet</option>
                    <option value="Sahline">Sahline</option>
                    <option value="Jemmal">Jemmal</option>
                    <option value="Bembla">Bembla</option>
                    <option value="Beni Hassen">Beni Hassen</option>
                    <option value="Menzel Kamel">Menzel Kamel</option>
                    <option value="Menzel Ennour">Menzel Ennour</option>
                    <option value="Menzel Fersi">Menzel Fersi</option>
                    <option value="Monastir">Monastir</option>
                    <option value="Khniss">Khniss</option>
                    <option value="Ouerdanine">Ouerdanine</option>
                    <option value="Teboulba">Teboulba</option>
                    <option value="Sayada">Sayada</option>
                    <option value="Zeramdine">Zeramdine</option>
                  </optgroup>
                  <optgroup label="Mahdia">
                    <option value="Mahdia">Mahdia</option>
                    <option value="Rejiche">Rejiche</option>
                    <option value="Ksour Essef">Ksour Essef</option>
                    <option value="El Bradâa">El Bradâa</option>
                    <option value="Sidi Alouane">Sidi Alouane</option>
                    <option value="El Jem">El Jem</option>
                    <option value="Boumerdes">Boumerdes</option>
                    <option value="Chebba">Chebba</option>
                    <option value="Melloulèche">Melloulèche</option>
                    <option value="Souassi">Souassi</option>
                    <option value="Chorbane">Chorbane</option>
                    <option value="Hbira">Hbira</option>
                  </optgroup>
                  <optgroup label="Sfax">
                    <option value="Sfax">Sfax</option>
                    <option value="Sakiet Ezzit">Sakiet Ezzit</option>
                    <option value="Sakiet Eddaier">Sakiet Eddaier</option>
                    <option value="El Ain">El Ain</option>
                    <option value="Thyna">Thyna</option>
                    <option value="Gremda">Gremda</option>
                    <option value="El Hencha">El Hencha</option>
                    <option value="Jebiniana">Jebiniana</option>
                    <option value="Skhira">Skhira</option>
                    <option value="Mahres">Mahres</option>
                    <option value="Agareb">Agareb</option>
                    <option value="Bir Ali Ben Khalifa">Bir Ali Ben Khalifa</option>
                    <option value="Kerkennah">Kerkennah</option>
                  </optgroup>
                  <optgroup label="Béja">
                    <option value="Béja">Béja</option>
                    <option value="Medjez El Bab">Medjez El Bab</option>
                    <option value="Teboursouk">Teboursouk</option>
                    <option value="Testour">Testour</option>
                    <option value="Nefza">Nefza</option>
                    <option value="Goubellat">Goubellat</option>
                  </optgroup>
                  <optgroup label="Jendouba">
                    <option value="Jendouba">Jendouba</option>
                    <option value="Bousalem">Bousalem</option>
                    <option value="Tabarka">Tabarka</option>
                    <option value="Ghardimaou">Ghardimaou</option>
                    <option value="Ain Draham">Ain Draham</option>
                    <option value="Fernana">Fernana</option>
                    <option value="Oued Meliz">Oued Meliz</option>
                  </optgroup>
                  <optgroup label="Le Kef">
                    <option value="Le Kef">Le Kef</option>
                    <option value="Sers">Sers</option>
                    <option value="Nebeur">Nebeur</option>
                    <option value="Tajerouine">Tajerouine</option>
                    <option value="Dahmani">Dahmani</option>
                    <option value="Sakiet Sidi Youssef">Sakiet Sidi Youssef</option>
                  </optgroup>
                  <optgroup label="Siliana">
                    <option value="Siliana">Siliana</option>
                    <option value="Makthar">Makthar</option>
                    <option value="Bou Arada">Bou Arada</option>
                    <option value="Le Krib">Le Krib</option>
                    <option value="Rouhia">Rouhia</option>
                    <option value="Gaafour">Gaafour</option>
                    <option value="Bargou">Bargou</option>
                    <option value="Kesra">Kesra</option>
                  </optgroup>
                  <optgroup label="Kairouan">
                    <option value="Kairouan">Kairouan</option>
                    <option value="Sbikha">Sbikha</option>
                    <option value="Oueslatia">Oueslatia</option>
                    <option value="Chebika">Chebika</option>
                    <option value="Haffouz">Haffouz</option>
                    <option value="Nasrallah">Nasrallah</option>
                    <option value="Bouhajla">Bouhajla</option>
                  </optgroup>
                  <optgroup label="Sidi Bouzid">
                    <option value="Sidi Bouzid">Sidi Bouzid</option>
                    <option value="Regueb">Regueb</option>
                    <option value="Sidi Ali Ben Aoun">Sidi Ali Ben Aoun</option>
                    <option value="Jelma">Jelma</option>
                    <option value="Meknassy">Meknassy</option>
                    <option value="Bir El Haffey">Bir El Haffey</option>
                  </optgroup>
                  <optgroup label="Kasserine">
                    <option value="Kasserine">Kasserine</option>
                    <option value="Sbeitla">Sbeitla</option>
                    <option value="Feriana">Feriana</option>
                    <option value="Foussana">Foussana</option>
                    <option value="Sbiba">Sbiba</option>
                    <option value="Thala">Thala</option>
                    <option value="Hidra">Hidra</option>
                  </optgroup>
                  <optgroup label="Gabès">
                    <option value="Gabès">Gabès</option>
                    <option value="El Hamma">El Hamma</option>
                    <option value="Mareth">Mareth</option>
                    <option value="Ghannouch">Ghannouch</option>
                    <option value="Metouia">Metouia</option>
                    <option value="Oudhref">Oudhref</option>
                  </optgroup>
                  <optgroup label="Médenine">
                    <option value="Médenine">Médenine</option>
                    <option value="Zarzis">Zarzis</option>
                    <option value="Djerba Houmt Souk">Djerba Houmt Souk</option>
                    <option value="Djerba Midoun">Djerba Midoun</option>
                    <option value="Djerba Ajim">Djerba Ajim</option>
                    <option value="Ben Guerdane">Ben Guerdane</option>
                    <option value="Beni Khedache">Beni Khedache</option>
                  </optgroup>
                  <optgroup label="Gafsa">
                    <option value="Gafsa">Gafsa</option>
                    <option value="Redeyef">Redeyef</option>
                    <option value="Metlaoui">Metlaoui</option>
                    <option value="Mdhilla">Mdhilla</option>
                    <option value="Om Laarayes">Om Laarayes</option>
                    <option value="El Guettar">El Guettar</option>
                  </optgroup>
                  <optgroup label="Tozeur">
                    <option value="Tozeur">Tozeur</option>
                    <option value="Nefta">Nefta</option>
                    <option value="Degache">Degache</option>
                    <option value="Tameghza">Tameghza</option>
                  </optgroup>
                  <optgroup label="Tataouine">
                    <option value="Tataouine">Tataouine</option>
                    <option value="Ghomrassen">Ghomrassen</option>
                    <option value="Remada">Remada</option>
                    <option value="Dhehiba">Dhehiba</option>
                  </optgroup>
                  <optgroup label="Kébili">
                    <option value="Kébili">Kébili</option>
                    <option value="Douz">Douz</option>
                    <option value="Souk Lahad">Souk Lahad</option>
                    <option value="Jemna">Jemna</option>
                  </optgroup>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Adresse du Siège</label>
              <input style={inputStyle} placeholder="ex: Zone Industrielle Charguia II" value={form.address} onChange={e => setForm({...form, address: e.target.value})} required />
            </div>
            <div>
              <label style={labelStyle}>Description de vos produits</label>
              <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Quels types de produits vendez-vous ?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'transparent', color: '#475569', border: '1.5px solid #E2E8F0', fontWeight: 700 }}>Retour</button>
              <button type="submit" disabled={loading} style={{ flex: 2, padding: '14px', borderRadius: '12px', background: '#4F46E5', color: '#fff', border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? 'Création...' : <><Send size={18} /> Finaliser l'inscription</>}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '80px', height: '80px', background: '#D1FAE5', color: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle size={48} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', marginBottom: '12px' }}>Inscription Envoyée !</h2>
            <p style={{ color: '#64748B', lineHeight: '1.6', marginBottom: '32px' }}>
              Votre demande est en cours de validation par notre équipe. Vous recevrez un email dès que votre accès au Marketplace sera activé.
            </p>
            <Link href="/" style={{ display: 'inline-block', width: '100%', padding: '14px', borderRadius: '12px', background: '#4F46E5', color: '#fff', textDecoration: 'none', fontWeight: 800 }}>
              Retour à l'accueil
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
