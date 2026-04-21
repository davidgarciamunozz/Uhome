import type { Owner } from '../../domain/entities/User';
import { validateEmail, validatePassword, validatePhone, validateRequired, ValidationError } from '../../domain/services/Validators';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

export interface RegisterOwnerInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  city: string;
  propertyTypes?: string[];
}

export function registerOwner(input: RegisterOwnerInput): Owner {
  validateRequired(input.name, 'name', 'El nombre');
  const email = validateEmail(input.email);
  validatePassword(input.password);

  if (input.password !== input.confirmPassword) {
    throw new ValidationError('confirmPassword', 'Las contraseñas no coinciden');
  }

  if (UserRepository.findByEmail(email)) {
    throw new ValidationError('email', 'Este correo ya está registrado');
  }

  validatePhone(input.phone);
  validateRequired(input.city, 'city', 'La ciudad');

  const owner: Owner = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    password: input.password,
    role: 'owner',
    phone: input.phone.trim(),
    propertyTypes: input.propertyTypes || [],
    city: input.city.trim(),
    createdAt: new Date().toISOString(),
  };

  return UserRepository.save(owner) as Owner;
}
