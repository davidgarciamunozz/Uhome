import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { RoomieRepository } from '../../infrastructure/repositories/RoomieRepository';
import { reportContent } from '../../application/social/ReportContentUseCase';
import { rateUser } from '../../application/social/RateUserUseCase';
import { calculateCompatibility, getCompatibilityLabel, getCompatibilityColor } from '../../domain/services/CompatibilityService';
import type { RoomieProfile } from '../../domain/entities/RoomieProfile';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { isStudent } from '../../domain/entities/User';
import Modal from '../components/ui/Modal';
import Stars from '../components/ui/Stars';
import type { ReportReason } from '../../domain/entities/Report';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function RoomieProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<RoomieProfile | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('spam');
  const [reportDesc, setReportDesc] = useState('');
  const [rateScore, setRateScore] = useState(0);
  const [rateComment, setRateComment] = useState('');
  const { user } = useSession();
  const showToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const p = RoomieRepository.findById(id);
    if (!p) { navigate('/roomies'); return; }
    setProfile(p);
  }, [id, navigate]);

  if (!profile) return <div className="container" style={{ padding: '4rem 0' }}>Cargando...</div>;

  const compat = user && isStudent(user) ? calculateCompatibility(user, profile) : null;

  const handleContact = () => {
    if (!user) { navigate('/login'); return; }
    navigate(`/messages?to=${profile.userId}`);
  };

  const submitReport = () => {
    if (!user) return;
    try {
      reportContent(user.id, profile.userId, 'user', reportReason, reportDesc);
      showToast('Reporte enviado. Gracias.', 'success');
      setReportOpen(false);
    } catch {
      showToast('Error al enviar el reporte', 'error');
    }
  };

  const submitRate = () => {
    if (!user) return;
    try {
      rateUser(user.id, profile.userId, rateScore, rateComment);
      showToast('Calificación enviada', 'success');
      setRateOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Error al calificar', 'error');
    }
  };

  const { preferences: p } = profile;

  return (
    <div className="container" style={{ maxWidth: 640, padding: '2rem' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
        ← Volver
      </button>

      <div className="roomie-detail-card">
        <div className="roomie-detail-header">
          <div className="avatar avatar-xl">
            {profile.avatar
              ? <img src={profile.avatar} alt={profile.name} />
              : <span>{profile.name.charAt(0).toUpperCase()}</span>
            }
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="profile-name">{profile.name}</h1>
            <p className="text-gray">{profile.age} años · {profile.university}</p>
            {profile.career && <p className="text-sm text-gray">{profile.career}</p>}
          </div>
          {compat !== null && (
            <div className="compat-score" style={{ color: getCompatibilityColor(compat) }}>
              <div className="compat-number">{compat}%</div>
              <div className="compat-label">{getCompatibilityLabel(compat)}</div>
            </div>
          )}
        </div>

        <hr className="divider" />

        <div className="prefs-section">
          <h3 className="prefs-title">Preferencias de convivencia</h3>
          <div className="prefs-grid">
            <div className="pref-item">
              <span className="pref-icon">🚬</span>
              <span className="pref-label">Fumador</span>
              <span className="pref-value">{p.smoker ? 'Sí' : 'No'}</span>
            </div>
            <div className="pref-item">
              <span className="pref-icon">🐾</span>
              <span className="pref-label">Mascotas</span>
              <span className="pref-value">{p.pets === 'sí' ? 'Sí' : p.pets === 'indiferente' ? 'Indiferente' : 'No'}</span>
            </div>
            <div className="pref-item">
              <span className="pref-icon">⏰</span>
              <span className="pref-label">Horarios</span>
              <span className="pref-value">{p.schedule === 'tranquilo' ? 'Tranquilo' : 'Social'}</span>
            </div>
            <div className="pref-item">
              <span className="pref-icon">✨</span>
              <span className="pref-label">Nivel de orden</span>
              <span className="pref-value">{p.order.charAt(0).toUpperCase() + p.order.slice(1)}</span>
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div>
          <div className="pref-item" style={{ marginBottom: '0.5rem' }}>
            <span className="pref-icon">💰</span>
            <span className="pref-label">Presupuesto mensual</span>
            <span className="pref-value text-red">{COP.format(profile.budget)}/mes</span>
          </div>
          {profile.stayDuration > 0 && (
            <div className="pref-item">
              <span className="pref-icon">📅</span>
              <span className="pref-label">Estadía estimada</span>
              <span className="pref-value">{profile.stayDuration} meses</span>
            </div>
          )}
        </div>

        {profile.description && (
          <>
            <hr className="divider" />
            <div>
              <h3 className="prefs-title">Sobre mí</h3>
              <p className="text-gray" style={{ lineHeight: '1.6' }}>{profile.description}</p>
            </div>
          </>
        )}

        <hr className="divider" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {user && user.id !== profile.userId && (
            <>
              <button className="btn btn-primary btn-lg" onClick={handleContact}>
                Contactar
              </button>
              <button className="btn btn-outline" onClick={() => setRateOpen(true)}>
                Calificar
              </button>
            </>
          )}
          {user && (
            <button className="btn btn-ghost btn-sm text-gray" onClick={() => setReportOpen(true)}>
              Reportar perfil
            </button>
          )}
          {!user && (
            <Link to="/login" className="btn btn-primary btn-lg">Inicia sesión para contactar</Link>
          )}
        </div>
      </div>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Reportar perfil">
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
            onChange={(e) => setReportDesc(e.target.value)} placeholder="Describe el problema..." />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setReportOpen(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={submitReport}>Enviar reporte</button>
        </div>
      </Modal>

      <Modal open={rateOpen} onClose={() => setRateOpen(false)} title="Calificar usuario">
        <div className="form-group">
          <label className="form-label">Calificación *</label>
          <Stars value={rateScore} onChange={setRateScore} size="lg" />
        </div>
        <div className="form-group">
          <label className="form-label">Comentario (opcional)</label>
          <textarea className="form-textarea" rows={3} value={rateComment}
            onChange={(e) => setRateComment(e.target.value)} placeholder="Tu experiencia..." />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setRateOpen(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={submitRate} disabled={rateScore === 0}>
            Enviar calificación
          </button>
        </div>
      </Modal>
    </div>
  );
}
