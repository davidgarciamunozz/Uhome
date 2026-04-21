import type { RoomieProfile } from '../../domain/entities/RoomieProfile';
import { validateRequired, ValidationError } from '../../domain/services/Validators';
import { RoomieRepository } from '../../infrastructure/repositories/RoomieRepository';

export interface CreateRoomieInput {
  name: string;
  age: string;
  university: string;
  career?: string;
  smoker?: string;
  pets?: string;
  schedule?: string;
  order?: string;
  budget?: string;
  stayDuration?: string;
  description?: string;
}

export function createOrUpdateRoomieProfile(input: CreateRoomieInput, userId: string): RoomieProfile {
  validateRequired(input.name, 'name', 'El nombre');
  validateRequired(input.age, 'age', 'La edad');
  validateRequired(input.university, 'university', 'La universidad');

  const age = Number(input.age);
  if (isNaN(age) || age < 15 || age > 70) {
    throw new ValidationError('age', 'Edad inválida (15-70)');
  }

  const existing = RoomieRepository.findByUser(userId);

  const profileData = {
    id: existing?.id || crypto.randomUUID(),
    userId,
    name: input.name.trim(),
    age,
    university: input.university.trim(),
    career: input.career?.trim(),
    preferences: {
      smoker: input.smoker === 'true',
      pets: (input.pets || 'no') as 'sí' | 'no' | 'indiferente',
      schedule: (input.schedule || 'tranquilo') as 'tranquilo' | 'social',
      order: (input.order || 'medio') as 'alto' | 'medio' | 'bajo',
    },
    budget: Number(input.budget) || 0,
    stayDuration: Number(input.stayDuration) || 0,
    description: input.description?.trim() || '',
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  return RoomieRepository.save(profileData);
}
