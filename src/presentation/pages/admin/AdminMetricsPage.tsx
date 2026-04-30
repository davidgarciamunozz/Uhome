import { useEffect, useState } from 'react';
import { getDashboardMetrics, type DashboardMetrics } from '../../../application/admin/GetDashboardMetricsUseCase';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { ReportRepository } from '../../../infrastructure/repositories/ReportRepository';
import AdminLayout from './AdminLayout';

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [monthlyUsers, setMonthlyUsers] = useState<{ month: string; count: number }[]>([]);
  const [reportsByReason, setReportsByReason] = useState<{ reason: string; count: number }[]>([]);

  useEffect(() => {
    setMetrics(getDashboardMetrics());

    const users = UserRepository.findAll().filter((u) => u.role !== 'admin');
    const monthMap: Record<string, number> = {};
    users.forEach((u) => {
      const month = u.createdAt.slice(0, 7);
      monthMap[month] = (monthMap[month] || 0) + 1;
    });
    setMonthlyUsers(
      Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, count]) => ({ month, count }))
    );

    const reports = ReportRepository.findAll();
    const reasonMap: Record<string, number> = { spam: 0, false_info: 0, inappropriate: 0 };
    reports.forEach((r) => { reasonMap[r.reason] = (reasonMap[r.reason] || 0) + 1; });
    setReportsByReason([
      { reason: 'Spam', count: reasonMap.spam },
      { reason: 'Info falsa', count: reasonMap.false_info },
      { reason: 'Inapropiado', count: reasonMap.inappropriate },
    ]);
  }, []);

  if (!metrics) return null;

  const maxMonthly = Math.max(...monthlyUsers.map((m) => m.count), 1);

  const metricCards = [
    { label: 'Total usuarios', value: metrics.totalUsers, color: 'var(--black)' },
    { label: 'Estudiantes', value: metrics.totalStudents, color: 'var(--black)' },
    { label: 'Propietarios', value: metrics.totalOwners, color: 'var(--black)' },
    { label: 'Bloqueados', value: metrics.blockedUsers, color: 'var(--red)' },
    { label: 'Publicaciones', value: metrics.totalListings, color: 'var(--black)' },
    { label: 'Publicadas', value: metrics.publishedListings, color: 'var(--green)' },
    { label: 'Destacadas', value: metrics.featuredListings, color: '#B45309' },
    { label: 'Ocultas', value: metrics.hiddenListings, color: 'var(--gray-600)' },
    { label: 'Total reportes', value: metrics.totalReports, color: 'var(--black)' },
    { label: 'Pendientes', value: metrics.pendingReports, color: 'var(--red)' },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Métricas del sistema</h1>
        <p className="page-subtitle" style={{ marginBottom: '2rem' }}>Estadísticas generales de la plataforma</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '2.5rem' }}>
          {metricCards.map((m) => (
            <div key={m.label} style={{ padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.125rem' }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div className="form-row" style={{ gap: '2rem', alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Nuevos usuarios por mes</h2>
            {monthlyUsers.length === 0 ? (
              <p className="text-gray text-sm">Sin datos disponibles</p>
            ) : (
              <div className="revenue-chart">
                {monthlyUsers.map((m) => (
                  <div key={m.month} className="revenue-bar-wrap">
                    <div className="revenue-bar-value">{m.count}</div>
                    <div className="revenue-bar" style={{ height: `${Math.round((m.count / maxMonthly) * 120) + 4}px` }} />
                    <div className="revenue-bar-label">{m.month.slice(5)}/{m.month.slice(2, 4)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Reportes por motivo</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {reportsByReason.map((r) => (
                <div key={r.reason} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '90px', fontSize: '0.8rem', color: 'var(--gray-600)' }}>{r.reason}</div>
                  <div style={{ flex: 1, height: '12px', background: 'var(--gray-100)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ width: `${metrics.totalReports > 0 ? Math.round((r.count / metrics.totalReports) * 100) : 0}%`, height: '100%', background: 'var(--red)', borderRadius: '100px' }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, width: '24px', textAlign: 'right' }}>{r.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
