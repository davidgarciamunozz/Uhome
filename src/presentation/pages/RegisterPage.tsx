import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerStudent } from '../../application/auth/RegisterStudentUseCase';
import { registerOwner } from '../../application/auth/RegisterOwnerUseCase';
import { ValidationError } from '../../domain/services/Validators';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';

type Tab = 'student' | 'owner';

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

export default function RegisterPage() {
  const [tab, setTab] = useState<Tab>('student');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { login } = useSession();
  const showToast = useToast();
  const navigate = useNavigate();

  // Student fields
  const [s, setS] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    university: '', career: '', age: '',
    budgetMin: '300000', budgetMax: '800000',
    smoker: 'false', pets: 'false', schedule: 'tranquilo',
  });

  // Owner fields
  const [o, setO] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', city: 'Cali',
    propertyTypes: [] as string[],
  });

  const togglePropertyType = (type: string) => {
    setO((prev) => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter((t) => t !== type)
        : [...prev.propertyTypes, type],
    }));
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const user = registerStudent(s);
      login(user);
      showToast('¡Cuenta creada exitosamente!', 'success');
      navigate('/search');
    } catch (err) {
      if (err instanceof ValidationError) {
        setErrors({ [err.field]: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const user = registerOwner(o);
      login(user);
      showToast('¡Cuenta creada exitosamente!', 'success');
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ValidationError) {
        setErrors({ [err.field]: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">Uhome</div>
        <p className="auth-subtitle">Crea tu cuenta</p>

        <div className="tab-group">
          <button
            className={`tab-btn ${tab === 'student' ? 'active' : ''}`}
            onClick={() => { setTab('student'); setErrors({}); }}
          >
            Soy Estudiante
          </button>
          <button
            className={`tab-btn ${tab === 'owner' ? 'active' : ''}`}
            onClick={() => { setTab('owner'); setErrors({}); }}
          >
            Soy Propietario
          </button>
        </div>

        {tab === 'student' ? (
          <form onSubmit={handleStudentSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
                <input className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                  value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} placeholder="Tu nombre" />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Edad</label>
                <input type="number" className="form-input" value={s.age}
                  onChange={(e) => setS({ ...s, age: e.target.value })} placeholder="21" min="15" max="60" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Correo electrónico *</label>
              <input type="email" className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                value={s.email} onChange={(e) => setS({ ...s, email: e.target.value })}
                placeholder="correo@universidad.edu" />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contraseña *</label>
                <input type="password" className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                  value={s.password} onChange={(e) => setS({ ...s, password: e.target.value })} placeholder="Min. 8 caracteres" />
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar contraseña *</label>
                <input type="password" className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
                  value={s.confirmPassword} onChange={(e) => setS({ ...s, confirmPassword: e.target.value })}
                  placeholder="Repite tu contraseña" />
                {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Universidad *</label>
                <select className={`form-select ${errors.university ? 'form-input-error' : ''}`}
                  value={s.university} onChange={(e) => setS({ ...s, university: e.target.value })}>
                  <option value="">Selecciona</option>
                  {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                {errors.university && <p className="form-error">{errors.university}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Carrera (opcional)</label>
                <input className="form-input" value={s.career}
                  onChange={(e) => setS({ ...s, career: e.target.value })} placeholder="Tu carrera" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Presupuesto mensual (COP)</label>
              <div className="form-row">
                <input type="number" className="form-input" value={s.budgetMin}
                  onChange={(e) => setS({ ...s, budgetMin: e.target.value })} placeholder="Mínimo" />
                <input type="number" className="form-input" value={s.budgetMax}
                  onChange={(e) => setS({ ...s, budgetMax: e.target.value })} placeholder="Máximo" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Preferencias de convivencia</label>
              <div className="prefs-grid">
                <div className="form-group">
                  <label className="form-label text-sm">Fumador</label>
                  <select className="form-select" value={s.smoker} onChange={(e) => setS({ ...s, smoker: e.target.value })}>
                    <option value="false">No fumo</option>
                    <option value="true">Fumo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label text-sm">Mascotas</label>
                  <select className="form-select" value={s.pets} onChange={(e) => setS({ ...s, pets: e.target.value })}>
                    <option value="false">Sin mascotas</option>
                    <option value="true">Tengo mascota</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label text-sm">Estilo de vida</label>
                  <select className="form-select" value={s.schedule} onChange={(e) => setS({ ...s, schedule: e.target.value })}>
                    <option value="tranquilo">Tranquilo</option>
                    <option value="social">Social</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOwnerSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
                <input className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                  value={o.name} onChange={(e) => setO({ ...o, name: e.target.value })} placeholder="Tu nombre" />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Ciudad *</label>
                <input
                  className="form-input"
                  value="Cali"
                  readOnly
                  style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Correo electrónico *</label>
              <input type="email" className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                value={o.email} onChange={(e) => setO({ ...o, email: e.target.value })} placeholder="correo@ejemplo.com" />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contraseña *</label>
                <input type="password" className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                  value={o.password} onChange={(e) => setO({ ...o, password: e.target.value })} placeholder="Min. 8 caracteres" />
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar contraseña *</label>
                <input type="password" className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
                  value={o.confirmPassword} onChange={(e) => setO({ ...o, confirmPassword: e.target.value })}
                  placeholder="Repite tu contraseña" />
                {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Número de WhatsApp *</label>
              <input className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                value={o.phone} onChange={(e) => setO({ ...o, phone: e.target.value })}
                placeholder="3101234567" />
              {errors.phone && <p className="form-error">{errors.phone}</p>}
              <p className="form-hint">Solo números. Se recomienda WhatsApp para contacto.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de propiedad</label>
              <div className="checkbox-group">
                {['habitación', 'apartamento'].map((type) => (
                  <label key={type} className="checkbox-label">
                    <input type="checkbox"
                      checked={o.propertyTypes.includes(type)}
                      onChange={() => togglePropertyType(type)} />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}

        <div className="auth-divider">
          <span>¿Ya tienes cuenta?</span>
          <Link to="/login">Ingresar</Link>
        </div>
      </div>
    </div>
  );
}
