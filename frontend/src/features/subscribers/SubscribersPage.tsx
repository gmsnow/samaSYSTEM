import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, IconButton, Pagination, Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack } from '@mui/material';
import { Edit, Delete, Close, Download, CheckCircle } from '@mui/icons-material';
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

const typeLabels: Record<string, string> = {
  physiotherapy: 'علاج طبيعي',
  'physiotherapy (adults)': 'جلسات علاج طبيعي (كبار)',
  'physiotherapy (children)': 'جلسات علاج طبيعي (أطفال)',
};

export default function SubscribersPage() {
  const { t } = useLanguage();
  const [subscribers, setSubscribers] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ subscription_amount: '', subscription_day: '' });

  const fetch = useCallback(() => {
    api.get('/sessions').then(({ data }) => {
      setSubscribers((data as Session[]).filter(s => s.subscriptionPeriod && s.subscriptionAmount));
    }).catch(() => {});
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = subscribers.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.fullname.toLowerCase().includes(q)
      || s.sessionType.toLowerCase().includes(q)
      || (s.speacial && s.speacial.toLowerCase().includes(q));
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const openEdit = (s: Session) => {
    setSelectedId(s.id);
    setEditForm({ subscription_amount: s.subscriptionAmount?.toString() || '', subscription_day: s.subscriptionDay?.toString() || '' });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      await api.put(`/sessions/${selectedId}`, {
        subscription_amount: editForm.subscription_amount ? Number(editForm.subscription_amount) : null,
        subscription_day: editForm.subscription_day ? Number(editForm.subscription_day) : null,
      });
      setEditOpen(false);
      fetch();
    } catch { /* ignore */ }
  };

  const openDelete = (id: string) => {
    setSelectedId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    try {
      await api.delete(`/sessions/${selectedId}`);
      setDeleteOpen(false);
      fetch();
    } catch { /* ignore */ }
  };

  const handleAttend = async (s: Session) => {
    try {
      await api.put(`/sessions/${s.id}`, {
        subscription_day: Math.max(0, (s.subscriptionDay ?? 1) - 1),
      });
      fetch();
    } catch { /* ignore */ }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{t('subscribers.title')}</Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField size="small" placeholder="بحث..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(0); }} sx={{ maxWidth: 320 }} />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'action.hover' } }}>
              <TableCell>اسم المريض</TableCell>
              <TableCell>نوع الجلسة</TableCell>
              <TableCell>المعالج</TableCell>
              <TableCell>المبلغ</TableCell>
              <TableCell>اليوم</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map(s => (
              <TableRow key={s.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                <TableCell sx={{ fontWeight: 600 }}>{s.fullname}</TableCell>
                <TableCell>{typeLabels[s.sessionType] || s.sessionType}</TableCell>
                <TableCell>{s.speacial || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{s.subscriptionAmount?.toLocaleString()} YER</TableCell>
                <TableCell>{s.subscriptionDay ?? '-'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => openEdit(s)} sx={{ bgcolor: '#007bff15', color: '#007bff', '&:hover': { bgcolor: '#007bff25' } }}>
                      <Edit sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleAttend(s)} sx={{ bgcolor: '#28a74515', color: '#28a745', '&:hover': { bgcolor: '#28a74525' } }}>
                      <CheckCircle sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton size="small" sx={{ bgcolor: '#17a2b815', color: '#17a2b8', '&:hover': { bgcolor: '#17a2b825' } }}>
                      <Download sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => openDelete(s.id)} sx={{ bgcolor: '#dc354515', color: '#dc3545', '&:hover': { bgcolor: '#dc354525' } }}>
                      <Delete sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  {searchQuery ? `لا توجد نتائج — "${searchQuery}"` : t('subscribers.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)} color="primary" size="small" />
        </Box>
      )}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={handleEditSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>تعديل الاشتراك</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField fullWidth label="مبلغ الاشتراك" type="number" value={editForm.subscription_amount} onChange={e => setEditForm(f => ({ ...f, subscription_amount: e.target.value }))} />
              <TextField fullWidth label="اليوم" type="number" value={editForm.subscription_day} onChange={e => setEditForm(f => ({ ...f, subscription_day: e.target.value }))} slotProps={{ htmlInput: { min: 1, max: 31 } }} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditOpen(false)} color="secondary">إلغاء</Button>
            <Button type="submit" variant="contained" color="primary">حفظ</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>حذف الاشتراك</DialogTitle>
        <DialogContent>
          <Typography>هل أنت متأكد من حذف هذا الاشتراك؟</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} color="secondary">إلغاء</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">حذف</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
