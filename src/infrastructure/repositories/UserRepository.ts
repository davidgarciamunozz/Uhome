import type { User } from '../../domain/entities/User';

const KEY = 'uhome_users';

function getAll(): User[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(users: User[]): void {
  localStorage.setItem(KEY, JSON.stringify(users));
}

export const UserRepository = {
  findAll: (): User[] => getAll(),

  findById: (id: string): User | null =>
    getAll().find((u) => u.id === id) ?? null,

  findByEmail: (email: string): User | null =>
    getAll().find((u) => u.email === email.toLowerCase()) ?? null,

  save: (user: User): User => {
    const users = getAll();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    saveAll(users);
    return user;
  },

  delete: (id: string): void => {
    saveAll(getAll().filter((u) => u.id !== id));
  },

  seed: (users: User[]): void => {
    saveAll(users);
  },
};
