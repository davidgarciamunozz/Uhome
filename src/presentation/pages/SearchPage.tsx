import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchListings, type SearchFilters } from '../../application/listings/SearchListingsUseCase';
import type { Listing } from '../../domain/entities/Listing';
import ListingCard from '../components/listing/ListingCard';
import ListingFilters from '../components/listing/ListingFilters';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
  });
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setListings(searchListings(filters));
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = { ...filters, query: inputValue };
    setFilters(next);
    setSearchParams(inputValue ? { q: inputValue } : {});
  };

  const handleFilterChange = (next: SearchFilters) => {
    setFilters({ ...next, query: filters.query });
  };

  const handleReset = () => {
    setFilters({ query: filters.query });
  };

  return (
    <div className="container">
      {/* Search bar */}
      <div className="page-header">
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por ciudad, zona o nombre..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Buscar</button>
        </form>
        <p className="results-count">
          {listings.length} resultado{listings.length !== 1 ? 's' : ''}
          {filters.query ? ` para "${filters.query}"` : ''}
        </p>
      </div>

      <div className="search-layout">
        <ListingFilters filters={filters} onChange={handleFilterChange} onReset={handleReset} />

        <div>
          {listings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏠</div>
              <h3>No encontramos resultados</h3>
              <p>Intenta con otra búsqueda o ajusta los filtros</p>
            </div>
          ) : (
            <div className="grid grid-3">
              {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
