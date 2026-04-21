import type { Student } from '../../domain/entities/User';
import { validateEmail, validatePassword, validateRequired, ValidationError } from '../../domain/services/Validators';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

export interface RegisterStudentInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  university: string;
  career?: string;
  age?: string;
  budgetMin?: string;
  budgetMax?: string;
  smoker?: string;
  pets?: string;
  schedule?: string;
}

export function registerStudent(input: RegisterStudentInput): Student {
  validateRequired(input.name, 'name', 'El nombre');
  const email = validateEmail(input.email);
  validatePassword(input.password);

  if (input.password !== input.confirmPassword) {
    throw new ValidationError('confirmPassword', 'Las contraseñas no coinciden');
  }

  if (UserRepository.findByEmail(email)) {
    throw new ValidationError('email', 'Este correo ya está registrado');
  }

  validateRequired(input.university, 'university', 'La universidad');

  const student: Student = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    password: input.password,
    role: 'student',
    university: input.university,
    career: input.career,
    age: input.age ? Number(input.age) : undefined,
    budget: {
      min: Number(input.budgetMin) || 0,
      max: Number(input.budgetMax) || 0,
    },
    preferences: {
      smoker: input.smoker === 'true',
      pets: input.pets === 'true',
      schedule: (input.schedule as 'tranquilo' | 'social') || 'tranquilo',
    },
    createdAt: new Date().toISOString(),
  };

  return UserRepository.save(student) as Student;
}
