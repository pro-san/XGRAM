import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Tabs,
  Tab,
  Alert,
  Divider,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { loginWithEmail, registerWithEmail, loginWithGoogle } from '../../firebase/auth';
import { useUIStore } from '../../store/uiStore';
import { t } from '../../i18n/strings';

export default function AuthPage() {
  const language = useUIStore((s) => s.language);
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      if (tab === 0) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(
          email,
          password,
          displayName.slice(0, 100),
          username.slice(0, 60),
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      if (msg.includes('auth/operation-not-allowed') || msg.includes('auth/configuration-not-found')) {
        setError(
          'Email/Password sign-in is not enabled in the Firebase Console yet. Please use "Continue with Google" below, or enable Email/Password under Authentication > Sign-in method in your Firebase Console.',
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: 380, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, textAlign: 'center' }}>
          {t(language, 'appName')}
        </Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
          <Tab label={t(language, 'login')} />
          <Tab label={t(language, 'register')} />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          {tab === 1 && (
            <>
              <TextField
                label={t(language, 'displayName')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 100))}
                fullWidth
              />
              <TextField
                label={t(language, 'username')}
                value={username}
                onChange={(e) => setUsername(e.target.value.slice(0, 60))}
                fullWidth
              />
            </>
          )}
          <TextField
            label={t(language, 'email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.slice(0, 254))}
            fullWidth
          />
          <TextField
            label={t(language, 'password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={loading}
          >
            {tab === 0 ? t(language, 'login') : t(language, 'register')}
          </Button>
          <Divider>or</Divider>
          <Button
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogle}
            disabled={loading}
          >
            {t(language, 'continueWithGoogle')}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
