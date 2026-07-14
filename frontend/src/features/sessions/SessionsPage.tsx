import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, MenuItem, IconButton, Collapse,
  Table, TableHead, TableBody, TableRow, TableCell, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, Chip, Pagination,
} from '@mui/material';
import { KeyboardArrowUp, Close, Edit, Delete, Add, FilterList } from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';

interface Session {
  id: string;
  fullname: string;
  sessionType: string;
  speacial: string | null;
  status: string;
  sessionDate: string | null;
  price: number | null;
  notes: string | null;
}

interface Employee {
  id: string;
  name: string;
  department: string | null;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
}

const formatDate = (d: string | null) => {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
};

const statusColor = (s: string) => {
  if (s === 'complete') return 'success';
  if (s === 'progress') return 'warning';
  if (s === 'negative') return 'error';
  return 'default';
};

const statusLabel = (s: string, t: (k: string) => string) => {
  if (s === 'complete') return t('sessions.complete');
  if (s === 'progress') return t('sessions.progress');
  if (s === 'negative') return t('sessions.negative');
  return s;
};

export default function SessionsPage() {
  const { t, dir } = useLanguage();
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelHidden, setPanelHidden] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const [statusFilter, setStatusFilter] = useState('');
  const [statusForm, setStatusForm] = useState({ patient: '', sessionType: '', status: '' });

  const filteredSessions = sessions.filter(s => {
    if (statusFilter && s.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.fullname.toLowerCase().includes(q)
      || s.sessionType.toLowerCase().includes(q)
      || (s.speacial && s.speacial.toLowerCase().includes(q))
      || (s.price && s.price.toString().includes(q));
  });
  const totalPages = Math.ceil(filteredSessions.length / rowsPerPage);
  const paginatedSessions = filteredSessions.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const [form, setForm] = useState({
    fullname: '',
    session_type: '',
    speacial: '',
    session_date: '',
    price: '',
    notes: '',
  });

  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await api.get('/sessions');
      setSessions(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { setPage(0); }, [searchQuery, statusFilter]);

  useEffect(() => {
    api.get('/employees', { params: { department: 'علاج طبيعي' } }).then(({ data }) => setEmployees(data)).catch(() => {});
    api.get('/services').then(({ data }) => setServices(data)).catch(() => {});
  }, []);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'session_type') {
        const found = services.find(s => s.name === value);
        next.price = found ? found.price.toString() : prev.price;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/sessions', form);
      setMessage({ text: data.message, type: 'success' });
      setForm({ fullname: '', session_type: '', speacial: '', session_date: '', price: '', notes: '' });
      fetchSessions();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Error', type: 'error' });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  const openEdit = async (id: string) => {
    try {
      const { data } = await api.get<Session>(`/sessions/${id}`);
      setSelectedId(id);
      setForm({
        fullname: data.fullname,
        session_type: data.sessionType,
        speacial: data.speacial || '',
        session_date: data.sessionDate ? data.sessionDate.substring(0, 16) : '',
        price: data.price?.toString() || '',
        notes: data.notes || '',
      });
      setEditOpen(true);
    } catch { /* ignore */ }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      const { data } = await api.put(`/sessions/${selectedId}`, form);
      setMessage({ text: data.message, type: 'success' });
      setEditOpen(false);
      fetchSessions();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Error', type: 'error' });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  const openDelete = (id: string) => {
    setSelectedId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    try {
      const { data } = await api.delete(`/sessions/${selectedId}`);
      setMessage({ text: data.message, type: 'success' });
      fetchSessions();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Error', type: 'error' });
    }
    setDeleteOpen(false);
    setSelectedId(null);
    setTimeout(() => setMessage(null), 4000);
  };

  const uniquePatients = [...new Set(sessions.map(s => s.fullname))].sort();
  const statusSessionTypes = statusForm.patient
    ? [...new Set(sessions.filter(s => s.fullname === statusForm.patient).map(s => s.sessionType))]
    : [];
  const selectedSession = statusForm.patient && statusForm.sessionType
    ? sessions.find(s => s.fullname === statusForm.patient && s.sessionType === statusForm.sessionType)
    : null;

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    try {
      const { data } = await api.put(`/sessions/${selectedSession.id}/status`, { status: statusForm.status });
      setMessage({ text: data.message, type: 'success' });
      setStatusForm({ patient: '', sessionType: '', status: '' });
      fetchSessions();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Error', type: 'error' });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  if (panelHidden) return null;

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>{t('sessions.title')}</Typography>
      </Box>

      {/* Add Session Form */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{t('sessions.add')}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" onClick={() => setPanelOpen(o => !o)} sx={{ color: 'text.secondary' }}>
              <KeyboardArrowUp sx={{ transform: panelOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: '0.3s' }} />
            </IconButton>
            <IconButton size="small" onClick={() => setPanelHidden(true)} sx={{ color: 'text.secondary' }}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
        <Collapse in={panelOpen}>
          <CardContent sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ '& .MuiTextField-root': { mb: 2.5 } }}>
              <TextField fullWidth label={t('patients.add.form.name')} value={form.fullname} onChange={handleChange('fullname')} required />

              <TextField fullWidth label={t('sessions.type')} value={form.session_type} onChange={handleChange('session_type')} required />

              <TextField select fullWidth label={t('sessions.therapist')} value={form.speacial} onChange={handleChange('speacial')}>
                <MenuItem value="">{t('sessions.noTherapist')}</MenuItem>
                {employees.map(emp => (
                  <MenuItem key={emp.id} value={emp.name}>{emp.name}</MenuItem>
                ))}
              </TextField>

              <TextField fullWidth label={t('sessions.date')} type="datetime-local" value={form.session_date} onChange={handleChange('session_date')}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField fullWidth label={t('patients.add.form.price')} type="number" value={form.price} onChange={handleChange('price')} required />

              <TextField fullWidth label={t('patients.add.form.notes')} multiline rows={2} value={form.notes} onChange={handleChange('notes')} />

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Button variant="outlined" color="warning" onClick={() => setForm({ fullname: '', session_type: '', speacial: '', session_date: '', price: '', notes: '' })}>{t('patients.add.form.cancel')}</Button>
                <Button variant="contained" color="success" type="submit">{t('patients.add.form.save')}</Button>
              </Box>
            </Box>
          </CardContent>
        </Collapse>
      </Card>

      {/* Message */}
      <Collapse in={!!message} sx={{ mb: 2 }}>
        <Box sx={{
          p: 2, borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          bgcolor: message?.type === 'success' ? '#2e7d3215' : '#d32f2f15',
          color: message?.type === 'success' ? '#2e7d32' : '#d32f2f',
          border: '1px solid',
          borderColor: message?.type === 'success' ? '#2e7d32' : '#d32f2f',
        }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{message?.text}</Typography>
          <IconButton size="small" onClick={() => setMessage(null)} sx={{ color: 'inherit' }}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Collapse>

      {/* Price List */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>قائمة الأسعار</Typography>
        </Box>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 1 }}>
            {services.map(s => (
              <Box key={s.id} sx={{ display: 'flex', justifyContent: 'space-between', px: 1.5, py: 0.8, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2">{s.name}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', whiteSpace: 'nowrap' }}>{s.price} ريال</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Patient Status Follow-up */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>متابعة حالة المريض</Typography>
        </Box>
        <CardContent>
          <Box component="form" onSubmit={handleStatusChange} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 200, flex: 1 }}>
                <InputLabel>اختر المريض</InputLabel>
                <Select value={statusForm.patient} onChange={e => setStatusForm({ patient: e.target.value, sessionType: '', status: '' })} label="اختر المريض" required>
                  <MenuItem value="" disabled>اختر المريض</MenuItem>
                  {uniquePatients.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200, flex: 1 }}>
                <InputLabel>نوع الجلسة</InputLabel>
                <Select value={statusForm.sessionType} onChange={e => setStatusForm(prev => ({ ...prev, sessionType: e.target.value }))} label="نوع الجلسة" required disabled={!statusForm.patient}>
                  <MenuItem value="" disabled>نوع الجلسة</MenuItem>
                  {statusSessionTypes.map(st => <MenuItem key={st} value={st}>{st}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200, flex: 1 }}>
                <InputLabel>حالة المريض</InputLabel>
                <Select value={statusForm.status} onChange={e => setStatusForm(prev => ({ ...prev, status: e.target.value }))} label="حالة المريض" required disabled={!selectedSession}>
                  <MenuItem value="" disabled>حالة المريض</MenuItem>
                  <MenuItem value="complete">الحالة مكتملة</MenuItem>
                  <MenuItem value="progress">قيد المتابعة</MenuItem>
                  <MenuItem value="negative">حالة سلبية</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" color="success" type="submit" disabled={!selectedSession}>حفظ</Button>
              <Button variant="outlined" color="warning" type="reset" onClick={() => setStatusForm({ patient: '', sessionType: '', status: '' })}>إعادة تعيين</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{t('sessions.list')}</Typography>
        </Box>
        <Box sx={{ px: 2.5, py: 1.5, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder={t('sessions.search')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            sx={{ maxWidth: 320 }}
          />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[
              { label: t('sessions.all'), value: '' },
              { label: t('sessions.complete'), value: 'complete' },
              { label: t('sessions.progress'), value: 'progress' },
              { label: t('sessions.negative'), value: 'negative' },
            ].map(opt => (
              <Button
                key={opt.value}
                size="small"
                variant={statusFilter === opt.value ? 'contained' : 'outlined'}
                color={opt.value === 'complete' ? 'success' : opt.value === 'progress' ? 'warning' : opt.value === 'negative' ? 'error' : 'primary'}
                onClick={() => setStatusFilter(opt.value)}
                sx={{ minWidth: 60, fontSize: '0.75rem' }}
              >
                {opt.label}
              </Button>
            ))}
          </Box>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'action.hover' } }}>
                <TableCell>{t('patients.add.form.name')}</TableCell>
                <TableCell>{t('sessions.type')}</TableCell>
                <TableCell>{t('sessions.therapist')}</TableCell>
                <TableCell>{t('sessions.status')}</TableCell>
                <TableCell>{t('sessions.date')}</TableCell>
                <TableCell>{t('patients.add.form.price')}</TableCell>
                <TableCell>{t('patients.add.form.notes')}</TableCell>
                <TableCell>{t('patients.col.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSessions.map(s => (
                <TableRow key={s.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>{s.fullname}</TableCell>
                  <TableCell>{s.sessionType}</TableCell>
                  <TableCell>{s.speacial || '-'}</TableCell>
                  <TableCell>
                    <Chip label={statusLabel(s.status, t)} color={statusColor(s.status) as any} size="small" />
                  </TableCell>
                  <TableCell>{formatDate(s.sessionDate)}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{s.price ?? ''}</TableCell>
                  <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.notes || '-'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(s.id)} sx={{ bgcolor: '#007bff15', color: '#007bff', '&:hover': { bgcolor: '#007bff25' } }}>
                        <Edit sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => openDelete(s.id)} sx={{ bgcolor: '#dc354515', color: '#dc3545', '&:hover': { bgcolor: '#dc354525' } }}>
                        <Delete sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    {searchQuery ? `${t('sessions.empty')} — "${searchQuery}"` : t('sessions.empty')}
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

      {/* Edit Modal */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleEditSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>{t('sessions.edit')}</DialogTitle>
          <DialogContent>
            <TextField fullWidth label={t('patients.add.form.name')} value={form.fullname} onChange={handleChange('fullname')} sx={{ mb: 2 }} required />

              <TextField fullWidth label={t('sessions.type')} value={form.session_type} onChange={handleChange('session_type')} sx={{ mb: 2 }} required />

            <TextField select fullWidth label={t('sessions.therapist')} value={form.speacial} onChange={handleChange('speacial')} sx={{ mb: 2 }}>
              <MenuItem value="">{t('sessions.noTherapist')}</MenuItem>
              {employees.map(emp => (
                <MenuItem key={emp.id} value={emp.name}>{emp.name}</MenuItem>
              ))}
            </TextField>

            <TextField fullWidth label={t('sessions.date')} type="datetime-local" value={form.session_date} onChange={handleChange('session_date')} sx={{ mb: 2 }} slotProps={{ inputLabel: { shrink: true } }} />

            <TextField fullWidth label={t('patients.add.form.price')} type="number" value={form.price} onChange={handleChange('price')} sx={{ mb: 2 }} required />

            <TextField fullWidth label={t('patients.add.form.notes')} multiline rows={2} value={form.notes} onChange={handleChange('notes')} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditOpen(false)} color="secondary">{t('patients.add.form.cancel')}</Button>
            <Button type="submit" variant="contained" color="primary">{t('sessions.save')}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('patients.delete.title')}</DialogTitle>
        <DialogContent>
          <Typography>{t('patients.delete.confirm')}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} color="secondary">{t('patients.add.form.cancel')}</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">{t('patients.delete.confirmBtn')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
