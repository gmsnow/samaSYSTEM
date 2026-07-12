'use client';
import { Typography, Box } from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AppointmentsPage() {
  const { t } = useLanguage();
  return <Box sx={{ p: 3 }}><Typography variant="h5">{t('appointments.title')}</Typography></Box>;
}
