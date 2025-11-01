import {
  Alert,
  Box,
  Button,
  Container,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import type { ChangeEvent } from 'react';
import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { getErrorMessage } from '../utils/errors';

// ИМЕННО сгенерированные хуки Orval:
import {
  useGetApiSandboxSuccess,
  useGetApiSandboxFailure,
  useGetApiSandboxDelayed,
  getGetApiSandboxSuccessQueryKey,
  getGetApiSandboxFailureQueryKey,
} from '../api';

const SandboxPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [delaySeconds, setDelaySeconds] = useState(5);
  const [delayedState, setDelayedState] = useState<
    | { status: 'idle' }
    | { status: 'pending'; message: string }
    | { status: 'success'; message: string }
    | { status: 'error'; message: string }
    | { status: 'cancelled'; message: string }
  >({ status: 'idle' });
  const clampedDelayMs = Math.min(Math.max(Math.round(delaySeconds * 1000), 0), 60000);

  const delayedQuery = useGetApiSandboxDelayed<{ message: string }>({
    delayMs: clampedDelayMs,
  }, {
    query: {
      enabled: false,
      retry: false,
      select: (response) => response.data,
    },
  });

  const { refetch: refetchDelayed, fetchStatus: delayedFetchStatus, queryKey: delayedQueryKey } = delayedQuery;

  // Запрос «по кнопке» + маппинг на data
  const successQuery = useGetApiSandboxSuccess<{ message: string }, unknown>({
    query: {
      queryKey: getGetApiSandboxSuccessQueryKey(),
      enabled: false,
      retry: false,
      select: (resp) => resp.data, // теперь successQuery.data === { message: string }
    },
  });

  const failureQuery = useGetApiSandboxFailure<unknown, unknown>({
    query: {
      queryKey: getGetApiSandboxFailureQueryKey(),
      enabled: false,
      retry: false,
      // для фейла можно тоже вернуть data, но нам важнее error
      // select: (resp) => resp.data,
    },
  });

  const isLoading = successQuery.isFetching || failureQuery.isFetching;

  const runSuccess = async () => {
    const { data, error } = await successQuery.refetch();
    if (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
      return;
    }
    if (data) {
      enqueueSnackbar(data.message ?? 'Успех!', { variant: 'success' });
    }
  };

  const runFailure = async () => {
    const { error } = await failureQuery.refetch();
    enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
  };

  const handleDelayChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (Number.isNaN(value)) {
      setDelaySeconds(0);
      return;
    }

    const clamped = Math.min(Math.max(value, 0), 60);
    setDelaySeconds(clamped);
  }, []);

  const startDelayedRequest = useCallback(async () => {
    setDelayedState({ status: 'pending', message: 'Выполняем запрос…' });

    const result = await refetchDelayed();

    if (result.error) {
      if (axios.isCancel(result.error)) {
        setDelayedState({ status: 'cancelled', message: 'Запрос отменён пользователем' });
      } else {
        setDelayedState({ status: 'error', message: getErrorMessage(result.error) });
      }

      return;
    }

    if (result.data) {
      setDelayedState({ status: 'success', message: result.data.message ?? 'Готово' });
      return;
    }

    setDelayedState({ status: 'error', message: 'Не удалось получить ответ от сервера' });
  }, [refetchDelayed]);

  const cancelDelayedRequest = useCallback(() => {
    if (delayedFetchStatus !== 'fetching') {
      return;
    }

    queryClient.cancelQueries({ queryKey: delayedQueryKey });
    setDelayedState({ status: 'cancelled', message: 'Запрос отменён пользователем' });
  }, [delayedFetchStatus, queryClient, delayedQueryKey]);

  const isDelayedPending = delayedState.status === 'pending' || delayedFetchStatus === 'fetching';
  const delayedAlertSeverity =
    delayedState.status === 'success' ? 'success' : delayedState.status === 'error' ? 'error' : 'info';

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Песочница уведомлений
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Страница доступна только в режиме разработки и помогает проверить уведомления.
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={600}>
              Тестовые запросы
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Нажмите кнопку, чтобы отправить запрос и увидеть уведомление.
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button variant="contained" color="success" onClick={runSuccess} disabled={isLoading}>
                Успешный запрос
              </Button>
              <Button variant="contained" color="error" onClick={runFailure} disabled={isLoading}>
                Неуспешный запрос
              </Button>
            </Stack>

            {isLoading && <Alert severity="info">Выполняем запрос…</Alert>}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={600}>
              Проверка отмены долгих запросов
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Запустите искусственно долгий запрос и отмените его, чтобы убедиться, что AbortController
              работает корректно на фронтенде.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'flex-end' }}
            >
              <TextField
                type="number"
                label="Задержка, сек"
                value={delaySeconds}
                onChange={handleDelayChange}
                inputProps={{ min: 0, max: 60 }}
                helperText="Максимум 60 секунд"
                size="small"
                sx={{ width: { xs: '100%', sm: 200 } }}
              />

              <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={startDelayedRequest}
                  fullWidth
                  disabled={isDelayedPending}
                >
                  Запустить долгий запрос
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={cancelDelayedRequest}
                  fullWidth
                  disabled={delayedFetchStatus !== 'fetching'}
                >
                  Отменить
                </Button>
              </Stack>
            </Stack>

            {delayedFetchStatus === 'fetching' && <LinearProgress />}

            {delayedState.status !== 'idle' && (
              <Alert severity={delayedAlertSeverity}>{delayedState.message}</Alert>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default SandboxPage;
