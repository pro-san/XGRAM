import { createTheme } from '@mui/material/styles';
import type { ThemeMode } from '../types';

export function getTheme(mode: ThemeMode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#2AABEE' },
      secondary: { main: '#229ED9' },
      background:
        mode === 'light'
          ? { default: '#FFFFFF', paper: '#F4F4F5' }
          : { default: '#0E1621', paper: '#17212B' },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: [
        'Noto Sans',
        'Noto Sans Khmer',
        '-apple-system',
        'Roboto',
        'Arial',
        'sans-serif',
      ].join(','),
    },
  });
}
