export interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  maxContacts: number | null;
  maxListings: number | null;
  canFeature: boolean;
  active: boolean;
  createdAt: string;
}

export function createPlan(data: Omit<Plan, 'id' | 'createdAt'>): Plan {
  return {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}
