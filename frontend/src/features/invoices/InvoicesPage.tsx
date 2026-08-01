import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  FormControl, InputLabel, Select, IconButton, TablePagination, Chip, Stack, Tooltip, Card,
} from '@mui/material';
import { Add, Delete, Edit, Print, Receipt } from '@mui/icons-material';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatDate } from '../../shared/formatDate';

interface Invoice {
  id: string;
  employee: string;
  type: string;
  amount: number;
  date: string;
  notes: string | null;
}

interface Employee {
  id: string;
  name: string;
  department: string | null;
  salary: number | null;
}

export default function InvoicesPage() {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ type: 'electricity', employee: '', amount: 0, date: '', notes: '' });
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    api.get('/invoices').then(({ data }) => setInvoices(data)).catch(() => {});
    api.get('/employees').then(({ data }) => setEmployees(data)).catch(() => {});
  }, []);

  const selectedEmployee = employees.find(e => e.id === selectedEmpId);
  const employeeInvoices = useMemo(() => {
    if (!selectedEmployee) return [];
    let list = invoices.filter(inv => inv.employee === selectedEmployee.name);
    if (selectedMonth) list = list.filter(inv => inv.date.startsWith(selectedMonth));
    return list;
  }, [invoices, selectedEmployee, selectedMonth]);
  const employeeTotal = useMemo(() => employeeInvoices.reduce((s, inv) => s + inv.amount, 0), [employeeInvoices]);

  const handleOpenAdd = () => {
    const today = new Date().toISOString().slice(0, 10);
    setEditing(null);
    setForm({ type: 'electricity', employee: '', amount: 0, date: today, notes: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditing(inv);
    setForm({ type: inv.type || 'electricity', employee: inv.employee, amount: inv.amount, date: inv.date, notes: inv.notes || '' });
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
      inv.employee.toLowerCase().includes(q)
      || (inv.type === 'water' ? t('invoices.type.water') : t('invoices.type.electricity')).toLowerCase().includes(q)
      || inv.amount.toString().includes(q)
      || (inv.notes && inv.notes.toLowerCase().includes(q))
    );
  }, [invoices, searchQuery]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const totalAmount = useMemo(() => invoices.reduce((sum, inv) => sum + inv.amount, 0), [invoices]);

  const openPrintReport = (empId: string, month?: string) => {
    const token = localStorage.getItem('accessToken');
    const lang = document.documentElement.lang || 'en';
    const base = import.meta.env.VITE_API_URL || '';
    let url = `${base ? `${base}/api` : '/api'}/invoices/report/${empId}?lang=${lang}&token=${token}`;
    if (month) url += `&month=${month}`;
    window.open(url, '_blank');
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

      {/* Employee Report Section */}
      <Card sx={{ mb: 3, p: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>{t('invoices.report.title')}</Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 280 }}>
            <InputLabel>{t('invoices.report.selectEmployee')}</InputLabel>
            <Select
              value={selectedEmpId}
              label={t('invoices.report.selectEmployee')}
              onChange={e => setSelectedEmpId(e.target.value)}
            >
              <MenuItem value="">{t('invoices.report.selectEmployee')}</MenuItem>
              {employees.map(emp => (
                <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="month" size="small" label={t('invoices.report.selectMonth')}
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            sx={{ minWidth: 200 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {selectedMonth && (
            <Button size="small" variant="text" color="secondary" onClick={() => setSelectedMonth('')}>
              {t('common.clear')}
            </Button>
          )}
        </Stack>

        {selectedEmployee && (
          <>
            <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip label={`${t('invoices.report.totalInvoices')}: ${employeeTotal.toLocaleString()} YER`} color="primary" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.95rem', py: 2 }} />
              <Button variant="contained" size="small" startIcon={<Print />} onClick={() => openPrintReport(selectedEmpId, selectedMonth)} sx={{ mr: 'auto' }}>
                {t('invoices.report.print')}
              </Button>
            </Stack>

            {employeeInvoices.length === 0 ? (
              <Typography variant="body2" color="text.secondary">{t('invoices.report.noInvoices')}</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table dir="rtl" size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>{t('invoices.col.type')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('invoices.col.amount')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('invoices.col.date')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('invoices.col.notes')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employeeInvoices.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell>
                          <Chip label={inv.type === 'water' ? t('invoices.type.water') : t('invoices.type.electricity')} size="small" color={inv.type === 'water' ? 'info' : 'warning'} sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell>{inv.amount.toLocaleString()} YER</TableCell>
                        <TableCell>{formatDate(inv.date)}</TableCell>
                        <TableCell>{inv.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Card>

      <TextField size="small" placeholder={t('invoices.search')} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(0); }} sx={{ mb: 1.5, maxWidth: 320 }} />
      <TableContainer component={Paper}>
        <Table dir="rtl">
          <TableHead>
            <TableRow>
              <TableCell>{t('invoices.col.employee')}</TableCell>
              <TableCell>{t('invoices.col.type')}</TableCell>
              <TableCell>{t('invoices.col.amount')}</TableCell>
              <TableCell>{t('invoices.col.date')}</TableCell>
              <TableCell>{t('invoices.col.notes')}</TableCell>
              <TableCell>{t('invoices.col.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map(inv => (
              <TableRow key={inv.id}>
                <TableCell sx={{ fontWeight: 600 }}>{inv.employee}</TableCell>
                <TableCell>
                  <Chip label={inv.type === 'water' ? t('invoices.type.water') : t('invoices.type.electricity')} size="small" color={inv.type === 'water' ? 'info' : 'warning'} sx={{ fontWeight: 600 }} />
                </TableCell>
                <TableCell>{inv.amount.toLocaleString()} YER</TableCell>
                <TableCell>{formatDate(inv.date)}</TableCell>
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
            <FormControl fullWidth>
              <InputLabel>{t('invoices.form.type')}</InputLabel>
              <Select
                value={form.type}
                label={t('invoices.form.type')}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                <MenuItem value="electricity">{t('invoices.type.electricity')}</MenuItem>
                <MenuItem value="water">{t('invoices.type.water')}</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t('invoices.form.employee')}</InputLabel>
              <Select
                value={form.employee}
                label={t('invoices.form.employee')}
                onChange={e => setForm(f => ({ ...f, employee: e.target.value }))}
              >
                {employees.map(emp => (
                  <MenuItem key={emp.id} value={emp.name}>{emp.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
