import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRoomieProfiles, type RoomieFilters } from '../../application/roomies/GetRoomieProfilesUseCase';
import type { RoomieProfile } from '../../domain/entities/RoomieProfile';
import { useSession } from '../context/SessionContext';
import { isStudent } from '../../domain/entities/User';
import { calculateCompatibility } from '../../domain/services/CompatibilityService';
import RoomieCard from '../components/roomie/RoomieCard';

export default function RoomiesPage() {
  const { user } = useSession();
  const [profiles, setProfiles] = useState<RoomieProfile[]>([]);
  const [filters, setFilters] = useState<RoomieFilters>({});
  const [uniQuery, setUniQuery] = useState('');

  useEffect(() => {
    setProfiles(getRoomieProfiles(filters));
  }, [filters]);

  const studentUser = user && isStudent(user) ? user : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, university: uniQuery || undefined });
  };

  const visibleProfiles = studentUser
    ? profiles.filter((p) => p.userId !== studentUser.id)
    : profiles;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Buscar roomie</h1>
          <p className="page-subtitle">Encuentra compañeros de vivienda compatibles</p>
        </div>
        {user && isStudent(user) && (
          <Link to="/roomie-profile/edit" className="btn btn-primary">Mi perfil de roomie</Link>
        )}
      </div>

      <div className="search-layout">
        {/* Filters */}
        <aside className="filter-sidebar">
          <div className="filter-header">
            <span className="filter-title">Filtros</span>
            <button className="btn-link" onClick={() => { setFilters({}); setUniQuery(''); }}>Limpiar</button>
          </div>

          <form onSubmit={handleSearch}>
            <div className="filter-section">
              <label className="form-label">Universidad</label>
              <input className="form-input" placeholder="Buscar universidad..."
                value={uniQuery} onChange={(e) => setUniQuery(e.target.value)} />
              <button type="submit" className="btn btn-outline btn-sm" style={{ marginTop: '0.5rem', width: '100%' }}>
                Buscar
              </button>
            </div>
          </form>

          <div className="filter-section">
            <label className="form-label">Estilo de vida</label>
            <select className="form-select" value={filters.schedule || ''}
              onChange={(e) => setFilters({ ...filters, schedule: e.target.value || undefined })}>
              <option value="">Todos</option>
              <option value="tranquilo">Tranquilo</option>
              <option value="social">Social</option>
            </select>
          </div>

          <div className="filter-section">
            <label className="form-label">Presupuesto máximo (COP)</label>
            <input type="number" className="form-input" placeholder="Sin límite"
              value={filters.maxBudget || ''}
              onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value || undefined })} />
          </div>
        </aside>

        {/* Results */}
        <div>
          <p className="results-count" style={{ marginBottom: '1rem' }}>
            {visibleProfiles.length} perfil{visibleProfiles.length !== 1 ? 'es' : ''}
            {studentUser && ' · ordenado por compatibilidad'}
          </p>

          {visibleProfiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No hay perfiles disponibles</h3>
              <p>Sé el primero en crear un perfil de roomie.</p>
              {user && isStudent(user) && (
                <Link to="/roomie-profile/edit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Crear mi perfil
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-3">
              {(studentUser
                ? [...visibleProfiles].sort((a, b) =>
                    calculateCompatibility(studentUser, b) - calculateCompatibility(studentUser, a)
                  )
                : visibleProfiles
              ).map((p) => (
                <RoomieCard
                  key={p.id}
                  profile={p}
                  compatibilityScore={studentUser ? calculateCompatibility(studentUser, p) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
