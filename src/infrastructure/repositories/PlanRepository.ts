import type { Plan } from '../../domain/entities/Plan';

const KEY = 'uhome_plans';

function getAll(): Plan[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(plans: Plan[]): void {
  localStorage.setItem(KEY, JSON.stringify(plans));
}

export const PlanRepository = {
  findAll: (): Plan[] => getAll(),

  findById: (id: string): Plan | null =>
    getAll().find((p) => p.id === id) ?? null,

  findActive: (): Plan[] => getAll().filter((p) => p.active),

  save: (plan: Plan): Plan => {
    const plans = getAll();
    const idx = plans.findIndex((p) => p.id === plan.id);
    if (idx >= 0) plans[idx] = plan;
    else plans.push(plan);
    saveAll(plans);
    return plan;
  },

  delete: (id: string): void => {
    saveAll(getAll().filter((p) => p.id !== id));
  },

  seed: (plans: Plan[]): void => {
    saveAll(plans);
  },
};
