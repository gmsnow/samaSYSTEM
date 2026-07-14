import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, TablePagination, Chip, Stack, Tooltip,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface Service {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export default function ServicesPage() {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '' });
  const [editing, setEditing] = useState<Service | null>(null);

  const fetchServices = async () => {
    try {
      const { data } = await api.get('/services');
      setServices(data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchServices(); }, []);

  const paginated = services.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleOpenAdd = () => {
    setEditing(null);
    setForm({ name: '', price: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (s: Service) => {
    setEditing(s);
    setForm({ name: s.name, price: s.price.toString() });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/services/${editing.id}`, form);
      } else {
        await api.post('/services', form);
      }
      await fetchServices();
      setDialogOpen(false);
    } catch { /* ignore */ }
  };

  const openDelete = (id: string) => { setSelectedId(id); setDeleteOpen(true); };

  const confirmDelete = async () => {
    if (!selectedId) return;
    try {
      await api.delete(`/services/${selectedId}`);
      await fetchServices();
    } catch { /* ignore */ }
    setDeleteOpen(false);
    setSelectedId(null);
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>{t('services.title') || 'الخدمات'}</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
          {t('services.add') || 'إضافة خدمة'}
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('services.col.name') || 'الاسم'}</TableCell>
              <TableCell>{t('services.col.price') || 'السعر'}</TableCell>
              <TableCell>{t('services.col.status') || 'الحالة'}</TableCell>
              <TableCell>{t('services.col.actions') || 'إجراءات'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map(s => (
              <TableRow key={s.id} sx={{ opacity: s.isActive ? 1 : 0.5 }}>
                <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                <TableCell>{s.price.toLocaleString()} YER</TableCell>
                <TableCell>
                  <Chip label={s.isActive ? 'نشط' : 'غير نشط'} size="small" color={s.isActive ? 'success' : 'default'} variant="outlined" />
                </TableCell>
                <TableCell>
                  <Tooltip title={t('common.edit')}>
                    <IconButton size="small" onClick={() => handleOpenEdit(s)}><Edit fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton size="small" color="error" onClick={() => openDelete(s.id)}><Delete fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {paginated.length === 0 && (
              <TableRow><TableCell colSpan={4} align="center">{t('services.empty') || 'لا توجد خدمات'}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={services.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          labelRowsPerPage={t('common.rowsPerPage')}
        />
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? (t('services.edit') || 'تعديل الخدمة') : (t('services.add') || 'إضافة خدمة')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label={t('services.form.name') || 'الاسم'} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth required />
            <TextField label={t('services.form.price') || 'السعر'} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} fullWidth required />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('patients.delete.title')}</DialogTitle>
        <DialogContent><Typography>{t('patients.delete.confirm')}</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} color="secondary">{t('patients.add.form.cancel')}</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">{t('patients.delete.confirmBtn')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
