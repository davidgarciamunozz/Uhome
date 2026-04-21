import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrUpdateRoomieProfile } from '../../application/roomies/CreateRoomieProfileUseCase';
import { RoomieRepository } from '../../infrastructure/repositories/RoomieRepository';
import { ValidationError } from '../../domain/services/Validators';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { isStudent } from '../../domain/entities/User';

const UNIVERSITIES = [
  'Universidad Nacional de Colombia',
  'Pontificia Universidad Javeriana',
  'Universidad de los Andes',
  'Universidad de Antioquia',
  'Universidad EAFIT',
  'Universidad del Valle',
  'Universidad del Rosario',
  'Universidad Externado de Colombia',
  'Universidad de la Sabana',
  'Universidad Distrital',
  'Otra',
];

export default function RoomieProfileEditPage() {
  const { user } = useSession();
  const showToast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', age: '', university: '', career: '',
    smoker: 'false', pets: 'no', schedule: 'tranquilo', order: 'medio',
    budget: '', stayDuration: '', description: '', avatar: '',
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!isStudent(user)) { navigate('/'); return; }
    const existing = RoomieRepository.findByUser(user.id);
    if (existing) {
      setForm({
        name: existing.name,
        age: String(existing.age),
        university: existing.university,
        career: existing.career || '',
        smoker: existing.preferences.smoker ? 'true' : 'false',
        pets: existing.preferences.pets,
        schedule: existing.preferences.schedule,
        order: existing.preferences.order,
        budget: String(existing.budget || ''),
        stayDuration: String(existing.stayDuration || ''),
        description: existing.description,
        avatar: existing.avatar || '',
      });
    } else {
      setForm((f) => ({ ...f, name: user.name, university: (user as any).university || '' }));
    }
  }, [user, navigate]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setForm((f) => ({ ...f, avatar: ev.target!.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrors({});
    setLoading(true);
    try {
      createOrUpdateRoomieProfile(form, user.id);
      showToast('Perfil de roomie guardado', 'success');
      navigate('/roomies');
    } catch (err) {
      if (err instanceof ValidationError) {
        setErrors({ [err.field]: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 600, padding: '2rem' }}>
      <div className="page-header">
        <h1 className="page-title">Perfil de roomie</h1>
        <p className="page-subtitle">Tu perfil de convivencia visible para otros estudiantes</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="avatar avatar-xl" style={{ margin: '0 auto 0.75rem', cursor: 'pointer' }}
            onClick={() => fileRef.current?.click()}>
            {form.avatar
              ? <img src={form.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : <span>{form.name.charAt(0)?.toUpperCase() || '?'}</span>
            }
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
            Cambiar foto
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input className={`form-input ${errors.name ? 'form-input-error' : ''}`}
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Edad *</label>
            <input type="number" className={`form-input ${errors.age ? 'form-input-error' : ''}`}
              value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
              min="15" max="60" />
            {errors.age && <p className="form-error">{errors.age}</p>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Universidad *</label>
            <select className={`form-select ${errors.university ? 'form-input-error' : ''}`}
              value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })}>
              <option value="">Selecciona</option>
              {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            {errors.university && <p className="form-error">{errors.university}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Carrera</label>
            <input className="form-input" value={form.career}
              onChange={(e) => setForm({ ...form, career: e.target.value })} placeholder="Opcional" />
          </div>
        </div>

        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '1.25rem 0 0.75rem' }}>Preferencias de convivencia</h3>

        <div className="prefs-grid">
          <div className="form-group">
            <label className="form-label">Fumador</label>
            <select className="form-select" value={form.smoker}
              onChange={(e) => setForm({ ...form, smoker: e.target.value })}>
              <option value="false">No fumo</option>
              <option value="true">Fumo</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Mascotas</label>
            <select className="form-select" value={form.pets}
              onChange={(e) => setForm({ ...form, pets: e.target.value })}>
              <option value="no">Sin mascotas</option>
              <option value="sí">Tengo mascota</option>
              <option value="indiferente">Indiferente</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Horarios</label>
            <select className="form-select" value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}>
              <option value="tranquilo">Tranquilo</option>
              <option value="social">Social</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nivel de orden</label>
            <select className="form-select" value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}>
              <option value="alto">Alto</option>
              <option value="medio">Medio</option>
              <option value="bajo">Bajo</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Presupuesto mensual (COP)</label>
            <input type="number" className="form-input" value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="500000" />
          </div>
          <div className="form-group">
            <label className="form-label">Meses de estadía</label>
            <input type="number" className="form-input" value={form.stayDuration}
              onChange={(e) => setForm({ ...form, stayDuration: e.target.value })} placeholder="6" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Descripción personal</label>
          <textarea className="form-textarea" rows={4} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Cuéntanos sobre tu estilo de vida, gustos, rutinas..." />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar perfil'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
