import { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';
import { Print, DownloadForOffline } from '@mui/icons-material';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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
          if (idoc.readyState === 'complete') resolve();
          else setTimeout(check, 100);
        };
        check();
        setTimeout(resolve, 5000);
      });
      await idoc.fonts?.ready;
      await new Promise(r => setTimeout(r, 300));

      const style = idoc.createElement('style');
      style.textContent = `.container{box-shadow:none;border-radius:0}`;
      idoc.head.appendChild(style);

      const el = idoc.body.firstElementChild as HTMLElement;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const pageRatio = ph / pw;
      const canvasRatio = canvas.height / canvas.width;
      const chunkH = Math.round(canvas.width * pageRatio);

      if (canvasRatio <= pageRatio) {
        const h = pw * canvasRatio;
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pw, h);
      } else {
        let y = 0;
        let page = 0;
        while (y < canvas.height) {
          const h = Math.min(chunkH, canvas.height - y);
          const slice = document.createElement('canvas');
          slice.width = canvas.width;
          slice.height = h;
          const ctx = slice.getContext('2d')!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, h);
          ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
          if (page > 0) pdf.addPage();
          pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pw, pw * (h / canvas.width));
          y += h;
          page++;
        }
      }

      pdf.save(`daily-report-${date}.pdf`);
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
