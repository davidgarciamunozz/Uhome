import type { RoomieProfile } from '../../domain/entities/RoomieProfile';

const KEY = 'uhome_roomie_profiles';

function getAll(): RoomieProfile[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(profiles: RoomieProfile[]): void {
  localStorage.setItem(KEY, JSON.stringify(profiles));
}

export const RoomieRepository = {
  findAll: (): RoomieProfile[] => getAll(),

  findById: (id: string): RoomieProfile | null =>
    getAll().find((p) => p.id === id) ?? null,

  findByUser: (userId: string): RoomieProfile | null =>
    getAll().find((p) => p.userId === userId) ?? null,

  save: (profile: RoomieProfile): RoomieProfile => {
    const profiles = getAll();
    const idx = profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) profiles[idx] = profile;
    else profiles.push(profile);
    saveAll(profiles);
    return profile;
  },

  seed: (profiles: RoomieProfile[]): void => {
    saveAll(profiles);
  },
};
