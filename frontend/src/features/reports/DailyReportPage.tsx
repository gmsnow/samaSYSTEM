import { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';
import { Print, DownloadForOffline } from '@mui/icons-material';
import html2pdf from 'html2pdf.js';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import ReportsPage from './ReportsPage';

const toDateInput = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function DailyReportPage() {
  const { t } = useLanguage();
  const token = localStorage.getItem('accessToken');
  const [date, setDate] = useState(() => toDateInput(new Date()));

  const reportUrl = `${api.defaults.baseURL}/dashboard/daily-report?token=${token}&date=${date}`;

  const downloadPdf = async () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '-10000px';
    iframe.style.width = '1000px';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    try {
      const res = await fetch(`${reportUrl}&autoprint=0`);
      const html = await res.text();

      const idoc = iframe.contentDocument!;
      idoc.open();
      idoc.write(html);
      idoc.close();

      await new Promise<void>(resolve => {
        const check = () => {
          if (idoc.readyState === 'complete' && idoc.fonts?.status === 'loaded') resolve();
          else setTimeout(check, 200);
        };
        setTimeout(check, 200);
        setTimeout(resolve, 5000);
      });

      const el = idoc.body.firstElementChild as HTMLElement;
      await html2pdf().set({
        margin: 0,
        filename: `daily-report-${date}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(el).save();
    } catch { /* ignore */ }
    iframe.remove();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          size="small"
          slotProps={{ htmlInput: { sx: { fontSize: 14 } } }}
        />
        <Button variant="contained" startIcon={<Print />} onClick={() => window.open(reportUrl, '_blank')}>
          {t('common.print')}
        </Button>
        <Button variant="contained" color="success" startIcon={<DownloadForOffline />} onClick={downloadPdf}>
          {t('common.downloadPdf')}
        </Button>
      </Box>
      <ReportsPage period="daily" date={date} />
    </Box>
  );
}
