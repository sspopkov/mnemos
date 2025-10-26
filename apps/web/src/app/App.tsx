import { useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AppShell, type NavigationItem } from './layout/AppShell';
import Home from '../pages/Home';
import RecordsPage from '../features/records/RecordsPage';
import { getDesignTokens } from '../utils/theme';

export const App = () => {
  const [mode, setMode] = useState<PaletteMode>('light');
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const navigation: NavigationItem[] = [
    { label: 'Главная', href: '/', description: 'Обзор состояния сервисов' },
    { label: 'Записи', href: '/records', description: 'CRUD по записям' },
  ];

  const handleToggleColorMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        {/* AppShell теперь рендерит <Outlet />, а не children */}
        <Routes>
          <Route
            element={
              <AppShell
                navItems={navigation}
                colorMode={mode}
                onToggleColorMode={handleToggleColorMode}
              />
            }
          >
            <Route index element={<Home />} />
            <Route path="/records" element={<RecordsPage />} />
            {/* можно добавить 404 */}
            {/* <Route path="*" element={<NotFound />} /> */}
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
