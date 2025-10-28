import { Box, Container, Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type AuthLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export const AuthLayout = ({ title, description, children }: AuthLayoutProps) => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: (theme) => theme.palette.background.default,
      p: 2,
    }}
  >
    <Container maxWidth="sm">
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="h4" component="h1" fontWeight={700}>
              {title}
            </Typography>
            {description && (
              <Typography variant="body1" color="text.secondary">
                {description}
              </Typography>
            )}
          </Stack>
          {children}
        </Stack>
      </Paper>
    </Container>
  </Box>
);

export default AuthLayout;
