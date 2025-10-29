import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore, selectAuthInitialized, selectAuthUser } from '../store/auth';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';

type AuthLoaderProps = {
  message?: string;
};

export const AuthLoader = ({ message = 'Загружаем сессию…' }: AuthLoaderProps) => (
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
        {message}
      </Typography>
    </Stack>
  </Box>
);

export const RequireAuth = () => {
  const initialized = useAuthStore(selectAuthInitialized);
  const user = useAuthStore(selectAuthUser);
  const location = useLocation();

  if (!initialized) {
    return <AuthLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
