import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';
import { featureListingFree, featureListingPaid, unfeatureListing } from '../../application/listings/FeatureListingUseCase';
import type { Listing } from '../../domain/entities/Listing';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
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

  useEffect(() => {
    if (!user || user.role !== 'owner') { navigate('/login'); return; }
    setListings(ListingRepository.findByOwner(user.id));
  }, [user, navigate]);

  const reload = () => {
    if (!user) return;
    setListings(ListingRepository.findByOwner(user.id));
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

  const handleFeatureFree = (l: Listing) => {
    if (!confirm(`¿Destacar "${l.title}" gratis por 7 días?`)) return;
    try {
      featureListingFree(l.id, user!.id);
      showToast('¡Publicación destacada por 7 días!', 'success');
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
    featureListingPaid(featureModal.id, user.id, FEATURE_PLANS[selectedPlan].days);
    setPayStep('done');
    reload();
  };

  const published = listings.filter((l) => l.status === 'published');
  const drafts = listings.filter((l) => l.status === 'draft');
  const featured = listings.filter((l) => l.featured);

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Mis publicaciones</h1>
          <p className="page-subtitle">Gestiona tus propiedades</p>
        </div>
        <Link to="/publish" className="btn btn-primary">+ Nueva publicación</Link>
      </div>

      <div className="dashboard-stats">
        {[
          { label: 'Total', value: listings.length },
          { label: 'Publicadas', value: published.length },
          { label: 'Borradores', value: drafts.length },
          { label: 'Destacadas', value: featured.length },
        ].map((s) => (
          <div key={s.label} className="dashboard-stat">
            <div className="dashboard-stat-value">{s.value}</div>
            <div className="dashboard-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <h3>No tienes publicaciones</h3>
          <p>Crea tu primera publicación para que los estudiantes puedan encontrarte.</p>
          <Link to="/publish" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Crear primera publicación
          </Link>
        </div>
      ) : (
        <div className="listing-table">
          {listings.map((l) => (
            <div key={l.id} className="listing-row">
              <div className="listing-row-thumb">
                {l.images[0]
                  ? <img src={l.images[0]} alt="" />
                  : <div className="listing-row-placeholder">{l.type === 'habitación' ? '🛏' : '🏢'}</div>
                }
              </div>
              <div className="listing-row-info">
                <div className="listing-row-title">{l.title}</div>
                <div className="listing-row-meta">
                  {l.city}{l.zone ? ` · ${l.zone}` : ''} · {COP.format(l.price)}/mes
                </div>
                {l.featured && l.featuredUntil && (
                  <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '0.125rem' }}>
                    ⭐ Destacado hasta {new Date(l.featuredUntil).toLocaleDateString('es-CO')}
                  </div>
                )}
              </div>
              <div className="listing-row-status">
                <span className={`status-badge ${l.status === 'published' ? 'status-published' : 'status-draft'}`}>
                  {l.status === 'published' ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <div className="listing-row-actions" style={{ flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/publish?edit=${l.id}`)}>Editar</button>
                <button className="btn btn-outline btn-sm" onClick={() => handleToggleStatus(l)}>
                  {l.status === 'published' ? 'Pausar' : 'Activar'}
                </button>
                {l.status === 'published' && !l.featured && (
                  <button className="btn btn-outline btn-sm" style={{ color: '#B45309', borderColor: '#F59E0B' }}
                    onClick={() => handleFeatureFree(l)}>
                    ⭐ Destacar gratis
                  </button>
                )}
                {l.status === 'published' && !l.featured && (
                  <button className="btn btn-outline btn-sm" onClick={() => openPayFeature(l)}>
                    💳 Destacar con pago
                  </button>
                )}
                {l.featured && (
                  <button className="btn btn-outline btn-sm" onClick={() => handleUnfeature(l)}>
                    Quitar destaque
                  </button>
                )}
                <button className="btn btn-ghost btn-sm text-red" onClick={() => handleDelete(l)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!featureModal} onClose={() => setFeatureModal(null)} title="Destacar publicación">
        {payStep === 'plan' && (
          <>
            <p className="text-gray text-sm" style={{ marginBottom: '1.25rem' }}>
              Selecciona el plan de destaque para <strong>{featureModal?.title}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {FEATURE_PLANS.map((p, i) => (
                <label key={p.days} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', border: `1.5px solid ${selectedPlan === i ? 'var(--red)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius)', cursor: 'pointer' }}>
                  <input type="radio" name="plan" checked={selectedPlan === i} onChange={() => setSelectedPlan(i)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Tu anuncio aparece primero en los resultados</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--red)' }}>{COP.format(p.price)}</div>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setFeatureModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => setPayStep('pay')}>Continuar al pago</button>
            </div>
          </>
        )}

        {payStep === 'pay' && (
          <>
            <p className="text-gray text-sm" style={{ marginBottom: '1.25rem' }}>
              Plan: <strong>{FEATURE_PLANS[selectedPlan].label}</strong> — {COP.format(FEATURE_PLANS[selectedPlan].price)}
            </p>
            <div className="form-group">
              <label className="form-label">Número de tarjeta *</label>
              <input className="form-input" placeholder="1234 5678 9012 3456" maxLength={19}
                value={cardNum} onChange={(e) => setCardNum(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vencimiento *</label>
                <input className="form-input" placeholder="MM/AA" maxLength={5}
                  value={cardExp} onChange={(e) => setCardExp(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">CVV *</label>
                <input className="form-input" placeholder="123" maxLength={4} type="password"
                  value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} />
              </div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--gray-600)' }}>
              🔒 Pago de demostración — no se realizarán cargos reales.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setPayStep('plan')}>Atrás</button>
              <button className="btn btn-primary" onClick={handlePay}>Pagar {COP.format(FEATURE_PLANS[selectedPlan].price)}</button>
            </div>
          </>
        )}

        {payStep === 'done' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>¡Pago procesado!</h3>
            <p className="text-gray" style={{ marginBottom: '1.25rem' }}>
              Tu publicación aparecerá destacada durante {FEATURE_PLANS[selectedPlan].label}.
            </p>
            <button className="btn btn-primary" onClick={() => setFeatureModal(null)}>Entendido</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
