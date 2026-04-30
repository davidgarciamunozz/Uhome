import type { Listing } from '../../domain/entities/Listing';
import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';

export interface SearchFilters {
  query?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  services?: string[];
}

export function searchListings(filters: SearchFilters = {}): Listing[] {
  let listings = ListingRepository.findPublished();

  if (filters.query?.trim()) {
    const q = filters.query.toLowerCase();
    listings = listings.filter(
      (l) =>
        l.city.toLowerCase().includes(q) ||
        l.zone.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q),
    );
  }

  if (filters.type) {
    listings = listings.filter((l) => l.type === filters.type);
  }

  if (filters.minPrice) {
    listings = listings.filter((l) => l.price >= Number(filters.minPrice));
  }

  if (filters.maxPrice) {
    listings = listings.filter((l) => l.price <= Number(filters.maxPrice));
  }

  if (filters.services && filters.services.length > 0) {
    listings = listings.filter((l) =>
      filters.services!.every((s) => l.services[s as keyof typeof l.services]),
    );
  }

  return listings.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
