import { createPlan, type Plan } from '../../domain/entities/Plan';
import { PlanRepository } from '../../infrastructure/repositories/PlanRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { ValidationError } from '../../domain/services/Validators';

export function getPlans(): Plan[] {
  return PlanRepository.findAll();
}

export function createNewPlan(data: Omit<Plan, 'id' | 'createdAt'>): Plan {
  if (!data.name?.trim()) throw new ValidationError('name', 'El nombre es obligatorio');
  if (data.price < 0) throw new ValidationError('price', 'El precio no puede ser negativo');
  if (!data.durationDays || data.durationDays < 1) {
    throw new ValidationError('durationDays', 'La duración debe ser al menos 1 día');
  }
  const plan = createPlan(data);
  return PlanRepository.save(plan);
}

export function updatePlan(id: string, data: Partial<Omit<Plan, 'id' | 'createdAt'>>): Plan {
  const existing = PlanRepository.findById(id);
  if (!existing) throw new ValidationError('id', 'Plan no encontrado');
  return PlanRepository.save({ ...existing, ...data });
}

export function disablePlan(id: string): void {
  const existing = PlanRepository.findById(id);
  if (!existing) return;
  PlanRepository.save({ ...existing, active: false });
}

export function enablePlan(id: string): void {
  const existing = PlanRepository.findById(id);
  if (!existing) return;
  PlanRepository.save({ ...existing, active: true });
}

export function deletePlan(id: string): void {
  const premiumUsers = UserRepository.findAll().filter((u) => u.plan === 'premium');
  if (premiumUsers.length > 0) {
    throw new ValidationError('plan', 'No se puede eliminar un plan mientras haya suscriptores activos');
  }
  PlanRepository.delete(id);
}
