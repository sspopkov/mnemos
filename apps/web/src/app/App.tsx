import { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';

import { AppShell, type NavigationItem } from './layout/AppShell';
import RequireAuth from './RequireAuth';
import Home from '../pages/Home';
import RecordsPage from '../features/records/RecordsPage';
import LoginPage from '../pages/Login';
import RegisterPage from '../pages/Register';
import { getDesignTokens } from '../utils/theme';
import { rawRefresh } from '../api/http';
import { useAuthStore, selectAuthInitialized, selectAuthUser } from '../store/auth';
import { useLogout } from '../api';

const navigation: NavigationItem[] = [
  { label: 'Главная', href: '/', description: 'Обзор состояния сервисов' },
  { label: 'Записи', href: '/records', description: 'CRUD по записям' },
];

const ProtectedLayout = ({
  colorMode,
  onToggleColorMode,
}: {
  colorMode: PaletteMode;
  onToggleColorMode: () => void;
}) => {
  const user = useAuthStore(selectAuthUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoutMutation = useLogout({
    mutation: {
      onSettled: () => {
        queryClient.clear();
      },
    },
  });

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Ошибка при выходе из аккаунта', error);
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  return (
    <AppShell
      navItems={navigation}
      colorMode={colorMode}
      onToggleColorMode={onToggleColorMode}
      user={user}
      onLogout={handleLogout}
      logoutPending={logoutMutation.isPending}
    />
  );
};

export const App = () => {
  const [mode, setMode] = useState<PaletteMode>('light');
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const initialized = useAuthStore(selectAuthInitialized);
  const bootstrapping = useRef(false);

  useEffect(() => {
    if (initialized || bootstrapping.current) return;

    bootstrapping.current = true;

    const fetchSession = async () => {
      try {
        const response = await rawRefresh();
        const { accessToken, user } = response.data as {
          accessToken: string;
          user: { id: string; email: string; createdAt: string; updatedAt: string };
        };
        setAuth({ accessToken, user });
      } catch {
        clearAuth();
      } finally {
        bootstrapping.current = false;
      }
    };

    void fetchSession();
  }, [initialized, setAuth, clearAuth]);

  const handleToggleColorMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<RequireAuth />}>
            <Route
              element={<ProtectedLayout colorMode={mode} onToggleColorMode={handleToggleColorMode} />}
            >
              <Route index element={<Home />} />
              <Route path="records" element={<RecordsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
