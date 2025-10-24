import type { PaletteMode } from '@mui/material';
import type { ThemeOptions } from '@mui/material/styles';

import { darkPalette, lightPalette } from '../theme/palette.ts';
import { typography } from '../theme/typography.ts';

export const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light' ? lightPalette : darkPalette),
  },
  typography,
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 999,
        },
      },
    },
  },
});
