export class ValidationError extends Error {
  readonly field: string;
  constructor(field: string, message: string) {
    super(message);
    this.field = field;
    this.name = 'ValidationError';
  }
}

export function validateEmail(email: string): string {
  if (!email?.trim()) throw new ValidationError('email', 'El correo es obligatorio');
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) throw new ValidationError('email', 'Formato de correo inválido');
  return email.toLowerCase().trim();
}

export function validatePassword(password: string): string {
  if (!password) throw new ValidationError('password', 'La contraseña es obligatoria');
  if (password.length < 8) throw new ValidationError('password', 'Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) throw new ValidationError('password', 'Debe incluir al menos 1 mayúscula');
  if (!/[0-9]/.test(password)) throw new ValidationError('password', 'Debe incluir al menos 1 número');
  return password;
}

export function validatePhone(phone: string): string {
  if (!phone?.trim()) throw new ValidationError('phone', 'El teléfono es obligatorio');
  const digits = phone.replace(/[\s\-\+\(\)]/g, '');
  if (!/^\d{7,15}$/.test(digits)) throw new ValidationError('phone', 'Solo se permiten números (7-15 dígitos)');
  return phone.trim();
}

export function validateRequired(value: string | undefined | null, field: string, label: string): string {
  if (!value || !value.toString().trim()) {
    throw new ValidationError(field, `${label} es obligatorio`);
  }
  return value.toString().trim();
}

export function validatePositiveNumber(value: string | number, field: string, label: string): number {
  const n = Number(value);
  if (isNaN(n) || n <= 0) throw new ValidationError(field, `${label} debe ser un número positivo`);
  return n;
}
