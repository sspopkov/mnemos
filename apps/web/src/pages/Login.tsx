import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';

import AuthLayout from '../app/layout/AuthLayout';
import { useLogin, useLogout } from '../api';
import { getErrorMessage } from '../utils/errors';
import { selectAuthInitialized, selectAuthUser, useAuthStore } from '../store/auth';

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
    return (
      <AuthLayout
        title="Проверяем авторизацию"
        description="Пожалуйста, подождите, мы загружаем состояние вашей сессии."
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Загружаем данные…
          </Typography>
        </Stack>
      </AuthLayout>
    );
  }

  if (isRedirecting) {
    return (
      <AuthLayout
        title="Перенаправляем"
        description="Подождите секунду, мы открываем нужную страницу."
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Перенаправляем…
          </Typography>
        </Stack>
      </AuthLayout>
    );
  }

  if (user) {
    return (
      <AuthLayout
        title="Вы уже авторизованы"
        description={`Вы вошли как ${user.email}. Вы можете выйти из аккаунта или перейти на главную страницу.`}
      >
        <Stack spacing={4} alignItems="center" textAlign="center">
          <Avatar sx={{ bgcolor: 'primary.main', width: 72, height: 72 }}>
            <PersonRoundedIcon fontSize="large" />
          </Avatar>

          <Stack spacing={1}>
            <Typography variant="h6">{user.email}</Typography>
            <Typography variant="body2" color="text.secondary">
              Если вам нужно войти под другой учетной записью, сначала выйдите из текущей.
            </Typography>
          </Stack>

          <Stack spacing={2} sx={{ width: '100%' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<LogoutRoundedIcon />}
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              Выйти
            </Button>
            <Button component={RouterLink} to="/" variant="outlined" size="large">
              Перейти на главную
            </Button>
          </Stack>
        </Stack>
      </AuthLayout>
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
