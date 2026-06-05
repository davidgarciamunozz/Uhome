import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { ValidationError } from '../../domain/services/Validators';

export function featureListing(listingId: string, ownerId: string, days: number): void {
  const listing = ListingRepository.findById(listingId);
  if (!listing || listing.ownerId !== ownerId) {
    throw new ValidationError('listing', 'Publicación no encontrada');
  }
  const owner = UserRepository.findById(ownerId);
  if (owner?.plan !== 'premium') {
    throw new ValidationError('plan', 'Solo usuarios premium pueden destacar publicaciones');
  }
  if (listing.status !== 'published') {
    throw new ValidationError('listing', 'Solo puedes destacar publicaciones activas');
  }
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + days);
  ListingRepository.save({ ...listing, featured: true, featuredUntil: featuredUntil.toISOString() });
}

export function unfeatureListing(listingId: string, ownerId: string): void {
  const listing = ListingRepository.findById(listingId);
  if (!listing || listing.ownerId !== ownerId) return;
  ListingRepository.save({ ...listing, featured: false, featuredUntil: undefined });
}
