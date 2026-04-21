import type { RoomieProfile } from '../../domain/entities/RoomieProfile';
import { RoomieRepository } from '../../infrastructure/repositories/RoomieRepository';

export interface RoomieFilters {
  university?: string;
  schedule?: string;
  maxBudget?: string;
}

export function getRoomieProfiles(filters: RoomieFilters = {}): RoomieProfile[] {
  let profiles = RoomieRepository.findAll();

  if (filters.university?.trim()) {
    const q = filters.university.toLowerCase();
    profiles = profiles.filter((p) => p.university.toLowerCase().includes(q));
  }

  if (filters.schedule) {
    profiles = profiles.filter((p) => p.preferences.schedule === filters.schedule);
  }

  if (filters.maxBudget) {
    profiles = profiles.filter((p) => p.budget <= Number(filters.maxBudget));
  }

  return profiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
