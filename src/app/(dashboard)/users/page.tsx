'use client';
import { Typography, Box } from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';

export default function UsersPage() {
  const { t } = useLanguage();
  return <Box sx={{ p: 3 }}><Typography variant="h5">{t('users.title')}</Typography></Box>;
}
