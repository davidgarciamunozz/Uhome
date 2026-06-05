import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { RoomieRepository } from '../../infrastructure/repositories/RoomieRepository';
import { getUserRatingSummary, editRating } from '../../application/social/RateUserUseCase';
import { RatingRepository } from '../../infrastructure/repositories/RatingRepository';
import type { Rating } from '../../domain/entities/Rating';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import Stars from '../components/ui/Stars';
import { isStudent, isOwner } from '../../domain/entities/User';

export default function ProfilePage() {
  const { user, refreshUser } = useSession();
  const showToast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', avatar: '' });
  const [givenRatings, setGivenRatings] = useState<Rating[]>([]);
  const [editingRating, setEditingRating] = useState<Rating | null>(null);
  const [editScore, setEditScore] = useState(5);
  const [editComment, setEditComment] = useState('');

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, description: user.description || '', avatar: user.avatar || '' });
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) setGivenRatings(RatingRepository.findByFromUser(user.id));
  }, [user?.id]);

  if (!user) { navigate('/login'); return null; }

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

  const handleEditRating = () => {
    if (!editingRating) return;
    try {
      editRating(editingRating.id, user.id, editScore, editComment);
      showToast('Calificación actualizada', 'success');
      setEditingRating(null);
      setGivenRatings(RatingRepository.findByFromUser(user.id));
    } catch (e: any) {
      showToast(e.message || 'Error al editar', 'error');
    }
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

      {givenRatings.length > 0 && (
        <div className="profile-section" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>
            Calificaciones que has dado
          </h3>
          {givenRatings.map((r) => {
            const toUser = UserRepository.findById(r.toUserId);
            return (
              <div key={r.id} style={{ borderBottom: '1px solid var(--gray-100)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                {editingRating?.id === r.id ? (
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Editando calificación a {toUser?.name ?? 'usuario'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => setEditScore(s)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: s <= editScore ? 1 : 0.3 }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      style={{ marginBottom: '0.5rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary btn-sm" onClick={handleEditRating}>Guardar</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setEditingRating(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        Para: {toUser?.name ?? 'usuario eliminado'}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--yellow-dark, #92400e)' }}>
                        {'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}
                      </p>
                      {r.comment && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>{r.comment}</p>
                      )}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => { setEditingRating(r); setEditScore(r.score); setEditComment(r.comment); }}
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
