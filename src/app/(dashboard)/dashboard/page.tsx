'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Button,
} from '@mui/material';
import { People, CalendarMonth, MedicalServices, Paid } from '@mui/icons-material';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

interface DashboardData {
  mainCards: {
    totalPatients: { value: number; trend: string; up: boolean; trendLabel: string };
    todaysAppointments: { value: number; trend: string; up: boolean; trendLabel: string };
    activeTherapists: { value: number; trend: string; up: boolean; trendLabel: string };
    monthlyRevenue: { value: number; trend: string; up: boolean; trendLabel: string };
  };
}

export default function DashboardPage() {
  const { t, dir, locale } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get('/dashboard/stats', { params: { locale } }).then(r => setData(r.data)).catch(() => {});
  }, [locale]);

  if (!data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography color="text.secondary">{t('common.loading')}</Typography>
      </Box>
    );
  }

  const cards = [
    { label: t('dashboard.statTotalPatients'), value: data.mainCards.totalPatients.value.toLocaleString(), icon: <People />, color: '#3e5679' },
    { label: t('dashboard.statTodayAppointments'), value: data.mainCards.todaysAppointments.value.toLocaleString(), icon: <CalendarMonth />, color: '#2e7d32' },
    { label: t('dashboard.statActiveTherapists'), value: data.mainCards.activeTherapists.value.toLocaleString(), icon: <MedicalServices />, color: '#7c4dff' },
    { label: t('dashboard.statMonthlyRevenue'), value: `YER ${data.mainCards.monthlyRevenue.value.toLocaleString()}`, icon: <Paid />, color: '#e65100' },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        {t('dashboard.greeting.morning')}, {user?.firstName || 'Admin'}!
      </Typography>
      <Grid container spacing={3}>
        {cards.map(card => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>{card.label}</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{card.value}</Typography>
                  </Box>
                  <Avatar sx={{ width: 48, height: 48, bgcolor: `${card.color}18`, color: card.color }}>{card.icon}</Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
