import { useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import type { PaletteMode } from '@mui/material';

import { AppShell, type NavigationItem } from './layout/AppShell.tsx';
import { Home } from '../pages/Home.tsx';
import { getDesignTokens } from '../utils/theme.ts';

export const App = () => {
  const [mode, setMode] = useState<PaletteMode>('light');
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const navigation: NavigationItem[] = [
    {
      label: 'Главная',
      href: '/',
      description: 'Обзор состояния сервисов',
    },
  ];

  const handleToggleColorMode = () => {
    setMode((prevMode: PaletteMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell navItems={navigation} colorMode={mode} onToggleColorMode={handleToggleColorMode}>
        <Home />
      </AppShell>
    </ThemeProvider>
  );
};

export default App;
