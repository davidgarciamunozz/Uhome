import { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import { isAdmin } from '../../../domain/entities/User';

const NAV_ITEMS = [
  { path: '/admin', label: 'Resumen', icon: '📊', exact: true },
  { path: '/admin/reports', label: 'Reportes', icon: '🚩' },
  { path: '/admin/listings', label: 'Publicaciones', icon: '🏠' },
  { path: '/admin/users', label: 'Usuarios', icon: '👥' },
  { path: '/admin/metrics', label: 'Métricas', icon: '📈' },
  { path: '/admin/revenue', label: 'Ingresos', icon: '💰' },
];

interface Props { children: ReactNode }

export default function AdminLayout({ children }: Props) {
  const { user } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user || !isAdmin(user)) {
    navigate('/login');
    return null;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <p className="admin-sidebar-title">Administración</p>
        {NAV_ITEMS.map(({ path, label, icon, exact }) => {
          const isExactMatch = location.pathname === path;
          const isSubMatch = !exact && location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              className={`admin-nav-link ${isExactMatch || isSubMatch ? 'active' : ''}`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
