import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import { isOwner, isAdmin } from '../../../domain/entities/User';

export default function Nav() {
  const { user, logout } = useSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">Uhome</Link>
        <nav className="nav-links">
          {!user ? (
            <>
              <Link to="/search">Buscar vivienda</Link>
              <Link to="/roomies">Buscar roomie</Link>
              <Link to="/login" className="btn btn-outline btn-sm">Ingresar</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Registrarse</Link>
            </>
          ) : isAdmin(user) ? (
            <>
              <Link to="/admin">Panel de administración</Link>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Salir</button>
            </>
          ) : isOwner(user) ? (
            <>
              <Link to="/dashboard">Mis publicaciones</Link>
              <Link to="/publish">Publicar</Link>
              <Link to="/messages">Mensajes</Link>
              <Link to="/profile">Perfil</Link>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Salir</button>
            </>
          ) : (
            <>
              <Link to="/search">Buscar vivienda</Link>
              <Link to="/roomies">Roomies</Link>
              <Link to="/messages">Mensajes</Link>
              <Link to="/profile">Perfil</Link>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Salir</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
