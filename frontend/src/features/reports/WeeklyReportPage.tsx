import { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';
import { Print, DownloadForOffline } from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import ReportsPage from './ReportsPage';
import { downloadReportPdf } from './reportPdf';

const toDateInput = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const weekStartOf = (d: Date) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - (copy.getDay() === 6 ? 0 : copy.getDay() + 1));
  return toDateInput(copy);
};

export default function WeeklyReportPage() {
  const { t } = useLanguage();
  const token = localStorage.getItem('accessToken');
  const [weekDate, setWeekDate] = useState(() => toDateInput(new Date()));
  const weekStart = weekStartOf(new Date(`${weekDate}T00:00:00`));

  const printUrl = `${api.defaults.baseURL}/dashboard/weekly-report?token=${token}&weekStart=${weekStart}`;

  const downloadPdf = () => downloadReportPdf(`${printUrl}&autoprint=0`, `weekly-report-${weekStart}.pdf`);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          type="date"
          value={weekDate}
          onChange={e => setWeekDate(e.target.value)}
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
      <ReportsPage period="weekly" date={weekStart} />
    </Box>
  );
}
