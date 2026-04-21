export type PropertyType = 'habitación' | 'apartamento';
export type ListingStatus = 'published' | 'draft';

export interface ListingServices {
  internet: boolean;
  water: boolean;
  electricity: boolean;
  gas: boolean;
}

export interface Listing {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  price: number;
  city: string;
  zone: string;
  address: string;
  type: PropertyType;
  rooms: number;
  bathrooms: number;
  description: string;
  services: ListingServices;
  images: string[];
  status: ListingStatus;
  createdAt: string;
}

export function createListing(data: Omit<Listing, 'id' | 'createdAt'>): Listing {
  return {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}
