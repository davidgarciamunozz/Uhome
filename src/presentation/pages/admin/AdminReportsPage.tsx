import { useState, useEffect, useCallback } from 'react';
import { ReportRepository } from '../../../infrastructure/repositories/ReportRepository';
import { ListingRepository } from '../../../infrastructure/repositories/ListingRepository';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import type { Report } from '../../../domain/entities/Report';
import { useToast } from '../../context/ToastContext';
import AdminLayout from './AdminLayout';

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  false_info: 'Información falsa',
  inappropriate: 'Contenido inapropiado',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');
  const showToast = useToast();

  const load = useCallback(() => {
    const all = ReportRepository.findAll().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setReports(filter === 'all' ? all : all.filter((r) => r.status === filter));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = (report: Report) => {
    if (!confirm('¿Marcar este reporte como resuelto?')) return;
    ReportRepository.updateStatus(report.id, 'resolved');
    showToast('Reporte marcado como resuelto', 'success');
    load();
  };

  const handleDeleteListing = (report: Report) => {
    if (!confirm('¿Eliminar la publicación reportada? Esta acción no se puede deshacer.')) return;
    ListingRepository.delete(report.targetId);
    ReportRepository.updateStatus(report.id, 'resolved');
    showToast('Publicación eliminada y reporte resuelto', 'success');
    load();
  };

  const handleBlockUser = (report: Report) => {
    const userId = report.targetType === 'user' ? report.targetId : null;
    if (!userId) return;
    if (!confirm('¿Bloquear a este usuario? No podrá iniciar sesión.')) return;
    const user = UserRepository.findById(userId);
    if (user) {
      UserRepository.save({ ...user, blocked: true });
      ReportRepository.updateStatus(report.id, 'resolved');
      showToast('Usuario bloqueado', 'success');
      load();
    }
  };

  const handleDelete = (report: Report) => {
    if (!confirm('¿Eliminar este reporte del sistema?')) return;
    ReportRepository.delete(report.id);
    showToast('Reporte eliminado', 'success');
    load();
  };

  return (
    <AdminLayout>
      <div>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 0, marginBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title">Gestionar Reportes</h1>
            <p className="page-subtitle">{reports.length} reporte{reports.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="tab-group" style={{ width: 'auto', marginBottom: 0 }}>
            {(['pending', 'resolved', 'all'] as const).map((f) => (
              <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'pending' ? 'Pendientes' : f === 'resolved' ? 'Resueltos' : 'Todos'}
              </button>
            ))}
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>Sin reportes {filter === 'pending' ? 'pendientes' : ''}</h3>
            <p>No hay reportes en esta categoría.</p>
          </div>
        ) : (
          <div className="admin-table">
            {reports.map((r) => (
              <div key={r.id} className="admin-table-row" style={{ gridTemplateColumns: '1fr 1fr 120px 140px' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>
                    {r.targetType === 'listing' ? '🏠 Publicación' : '👤 Usuario'}
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--gray-400)', marginLeft: '0.375rem' }}>
                      {r.targetId.slice(0, 8)}…
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{r.description || '—'}</div>
                </div>
                <div>
                  <span className="badge badge-red">{REASON_LABELS[r.reason]}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                    {new Date(r.createdAt).toLocaleDateString('es-CO')}
                  </div>
                </div>
                <div>
                  <span className={`status-badge ${r.status === 'pending' ? 'badge-red' : 'status-published'}`}>
                    {r.status === 'pending' ? 'Pendiente' : 'Resuelto'}
                  </span>
                </div>
                <div className="admin-row-actions" style={{ flexDirection: 'column', gap: '0.375rem' }}>
                  {r.status === 'pending' && (
                    <>
                      <button className="btn btn-outline btn-sm" onClick={() => handleResolve(r)}>
                        Resolver
                      </button>
                      {r.targetType === 'listing' && (
                        <button className="btn btn-ghost btn-sm text-red" onClick={() => handleDeleteListing(r)}>
                          Eliminar pub.
                        </button>
                      )}
                      {r.targetType === 'user' && (
                        <button className="btn btn-ghost btn-sm text-red" onClick={() => handleBlockUser(r)}>
                          Bloquear user
                        </button>
                      )}
                    </>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--gray-400)' }} onClick={() => handleDelete(r)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
