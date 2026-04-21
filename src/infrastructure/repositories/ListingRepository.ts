import type { Listing } from '../../domain/entities/Listing';

const KEY = 'uhome_listings';

function getAll(): Listing[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(listings: Listing[]): void {
  localStorage.setItem(KEY, JSON.stringify(listings));
}

export const ListingRepository = {
  findAll: (): Listing[] => getAll(),

  findById: (id: string): Listing | null =>
    getAll().find((l) => l.id === id) ?? null,

  findByOwner: (ownerId: string): Listing[] =>
    getAll().filter((l) => l.ownerId === ownerId),

  findPublished: (): Listing[] =>
    getAll().filter((l) => l.status === 'published'),

  save: (listing: Listing): Listing => {
    const listings = getAll();
    const idx = listings.findIndex((l) => l.id === listing.id);
    if (idx >= 0) listings[idx] = listing;
    else listings.push(listing);
    saveAll(listings);
    return listing;
  },

  delete: (id: string): void => {
    saveAll(getAll().filter((l) => l.id !== id));
  },

  seed: (listings: Listing[]): void => {
    saveAll(listings);
  },
};
