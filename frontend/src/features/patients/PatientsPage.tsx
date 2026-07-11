import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, MenuItem, IconButton, Collapse,
  InputAdornment, CircularProgress, Table, TableHead, TableBody, TableRow, TableCell,
  Pagination, Dialog, DialogTitle, DialogContent, DialogActions, Select, FormControl, InputLabel,
} from '@mui/material';
import { KeyboardArrowUp, Close, CalendarMonth, Edit, Delete, DownloadForOffline } from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';

interface Patient {
  id: string;
  serialNumber: number;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  examType: string | null;
  gender: string | null;
  price: number | null;
  registrationDate: string | null;
  dateOfBirth: string | null;
}

export default function PatientsPage() {
  const { t } = useLanguage();

  const [addOpen, setAddOpen] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rowsPerPage = 10;

  const [form, setForm] = useState({
    examType: '', fullName: '', age: '', gender: '', phone: '', date: '', price: '',
  });

  const [editForm, setEditForm] = useState({
    examType: '', fullName: '', age: '', gender: '', phone: '', date: '', price: '',
  });

  const calcAge = (dob: string | null) => {
    if (!dob) return '';
    return (new Date().getFullYear() - new Date(dob).getFullYear()).toString();
  };

  const formatDate = (d: string | null) => {
    if (!d) return '';
    return new Date(d).toISOString().split('T')[0];
  };

  const calcPrice = (age: number) => (age < 14 ? '1500' : '3000');

  const fetchPatients = useCallback(async () => {
    try { const { data } = await api.get('/patients'); setPatients(data); } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);
  useEffect(() => { setPage(0); }, [searchQuery]);

  const filteredPatients = patients.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.toLowerCase();
    const age = calcAge(p.dateOfBirth);
    const date = formatDate(p.registrationDate);
    const exam = t(p.examType === 'nutrition' ? 'patients.add.form.examType.nutrition' : 'patients.add.form.examType.physiotherapy').toLowerCase();
    return name.includes(q) || exam.includes(q) || (p.phone && p.phone.includes(q)) || age.includes(q) || date.includes(q) || (p.price && p.price.toString().includes(q));
  });
  const totalPages = Math.ceil(filteredPatients.length / rowsPerPage);
  const paginatedPatients = filteredPatients.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'age') {
        const age = parseInt(value, 10);
        next.price = isNaN(age) ? '' : calcPrice(age);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await api.post('/patients', form);
      setMessage({ text: t('patients.add.form.saved'), type: 'success' });
      setForm({ examType: '', fullName: '', age: '', gender: '', phone: '', date: '', price: '' });
      fetchPatients();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Error saving patient', type: 'error' });
    }
    setSubmitting(false);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleReset = () => {
    setForm({ examType: '', fullName: '', age: '', gender: '', phone: '', date: '', price: '' });
  };

  const openEdit = async (id: string) => {
    try {
      const { data: p } = await api.get<Patient>(`/patients/${id}`);
      const age = calcAge(p.dateOfBirth);
      setSelectedId(id);
      setEditForm({
        examType: p.examType || '',
        fullName: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(),
        age,
        gender: p.gender || '',
        phone: p.phone || '',
        date: formatDate(p.registrationDate),
        price: age ? calcPrice(parseInt(age)) : '',
      });
      setEditOpen(true);
    } catch { /* ignore */ }
  };

  const handleEditChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setEditForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'age') {
        const age = parseInt(value, 10);
        next.price = isNaN(age) ? '' : calcPrice(age);
      }
      return next;
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      const { data } = await api.put(`/patients/${selectedId}`, editForm);
      setMessage({ text: data.message, type: 'success' });
      setEditOpen(false);
      fetchPatients();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Error', type: 'error' });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  const openDelete = (id: string) => { setSelectedId(id); setDeleteOpen(true); };

  const confirmDelete = async () => {
    if (!selectedId) return;
    try {
      const { data } = await api.delete(`/patients/${selectedId}`);
      setMessage({ text: data.message, type: 'success' });
      fetchPatients();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Error', type: 'error' });
    }
    setDeleteOpen(false);
    setSelectedId(null);
    setTimeout(() => setMessage(null), 4000);
  };

  const downloadPatientFile = (p: Patient) => {
    const token = localStorage.getItem('accessToken');
    window.open(`/api/patients/${p.id}/file?lang=en&token=${token}`, '_blank');
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>{t('patients.title')}</Typography>
      </Box>

      {/* Add Patient Form */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{t('patients.add.form.details')}</Typography>
          <IconButton size="small" onClick={() => setAddOpen(o => !o)} sx={{ color: 'text.secondary' }}>
            <KeyboardArrowUp sx={{ transform: addOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: '0.3s' }} />
          </IconButton>
        </Box>
        <Collapse in={addOpen}>
          <CardContent sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ '& .MuiTextField-root': { mb: 2.5 } }}>
              <TextField select fullWidth label={t('patients.add.form.examType')} value={form.examType} onChange={handleChange('examType')} required>
                <MenuItem value="" disabled>{t('patients.add.form.examType')}</MenuItem>
                <MenuItem value="physiotherapy">{t('patients.add.form.examType.physiotherapy')}</MenuItem>
                <MenuItem value="nutrition">{t('patients.add.form.examType.nutrition')}</MenuItem>
              </TextField>
              <TextField fullWidth label={t('patients.add.form.name')} value={form.fullName} onChange={handleChange('fullName')} required />
              <TextField fullWidth label={t('patients.add.form.age')} type="number" value={form.age} onChange={handleChange('age')} />
              <TextField select fullWidth label={t('patients.add.form.gender')} value={form.gender} onChange={handleChange('gender')} required>
                <MenuItem value="" disabled>{t('patients.add.form.gender')}</MenuItem>
                <MenuItem value="male">{t('patients.add.form.gender.male')}</MenuItem>
                <MenuItem value="female">{t('patients.add.form.gender.female')}</MenuItem>
              </TextField>
              <TextField fullWidth label={t('patients.add.form.phone')} value={form.phone} onChange={handleChange('phone')}
                placeholder="+967" required
                slotProps={{ input: { sx: { dir: 'ltr' } } }}
              />
              <TextField fullWidth label={t('patients.add.form.date')} type="date" value={form.date} onChange={handleChange('date')}
                slotProps={{ inputLabel: { shrink: true }, input: { endAdornment: <InputAdornment position="end"><CalendarMonth /></InputAdornment> } }}
              />
              <TextField fullWidth label={t('patients.add.form.price')} type="number" value={form.price}
                slotProps={{ input: { readOnly: true } }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Button variant="outlined" color="warning" onClick={handleReset}>{t('patients.add.form.cancel')}</Button>
                <Button variant="outlined" color="secondary" type="reset" onClick={handleReset}>{t('patients.add.form.reset')}</Button>
                <Button variant="contained" color="success" type="submit" disabled={submitting}>
                  {submitting ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                  {t('patients.add.form.save')}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Collapse>
      </Card>

      {/* Toast Message */}
      <Collapse in={!!message}>
        <Box sx={{ p: 2, borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2,
          bgcolor: message?.type === 'success' ? '#2e7d3215' : '#d32f2f15',
          color: message?.type === 'success' ? '#2e7d32' : '#d32f2f',
          border: '1px solid', borderColor: message?.type === 'success' ? '#2e7d32' : '#d32f2f',
        }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{message?.text}</Typography>
          <IconButton size="small" onClick={() => setMessage(null)} sx={{ color: 'inherit' }}><Close sx={{ fontSize: 18 }} /></IconButton>
        </Box>
      </Collapse>

      {/* Patient List */}
      <Card>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{t('patients.list')}</Typography>
        </Box>
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <TextField
            size="small" placeholder={t('patients.search')} value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} sx={{ maxWidth: 320 }}
          />
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'action.hover' } }}>
                <TableCell>{t('patients.col.serial')}</TableCell>
                <TableCell>{t('patients.add.form.examType')}</TableCell>
                <TableCell>{t('patients.add.form.name')}</TableCell>
                <TableCell>{t('patients.add.form.age')}</TableCell>
                <TableCell>{t('patients.add.form.phone')}</TableCell>
                <TableCell>{t('patients.add.form.date')}</TableCell>
                <TableCell>{t('patients.add.form.price')}</TableCell>
                <TableCell>{t('patients.col.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPatients.map(p => (
                <TableRow key={p.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell sx={{ fontWeight: 700 }}>{p.serialNumber}</TableCell>
                  <TableCell>{t(p.examType === 'nutrition' ? 'patients.add.form.examType.nutrition' : 'patients.add.form.examType.physiotherapy')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{`${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || '—'}</TableCell>
                  <TableCell>{calcAge(p.dateOfBirth)}</TableCell>
                  <TableCell dir="ltr">{p.phone}</TableCell>
                  <TableCell>{formatDate(p.registrationDate)}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{p.price ?? ''}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => downloadPatientFile(p)} sx={{ bgcolor: '#28a74515', color: '#28a745', '&:hover': { bgcolor: '#28a74525' } }} title={t('patients.download.file')}>
                        <DownloadForOffline sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => openEdit(p.id)} sx={{ bgcolor: '#007bff15', color: '#007bff', '&:hover': { bgcolor: '#007bff25' } }}>
                        <Edit sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => openDelete(p.id)} sx={{ bgcolor: '#dc354515', color: '#dc3545', '&:hover': { bgcolor: '#dc354525' } }}>
                        <Delete sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPatients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    {searchQuery ? t('patients.searchEmpty') || 'No results match your search' : t('patients.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)} color="primary" size="small" />
          </Box>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleEditSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>{t('patients.edit.title')}</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
              <InputLabel>{t('patients.add.form.examType')}</InputLabel>
              <Select value={editForm.examType} onChange={e => setEditForm(prev => ({ ...prev, examType: e.target.value }))} label={t('patients.add.form.examType')} required>
                <MenuItem value="physiotherapy">{t('patients.add.form.examType.physiotherapy')}</MenuItem>
                <MenuItem value="nutrition">{t('patients.add.form.examType.nutrition')}</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label={t('patients.add.form.name')} value={editForm.fullName} onChange={handleEditChange('fullName')} sx={{ mb: 2 }} required />
            <TextField fullWidth label={t('patients.add.form.age')} type="number" value={editForm.age} onChange={handleEditChange('age')} sx={{ mb: 2 }} />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('patients.add.form.gender')}</InputLabel>
              <Select value={editForm.gender} onChange={e => setEditForm(prev => ({ ...prev, gender: e.target.value }))} label={t('patients.add.form.gender')} required>
                <MenuItem value="male">{t('patients.add.form.gender.male')}</MenuItem>
                <MenuItem value="female">{t('patients.add.form.gender.female')}</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label={t('patients.add.form.phone')} value={editForm.phone} onChange={handleEditChange('phone')} sx={{ mb: 2 }} />
            <TextField fullWidth label={t('patients.add.form.date')} type="date" value={editForm.date} onChange={handleEditChange('date')} sx={{ mb: 2 }} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField fullWidth label={t('patients.add.form.price')} type="number" value={editForm.price} slotProps={{ input: { readOnly: true } }} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditOpen(false)} color="secondary">{t('patients.add.form.cancel')}</Button>
            <Button type="submit" variant="contained" color="primary">{t('patients.edit.save')}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Dialog */}
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
