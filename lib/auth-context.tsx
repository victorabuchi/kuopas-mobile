import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as api from './api-client';
import type { Profile } from './types';

type AuthContextValue = {
  isLoggedIn: boolean;
  isLoading: boolean;
  tenant: Profile | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<boolean>;
  register: (name: string, email: string, password: string, unitId: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenant, setTenant] = useState<Profile | null>(null);

  useEffect(() => {
    api.isLoggedIn().then(async (value) => {
      setIsLoggedIn(value);
      if (value) setTenant(await api.getMe().catch(() => null));
      setIsLoading(false);
    });
  }, []);

  const value: AuthContextValue = {
    isLoggedIn,
    isLoading,
    tenant,
    login: async (email, password) => {
      await api.login(email, password);
      setIsLoggedIn(true);
      setTenant(await api.getMe().catch(() => null));
    },
    loginWithGoogle: async () => {
      const signedIn = await api.loginWithGoogle();
      if (signedIn) {
        setIsLoggedIn(true);
        setTenant(await api.getMe().catch(() => null));
      }
      return signedIn;
    },
    register: async (name, email, password, unitId) => {
      await api.register(name, email, password, unitId);
      setIsLoggedIn(true);
      setTenant(await api.getMe().catch(() => null));
    },
    refreshProfile: async () => {
      setTenant(await api.getMe().catch(() => null));
    },
    logout: async () => {
      await api.logout();
      setIsLoggedIn(false);
      setTenant(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
