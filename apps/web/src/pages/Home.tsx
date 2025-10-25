import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, CardContent, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';

import { formatTimestamp } from '../utils/date.ts';
import { getApiHealth, type HealthResponse } from '../api/generated';

export const Home = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        const payload = await getApiHealth({ signal: controller.signal });
        if (!ignore) {
          setHealth(payload);
          setError(null);
        }
      } catch (err) {
        if (ignore) {
          return;
        }

        if ((err as Error).name === 'AbortError') {
          return;
        }

        setError((err as Error).message ?? 'Неожиданная ошибка');
        setHealth(null);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  const statusLabel = useMemo(() => {
    if (loading) {
      return 'Проверяем состояние сервисов…';
    }

    if (error) {
      return 'Сервисы недоступны';
    }

    return health?.ok ? 'Все системы работают' : 'Нет данных';
  }, [error, health?.ok, loading]);

  return (
    <Stack spacing={4} sx={{ maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={1}>
        <Typography variant="h3" component="h1">
          Добро пожаловать!
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
                color={error ? 'error' : health?.ok ? 'success' : 'default'}
                label={statusLabel}
                variant={error ? 'filled' : 'outlined'}
              />
            </Stack>

            {loading && <LinearProgress color="primary" />}

            {error && (
              <Alert severity="error" variant="outlined">
                {error}
              </Alert>
            )}

            {!loading && !error && health && (
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
