import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Alert, Box, Button, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import AuthLayout from '../app/layout/AuthLayout';
import { useLogin, useLogout } from '../api';
import { getErrorMessage } from '../utils/errors';
import { selectAuthInitialized, selectAuthUser, useAuthStore } from '../store/auth';
import { AuthLoader } from '../app/RequireAuth';
import AuthAuthenticatedLayout from './components/AuthAuthenticatedLayout';

type LoginFormState = {
  email: string;
  password: string;
};

type LocationState = {
  from?: { pathname: string };
};

const LoginPage = () => {
  const [form, setForm] = useState<LoginFormState>({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore(selectAuthUser);
  const initialized = useAuthStore(selectAuthInitialized);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (response) => {
        setIsRedirecting(true);
        const { accessToken, user } = response.data;
        setAuth({ accessToken, user });
        queryClient.clear();

        const state = (location.state as LocationState | null) ?? undefined;
        const redirectTo = state?.from?.pathname ?? '/';
        navigate(redirectTo, { replace: true });
      },
    },
  });

  const logoutMutation = useLogout({
    mutation: {
      onSettled: () => {
        queryClient.clear();
      },
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await loginMutation.mutateAsync({ data: form });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleChange = (field: keyof LoginFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Ошибка при выходе из аккаунта', err);
    } finally {
      clearAuth();
      setForm({ email: '', password: '' });
      setError(null);
    }
  };

  if (!initialized) {
    return <AuthLoader />;
  }

  if (isRedirecting) {
    return <AuthLoader message="Перенаправляем…" />;
  }

  if (user) {
    return (
      <AuthAuthenticatedLayout
        title="Вы уже авторизованы"
        description={`Вы вошли как ${user.email}. Вы можете выйти из аккаунта или перейти на главную страницу.`}
        email={user.email}
        hint="Если вам нужно войти под другой учетной записью, сначала выйдите из текущей."
        onLogout={handleLogout}
        isLoggingOut={logoutMutation.isPending}
      />
    );
  }

  return (
    <AuthLayout title="Вход" description="Войдите, чтобы продолжить работу с Mnemos">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            required
            autoFocus
            autoComplete="email"
            disabled={loginMutation.isPending}
          />

          <TextField
            label="Пароль"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            required
            autoComplete="current-password"
            disabled={loginMutation.isPending}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loginMutation.isPending || !form.email || !form.password}
          >
            Войти
          </Button>

          <Typography variant="body2" color="text.secondary" align="center">
            Нет аккаунта?{' '}
            <MuiLink component={RouterLink} to="/register">
              Зарегистрируйтесь
            </MuiLink>
          </Typography>
        </Stack>
      </Box>
    </AuthLayout>
  );
};

export default LoginPage;
