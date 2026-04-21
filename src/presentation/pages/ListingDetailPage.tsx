import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { reportContent } from '../../application/social/ReportContentUseCase';
import type { Listing } from '../../domain/entities/Listing';
import type { User } from '../../domain/entities/User';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import type { ReportReason } from '../../domain/entities/Report';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('spam');
  const [reportDesc, setReportDesc] = useState('');
  const { user } = useSession();
  const showToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const l = ListingRepository.findById(id);
    if (!l) { navigate('/search'); return; }
    setListing(l);
    setOwner(UserRepository.findById(l.ownerId));
  }, [id, navigate]);

  const handleContact = () => {
    if (!user) { navigate('/login'); return; }
    navigate(`/messages?to=${listing?.ownerId}`);
  };

  const handleReport = () => {
    if (!user) { navigate('/login'); return; }
    setReportOpen(true);
  };

  const submitReport = () => {
    if (!user || !listing) return;
    try {
      reportContent(user.id, listing.id, 'listing', reportReason, reportDesc);
      showToast('Reporte enviado. Gracias.', 'success');
      setReportOpen(false);
    } catch {
      showToast('Error al enviar el reporte', 'error');
    }
  };

  if (!listing) return <div className="container" style={{ padding: '4rem 0' }}>Cargando...</div>;

  const servicesList = Object.entries({
    internet: 'WiFi', water: 'Agua', electricity: 'Luz', gas: 'Gas'
  }).filter(([k]) => listing.services[k as keyof typeof listing.services]).map(([, v]) => v);

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
        ← Volver
      </button>

      <div className="listing-detail-grid">
        {/* Images */}
        <div>
          <div className="listing-detail-image">
            {listing.images[0] ? (
              <img src={listing.images[0]} alt={listing.title} />
            ) : (
              <div className={`listing-thumb-placeholder listing-thumb-${listing.type === 'habitación' ? 'room' : 'apt'}`}
                style={{ height: '100%', fontSize: '4rem' }}>
                <span>{listing.type === 'habitación' ? '🛏' : '🏢'}</span>
              </div>
            )}
          </div>
          {listing.images.length > 1 && (
            <div className="listing-thumbs">
              {listing.images.slice(1).map((img, i) => (
                <img key={i} src={img} alt="" className="listing-thumb-small" />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="listing-detail-info">
          <span className={`badge badge-${listing.type === 'habitación' ? 'red' : 'dark'}`}>{listing.type}</span>
          <h1 className="listing-detail-title">{listing.title}</h1>
          <div className="listing-detail-price">
            {COP.format(listing.price)}
            <span className="listing-price-unit">/mes</span>
          </div>
          <p className="listing-location">📍 {listing.city}{listing.zone ? ` · ${listing.zone}` : ''}</p>
          {listing.address && <p className="text-gray text-sm">{listing.address}</p>}

          <hr className="divider" />

          <div className="listing-specs">
            <div className="spec-item">
              <span className="spec-icon">🛏</span>
              <span>{listing.rooms} habitación{listing.rooms !== 1 ? 'es' : ''}</span>
            </div>
            <div className="spec-item">
              <span className="spec-icon">🚿</span>
              <span>{listing.bathrooms} baño{listing.bathrooms !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {servicesList.length > 0 && (
            <div>
              <p className="form-label" style={{ marginBottom: '0.5rem' }}>Servicios incluidos</p>
              <div className="chips">
                {servicesList.map((s) => <span key={s} className="chip chip-green">{s}</span>)}
              </div>
            </div>
          )}

          <hr className="divider" />

          {listing.description && (
            <div>
              <p className="form-label">Descripción</p>
              <p className="text-gray" style={{ lineHeight: '1.6' }}>{listing.description}</p>
            </div>
          )}

          <hr className="divider" />

          {owner && (
            <div className="owner-card">
              <div className="avatar avatar-sm">
                {owner.avatar ? <img src={owner.avatar} alt={owner.name} /> : owner.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-bold">{owner.name}</p>
                <p className="text-xs text-gray">Propietario</p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn btn-primary btn-lg" onClick={handleContact}>
              Contactar propietario
            </button>
            <button className="btn btn-ghost btn-sm text-gray" onClick={handleReport}>
              Reportar publicación
            </button>
          </div>
        </div>
      </div>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Reportar publicación">
        <div className="form-group">
          <label className="form-label">Motivo *</label>
          <select className="form-select" value={reportReason}
            onChange={(e) => setReportReason(e.target.value as ReportReason)}>
            <option value="spam">Spam</option>
            <option value="false_info">Información falsa</option>
            <option value="inappropriate">Contenido inapropiado</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Descripción (opcional)</label>
          <textarea className="form-textarea" rows={3} value={reportDesc}
            onChange={(e) => setReportDesc(e.target.value)}
            placeholder="Describe el problema..." />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setReportOpen(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={submitReport}>Enviar reporte</button>
        </div>
      </Modal>
    </div>
  );
}
