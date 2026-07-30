import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  FormControl, InputLabel, Select, IconButton, TablePagination, Chip, Stack, Tooltip,
} from '@mui/material';
import { Add, Delete, Edit, Receipt } from '@mui/icons-material';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatDate } from '../../shared/formatDate';

interface Invoice {
  id: string;
  patient: string;
  amount: number;
  date: string;
  status: string;
  notes: string | null;
}

export default function InvoicesPage() {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ patient: '', amount: 0, date: '', status: 'pending', notes: '' });
  const [editing, setEditing] = useState<Invoice | null>(null);

  useEffect(() => {
    api.get('/invoices').then(({ data }) => setInvoices(data)).catch(() => {});
  }, []);

  const handleOpenAdd = () => {
    const today = new Date().toISOString().slice(0, 10);
    setEditing(null);
    setForm({ patient: '', amount: 0, date: today, status: 'pending', notes: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditing(inv);
    setForm({ patient: inv.patient, amount: inv.amount, date: inv.date, status: inv.status, notes: inv.notes || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/invoices/${editing.id}`, form);
      } else {
        await api.post('/invoices', form);
      }
      const { data } = await api.get('/invoices');
      setInvoices(data);
      setDialogOpen(false);
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/invoices/${id}`);
      const { data } = await api.get('/invoices');
      setInvoices(data);
    } catch { /* ignore */ }
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return invoices;
    const q = searchQuery.toLowerCase();
    return invoices.filter(inv =>
      inv.patient.toLowerCase().includes(q)
      || inv.status.toLowerCase().includes(q)
      || inv.amount.toString().includes(q)
      || (inv.notes && inv.notes.toLowerCase().includes(q))
    );
  }, [invoices, searchQuery]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const totalAmount = useMemo(() => invoices.reduce((sum, inv) => sum + inv.amount, 0), [invoices]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Receipt sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{t('invoices.title')}</Typography>
          <Chip label={`${t('invoices.total')}: ${totalAmount.toLocaleString()} YER`} color="warning" />
        </Stack>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
          {t('invoices.add')}
        </Button>
      </Stack>

      <TextField size="small" placeholder={t('invoices.search')} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(0); }} sx={{ mb: 1.5, maxWidth: 320 }} />
      <TableContainer component={Paper}>
        <Table dir="rtl">
          <TableHead>
            <TableRow>
              <TableCell>{t('invoices.col.patient')}</TableCell>
              <TableCell>{t('invoices.col.amount')}</TableCell>
              <TableCell>{t('invoices.col.date')}</TableCell>
              <TableCell>{t('invoices.col.status')}</TableCell>
              <TableCell>{t('invoices.col.notes')}</TableCell>
              <TableCell>{t('invoices.col.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map(inv => (
              <TableRow key={inv.id}>
                <TableCell sx={{ fontWeight: 600 }}>{inv.patient}</TableCell>
                <TableCell>{inv.amount.toLocaleString()} YER</TableCell>
                <TableCell>{formatDate(inv.date)}</TableCell>
                <TableCell>
                  <Chip label={t(`invoices.status.${inv.status}`)} size="small" color={statusColor(inv.status)} sx={{ fontWeight: 600 }} />
                </TableCell>
                <TableCell>{inv.notes || '-'}</TableCell>
                <TableCell>
                  <Tooltip title={t('common.edit')}>
                    <IconButton size="small" onClick={() => handleOpenEdit(inv)}><Edit fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton size="small" color="error" onClick={() => handleDelete(inv.id)}><Delete fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {paginated.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">{t('invoices.empty')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          labelRowsPerPage={t('common.rowsPerPage')}
        />
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('invoices.edit') : t('invoices.add')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('invoices.form.patient')}
              value={form.patient}
              onChange={e => setForm(f => ({ ...f, patient: e.target.value }))}
              fullWidth
            />
            <TextField
              label={t('invoices.form.amount')}
              type="number"
              value={form.amount || ''}
              onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
              fullWidth
            />
            <TextField
              label={t('invoices.form.date')}
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl fullWidth>
              <InputLabel>{t('invoices.form.status')}</InputLabel>
              <Select
                value={form.status}
                label={t('invoices.form.status')}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                <MenuItem value="pending">{t('invoices.status.pending')}</MenuItem>
                <MenuItem value="paid">{t('invoices.status.paid')}</MenuItem>
                <MenuItem value="cancelled">{t('invoices.status.cancelled')}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={t('invoices.form.notes')}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
