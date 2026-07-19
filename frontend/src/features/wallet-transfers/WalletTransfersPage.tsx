import { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Paper, TablePagination, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, Stack,
} from '@mui/material';
import { AccountBalanceWallet, Edit, Delete } from '@mui/icons-material';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

const WALLET_TYPES = [
  'جوالي', 'WeCash', 'جيب', 'AHD Financial',
  'موبايل موني', 'كاك بنك',
  'فلوسك', 'بنك الكريمي للتمويل الأصغر الإسلامي',
  'ONE Cash', 'كاش', 'Tamkeen Financial',
  'شامل موني', 'بنك شامل',
  'سبأ كاش', 'محفظتي', 'أم فلوس',
];

interface Session {
  id: string;
  fullname: string;
  price: number | null;
  sessionDate: string | null;
  walletType: string | null;
  transactionNumber: string | null;
  paymentMethod: string | null;
}

export default function WalletTransfersPage() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Session | null>(null);
  const [editForm, setEditForm] = useState({ price: '', wallet_type: '', transaction_number: '' });

  const fetchSessions = () => {
    api.get('/sessions').then(({ data }) => setSessions(data)).catch(() => {});
  };

  useEffect(() => { fetchSessions(); }, []);

  const filtered = useMemo(() => {
    let list = sessions.filter(s => s.paymentMethod === 'محفظة');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.fullname.toLowerCase().includes(q) ||
        (s.walletType || '').toLowerCase().includes(q) ||
        (s.transactionNumber || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.sessionDate || '').getTime() - new Date(a.sessionDate || '').getTime());
  }, [sessions, search]);

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const openEdit = (s: Session) => {
    setSelected(s);
    setEditForm({
      price: s.price?.toString() || '',
      wallet_type: s.walletType || '',
      transaction_number: s.transactionNumber || '',
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selected) return;
    try {
      await api.put(`/sessions/${selected.id}`, {
        price: editForm.price ? parseFloat(editForm.price) : null,
        wallet_type: editForm.wallet_type,
        transaction_number: editForm.transaction_number,
      });
      setEditOpen(false);
      fetchSessions();
    } catch { /* ignore */ }
  };

  const openDelete = (s: Session) => {
    setSelected(s);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selected) return;
    try {
      await api.delete(`/sessions/${selected.id}`);
      setDeleteOpen(false);
      fetchSessions();
    } catch { /* ignore */ }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        الحوالات المالية (المحافظ)
      </Typography>

      <Card>
        <CardContent>
          <TextField
            size="small"
            placeholder="بحث باسم المريض أو المحفظة..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            sx={{ mb: 2, maxWidth: 400 }}
          />

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'action.hover' } }}>
                  <TableCell>المريض</TableCell>
                  <TableCell>نوع المحفظة</TableCell>
                  <TableCell>رقم العملية</TableCell>
                  <TableCell>المبلغ</TableCell>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map(s => (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{s.fullname}</TableCell>
                    <TableCell>
                      <Chip icon={<AccountBalanceWallet />} label={s.walletType || '-'} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell dir="ltr" sx={{ fontFamily: 'monospace' }}>{s.transactionNumber || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>{s.price ?? '-'} ريال</TableCell>
                    <TableCell>{s.sessionDate ? new Date(s.sessionDate).toLocaleDateString('ar-SA') : '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => openEdit(s)} sx={{ bgcolor: '#007bff15', color: '#007bff', '&:hover': { bgcolor: '#007bff25' } }}>
                          <Edit sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => openDelete(s)} sx={{ bgcolor: '#dc354515', color: '#dc3545', '&:hover': { bgcolor: '#dc354525' } }}>
                          <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      لا توجد حوالات مالية
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {filtered.length > rowsPerPage && (
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[rowsPerPage]}
              labelRowsPerPage=""
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>تعديل الحوالة</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="المبلغ" type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
            <TextField select fullWidth label="نوع المحفظة" value={editForm.wallet_type} onChange={e => setEditForm(f => ({ ...f, wallet_type: e.target.value }))}>
              <MenuItem value="">اختر</MenuItem>
              {WALLET_TYPES.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="رقم العملية" value={editForm.transaction_number} onChange={e => setEditForm(f => ({ ...f, transaction_number: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} color="secondary">إلغاء</Button>
          <Button onClick={handleEditSubmit} variant="contained" color="primary">حفظ</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>حذف الحوالة</DialogTitle>
        <DialogContent>
          <Typography>هل أنت متأكد من حذف هذه الحوالة؟</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} color="secondary">إلغاء</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">حذف</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
