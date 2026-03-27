import { prisma } from '@coffeeshop/database';
import { CreditCard, CheckCircle2, Zap, BarChart3, Shield, Headphones, ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { getStore } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function SubscriptionManagement() {
  const store = await getStore();
  if (!store) return <div>Accès refusé</div>;

  let subscription = await prisma.subscription.findUnique({
    where: { storeId: store.id },
    include: { plan: true }
  });

  // Robust fetch for plan details if client is stale
  if (subscription && subscription.plan) {
    const rawPlan: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "Plan" WHERE id = $1`, subscription.planId);
    if (rawPlan[0]) {
        subscription = { 
            ...subscription, 
            plan: { ...subscription.plan, ...rawPlan[0] } 
        } as any;
    }
  }

  const currentPlan = subscription ? {
    name: subscription.plan.name,
    price: Number(subscription.plan.price),
    status: subscription.status,
    renewsAt: subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'N/A',
    startedAt: subscription.createdAt ? new Date(subscription.createdAt).toLocaleDateString() : 'N/A',
    maxStores: subscription.plan.maxStores,
    maxProducts: subscription.plan.maxProducts,
    features: [
      { label: `Jusqu'à ${subscription.plan.maxStores} Point(s) de Vente`, icon: <Shield size={16} /> },
      { label: `${subscription.plan.maxProducts} Produits max. au catalogue`, icon: <CheckCircle2 size={16} /> },
      { label: 'Ventes POS Illimitées', icon: <Zap size={16} /> },
      (subscription.plan as any).hasMarketplace && { label: 'Marketplace B2B Active', icon: <CheckCircle2 size={16} /> },
      { label: 'Support Chat 24h/7j', icon: <Headphones size={16} /> },
    ].filter(Boolean) as any[]
  } : null;

  const usageKpis = [
    { label: 'Produits utilisés', value: await prisma.product.count({ where: { storeId: store.id } }), max: currentPlan?.maxProducts || 50, unit: 'produits' },
    { label: 'Points de Vente actifs', value: 1, max: currentPlan?.maxStores || 1, unit: 'POS' },
    { label: 'Tables configurées', value: await prisma.storeTable.count({ where: { storeId: store.id } }), max: '∞', unit: 'Tables' },
  ];

  // Fetch other plans to switch to
  let allPlans: any[] = [];
  try {
     allPlans = await prisma.plan.findMany({ where: { status: 'ACTIVE' } });
  } catch(e) {
     allPlans = await prisma.$queryRawUnsafe(`SELECT * FROM "Plan" WHERE status = 'ACTIVE'`);
  }
  const otherPlans = allPlans.filter(p => p.id !== subscription?.planId);

  // Invoices (Mocked for now)
  const invoices: any[] = []; 

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Mon Abonnement SaaS</h1>
          <p>Gérez votre forfait, consultez votre utilisation et votre historique de facturation.</p>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'20px',marginBottom:'20px'}}>
        {/* Current Plan Card */}
        {currentPlan ? (
          <div className="card" style={{overflow:'visible'}}>
            <div style={{padding:'28px',background:'linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%)',borderRadius:'14px 14px 0 0'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontSize:'12px',fontWeight:700,color:'rgba(255,255,255,.6)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'4px'}}>Plan Actuel</div>
                  <div style={{fontSize:'36px',fontWeight:900,color:'#fff',letterSpacing:'-1px',marginBottom:'8px'}}>{currentPlan.name}</div>
                  <span style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(255,255,255,.15)',color:'#fff',padding:'4px 12px',borderRadius:'100px',fontSize:'13px',fontWeight:600}}>
                    <CheckCircle2 size={14} /> Abonnement Actif
                  </span>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'48px',fontWeight:900,color:'#fff',letterSpacing:'-2px'}}>{currentPlan.price}</div>
                  <div style={{fontSize:'14px',color:'rgba(255,255,255,.6)'}}>DT / mois</div>
                </div>
              </div>

              <div style={{display:'flex',gap:'20px',marginTop:'20px',padding:'16px',background:'rgba(255,255,255,.1)',borderRadius:'10px'}}>
                <div>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,.6)',fontWeight:600}}>Commencé le</div>
                  <div style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>{currentPlan.startedAt}</div>
                </div>
                <div style={{width:'1px',background:'rgba(255,255,255,.15)'}} />
                <div>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,.6)',fontWeight:600}}>Renouvellement</div>
                  <div style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>{currentPlan.renewsAt}</div>
                </div>
                <div style={{width:'1px',background:'rgba(255,255,255,.15)'}} />
                <div>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,.6)',fontWeight:600}}>Cycle</div>
                  <div style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Mensuel</div>
                </div>
              </div>
            </div>

            <div style={{padding:'24px'}}>
              <div style={{fontWeight:700,color:'#1E293B',marginBottom:'16px',fontSize:'14px'}}>✓ Inclus dans votre forfait</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                {currentPlan.features.map((f, i) => (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 12px',borderRadius:'8px',background:'#F8FAFC',fontSize:'13px',fontWeight:600,color:'#475569'}}>
                    <span style={{color:'#10B981'}}>{f.icon}</span>
                    {f.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{padding:'16px 24px',borderTop:'1px solid #E2E8F0',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#F8FAFC',borderRadius:'0 0 14px 14px'}}>
              <button style={{color:'#EF4444',border:'none',background:'none',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>
                Annuler l'abonnement
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <AlertCircle size={48} color="#94A3B8" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Aucun abonnement actif</h2>
            <p style={{ color: '#64748B', maxWidth: '300px', margin: '8px auto 24px' }}>Vous utilisez actuellement la période d'essai ou n'avez pas encore choisi de forfait.</p>
            <button className="btn btn-primary" onClick={() => {}}>Choisir un forfait ci-dessous</button>
          </div>
        )}

        {/* Usage + Invoices */}
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {/* Usage */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><BarChart3 size={16} /> Utilisation du Forfait</span>
            </div>
            <div style={{padding:'16px',display:'flex',flexDirection:'column',gap:'16px'}}>
              {usageKpis.map(u => {
                const maxVal = typeof u.max === 'number' ? u.max : 1;
                const pct = typeof u.max === 'number' ? Math.round((u.value / maxVal) * 100) : 0;
                return (
                  <div key={u.label}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                      <span style={{fontSize:'13px',fontWeight:600,color:'#475569'}}>{u.label}</span>
                      <span style={{fontSize:'13px',fontWeight:700,color:pct>80?'#EF4444':'#1E293B'}}>{u.value}/{u.max} {u.unit}</span>
                    </div>
                    {typeof u.max === 'number' && (
                      <div className="progress-track">
                        <div className="progress-fill" style={{width:`${pct}%`,background:pct>80?'#EF4444':pct>60?'#F59E0B':'#6366F1'}} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invoices */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Calendar size={16} /> Historique Factures</span>
            </div>
            <div style={{padding:'12px',display:'flex',flexDirection:'column',gap:'6px'}}>
              {invoices.length === 0 ? (
                 <p style={{ textAlign: 'center', padding: '12px', color: '#94A3B8', fontSize: '13px' }}>Aucune facture disponible.</p>
              ) : invoices.map(inv => (
                <div key={inv.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',borderRadius:'8px',background:'#F8FAFC'}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:'13px',color:'#1E293B'}}>{inv.id}</div>
                    <div style={{fontSize:'11px',color:'#94A3B8'}}>{inv.date}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span style={{fontWeight:700,color:'#1E293B'}}>{inv.amount} DT</span>
                    <span className="badge green" style={{fontSize:'10px'}}>✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Other Plans */}
      <div>
        <div style={{fontWeight:800,fontSize:'18px',color:'#1E293B',marginBottom:'16px'}}>Plans Disponibles</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(350px, 1fr))',gap:'16px'}}>
          {otherPlans.map((plan: any) => (
            <div key={plan.id} className="card" style={{ padding: '24px' }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
                <div>
                  <h3 style={{fontSize:'18px',fontWeight:800,color:'#1E293B'}}>{plan.name}</h3>
                  <div style={{fontSize:'28px',fontWeight:900,color:'#6366F1',marginTop:'4px'}}>{Number(plan.price)} <span style={{fontSize:'13px',color:'#94A3B8',fontWeight:600}}>DT/mois</span></div>
                </div>
                <button className="btn btn-primary" style={{fontSize:'12px'}}>
                  Choisir ce plan <ArrowRight size={12} />
                </button>
              </div>
              <ul style={{display:'flex',flexDirection:'column',gap:'8px', padding: 0, listStyle: 'none'}}>
                  <li style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'#64748B'}}>
                    <CheckCircle2 size={14} color="#10B981" strokeWidth={3} /> {plan.maxStores} Point(s) de Vente
                  </li>
                  <li style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'#64748B'}}>
                    <CheckCircle2 size={14} color="#10B981" strokeWidth={3} /> {plan.maxProducts} Produits au catalogue
                  </li>
                  <li style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'#64748B'}}>
                    <CheckCircle2 size={14} color="#10B981" strokeWidth={3} /> Ventes POS Illimitées
                  </li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
