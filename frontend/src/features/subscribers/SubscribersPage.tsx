import { Box, Typography } from '@mui/material';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SubscribersPage() {
  const { t } = useLanguage();
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>{t('subscribers.title')}</Typography>
    </Box>
  );
}
