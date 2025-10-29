import { CircularProgress, Stack, Typography } from '@mui/material';

import AuthLayout from '../../app/layout/AuthLayout';

type AuthStatusLayoutProps = {
  title: string;
  description: string;
  message: string;
};

const AuthStatusLayout = ({ title, description, message }: AuthStatusLayoutProps) => (
  <AuthLayout title={title} description={description}>
    <Stack spacing={2} alignItems="center">
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Stack>
  </AuthLayout>
);

export default AuthStatusLayout;
