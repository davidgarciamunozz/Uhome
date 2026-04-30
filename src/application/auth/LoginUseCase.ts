import type { User } from '../../domain/entities/User';
import { ValidationError } from '../../domain/services/Validators';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

export function login(email: string, password: string): User {
  if (!email?.trim() || !password) {
    throw new ValidationError('email', 'Complete todos los campos');
  }

  const user = UserRepository.findByEmail(email.trim().toLowerCase());
  if (!user || user.password !== password) {
    throw new ValidationError('email', 'Correo o contraseña incorrectos');
  }

  if (user.blocked) {
    throw new ValidationError('email', 'Esta cuenta ha sido bloqueada. Contacta al administrador.');
  }

  return user;
}
