import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, authStorage } from '@/lib/api';
import { mockStore, type MockUser } from '@/lib/mockStore';

export type UserRole = 'Admin' | 'Lawyer' | 'Client' | 'EndUser';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  name?: string;
  nameArabic?: string;
  nameEnglish?: string;
  role: UserRole;
  status?: string;
  isActive?: boolean;
  phone?: string;
  subscription?: {
    planName?: string;
    casesUsedThisPeriod?: number;
    monthlyCaseLimit?: number;
    hasAdvancedCalculator?: boolean;
    hasPdfExports?: boolean;
    hasClientManagement?: boolean;
    hasAdminAccess?: boolean;
    usagePeriodEnd?: string;
  } | null;
}

interface RegisterPayload {
  email: string;
  password: string;
  fullName?: string;
  nameEnglish?: string;
  nameArabic?: string;
  phoneNumber?: string;
  phone?: string;
  role?: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (payload: RegisterPayload) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  me: () => Promise<void>;
  signIn: AuthContextType['login'];
  signUp: AuthContextType['register'];
  signOut: AuthContextType['logout'];
  refreshProfile: AuthContextType['me'];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normaliseUser = (u: any): AuthUser => ({
  ...u,
  fullName: u.fullName ?? u.nameEnglish ?? u.name ?? u.email,
  role: u.role ?? 'Client',
});

const mockToAuth = (u: MockUser): AuthUser => ({
  id: u.id,
  email: u.email,
  fullName: u.fullName || u.nameEnglish,
  nameEnglish: u.nameEnglish,
  nameArabic: u.nameArabic,
  role: u.role,
  isActive: u.isActive,
  phone: u.phone,
  subscription: u.subscription,
});

// Detect standalone mode: no API URL configured, or explicit flag
const STANDALONE = import.meta.env.VITE_STANDALONE_MODE === 'true'
  || !import.meta.env.VITE_API_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const me = async () => {
    if (STANDALONE) {
      const u = mockStore.getCurrentUser();
      if (u) setUser(mockToAuth(u));
      else setUser(null);
      return;
    }
    const response = await api.get<AuthUser>('/auth/me');
    setUser(normaliseUser(response.data));
  };

  useEffect(() => {
    (async () => {
      if (STANDALONE) {
        const u = mockStore.getCurrentUser();
        setUser(u ? mockToAuth(u) : null);
        setLoading(false);
        return;
      }
      if (!authStorage.hasToken()) { setLoading(false); return; }
      try { await me(); } catch { authStorage.clear(); setUser(null); }
      finally { setLoading(false); }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      if (STANDALONE) {
        const u = mockStore.login(email, password);
        mockStore.persistCurrentUser(u);
        setUser(mockToAuth(u));
        return { error: null };
      }
      const r = await api.post<any>('/auth/login', { email, password });
      authStorage.persist(r.data);
      setUser(normaliseUser(r.data.user));
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      if (STANDALONE) {
        const u = mockStore.register(
          payload.email,
          payload.password,
          payload.nameEnglish ?? payload.fullName ?? '',
          payload.nameArabic ?? '',
          payload.phone ?? payload.phoneNumber ?? '',
          payload.role ?? 'Client',
        );
        mockStore.persistCurrentUser(u);
        setUser(mockToAuth(u));
        return { error: null };
      }
      const r = await api.post<any>('/auth/register', {
        ...payload,
        nameEnglish: payload.nameEnglish ?? payload.fullName,
        phone: payload.phone ?? payload.phoneNumber,
      });
      authStorage.persist(r.data);
      setUser(normaliseUser(r.data.user));
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const logout = async () => {
    if (STANDALONE) {
      mockStore.clearCurrentUser();
      setUser(null);
      return;
    }
    try { await api.post('/auth/logout'); } catch {}
    finally { authStorage.clear(); setUser(null); }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, me, signIn: login, signUp: register, signOut: logout, refreshProfile: me }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
}
