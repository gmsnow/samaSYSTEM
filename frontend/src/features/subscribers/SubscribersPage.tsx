import { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Stack,
} from '@mui/material';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface Session {
  id: string;
  fullname: string;
  sessionType: string;
  speacial: string | null;
  sessionDate: string | null;
  price: number | null;
  subscriptionPeriod: string | null;
  subscriptionAmount: number | null;
  subscriptionDay: number | null;
}

const periodLabel = (p: string) => {
  if (p === 'month') return 'شهر';
  if (p === 'week') return 'أسبوع';
  return 'يوم';
};

export default function SubscribersPage() {
  const { t } = useLanguage();
  const [subscribers, setSubscribers] = useState<Session[]>([]);

  useEffect(() => {
    api.get('/sessions').then(({ data }) => {
      setSubscribers((data as Session[]).filter(s => s.subscriptionPeriod));
    }).catch(() => {});
  }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{t('subscribers.title')}</Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>اسم المريض</TableCell>
              <TableCell>نوع الجلسة</TableCell>
              <TableCell>المعالج</TableCell>
              <TableCell>السعر</TableCell>
              <TableCell>الاشتراك</TableCell>
              <TableCell>مبلغ الاشتراك</TableCell>
              <TableCell>اليوم</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subscribers.map(s => (
              <TableRow key={s.id}>
                <TableCell sx={{ fontWeight: 600 }}>{s.fullname}</TableCell>
                <TableCell>{s.sessionType}</TableCell>
                <TableCell>{s.speacial || '-'}</TableCell>
                <TableCell>{s.price ? `${s.price.toLocaleString()} YER` : '-'}</TableCell>
                <TableCell><Chip label={periodLabel(s.subscriptionPeriod!)} size="small" color="primary" variant="outlined" /></TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{s.subscriptionAmount?.toLocaleString()} YER</TableCell>
                <TableCell>{s.subscriptionDay ?? '-'}</TableCell>
              </TableRow>
            ))}
            {subscribers.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>{t('subscribers.empty')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
