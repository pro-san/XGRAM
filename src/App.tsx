import { useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { getTheme } from './theme/theme';
import AuthPage from './components/auth/AuthPage';
import MainLayout from './components/layout/MainLayout';

export default function App() {
  const { init, firebaseUser, loading } = useAuthStore();
  const themeMode = useUIStore((s) => s.themeMode);

  useEffect(() => {
    const unsub = init();
    return () => unsub();
  }, [init]);

  const theme = getTheme(themeMode);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {firebaseUser ? <MainLayout /> : <AuthPage />}
    </ThemeProvider>
  );
}
