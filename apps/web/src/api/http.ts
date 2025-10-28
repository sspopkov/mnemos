import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';

import { useAuthStore } from '../store/auth';
import { type Def2, type Refresh200 } from './index.ts';

declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean;
    _requiresAuth?: boolean;
  }
}

const api = axios.create({ withCredentials: true });
const refreshClient = axios.create({ withCredentials: true });

let refreshPromise: Promise<void> | null = null;

const performRefresh = async () => {
  try {
    const response = await refreshClient.post<Def2, AxiosResponse<Refresh200>>('/api/auth/refresh');
    const { accessToken, user } = response.data;
    useAuthStore.getState().setAuth({ accessToken, user });
  } catch (error) {
    useAuthStore.getState().clearAuth();
    throw error;
  }
};

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
    config._requiresAuth = true;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { response, config } = error;
    const isAuthRefresh = config?.url?.includes('/api/auth/refresh');

    if (
      response?.status === 401 &&
      config &&
      !config._retry &&
      !isAuthRefresh &&
      config._requiresAuth
    ) {
      config._retry = true;

      try {
        refreshPromise = refreshPromise ?? performRefresh();
        await refreshPromise;
        refreshPromise = null;

        const token = useAuthStore.getState().accessToken;
        if (token) {
          config.headers.set('Authorization', `Bearer ${token}`);
        }

        return api(config);
      } catch (refreshError) {
        refreshPromise = null;
        throw refreshError;
      }
    }

    throw error;
  },
);

export const httpClient = <T = unknown, R = AxiosResponse<T>>(
  config: AxiosRequestConfig,
): Promise<R> => {
  return api.request<T, R>(config);
};
