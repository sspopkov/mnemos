import { Avatar, Button, Stack, Typography } from '@mui/material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { Link as RouterLink } from 'react-router-dom';

import AuthLayout from '../../app/layout/AuthLayout';

type AuthAuthenticatedLayoutProps = {
  title: string;
  description: string;
  email: string;
  hint: string;
  onLogout: () => void | Promise<void>;
  isLoggingOut: boolean;
};

const AuthAuthenticatedLayout = ({
  title,
  description,
  email,
  hint,
  onLogout,
  isLoggingOut,
}: AuthAuthenticatedLayoutProps) => (
  <AuthLayout title={title} description={description}>
    <Stack spacing={4}>
      <Stack spacing={1} alignItems="center" textAlign="center">
        <Avatar sx={{ bgcolor: 'primary.main', width: 72, height: 72 }}>
          <PersonRoundedIcon fontSize="large" />
        </Avatar>
        <Typography variant="h6">{email}</Typography>
        <Typography variant="body2" color="text.secondary">
          {hint}
        </Typography>
      </Stack>

      <Stack spacing={2} sx={{ width: '100%' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<LogoutRoundedIcon />}
          onClick={onLogout}
          disabled={isLoggingOut}
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

export default AuthAuthenticatedLayout;
