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
import {
  useGetApiSandboxSuccess,
  useGetApiSandboxFailure,
  useGetApiSandboxDelayed,
  getGetApiSandboxDelayedQueryKey,
  getGetApiSandboxSuccessQueryKey,
  getGetApiSandboxFailureQueryKey,
} from '../api';
import { getErrorMessage } from '../utils/errors';

function isAbortError(err: unknown) {
  // axios v1: axios.isCancel; fetch/DOM: name === 'AbortError'
  return axios.isCancel(err) || (err instanceof DOMException && err.name === 'AbortError');
}

const SandboxPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [delaySeconds, setDelaySeconds] = useState(5);
  const clampedDelayMs = Math.min(Math.max(Math.round(delaySeconds * 1000), 0), 60_000);

  // Кнопочные запросы без onSuccess/onError в options: обрабатываем результат после refetch().
  const successQuery = useGetApiSandboxSuccess<{ message: string }>({
    query: {
      queryKey: getGetApiSandboxSuccessQueryKey(),
      enabled: false,
      retry: false,
      select: (response) => response.data,
    },
  });

  const failureQuery = useGetApiSandboxFailure({
    query: {
      queryKey: getGetApiSandboxFailureQueryKey(),
      enabled: false,
      retry: false,
      select: (resp) => resp.data, // теперь successQuery.data === { message: string }
    },
  });

  const isAnyShortLoading = successQuery.isFetching || failureQuery.isFetching;

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

  // Долгий запрос с отменой
  const delayedQuery = useGetApiSandboxDelayed<{ message: string }>(
    { delayMs: clampedDelayMs },
    {
      query: {
        queryKey: getGetApiSandboxDelayedQueryKey(),
        enabled: false,
        retry: false,
        select: (r) => r.data,
      },
    },
  );

  const startDelayed = useCallback(async () => {
    const { data, error } = await delayedQuery.refetch();
    if (error) {
      if (!isAbortError(error)) {
        enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
      }
      return;
    }
    if (data) {
      enqueueSnackbar(data.message ?? 'Готово', { variant: 'success' });
    }
  }, [delayedQuery, enqueueSnackbar]);

  const cancelDelayed = useCallback(() => {
    queryClient.cancelQueries({ queryKey: getGetApiSandboxDelayedQueryKey() });
  }, [queryClient]);

  const onDelayChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (Number.isNaN(v)) return setDelaySeconds(0);
    setDelaySeconds(Math.min(Math.max(v, 0), 60));
  }, []);

  const isDelayedFetching = delayedQuery.fetchStatus === 'fetching';

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Песочница уведомлений
          </Typography>
          <Typography variant="body1" color="text.secondary">
            В dev-режиме: проверка уведомлений и отмены запросов.
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={600}>
              Тестовые запросы
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Нажмите кнопку, чтобы увидеть уведомление.
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="success"
                onClick={runSuccess}
                disabled={isAnyShortLoading}
              >
                Успешный запрос
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={runFailure}
                disabled={isAnyShortLoading}
              >
                Неуспешный запрос
              </Button>
            </Stack>

            {isAnyShortLoading && <Alert severity="info">Выполняем запрос…</Alert>}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={600}>
              Проверка отмены долгих запросов
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Запустите искусственно долгий запрос и отмените его.
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
                onChange={onDelayChange}
                inputProps={{ min: 0, max: 60 }}
                helperText="Максимум 60 секунд"
                size="small"
                sx={{ width: { xs: '100%', sm: 200 } }}
              />

              <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <Button
                  variant="contained"
                  onClick={startDelayed}
                  fullWidth
                  disabled={isDelayedFetching}
                >
                  Запустить долгий запрос
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={cancelDelayed}
                  fullWidth
                  disabled={!isDelayedFetching}
                >
                  Отменить
                </Button>
              </Stack>
            </Stack>

            {isDelayedFetching && <LinearProgress />}

            {/* Для ясности можно отрисовать итог без коллбеков */}
            {delayedQuery.isError && !isDelayedFetching && (
              <Alert severity="error">{getErrorMessage(delayedQuery.error)}</Alert>
            )}
            {delayedQuery.isSuccess && !isDelayedFetching && (
              <Alert severity="success">{delayedQuery.data?.message ?? 'Готово'}</Alert>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default SandboxPage;
