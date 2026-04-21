import type { Student } from '../entities/User';
import type { RoomieProfile } from '../entities/RoomieProfile';

export function calculateCompatibility(student: Student, roomie: RoomieProfile): number {
  let score = 0;
  let total = 0;

  // Smoker preference
  if (student.preferences.smoker === roomie.preferences.smoker) score += 1;
  total += 1;

  // Schedule preference
  if (student.preferences.schedule === roomie.preferences.schedule) score += 1;
  total += 1;

  // Pets preference
  if (
    roomie.preferences.pets === 'indiferente' ||
    (student.preferences.pets && roomie.preferences.pets === 'sí') ||
    (!student.preferences.pets && roomie.preferences.pets === 'no')
  ) {
    score += 1;
  }
  total += 1;

  return Math.round((score / total) * 100);
}

export function getCompatibilityLabel(score: number): string {
  if (score >= 80) return 'Alta compatibilidad';
  if (score >= 50) return 'Compatible';
  return 'Baja compatibilidad';
}

export function getCompatibilityColor(score: number): string {
  if (score >= 80) return '#16A34A';
  if (score >= 50) return '#D97706';
  return '#DC2626';
}
