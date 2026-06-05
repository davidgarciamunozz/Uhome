import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { ListingRepository } from '../../infrastructure/repositories/ListingRepository';

const FREE_LISTING_LIMIT = 3;

export function canPublish(ownerId: string): { allowed: boolean; active: number; limit: number } {
  const owner = UserRepository.findById(ownerId);
  if (!owner || owner.role !== 'owner') {
    return { allowed: false, active: 0, limit: FREE_LISTING_LIMIT };
  }
  if (owner.plan === 'premium') {
    return { allowed: true, active: 0, limit: Infinity };
  }
  const active = ListingRepository.findByOwner(ownerId).filter((l) => l.status === 'published').length;
  return {
    allowed: active < FREE_LISTING_LIMIT,
    active,
    limit: FREE_LISTING_LIMIT,
  };
}
