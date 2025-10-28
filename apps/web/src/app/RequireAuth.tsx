import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore, selectAuthInitialized, selectAuthUser } from '../store/auth';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';

const LoadingScreen = () => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Stack spacing={2} alignItems="center">
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Загружаем сессию…
      </Typography>
    </Stack>
  </Box>
);

export const RequireAuth = () => {
  const initialized = useAuthStore(selectAuthInitialized);
  const user = useAuthStore(selectAuthUser);
  const location = useLocation();

  if (!initialized) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
