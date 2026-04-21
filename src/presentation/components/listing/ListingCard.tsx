import { Link } from 'react-router-dom';
import type { Listing } from '../../../domain/entities/Listing';

interface Props {
  listing: Listing;
}

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function ListingCard({ listing }: Props) {
  const services = Object.entries({
    internet: 'WiFi',
    water: 'Agua',
    electricity: 'Luz',
    gas: 'Gas',
  })
    .filter(([key]) => listing.services[key as keyof typeof listing.services])
    .map(([, label]) => label);

  return (
    <Link to={`/listing/${listing.id}`} className="card card-link">
      <div className="listing-thumb">
        {listing.images[0] ? (
          <img src={listing.images[0]} alt={listing.title} />
        ) : (
          <div className={`listing-thumb-placeholder listing-thumb-${listing.type === 'habitación' ? 'room' : 'apt'}`}>
            <span>{listing.type === 'habitación' ? '🛏' : '🏢'}</span>
          </div>
        )}
        <span className={`listing-type-badge badge-${listing.type === 'habitación' ? 'red' : 'dark'}`}>
          {listing.type}
        </span>
      </div>
      <div className="card-body">
        <div className="listing-price">{COP.format(listing.price)}<span className="listing-price-unit">/mes</span></div>
        <h3 className="listing-title">{listing.title}</h3>
        <p className="listing-location">📍 {listing.city}{listing.zone ? ` · ${listing.zone}` : ''}</p>
        <div className="listing-meta">
          <span>🛏 {listing.rooms} hab.</span>
          <span>🚿 {listing.bathrooms} baño{listing.bathrooms !== 1 ? 's' : ''}</span>
        </div>
        {services.length > 0 && (
          <div className="chips">
            {services.map((s) => <span key={s} className="chip">{s}</span>)}
          </div>
        )}
      </div>
    </Link>
  );
}
