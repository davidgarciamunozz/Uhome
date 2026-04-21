import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';
import type { Listing } from '../../domain/entities/Listing';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

function toggleStatus(id: string, status: Listing['status'], ownerId: string) {
  const l = ListingRepository.findById(id);
  if (!l || l.ownerId !== ownerId) return;
  ListingRepository.save({ ...l, status });
}

function removeListingById(id: string, ownerId: string) {
  const l = ListingRepository.findById(id);
  if (!l || l.ownerId !== ownerId) return;
  ListingRepository.delete(id);
}

export default function DashboardPage() {
  const { user } = useSession();
  const showToast = useToast();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'owner') { navigate('/login'); return; }
    setListings(ListingRepository.findByOwner(user.id));
  }, [user, navigate]);

  const reload = () => {
    if (!user) return;
    setListings(ListingRepository.findByOwner(user.id));
  };

  const handleToggleStatus = (l: Listing) => {
    const next = l.status === 'published' ? 'draft' : 'published';
    toggleStatus(l.id, next, user!.id);
    showToast(next === 'published' ? 'Publicación activada' : 'Publicación pausada', 'success');
    reload();
  };

  const handleDelete = (l: Listing) => {
    if (!confirm(`¿Eliminar "${l.title}"?`)) return;
    removeListingById(l.id, user!.id);
    showToast('Publicación eliminada', 'success');
    reload();
  };

  const published = listings.filter((l) => l.status === 'published');
  const drafts = listings.filter((l) => l.status === 'draft');

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Mis publicaciones</h1>
          <p className="page-subtitle">Gestiona tus propiedades</p>
        </div>
        <Link to="/publish" className="btn btn-primary">+ Nueva publicación</Link>
      </div>

      <div className="dashboard-stats">
        {[
          { label: 'Total', value: listings.length },
          { label: 'Publicadas', value: published.length },
          { label: 'Borradores', value: drafts.length },
        ].map((s) => (
          <div key={s.label} className="dashboard-stat">
            <div className="dashboard-stat-value">{s.value}</div>
            <div className="dashboard-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <h3>No tienes publicaciones</h3>
          <p>Crea tu primera publicación para que los estudiantes puedan encontrarte.</p>
          <Link to="/publish" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Crear primera publicación
          </Link>
        </div>
      ) : (
        <div className="listing-table">
          {listings.map((l) => (
            <div key={l.id} className="listing-row">
              <div className="listing-row-thumb">
                {l.images[0]
                  ? <img src={l.images[0]} alt="" />
                  : <div className="listing-row-placeholder">{l.type === 'habitación' ? '🛏' : '🏢'}</div>
                }
              </div>
              <div className="listing-row-info">
                <div className="listing-row-title">{l.title}</div>
                <div className="listing-row-meta">
                  {l.city}{l.zone ? ` · ${l.zone}` : ''} · {COP.format(l.price)}/mes
                </div>
              </div>
              <div className="listing-row-status">
                <span className={`status-badge ${l.status === 'published' ? 'status-published' : 'status-draft'}`}>
                  {l.status === 'published' ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <div className="listing-row-actions">
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/publish?edit=${l.id}`)}>
                  Editar
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => handleToggleStatus(l)}>
                  {l.status === 'published' ? 'Pausar' : 'Activar'}
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
  );
}
