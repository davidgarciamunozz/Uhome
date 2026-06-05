import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';
import { featureListing, unfeatureListing } from '../../application/listings/FeatureListingUseCase';
import { canPublish } from '../../application/freemium/CheckListingLimitUseCase';
import type { Listing } from '../../domain/entities/Listing';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import FreemiumGate from '../components/ui/FreemiumGate';
import Modal from '../components/ui/Modal';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const FEATURE_PLANS = [
  { days: 7, label: '7 días', price: 25000 },
  { days: 15, label: '15 días', price: 45000 },
  { days: 30, label: '30 días', price: 80000 },
];

function toggleStatus(id: string, status: Listing['status'], ownerId: string) {
  const l = ListingRepository.findById(id);
  if (!l || l.ownerId !== ownerId) return;
  ListingRepository.save({ ...l, status });
}

function removeListingById(id: string, ownerId: string) {
  const l = ListingRepository.findById(id);
  if (!l || l.ownerId !== ownerId) return;
  ListingRepository.delete(id);
}

export default function DashboardPage() {
  const { user } = useSession();
  const showToast = useToast();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [featureModal, setFeatureModal] = useState<Listing | null>(null);
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [payStep, setPayStep] = useState<'plan' | 'pay' | 'done'>('plan');
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [freemiumMsg, setFreemiumMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'owner') { navigate('/login'); return; }
    setListings(ListingRepository.findByOwner(user.id));
  }, [user, navigate]);

  const reload = () => {
    if (!user) return;
    setListings(ListingRepository.findByOwner(user.id));
  };

  const handleNewListing = () => {
    if (!user) return;
    const check = canPublish(user.id);
    if (!check.allowed) {
      setFreemiumMsg(
        `Has alcanzado el máximo de ${check.limit} publicaciones activas en el plan gratuito. Actualiza a Premium para publicar más.`,
      );
      return;
    }
    navigate('/publish');
  };

  const handleToggleStatus = (l: Listing) => {
    const next = l.status === 'published' ? 'draft' : 'published';
    toggleStatus(l.id, next, user!.id);
    showToast(next === 'published' ? 'Publicación activada' : 'Publicación pausada', 'success');
    reload();
  };

  const handleDelete = (l: Listing) => {
    if (!confirm(`¿Eliminar "${l.title}"?`)) return;
    removeListingById(l.id, user!.id);
    showToast('Publicación eliminada', 'success');
    reload();
  };

  const openPayFeature = (l: Listing) => {
    setFeatureModal(l);
    setSelectedPlan(0);
    setPayStep('plan');
    setCardNum(''); setCardExp(''); setCardCvv('');
  };

  const handlePay = () => {
    if (!featureModal || !user) return;
    if (!cardNum.trim() || !cardExp.trim() || !cardCvv.trim()) {
      showToast('Completa todos los datos de pago', 'error');
      return;
    }
    try {
      featureListing(featureModal.id, user.id, FEATURE_PLANS[selectedPlan].days);
      setPayStep('done');
      reload();
    } catch (e: any) {
      showToast(e.message || 'Error al destacar', 'error');
    }
  };

  const handleUnfeature = (l: Listing) => {
    if (!confirm(`¿Quitar destaque de "${l.title}"?`)) return;
    unfeatureListing(l.id, user!.id);
    showToast('Destaque removido', 'success');
    reload();
  };

  const isPremium = user?.plan === 'premium';

  if (!user) return null;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      {freemiumMsg && (
        <FreemiumGate message={freemiumMsg} onClose={() => setFreemiumMsg(null)} />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Mis publicaciones</h1>
          <p className="page-subtitle">
            {listings.length} publicación{listings.length !== 1 ? 'es' : ''}
            {!isPremium && (
              <span style={{ color: 'var(--gray-400)', marginLeft: '0.5rem' }}>
                · {listings.filter((l) => l.status === 'published').length}/3 activas (plan gratuito)
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleNewListing}>
          + Nueva publicación
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏠</div>
          <p className="empty-state-title">Aún no tienes publicaciones</p>
          <button className="btn btn-primary" onClick={handleNewListing}>
            Crear primera publicación
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {listings.map((l) => {
            const isFeatured = l.featured && l.featuredUntil && new Date(l.featuredUntil) > new Date();
            return (
              <div key={l.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Link to={`/listing/${l.id}`} style={{ fontWeight: 700, fontSize: '0.95rem' }}>{l.title}</Link>
                      {isFeatured && (
                        <span style={{ fontSize: '0.7rem', background: 'var(--yellow-soft, #fffbeb)', color: 'var(--yellow-dark, #92400e)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
                          Destacada
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', background: l.status === 'published' ? 'var(--green-soft, #e6f9f0)' : 'var(--gray-100)', color: l.status === 'published' ? 'var(--green)' : 'var(--gray-500)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
                        {l.status === 'published' ? 'Activa' : 'Pausada'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      {COP.format(l.price)}/mes · {l.city}
                      {isFeatured && l.featuredUntil && (
                        <span style={{ marginLeft: '0.5rem' }}>
                          · Destacada hasta {new Date(l.featuredUntil).toLocaleDateString('es-CO')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link to={`/publish?edit=${l.id}`} className="btn btn-outline btn-sm">Editar</Link>
                    <button className="btn btn-outline btn-sm" onClick={() => handleToggleStatus(l)}>
                      {l.status === 'published' ? 'Pausar' : 'Activar'}
                    </button>
                    {l.status === 'published' && (
                      isPremium ? (
                        isFeatured ? (
                          <button className="btn btn-outline btn-sm" onClick={() => handleUnfeature(l)}>Quitar destaque</button>
                        ) : (
                          <button className="btn btn-primary btn-sm" onClick={() => openPayFeature(l)}>Destacar</button>
                        )
                      ) : (
                        <Link to="/plans" className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                          Destacar (Premium)
                        </Link>
                      )
                    )}
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleDelete(l)}>Eliminar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!featureModal} title="Destacar publicación" onClose={() => setFeatureModal(null)}>
        {featureModal && payStep === 'plan' && (
          <div>
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              Selecciona la duración del destaque para <strong>{featureModal.title}</strong>:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {FEATURE_PLANS.map((p, i) => (
                <label key={p.days} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', border: `1px solid ${selectedPlan === i ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius)' }}>
                  <input type="radio" name="featurePlan" checked={selectedPlan === i} onChange={() => setSelectedPlan(i)} />
                  <span style={{ flex: 1, fontWeight: 500 }}>{p.label}</span>
                  <span style={{ fontWeight: 700 }}>{COP.format(p.price)}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => setPayStep('pay')}>Continuar</button>
              <button className="btn btn-outline" onClick={() => setFeatureModal(null)}>Cancelar</button>
            </div>
          </div>
        )}
        {featureModal && payStep === 'pay' && (
          <div>
            <p style={{ marginBottom: '1.25rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              Total: <strong>{COP.format(FEATURE_PLANS[selectedPlan].price)}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Número de tarjeta</label>
              <input className="form-input" placeholder="1234 5678 9012 3456" value={cardNum} onChange={(e) => setCardNum(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vencimiento</label>
                <input className="form-input" placeholder="MM/AA" value={cardExp} onChange={(e) => setCardExp(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">CVV</label>
                <input className="form-input" placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={handlePay}>Pagar {COP.format(FEATURE_PLANS[selectedPlan].price)}</button>
              <button className="btn btn-outline" onClick={() => setFeatureModal(null)}>Cancelar</button>
            </div>
          </div>
        )}
        {payStep === 'done' && (
          <div>
            <p style={{ marginBottom: '1.5rem' }}>¡Publicación destacada exitosamente por {FEATURE_PLANS[selectedPlan].days} días!</p>
            <button className="btn btn-primary" onClick={() => { setFeatureModal(null); setPayStep('plan'); }}>Listo</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
