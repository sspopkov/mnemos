import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Alert, Box, Button, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import AuthLayout from '../app/layout/AuthLayout';
import { useLogout, useRegister } from '../api';
import { getErrorMessage } from '../utils/errors';
import { selectAuthInitialized, selectAuthUser, useAuthStore } from '../store/auth';
import { AuthLoader } from '../app/RequireAuth';
import AuthAuthenticatedLayout from './components/AuthAuthenticatedLayout';

type RegisterFormState = {
  email: string;
  password: string;
  confirmPassword: string;
};

const RegisterPage = () => {
  const [form, setForm] = useState<RegisterFormState>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore(selectAuthUser);
  const initialized = useAuthStore(selectAuthInitialized);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (response) => {
        setIsRedirecting(true);
        const { accessToken, user } = response.data;
        setAuth({ accessToken, user });
        queryClient.clear();
        navigate('/', { replace: true });
      },
      onError: (err) => {
        setError(getErrorMessage(err));
      },
    },
  });

  const logoutMutation = useLogout({
    mutation: {
      onError: (err) => {
        // eslint-disable-next-line no-console
        console.error('Ошибка при выходе из аккаунта', err);
      },
      onSettled: () => {
        queryClient.clear();
      },
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    registerMutation.mutate({ data: { email: form.email, password: form.password } });
  };

  const handleChange =
    (field: keyof RegisterFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        clearAuth();
        setForm({ email: '', password: '', confirmPassword: '' });
        setError(null);
      },
    });
  };

  const isSubmitDisabled =
    registerMutation.isPending ||
    !form.email ||
    !form.password ||
    !form.confirmPassword ||
    form.password !== form.confirmPassword;

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
        description={`Вы вошли как ${user.email}. Чтобы зарегистрировать новый аккаунт, сначала выйдите из текущего.`}
        email={user.email}
        hint="Чтобы создать другой аккаунт, выйдите из профиля и повторите регистрацию."
        onLogout={handleLogout}
        isLoggingOut={logoutMutation.isPending}
      />
    );
  }

  return (
    <AuthLayout title="Регистрация" description="Создайте аккаунт Mnemos, чтобы начать работу">
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
            disabled={registerMutation.isPending}
          />

          <TextField
            label="Пароль"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            required
            autoComplete="new-password"
            helperText="Минимум 8 символов"
            disabled={registerMutation.isPending}
          />

          <TextField
            label="Повторите пароль"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange('confirmPassword')}
            required
            autoComplete="new-password"
            disabled={registerMutation.isPending}
          />

          <Button type="submit" variant="contained" size="large" disabled={isSubmitDisabled}>
            Создать аккаунт
          </Button>

          <Typography variant="body2" color="text.secondary" align="center">
            Уже зарегистрированы?{' '}
            <MuiLink component={RouterLink} to="/login">
              Войдите
            </MuiLink>
          </Typography>
        </Stack>
      </Box>
    </AuthLayout>
  );
};

export default RegisterPage;
