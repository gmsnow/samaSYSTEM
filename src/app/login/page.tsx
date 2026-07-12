'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t, dir } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || t('auth.login.failed'));
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'url(https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <Card sx={{ maxWidth: 420, width: '90%', p: 4 }}>
        <CardContent>
          <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', mb: 1 }}>
            SAMA CENTER
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
            {t('auth.login.subtitle')}
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label={t('auth.login.username')} value={username} onChange={e => setUsername(e.target.value)} sx={{ mb: 2 }} required />
            <TextField fullWidth label={t('auth.login.password')} type="password" value={password} onChange={e => setPassword(e.target.value)} sx={{ mb: 3 }} required />
            <Button fullWidth variant="contained" type="submit" disabled={loading} sx={{ py: 1.5, fontWeight: 700 }}>
              {loading ? t('common.loading') : t('auth.login.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
