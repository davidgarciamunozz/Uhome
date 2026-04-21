import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User } from '../../domain/entities/User';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

const SESSION_KEY = 'uhome_session';

interface SessionContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function getStoredUser(): User | null {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    const stored = JSON.parse(data) as { id: string };
    return UserRepository.findById(stored.id);
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);

  const login = useCallback((u: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: u.id }));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <SessionContext.Provider value={{ user, login, logout, refreshUser }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
