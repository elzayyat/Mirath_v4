import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

const ACCESS_TOKEN_KEY = 'mirath_access_token';
const REFRESH_TOKEN_KEY = 'mirath_refresh_token';
const EXPIRES_AT_KEY = 'mirath_access_token_expires_at';

export type ApiEnvelope<T> = { success?: boolean; data: T; message?: string; items?: T };

const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/$/, '');

export const http = axios.create({ baseURL, withCredentials: true });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const url = String(config.url || '').toLowerCase();
  const isAuthEndpoint = url.includes('/auth/register') || url.includes('/auth/login') || url.includes('/auth/refresh');
  if (token && !isAuthEndpoint) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;
const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;
      const response = await axios.post(`${baseURL}/auth/refresh`, { refreshToken }, { withCredentials: true });
      const payload = response.data?.data ?? response.data;
      if (payload?.accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
        if (payload.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
        if (payload.expiresAt) localStorage.setItem(EXPIRES_AT_KEY, payload.expiresAt);
        return payload.accessToken as string;
      }
      return null;
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry && !String(original.url).includes('/auth/login')) {
      original._retry = true;
      const newToken = await refreshAccessToken().catch(() => null);
      if (newToken) {
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newToken}` };
        return http(original);
      }
    }
    throw error;
  }
);

const unwrap = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data as T;
  return payload as T;
};

export const api = {
  get: async <T>(path: string, config?: AxiosRequestConfig) => ({ data: unwrap<T>((await http.get(path, config)).data) }),
  post: async <T>(path: string, body?: unknown, config?: AxiosRequestConfig) => ({ data: unwrap<T>((await http.post(path, body, config)).data) }),
  put: async <T>(path: string, body?: unknown, config?: AxiosRequestConfig) => ({ data: unwrap<T>((await http.put(path, body, config)).data) }),
  delete: async <T>(path: string, config?: AxiosRequestConfig) => ({ data: unwrap<T>((await http.delete(path, config)).data) }),
  upload: async <T>(path: string, formData: FormData) => ({ data: unwrap<T>((await http.post(path, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data) }),
};

export const authStorage = {
  persist(payload: { accessToken: string; refreshToken?: string; expiresAt?: string }) {
    localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
    if (payload.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
    if (payload.expiresAt) localStorage.setItem(EXPIRES_AT_KEY, payload.expiresAt);
  },
  clear() { localStorage.removeItem(ACCESS_TOKEN_KEY); localStorage.removeItem(REFRESH_TOKEN_KEY); localStorage.removeItem(EXPIRES_AT_KEY); },
  hasToken() { return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY)); },
};
