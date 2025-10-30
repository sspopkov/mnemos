import { useMemo } from 'react';
import { Alert, Card, CardContent, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';

import { formatTimestamp } from '../utils/date';
import { useGetHealth, getGetHealthQueryKey, type HealthResponse, type ApiError } from '../api';
import { getErrorMessage } from '../utils/errors';
import { useAuthStore, selectAuthUser } from '../store/auth';

const Home = () => {
  const {
    data: health,
    isLoading,
    isFetching,
    error,
  } = useGetHealth<HealthResponse, ApiError>({
    query: {
      queryKey: getGetHealthQueryKey(),
      select: (res) => res.data,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: false,
    },
  });

  const loading = isLoading || isFetching;
  const errorText = error ? getErrorMessage(error) : null;

  const statusLabel = useMemo(() => {
    if (loading) return 'Проверяем состояние сервисов…';
    if (errorText) return 'Сервисы недоступны';
    return health?.ok ? 'Все системы работают' : 'Нет данных';
  }, [errorText, health?.ok, loading]);

  const user = useAuthStore(selectAuthUser);

  return (
    <Stack spacing={4} sx={{ maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={1}>
        <Typography variant="h3" component="h1">
          Добро пожаловать{user ? `, ${user.email}` : ''}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Здесь вы найдёте текущий статус ключевых сервисов Mnemos.
        </Typography>
      </Stack>

      <Card elevation={0} sx={{ border: (theme: Theme) => `1px solid ${theme.palette.divider}` }}>
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h5" component="h2" sx={{ flexGrow: 1 }}>
                Состояние API
              </Typography>
              <Chip
                color={errorText ? 'error' : health?.ok ? 'success' : 'default'}
                label={statusLabel}
                variant={errorText ? 'filled' : 'outlined'}
              />
            </Stack>

            {loading && <LinearProgress color="primary" />}

            {errorText && (
              <Alert severity="error" variant="outlined">
                {errorText}
              </Alert>
            )}

            {!loading && !errorText && health && (
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Последнее обновление:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formatTimestamp(health.ts)}
                </Typography>
                <Typography
                  component="code"
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: (theme: Theme) => theme.palette.action.hover,
                    fontFamily: 'monospace',
                  }}
                >
                  {JSON.stringify(health, null, 2)}
                </Typography>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default Home;
