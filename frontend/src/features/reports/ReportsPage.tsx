import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Table, TableHead, TableBody, TableRow, TableCell, Chip, Avatar } from '@mui/material';
import { People, Paid, Receipt, TrendingUp } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';

const periodLabel: Record<string, string> = {
  daily: 'nav.dailyReport',
  weekly: 'nav.weeklyReport',
  monthly: 'nav.monthlyReport',
};

const colors = ['#3e5679', '#2e7d32', '#7c4dff', '#e65100', '#00838f', '#558b2f', '#c62828', '#6a1b9a'];

export default function ReportsPage({ period }: { period: string }) {
  const { t, locale } = useLanguage();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/dashboard/stats', { params: { locale } }).then(r => setData(r.data)).catch(() => {});
  }, [locale]);

  if (!data) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><Typography color="text.secondary">{t('common.loading')}</Typography></Box>;
  }

  const isCurrentPeriod = (dateStr: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    if (period === 'daily') return d.toDateString() === now.toDateString();
    if (period === 'weekly') {
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
      return d >= weekStart;
    }
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const recentPatients = data.recentPatients?.filter((p: any) => isCurrentPeriod(p.createdAt)) || data.recentPatients?.slice(0, 5) || [];
  const recentAppts = data.recentAppointments?.filter((a: any) => isCurrentPeriod(a.date)) || data.recentAppointments?.slice(0, 5) || [];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>{t(periodLabel[period] || periodLabel.monthly)}</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: '#3e567915', color: '#3e5679', mx: 'auto', mb: 1 }}><Paid /></Avatar>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>YER {data.revenueOverview.revenue.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary">{t('dashboard.earnings')}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: '#2e7d3215', color: '#2e7d32', mx: 'auto', mb: 1 }}><Receipt /></Avatar>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>{data.revenueOverview.sessions}</Typography>
            <Typography variant="body2" color="text.secondary">{t('dashboard.totalSessions')}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: '#7c4dff15', color: '#7c4dff', mx: 'auto', mb: 1 }}><People /></Avatar>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>{data.totals.totalPatients}</Typography>
            <Typography variant="body2" color="text.secondary">{t('dashboard.statTotalPatients')}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: '#e6510015', color: '#e65100', mx: 'auto', mb: 1 }}><TrendingUp /></Avatar>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>{data.growthRates.revenue}</Typography>
            <Typography variant="body2" color="text.secondary">{t('dashboard.vsLastMonth')}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{t('dashboard.revenue')}</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3e5679" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{t('dashboard.sessionTypes')}</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={data.sessionTypes} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {data.sessionTypes.map((e: any, i: number) => <Cell key={e.name} fill={colors[i % colors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{t('dashboard.recentAppointments')}</Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>{t('appointments.col.patient')}</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>{t('appointments.col.therapist')}</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>{t('appointments.col.date')}</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>{t('appointments.col.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppts.map((a: any, i: number) => (
                      <tr key={a.id} style={{ borderBottom: i < recentAppts.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{a.patient}</td>
                        <td style={{ padding: '10px 12px' }}>{a.therapist || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>{a.date || '—'}</td>
                        <td style={{ padding: '10px 12px' }}><Chip label={a.status || '—'} size="small" color={a.status === 'paid' ? 'success' : a.status === 'cancelled' ? 'error' : 'warning'} sx={{ height: 22, fontSize: 11 }} /></td>
                      </tr>
                    ))}
                    {recentAppts.length === 0 && <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: 'text.secondary' }}>{t('dashboard.noAppointments')}</td></tr>}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{t('dashboard.recentPatients')}</Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>{t('patients.add.form.name')}</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>{t('patients.add.form.phone')}</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>{t('patients.add.form.gender')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPatients.map((p: any, i: number) => (
                      <tr key={p.id} style={{ borderBottom: i < recentPatients.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: '10px 12px' }}>{p.phone}</td>
                        <td style={{ padding: '10px 12px' }}><Chip label={p.gender} size="small" variant="outlined" sx={{ height: 22, fontSize: 11 }} /></td>
                      </tr>
                    ))}
                    {recentPatients.length === 0 && <tr><td colSpan={3} style={{ padding: 20, textAlign: 'center', color: 'text.secondary' }}>{t('dashboard.noPatients')}</td></tr>}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
