import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const NotFound = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (theme) => theme.palette.background.default,
        py: { xs: 10, md: 12 },
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) => theme.palette.primary.main,
              color: (theme) => theme.palette.primary.contrastText,
              boxShadow: (theme) => theme.shadows[6],
            }}
          >
            <ReportProblemRoundedIcon fontSize="large" />
          </Box>

          <Typography
            component="h1"
            variant="h2"
            sx={{ fontWeight: 700, fontSize: { xs: '3rem', md: '4rem' } }}
          >
            404
          </Typography>

          <Stack spacing={1}>
            <Typography variant="h5" component="p" sx={{ fontWeight: 600 }}>
              Страница не найдена
            </Typography>
            <Typography color="text.secondary">
              Возможно, вы ошиблись при вводе адреса или страница была удалена. Проверьте
              правильность ссылки или вернитесь на главную страницу.
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 2 }}>
            <Button
              component={RouterLink}
              to="/"
              variant="contained"
              color="primary"
              size="large"
            >
              На главную
            </Button>
            <Button component="a" href="mailto:support@mnemos.app" size="large">
              Написать в поддержку
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default NotFound;
