import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, TablePagination, Chip, Stack, Tooltip,
  FormControl, FormLabel, FormControlLabel, Radio, RadioGroup, Select, MenuItem, InputLabel,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface Coverage {
  id: string;
  name: string;
  sessionType: string;
  date: string;
  price: number;
  from: string | null;
  to: string | null;
}

interface Employee {
  id: string;
  name: string;
}

const emptyForm = { name: '', sessionType: 'normal', date: '', price: '', from: '', to: '' };

function calcPrice(from: string, to: string): number {
  if (!from || !to) return 0;
  const [fH, fM] = from.split(':').map(Number);
  const [tH, tM] = to.split(':').map(Number);
  const diff = (tH * 60 + tM) - (fH * 60 + fM);
  if (diff <= 0) return 0;
  const hours = diff / 60;
  return Math.ceil(hours) * 500;
}

export default function CoveragesPage() {
  const { t } = useLanguage();
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Coverage | null>(null);

  const autoPrice = useMemo(() => {
    if (form.sessionType !== 'normal') return null;
    return calcPrice(form.from, form.to);
  }, [form.sessionType, form.from, form.to]);

  const fetchCoverages = async () => {
    try {
      const { data } = await api.get('/coverages');
      setCoverages(data);
    } catch { /* ignore */ }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/employees');
      setEmployees(data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchCoverages(); fetchEmployees(); }, []);

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
      sessionType: c.sessionType || 'normal',
      date: c.date,
      price: c.price.toString(),
      from: c.from ?? '',
      to: c.to ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name,
        sessionType: form.sessionType,
        date: form.date,
        price: form.sessionType === 'normal' ? (autoPrice ?? 0) : Number(form.price),
        from: form.from || null,
        to: form.to || null,
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

  const isNormal = form.sessionType === 'normal';

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
              <TableCell>{t('coverages.col.sessionType')}</TableCell>
              <TableCell>{t('coverages.col.date')}</TableCell>
              <TableCell>{t('coverages.col.price')}</TableCell>
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
                  <Chip
                    label={c.sessionType === 'hijama' ? t('coverages.sessionType.hijama') : t('coverages.sessionType.normal')}
                    size="small"
                    color={c.sessionType === 'hijama' ? 'warning' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{c.date}</TableCell>
                <TableCell>{c.price.toLocaleString()} YER</TableCell>
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
              <TableRow><TableCell colSpan={7} align="center">{t('coverages.empty')}</TableCell></TableRow>
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
            <FormControl fullWidth required>
              <InputLabel>{t('coverages.form.name')}</InputLabel>
              <Select
                value={form.name}
                label={t('coverages.form.name')}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              >
                {employees.map(emp => (
                  <MenuItem key={emp.id} value={emp.name}>{emp.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>{t('coverages.form.sessionType')}</FormLabel>
              <RadioGroup
                row
                value={form.sessionType}
                onChange={e => setForm(f => ({ ...f, sessionType: e.target.value }))}
              >
                <FormControlLabel value="normal" control={<Radio />} label={t('coverages.sessionType.normal')} />
                <FormControlLabel value="hijama" control={<Radio />} label={t('coverages.sessionType.hijama')} />
              </RadioGroup>
            </FormControl>

            <TextField
              label={t('coverages.form.date')}
              type="datetime-local"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />

            {isNormal ? (
              <>
                <TextField
                  label={t('coverages.form.from')}
                  type="time"
                  value={form.from}
                  onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
                  fullWidth
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label={t('coverages.form.to')}
                  type="time"
                  value={form.to}
                  onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                  fullWidth
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label={t('coverages.form.price')}
                  value={autoPrice !== null ? `${autoPrice.toLocaleString()} YER` : ''}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
              </>
            ) : (
              <TextField
                label={t('coverages.form.price')}
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                fullWidth
                required
              />
            )}
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
