import type { ThemeOptions } from '@mui/material/styles';

export const typography: NonNullable<ThemeOptions['typography']> = {
  fontFamily: ['"Inter"', '"Roboto"', '"Helvetica Neue"', 'Arial', 'sans-serif'].join(','),
  h1: { fontWeight: 700 },
  h2: { fontWeight: 700 },
  h3: { fontWeight: 700 },
};
