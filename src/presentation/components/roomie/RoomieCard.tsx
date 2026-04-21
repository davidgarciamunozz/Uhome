import { Link } from 'react-router-dom';
import type { RoomieProfile } from '../../../domain/entities/RoomieProfile';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

interface Props {
  profile: RoomieProfile;
  compatibilityScore?: number;
}

export default function RoomieCard({ profile, compatibilityScore }: Props) {
  return (
    <Link to={`/roomie/${profile.id}`} className="card card-link">
      <div className="card-body">
        <div className="roomie-card-header">
          <div className="avatar avatar-md">
            {profile.avatar
              ? <img src={profile.avatar} alt={profile.name} />
              : <span>{profile.name.charAt(0).toUpperCase()}</span>
            }
          </div>
          <div>
            <div className="roomie-name">{profile.name}</div>
            <div className="roomie-meta">{profile.age} años · {profile.university}</div>
            {profile.career && <div className="roomie-career">{profile.career}</div>}
          </div>
          {compatibilityScore !== undefined && (
            <span
              className="compat-badge"
              style={{
                background: compatibilityScore >= 80 ? '#F0FFF4' : compatibilityScore >= 50 ? '#FFFBEB' : '#FFF0F0',
                color: compatibilityScore >= 80 ? '#16A34A' : compatibilityScore >= 50 ? '#D97706' : '#DC2626',
              }}
            >
              {compatibilityScore}%
            </span>
          )}
        </div>
        <p className="roomie-desc">{profile.description || 'Sin descripción'}</p>
        <div className="chips">
          <span className="chip">{profile.preferences.schedule === 'tranquilo' ? '🌙 Tranquilo' : '🎉 Social'}</span>
          <span className="chip">{profile.preferences.smoker ? '🚬 Fumador' : '🚭 No fumador'}</span>
          <span className="chip">
            {profile.preferences.pets === 'sí' ? '🐾 Mascotas' : profile.preferences.pets === 'indiferente' ? '🐾 Indiferente' : 'Sin mascotas'}
          </span>
        </div>
        <div className="roomie-budget">{COP.format(profile.budget)}/mes</div>
      </div>
    </Link>
  );
}
