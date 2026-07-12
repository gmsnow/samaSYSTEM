'use client';
import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFoundPage() {
  const router = useRouter();
  const { t, dir } = useLanguage();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', direction: dir }}>
      <Typography variant="h1" sx={{ fontWeight: 800, fontSize: 120, color: 'primary.main' }}>404</Typography>
      <Typography variant="h5" sx={{ mb: 2 }}>{t('notFound.title')}</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>{t('notFound.description')}</Typography>
      <Button variant="contained" onClick={() => router.push('/dashboard')}>{t('notFound.back')}</Button>
    </Box>
  );
}
