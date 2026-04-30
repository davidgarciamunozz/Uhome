import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { searchListings } from '../../application/listings/SearchListingsUseCase';
import ListingCard from '../components/listing/ListingCard';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const featured = searchListings({}).slice(0, 3);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Encuentra tu hogar<br /><span className="text-red">universitario</span></h1>
          <p>La plataforma de vivienda pensada para estudiantes. Busca habitaciones y apartamentos cerca de tu universidad.</p>
          <form className="hero-search" onSubmit={handleSearch}>
            <input
              type="text"
              className="hero-search-input"
              placeholder="Zona, barrio o universidad..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-lg">Buscar</button>
          </form>
          <div className="hero-tags">
            {['Granada', 'San Fernando', 'Ciudad Jardín', 'El Peñón', 'Versalles'].map((zone) => (
              <button
                key={zone}
                className="hero-tag"
                onClick={() => navigate(`/search?q=${zone}`)}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            {[
              { label: 'Viviendas disponibles', value: '500+' },
              { label: 'Estudiantes registrados', value: '2,000+' },
              { label: 'Universidades', value: '50+' },
              { label: 'Zonas en Cali', value: '20+' },
            ].map((s) => (
              <div key={s.label} className="stat-item">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Viviendas destacadas</h2>
              <p className="section-subtitle">Las publicaciones más recientes</p>
            </div>
            <Link to="/search" className="btn btn-outline">Ver todas</Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-3">
              {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          ) : (
            <p className="empty-state">No hay publicaciones aún.</p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="section section-gray">
        <div className="container">
          <h2 className="section-title text-center">¿Cómo funciona?</h2>
          <p className="section-subtitle text-center">Simple, rápido y seguro</p>
          <div className="grid grid-3" style={{ marginTop: '2rem' }}>
            {[
              { step: '01', title: 'Regístrate', desc: 'Crea tu cuenta como estudiante o propietario en menos de 2 minutos.' },
              { step: '02', title: 'Busca o publica', desc: 'Encuentra la vivienda perfecta o publica tu propiedad para estudiantes.' },
              { step: '03', title: 'Conéctate', desc: 'Contáctate directamente con propietarios o potenciales roomies.' },
            ].map((item) => (
              <div key={item.step} className="how-card">
                <div className="how-step">{item.step}</div>
                <h3 className="how-title">{item.title}</h3>
                <p className="how-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roomie CTA */}
      <section className="section">
        <div className="container">
          <div className="cta-card">
            <div>
              <h2 className="cta-title">¿Buscas roomie?</h2>
              <p className="cta-desc">Encuentra compañeros de vivienda compatibles con tu estilo de vida.</p>
            </div>
            <Link to="/roomies" className="btn btn-primary btn-lg">Explorar roomies</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
