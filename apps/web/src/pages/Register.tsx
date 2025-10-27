import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import AuthLayout from '../app/layout/AuthLayout';
import { useRegister } from '../api';
import { getErrorMessage } from '../utils/errors';
import { useAuthStore } from '../store/auth';

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
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (response) => {
        const { accessToken, user } = response.data;
        setAuth({ accessToken, user });
        queryClient.clear();
        navigate('/', { replace: true });
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

    try {
      await registerMutation.mutateAsync({ data: { email: form.email, password: form.password } });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleChange = (field: keyof RegisterFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const isSubmitDisabled =
    registerMutation.isPending ||
    !form.email ||
    !form.password ||
    !form.confirmPassword ||
    form.password !== form.confirmPassword;

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
