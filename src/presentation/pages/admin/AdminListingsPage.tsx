import { useState, useEffect, useCallback } from 'react';
import { ListingRepository } from '../../../infrastructure/repositories/ListingRepository';
import type { Listing } from '../../../domain/entities/Listing';
import { useToast } from '../../context/ToastContext';
import AdminLayout from './AdminLayout';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState<'all' | 'hidden' | 'featured'>('all');
  const showToast = useToast();

  const load = useCallback(() => {
    const all = ListingRepository.findAll().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (filter === 'hidden') setListings(all.filter((l) => l.hidden));
    else if (filter === 'featured') setListings(all.filter((l) => l.featured));
    else setListings(all);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleToggleHidden = (l: Listing) => {
    const action = l.hidden ? 'mostrar' : 'ocultar';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} "${l.title}"?`)) return;
    ListingRepository.save({ ...l, hidden: !l.hidden });
    showToast(`Publicación ${l.hidden ? 'visible' : 'ocultada'}`, 'success');
    load();
  };

  const handleDelete = (l: Listing) => {
    if (!confirm(`¿Eliminar permanentemente "${l.title}"? Esta acción no se puede deshacer.`)) return;
    ListingRepository.delete(l.id);
    showToast('Publicación eliminada', 'success');
    load();
  };

  const handleToggleFeatured = (l: Listing) => {
    if (!confirm(`¿${l.featured ? 'Quitar destaque de' : 'Destacar'} "${l.title}"?`)) return;
    ListingRepository.save({ ...l, featured: !l.featured, featuredUntil: !l.featured ? new Date(Date.now() + 30 * 86400000).toISOString() : undefined });
    showToast(l.featured ? 'Destaque removido' : 'Publicación destacada', 'success');
    load();
  };

  return (
    <AdminLayout>
      <div>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 0, marginBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title">Publicaciones</h1>
            <p className="page-subtitle">{listings.length} publicación{listings.length !== 1 ? 'es' : ''}</p>
          </div>
          <div className="tab-group" style={{ width: 'auto', marginBottom: 0 }}>
            {(['all', 'featured', 'hidden'] as const).map((f) => (
              <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Todas' : f === 'featured' ? 'Destacadas' : 'Ocultas'}
              </button>
            ))}
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h3>Sin publicaciones</h3>
            <p>No hay publicaciones en esta categoría.</p>
          </div>
        ) : (
          <div className="listing-table">
            {listings.map((l) => (
              <div key={l.id} className="listing-row">
                <div className="listing-row-thumb">
                  <div className="listing-row-placeholder">{l.type === 'habitación' ? '🛏' : '🏢'}</div>
                </div>
                <div className="listing-row-info">
                  <div className="listing-row-title">{l.title}</div>
                  <div className="listing-row-meta">
                    {l.city} · {l.zone} · {COP.format(l.price)}/mes · {l.ownerName}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  <span className={`status-badge ${l.status === 'published' ? 'status-published' : 'status-draft'}`}>
                    {l.status === 'published' ? 'Publicado' : 'Borrador'}
                  </span>
                  {l.hidden && <span className="status-badge status-hidden">Oculto</span>}
                  {l.featured && <span className="status-badge status-featured">⭐ Destacado</span>}
                </div>
                <div className="listing-row-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => handleToggleHidden(l)}>
                    {l.hidden ? 'Mostrar' : 'Ocultar'}
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleToggleFeatured(l)}>
                    {l.featured ? 'Quitar destaque' : 'Destacar'}
                  </button>
                  <button className="btn btn-ghost btn-sm text-red" onClick={() => handleDelete(l)}>
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
