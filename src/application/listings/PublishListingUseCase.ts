import { createListing, type Listing, type ListingStatus } from '../../domain/entities/Listing';
import { validateRequired, validatePositiveNumber } from '../../domain/services/Validators';
import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

export interface PublishListingInput {
  id?: string;
  title: string;
  price: string;
  city: string;
  zone?: string;
  address?: string;
  type: string;
  rooms?: string;
  bathrooms?: string;
  description?: string;
  services?: {
    internet?: boolean;
    water?: boolean;
    electricity?: boolean;
    gas?: boolean;
  };
  images?: string[];
  status?: ListingStatus;
}

export function publishListing(input: PublishListingInput, ownerId: string): Listing {
  validateRequired(input.title, 'title', 'El título');
  validateRequired(input.city, 'city', 'La ciudad');
  validateRequired(input.type, 'type', 'El tipo de vivienda');
  validatePositiveNumber(input.price, 'price', 'El precio');

  const owner = UserRepository.findById(ownerId);

  if (input.id) {
    const existing = ListingRepository.findById(input.id);
    if (existing && existing.ownerId === ownerId) {
      const updated: Listing = {
        ...existing,
        title: input.title,
        price: Number(input.price),
        city: input.city,
        zone: input.zone || '',
        address: input.address || '',
        type: input.type as Listing['type'],
        rooms: Number(input.rooms) || 1,
        bathrooms: Number(input.bathrooms) || 1,
        description: input.description || '',
        services: {
          internet: !!input.services?.internet,
          water: !!input.services?.water,
          electricity: !!input.services?.electricity,
          gas: !!input.services?.gas,
        },
        images: input.images || [],
        status: input.status || 'published',
      };
      return ListingRepository.save(updated);
    }
  }

  const listing = createListing({
    ownerId,
    ownerName: owner?.name || '',
    title: input.title,
    price: Number(input.price),
    city: input.city,
    zone: input.zone || '',
    address: input.address || '',
    type: input.type as Listing['type'],
    rooms: Number(input.rooms) || 1,
    bathrooms: Number(input.bathrooms) || 1,
    description: input.description || '',
    services: {
      internet: !!input.services?.internet,
      water: !!input.services?.water,
      electricity: !!input.services?.electricity,
      gas: !!input.services?.gas,
    },
    images: input.images || [],
    status: input.status || 'published',
  });

  return ListingRepository.save(listing);
}
