import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../application/auth/LoginUseCase';
import { ValidationError } from '../../domain/services/Validators';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { login: setSession } = useSession();
  const showToast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const user = login(email, password);
      setSession(user);
      showToast('¡Bienvenido/a de nuevo!', 'success');
      navigate(user.role === 'owner' ? '/dashboard' : '/search');
    } catch (err) {
      if (err instanceof ValidationError) {
        setErrors({ [err.field]: err.message });
      } else {
        showToast('Error al iniciar sesión', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">Uhome</div>
        <p className="auth-subtitle">Ingresa a tu cuenta</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              type="email"
              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className={`form-input ${errors.password ? 'form-input-error' : ''}`}
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="auth-divider">
          <span>¿No tienes cuenta?</span>
          <Link to="/register">Regístrate</Link>
        </div>

        <div className="demo-hint">
          <p className="text-xs text-gray">Cuentas demo:</p>
          <p className="text-xs text-gray">Estudiante: maria.garcia@universidad.edu / Password1</p>
          <p className="text-xs text-gray">Propietario: lucia.m@gmail.com / Password1</p>
        </div>
      </div>
    </div>
  );
}
