import type { Rating } from '../../domain/entities/Rating';

const KEY = 'uhome_ratings';

function getAll(): Rating[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(ratings: Rating[]): void {
  localStorage.setItem(KEY, JSON.stringify(ratings));
}

export const RatingRepository = {
  findAll: (): Rating[] => getAll(),

  findForUser: (userId: string): Rating[] =>
    getAll().filter((r) => r.toUserId === userId),

  findByFromUser: (userId: string): Rating[] =>
    getAll().filter((r) => r.fromUserId === userId),

  findByUsers: (fromId: string, toId: string): Rating | null =>
    getAll().find((r) => r.fromUserId === fromId && r.toUserId === toId) ?? null,

  findById: (id: string): Rating | null =>
    getAll().find((r) => r.id === id) ?? null,

  save: (rating: Rating): Rating => {
    const ratings = getAll();
    const idx = ratings.findIndex((r) => r.id === rating.id);
    if (idx >= 0) ratings[idx] = rating;
    else ratings.push(rating);
    saveAll(ratings);
    return rating;
  },
};
