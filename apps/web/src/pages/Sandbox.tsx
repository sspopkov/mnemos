import { Alert, Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { getErrorMessage } from '../utils/errors';

// ИМЕННО сгенерированные хуки Orval:
import {
  useGetApiSandboxSuccess,
  useGetApiSandboxFailure,
  getGetApiSandboxSuccessQueryKey,
  getGetApiSandboxFailureQueryKey,
} from '../api';

const SandboxPage = () => {
  const { enqueueSnackbar } = useSnackbar();

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
      </Stack>
    </Container>
  );
};

export default SandboxPage;
