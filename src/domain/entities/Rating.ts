export interface Rating {
  id: string;
  fromUserId: string;
  toUserId: string;
  score: number;
  comment: string;
  createdAt: string;
}

export interface RatingSummary {
  average: number;
  count: number;
  ratings: Rating[];
}

export function createRating(data: Omit<Rating, 'id' | 'createdAt'>): Rating {
  return {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}
