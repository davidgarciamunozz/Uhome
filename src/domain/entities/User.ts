export type UserRole = 'student' | 'owner' | 'admin';
export type ScheduleType = 'tranquilo' | 'social';
export type PetsPreference = 'sí' | 'no' | 'indiferente';
export type OrderLevel = 'alto' | 'medio' | 'bajo';

export interface StudentPreferences {
  smoker: boolean;
  pets: boolean;
  schedule: ScheduleType;
}

export interface Budget {
  min: number;
  max: number;
}

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  description?: string;
  createdAt: string;
  blocked?: boolean;
}

export interface Student extends BaseUser {
  role: 'student';
  university: string;
  career?: string;
  age?: number;
  budget: Budget;
  preferences: StudentPreferences;
}

export interface Owner extends BaseUser {
  role: 'owner';
  phone: string;
  propertyTypes: string[];
  city: string;
}

export interface Admin extends BaseUser {
  role: 'admin';
}

export type User = Student | Owner | Admin;

export function isStudent(user: User): user is Student {
  return user.role === 'student';
}

export function isOwner(user: User): user is Owner {
  return user.role === 'owner';
}

export function isAdmin(user: User): user is Admin {
  return user.role === 'admin';
}

export function createStudentId(): string {
  return `student-${crypto.randomUUID()}`;
}

export function createOwnerId(): string {
  return `owner-${crypto.randomUUID()}`;
}
