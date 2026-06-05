import { type Student } from '../../domain/entities/User';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

const FREE_DAILY_LIMIT = 3;

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function canContact(student: Student): { allowed: boolean; remaining: number } {
  if (student.plan === 'premium') return { allowed: true, remaining: Infinity };
  const today = todayString();
  const count = student.contactsResetDate === today ? (student.contactsToday ?? 0) : 0;
  const remaining = FREE_DAILY_LIMIT - count;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

export function registerContact(student: Student): Student {
  const today = todayString();
  const count = student.contactsResetDate === today ? (student.contactsToday ?? 0) : 0;
  const updated: Student = {
    ...student,
    contactsToday: count + 1,
    contactsResetDate: today,
  };
  UserRepository.save(updated);
  return updated;
}
