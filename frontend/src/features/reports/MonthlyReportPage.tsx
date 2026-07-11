import { Box, Button } from '@mui/material';
import { Print } from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import ReportsPage from './ReportsPage';

export default function MonthlyReportPage() {
  const { t } = useLanguage();
  const token = localStorage.getItem('accessToken');
  const printUrl = `${api.defaults.baseURL}/dashboard/monthly-report?token=${token}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Print />} onClick={() => window.open(printUrl, '_blank')}>
          {t('common.print')}
        </Button>
      </Box>
      <ReportsPage period="monthly" />
    </Box>
  );
}
