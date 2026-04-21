import type { SearchFilters } from '../../../application/listings/SearchListingsUseCase';

interface Props {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onReset: () => void;
}

const SERVICES = [
  { key: 'internet', label: 'WiFi' },
  { key: 'water', label: 'Agua' },
  { key: 'electricity', label: 'Luz' },
  { key: 'gas', label: 'Gas' },
];

export default function ListingFilters({ filters, onChange, onReset }: Props) {
  const toggleService = (key: string) => {
    const current = filters.services || [];
    const next = current.includes(key) ? current.filter((s) => s !== key) : [...current, key];
    onChange({ ...filters, services: next });
  };

  return (
    <aside className="filter-sidebar">
      <div className="filter-header">
        <span className="filter-title">Filtros</span>
        <button className="btn-link" onClick={onReset}>Limpiar</button>
      </div>

      <div className="filter-section">
        <label className="form-label">Tipo de vivienda</label>
        <select
          className="form-select"
          value={filters.type || ''}
          onChange={(e) => onChange({ ...filters, type: e.target.value || undefined })}
        >
          <option value="">Todos</option>
          <option value="habitación">Habitación</option>
          <option value="apartamento">Apartamento</option>
        </select>
      </div>

      <div className="filter-section">
        <label className="form-label">Precio mínimo (COP)</label>
        <input
          type="number"
          className="form-input"
          placeholder="0"
          value={filters.minPrice || ''}
          onChange={(e) => onChange({ ...filters, minPrice: e.target.value || undefined })}
        />
      </div>

      <div className="filter-section">
        <label className="form-label">Precio máximo (COP)</label>
        <input
          type="number"
          className="form-input"
          placeholder="Sin límite"
          value={filters.maxPrice || ''}
          onChange={(e) => onChange({ ...filters, maxPrice: e.target.value || undefined })}
        />
      </div>

      <div className="filter-section">
        <label className="form-label">Servicios incluidos</label>
        <div className="checkbox-group">
          {SERVICES.map(({ key, label }) => (
            <label key={key} className="checkbox-label">
              <input
                type="checkbox"
                checked={(filters.services || []).includes(key)}
                onChange={() => toggleService(key)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
