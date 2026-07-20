import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, TablePagination, Chip, Stack, Tooltip, FormControlLabel, Checkbox,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface Coverage {
  id: string;
  name: string;
  special: boolean;
  date: string;
  price: number;
  time: string | null;
  from: string | null;
  to: string | null;
}

const emptyForm = { name: '', special: false, date: '', price: '', time: '', from: '', to: '' };

export default function CoveragesPage() {
  const { t } = useLanguage();
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Coverage | null>(null);

  const fetchCoverages = async () => {
    try {
      const { data } = await api.get('/coverages');
      setCoverages(data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchCoverages(); }, []);

  const paginated = coverages.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleOpenAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (c: Coverage) => {
    setEditing(c);
    setForm({
      name: c.name,
      special: c.special,
      date: c.date,
      price: c.price.toString(),
      time: c.time ?? '',
      from: c.from ?? '',
      to: c.to ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        special: form.special,
        price: Number(form.price),
      };
      if (editing) {
        await api.put(`/coverages/${editing.id}`, payload);
      } else {
        await api.post('/coverages', payload);
      }
      await fetchCoverages();
      setDialogOpen(false);
    } catch { /* ignore */ }
  };

  const openDelete = (id: string) => { setSelectedId(id); setDeleteOpen(true); };

  const confirmDelete = async () => {
    if (!selectedId) return;
    try {
      await api.delete(`/coverages/${selectedId}`);
      await fetchCoverages();
    } catch { /* ignore */ }
    setDeleteOpen(false);
    setSelectedId(null);
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>{t('coverages.title')}</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
          {t('coverages.add')}
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('coverages.col.name')}</TableCell>
              <TableCell>{t('coverages.col.special')}</TableCell>
              <TableCell>{t('coverages.col.date')}</TableCell>
              <TableCell>{t('coverages.col.price')}</TableCell>
              <TableCell>{t('coverages.col.time')}</TableCell>
              <TableCell>{t('coverages.col.from')}</TableCell>
              <TableCell>{t('coverages.col.to')}</TableCell>
              <TableCell>{t('coverages.col.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map(c => (
              <TableRow key={c.id}>
                <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                <TableCell>
                  <Chip label={c.special ? t('coverages.yes') : t('coverages.no')} size="small" color={c.special ? 'primary' : 'default'} variant="outlined" />
                </TableCell>
                <TableCell>{c.date}</TableCell>
                <TableCell>{c.price.toLocaleString()} YER</TableCell>
                <TableCell>{c.time || '-'}</TableCell>
                <TableCell>{c.from || '-'}</TableCell>
                <TableCell>{c.to || '-'}</TableCell>
                <TableCell>
                  <Tooltip title={t('common.edit')}>
                    <IconButton size="small" onClick={() => handleOpenEdit(c)}><Edit fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton size="small" color="error" onClick={() => openDelete(c.id)}><Delete fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {paginated.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center">{t('coverages.empty')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={coverages.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          labelRowsPerPage={t('common.rowsPerPage')}
        />
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('coverages.edit') : t('coverages.add')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label={t('coverages.form.name')} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth required />
            <FormControlLabel
              control={<Checkbox checked={form.special} onChange={e => setForm(f => ({ ...f, special: e.target.checked }))} />}
              label={t('coverages.form.special')}
            />
            <TextField label={t('coverages.form.date')} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} fullWidth required slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label={t('coverages.form.price')} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} fullWidth required />
            <TextField label={t('coverages.form.time')} type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label={t('coverages.form.from')} value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} fullWidth />
            <TextField label={t('coverages.form.to')} value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('coverages.delete.title')}</DialogTitle>
        <DialogContent><Typography>{t('coverages.delete.confirm')}</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} color="secondary">{t('common.cancel')}</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">{t('coverages.delete.confirmBtn')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
