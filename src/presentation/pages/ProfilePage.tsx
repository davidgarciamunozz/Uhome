import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { RoomieRepository } from '../../infrastructure/repositories/RoomieRepository';
import { getUserRatingSummary } from '../../application/social/RateUserUseCase';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import Stars from '../components/ui/Stars';
import { isStudent, isOwner } from '../../domain/entities/User';

export default function ProfilePage() {
  const { user, refreshUser } = useSession();
  const showToast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) { navigate('/login'); return null; }

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    description: user.description || '',
    avatar: user.avatar || '',
  });

  const ratingSummary = getUserRatingSummary(user.id);
  const roomieProfile = isStudent(user) ? RoomieRepository.findByUser(user.id) : null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setForm((f) => ({ ...f, avatar: ev.target!.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const updated = { ...user, ...form };
    UserRepository.save(updated);
    refreshUser();
    showToast('Cambios guardados', 'success');
    setEditing(false);
  };

  return (
    <div className="container" style={{ maxWidth: 640, padding: '2rem' }}>
      <div className="page-header">
        <h1 className="page-title">Mi perfil</h1>
      </div>

      <div className="profile-section">
        <div className="profile-avatar-wrap">
          <div className="avatar avatar-lg" onClick={() => editing && fileRef.current?.click()} style={{ cursor: editing ? 'pointer' : 'default' }}>
            {form.avatar
              ? <img src={form.avatar} alt={user.name} />
              : <span>{user.name.charAt(0).toUpperCase()}</span>
            }
            {editing && <div className="avatar-overlay">📷</div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>

        {editing ? (
          <div style={{ flex: 1 }}>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input className="form-input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción personal</label>
              <textarea className="form-textarea" rows={3} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Cuéntanos sobre ti..." />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={handleSave}>Guardar cambios</button>
              <button className="btn btn-outline" onClick={() => setEditing(false)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            <h2 className="profile-name">{user.name}</h2>
            <p className="badge badge-gray" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
              {user.role === 'student' ? 'Estudiante' : 'Propietario'}
            </p>
            <p className="text-gray" style={{ marginTop: '0.5rem' }}>{user.description || 'Sin descripción'}</p>
            {isStudent(user) && (
              <div style={{ marginTop: '0.75rem' }}>
                <p className="text-sm"><strong>Universidad:</strong> {user.university}</p>
                {user.career && <p className="text-sm"><strong>Carrera:</strong> {user.career}</p>}
                {user.age && <p className="text-sm"><strong>Edad:</strong> {user.age} años</p>}
              </div>
            )}
            {isOwner(user) && (
              <div style={{ marginTop: '0.75rem' }}>
                <p className="text-sm"><strong>Ciudad:</strong> {user.city}</p>
                <p className="text-sm"><strong>WhatsApp:</strong> {user.phone}</p>
              </div>
            )}
            <button className="btn btn-outline btn-sm" style={{ marginTop: '1rem' }} onClick={() => setEditing(true)}>
              Editar perfil
            </button>
          </div>
        )}
      </div>

      <hr className="divider" />

      {ratingSummary.count > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 className="section-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Calificaciones</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Stars value={Math.round(ratingSummary.average)} size="md" />
            <span className="text-bold">{ratingSummary.average}</span>
            <span className="text-gray text-sm">({ratingSummary.count} reseñas)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {ratingSummary.ratings.map((r) => (
              <div key={r.id} style={{ padding: '0.75rem', background: 'var(--gray-50)', borderRadius: '8px' }}>
                <Stars value={r.score} size="sm" />
                {r.comment && <p className="text-sm" style={{ marginTop: '0.25rem' }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {isStudent(user) && (
        <div>
          <h3 className="section-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Perfil de roomie</h3>
          {roomieProfile ? (
            <div className="card" style={{ padding: '1rem' }}>
              <p className="text-sm" style={{ marginBottom: '0.5rem' }}>Tu perfil es visible para otros estudiantes.</p>
              <Link to="/roomie-profile/edit" className="btn btn-outline btn-sm">Editar perfil de roomie</Link>
            </div>
          ) : (
            <div className="card" style={{ padding: '1rem' }}>
              <p className="text-sm text-gray" style={{ marginBottom: '0.5rem' }}>
                Crea tu perfil de roomie para que otros estudiantes puedan encontrarte.
              </p>
              <Link to="/roomie-profile/edit" className="btn btn-primary btn-sm">Crear perfil de roomie</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
