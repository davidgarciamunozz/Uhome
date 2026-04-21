import type { ScheduleType, PetsPreference, OrderLevel } from './User';

export interface RoomiePreferences {
  smoker: boolean;
  pets: PetsPreference;
  schedule: ScheduleType;
  order: OrderLevel;
}

export interface RoomieProfile {
  id: string;
  userId: string;
  name: string;
  age: number;
  university: string;
  career?: string;
  preferences: RoomiePreferences;
  budget: number;
  stayDuration: number;
  description: string;
  avatar?: string;
  createdAt: string;
}

export function createRoomieProfile(data: Omit<RoomieProfile, 'id' | 'createdAt'>): RoomieProfile {
  return {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}
