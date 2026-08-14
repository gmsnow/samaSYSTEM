import { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Grid, Card, CardContent, Avatar } from '@mui/material';
import { Print, DownloadForOffline, Payments, AccountBalanceWallet, Receipt, Savings } from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import ReportsPage from './ReportsPage';
import { downloadReportPdf } from './reportPdf';

const toMonthInput = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

interface Summary {
  sumSalaries: number;
  sumCoverages: number;
  sumAdvances: number;
}

export default function ReceivablesReportPage() {
  const { t } = useLanguage();
  const token = localStorage.getItem('accessToken');
  const [month, setMonth] = useState(() => toMonthInput(new Date()));
  const [summary, setSummary] = useState<Summary | null>(null);

  const year = Number(month.slice(0, 4));
  const monthNum = Number(month.slice(5, 7));
  const monthIndex = monthNum - 1;

  useEffect(() => {
    api.get('/dashboard/receivables-summary').then(r => setSummary(r.data)).catch(() => {});
  }, []);

  const printUrl = `${api.defaults.baseURL}/dashboard/monthly-report?token=${token}&month=${monthIndex}&year=${year}`;

  const downloadPdf = () => downloadReportPdf(`${printUrl}&autoprint=0`, `receivables-report-${year}-${monthNum}.pdf`);

  const sumNet = (summary?.sumSalaries ?? 0) + (summary?.sumCoverages ?? 0) - (summary?.sumAdvances ?? 0);

  const cards = summary ? [
    { label: t('receivables.sumSalaries'), value: summary.sumSalaries, color: '#3e5679', icon: <Payments /> },
    { label: t('receivables.sumCoverages'), value: summary.sumCoverages, color: '#2e7d32', icon: <Receipt /> },
    { label: t('receivables.sumAdvances'), value: summary.sumAdvances, color: '#e65100', icon: <AccountBalanceWallet /> },
    { label: t('receivables.sumNet'), value: sumNet, color: '#7c4dff', icon: <Savings /> },
  ] : [];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{t('nav.receivables')}</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          size="small"
          slotProps={{ htmlInput: { sx: { fontSize: 14 } } }}
        />
        <Button variant="contained" startIcon={<Print />} onClick={() => window.open(printUrl, '_blank')}>
          {t('common.print')}
        </Button>
        <Button variant="contained" color="success" startIcon={<DownloadForOffline />} onClick={downloadPdf}>
          {t('common.downloadPdf')}
        </Button>
      </Box>

      {cards.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {cards.map((c, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Card><CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: `${c.color}15`, color: c.color, mx: 'auto', mb: 1 }}>{c.icon}</Avatar>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>YER {c.value.toLocaleString()}</Typography>
                <Typography variant="body2" color="text.secondary">{c.label}</Typography>
              </CardContent></Card>
            </Grid>
          ))}
        </Grid>
      )}

      <ReportsPage period="monthly" />
    </Box>
  );
}
