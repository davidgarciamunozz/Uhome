import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardMetrics, type DashboardMetrics } from '../../../application/admin/GetDashboardMetricsUseCase';
import AdminLayout from './AdminLayout';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    setMetrics(getDashboardMetrics());
  }, []);

  if (!metrics) return null;

  const stats = [
    { icon: '👥', label: 'Usuarios totales', value: metrics.totalUsers, sub: `${metrics.totalStudents} estudiantes · ${metrics.totalOwners} propietarios` },
    { icon: '🏠', label: 'Publicaciones activas', value: metrics.publishedListings, sub: `${metrics.featuredListings} destacadas · ${metrics.hiddenListings} ocultas` },
    { icon: '🚩', label: 'Reportes pendientes', value: metrics.pendingReports, sub: `${metrics.totalReports} reportes en total` },
    { icon: '🔒', label: 'Usuarios bloqueados', value: metrics.blockedUsers, sub: 'Cuentas restringidas' },
  ];

  const actions = [
    { to: '/admin/reports', label: 'Ver reportes', desc: 'Gestionar contenido reportado', icon: '🚩' },
    { to: '/admin/listings', label: 'Moderar publicaciones', desc: 'Ocultar o eliminar anuncios', icon: '🏠' },
    { to: '/admin/users', label: 'Gestionar usuarios', desc: 'Bloquear, editar o eliminar cuentas', icon: '👥' },
    { to: '/admin/metrics', label: 'Ver métricas', desc: 'Estadísticas detalladas del sistema', icon: '📈' },
    { to: '/admin/revenue', label: 'Ver ingresos', desc: 'Resumen financiero de la plataforma', icon: '💰' },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Panel de Administración</h1>
        <p className="page-subtitle" style={{ marginBottom: '2rem' }}>Bienvenido al centro de control de Uhome</p>

        <div className="admin-stats">
          {stats.map((s) => (
            <div key={s.label} className="admin-stat">
              <div className="admin-stat-icon">{s.icon}</div>
              <div className="admin-stat-value">{s.value}</div>
              <div className="admin-stat-label">{s.label}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Acciones rápidas</h2>
        <div className="grid grid-3" style={{ gap: '1rem' }}>
          {actions.map((a) => (
            <Link key={a.to} to={a.to} className="card card-link" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{a.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.9rem' }}>{a.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
