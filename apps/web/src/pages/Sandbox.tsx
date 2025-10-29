import { useMutation } from '@tanstack/react-query';
import { Alert, Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

import { sandboxFailure, sandboxSuccess } from '../api/sandbox';
import { getErrorMessage } from '../utils/errors';

const SandboxPage = () => {
  const { enqueueSnackbar } = useSnackbar();

  const successMutation = useMutation({
    mutationFn: sandboxSuccess,
    onSuccess: (response) => {
      enqueueSnackbar(response.data.message, { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const failureMutation = useMutation({
    mutationFn: sandboxFailure,
    onSuccess: (response) => {
      enqueueSnackbar(response.data.message, { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const isLoading = successMutation.isPending || failureMutation.isPending;

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Песочница уведомлений
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Страница доступна только в режиме разработки и помогает проверить, как работают
            уведомления при успешных и неуспешных запросах к API.
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={600}>
              Тестовые запросы
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Нажмите одну из кнопок ниже, чтобы отправить запрос на сервер и увидеть уведомление.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="success"
                onClick={() => successMutation.mutate()}
                disabled={isLoading}
              >
                Успешный запрос
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => failureMutation.mutate()}
                disabled={isLoading}
              >
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
