import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';
import { ValidationError } from '../../domain/services/Validators';

export function featureListingFree(listingId: string, ownerId: string): void {
  const listing = ListingRepository.findById(listingId);
  if (!listing || listing.ownerId !== ownerId) {
    throw new ValidationError('listing', 'Publicación no encontrada');
  }
  if (listing.status !== 'published') {
    throw new ValidationError('listing', 'Solo puedes destacar publicaciones activas');
  }
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + 7);
  ListingRepository.save({ ...listing, featured: true, featuredUntil: featuredUntil.toISOString() });
}

export function featureListingPaid(listingId: string, ownerId: string, days: number): void {
  const listing = ListingRepository.findById(listingId);
  if (!listing || listing.ownerId !== ownerId) {
    throw new ValidationError('listing', 'Publicación no encontrada');
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
