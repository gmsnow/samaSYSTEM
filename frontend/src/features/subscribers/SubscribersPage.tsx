import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, IconButton, Pagination, Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Checkbox, Tooltip, Chip } from '@mui/material';
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
  subscriptionAttendance: string | null;
}

const typeLabels: Record<string, string> = {
  physiotherapy: 'علاج طبيعي',
  'physiotherapy (adults)': 'جلسات علاج طبيعي (كبار)',
  'physiotherapy (children)': 'جلسات علاج طبيعي (أطفال)',
};

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function getAttendance(s: Session): number[] {
  try { return s.subscriptionAttendance ? JSON.parse(s.subscriptionAttendance) : []; } catch { return []; }
}

export default function SubscribersPage() {
  const { t } = useLanguage();
  const [subscribers, setSubscribers] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ subscription_amount: '', subscription_day: '', attendance: [] as number[] });

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
    setEditForm({
      subscription_amount: s.subscriptionAmount?.toString() || '',
      subscription_day: s.subscriptionDay?.toString() || '',
      attendance: getAttendance(s),
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      await api.put(`/sessions/${selectedId}`, {
        subscription_amount: editForm.subscription_amount ? Number(editForm.subscription_amount) : null,
        subscription_day: editForm.subscription_day ? Number(editForm.subscription_day) : null,
        subscription_attendance: JSON.stringify(editForm.attendance),
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

  const toggleDayAttend = (s: Session, dayIndex: number) => {
    const current = getAttendance(s);
    const next = current.includes(dayIndex) ? current.filter(d => d !== dayIndex) : [...current, dayIndex];
    api.put(`/sessions/${s.id}`, {
      subscription_attendance: JSON.stringify(next),
      subscription_day: Math.max(0, (s.subscriptionDay ?? 0) - (next.length - current.length)),
    }).then(fetch).catch(() => {});
  };

  const handleDownload = (s: Session) => {
    const today = new Date();
    const attended = getAttendance(s);

    const startDate = s.sessionDate ? new Date(s.sessionDate) : today;
    const totalDays = s.subscriptionPeriod === 'شهر' ? 30 : s.subscriptionPeriod === 'أسبوع' ? 7 : 1;
    const perDay = Math.floor((s.subscriptionAmount ?? 0) / totalDays);

    let rows = '';
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
      const dayName = dayNames[d.getDay()];
      const isSigned = attended.includes(i);
      rows += `<tr>
        <td>${i + 1}</td>
        <td>${dateStr}</td>
        <td>${dayName}</td>
        <td>${typeLabels[s.sessionType] || s.sessionType}</td>
        <td class="${i === 4 ? 'free' : 'amount'}">${i === 4 ? 'مجانية' : perDay.toLocaleString()}</td>
        <td>${isSigned ? '✓' : ''}</td>
        <td></td>
      </tr>`;
    }

    const html = `
<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="UTF-8">
<title>كشف اشتراك - ${s.fullname}</title>
<style>
*{ box-sizing:border-box; font-family:Tahoma, Arial, sans-serif; }
body{ background:#eee; margin:20px; }
.sheet{ width:210mm; margin:auto; background:#fff; padding:8mm; border:2px solid #000; }
table{ width:100%; border-collapse:collapse; }
th,td{ border:1px solid #000; padding:4px; text-align:center; vertical-align:middle; font-size:13px; height:34px; }
thead th{ background:#f7f7f7; font-weight:bold; }
.title{ font-size:20px; font-weight:bold; border:2px solid #000; padding:8px; }
.patient{ text-align:right; padding-right:10px; font-weight:bold; }
.amount{ color:#0b8d2b; font-weight:bold; }
.free{ color:#d30000; font-weight:bold; }
.signature{ width:120px; }
.notes{ width:180px; }
.no{ width:40px; }
.date{ width:110px; }
.day{ width:90px; }
.service{ width:180px; }
@media print{ body{ background:#fff; margin:0; } .sheet{ border:none; width:100%; padding:0; } }
</style>
</head>
<body>
<div class="sheet" dir="rtl">
<table>
<tr><td colspan="7" class="title">كشف التوقيع اليومي للمرضى</td></tr>
<tr>
  <td colspan="5" class="patient">اسم الحالة : ${s.fullname}</td>
  <td>المبلغ</td>
  <td class="amount">${s.subscriptionAmount?.toLocaleString()}</td>
</tr>
</table>
<br>
<table>
<thead>
<tr>
  <th class="no">م</th>
  <th class="date">التاريخ</th>
  <th class="day">اليوم</th>
  <th class="service">نوع الخدمة</th>
  <th>المبلغ</th>
  <th class="signature">التوقيع</th>
  <th class="notes">ملاحظات</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</div>
</body>
</html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
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
              <TableCell>التوقيع</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map(s => {
              const att = getAttendance(s);
              return (
              <TableRow key={s.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                <TableCell sx={{ fontWeight: 600 }}>{s.fullname}</TableCell>
                <TableCell>{typeLabels[s.sessionType] || s.sessionType}</TableCell>
                <TableCell>{s.speacial || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{s.subscriptionAmount?.toLocaleString()} YER</TableCell>
                <TableCell>{s.subscriptionDay ?? '-'}</TableCell>
                <TableCell>
                  <Chip label={att.length > 0 ? `✓ (${att.length})` : '—'} size="small" color={att.length > 0 ? 'success' : 'default'} variant="outlined" />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => openEdit(s)} sx={{ bgcolor: '#007bff15', color: '#007bff', '&:hover': { bgcolor: '#007bff25' } }}>
                      <Edit sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDownload(s)} sx={{ bgcolor: '#17a2b815', color: '#17a2b8', '&:hover': { bgcolor: '#17a2b825' } }}>
                      <Download sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => openDelete(s.id)} sx={{ bgcolor: '#dc354515', color: '#dc3545', '&:hover': { bgcolor: '#dc354525' } }}>
                      <Delete sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
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

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleEditSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>تعديل الاشتراك</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField fullWidth label="مبلغ الاشتراك" type="number" value={editForm.subscription_amount} onChange={e => setEditForm(f => ({ ...f, subscription_amount: e.target.value }))} />
              <TextField fullWidth label="اليوم" type="number" value={editForm.subscription_day} onChange={e => setEditForm(f => ({ ...f, subscription_day: e.target.value }))} slotProps={{ htmlInput: { min: 0, max: 31 } }} />
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: 'text.secondary' }}>أيام الحضور (اختر الأيام التي حضرها المريض)</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {(() => {
                  const editing = subscribers.find(s => s.id === selectedId);
                  if (!editing) return null;
                  const startDate = editing.sessionDate ? new Date(editing.sessionDate) : new Date();
                  const totalDays = editing.subscriptionPeriod === 'شهر' ? 30 : editing.subscriptionPeriod === 'أسبوع' ? 7 : 1;
                  return Array.from({ length: totalDays }, (_, i) => {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() + i);
                    return (
                      <Tooltip key={i} title={`${d.getDate()} ${monthNames[d.getMonth()]} - ${dayNames[d.getDay()]}`}>
                        <Chip
                          label={`يوم ${i + 1}`}
                          size="small"
                          color={editForm.attendance.includes(i) ? 'success' : 'default'}
                          variant={editForm.attendance.includes(i) ? 'filled' : 'outlined'}
                          onClick={() => setEditForm(f => ({
                            ...f,
                            attendance: f.attendance.includes(i) ? f.attendance.filter(d => d !== i) : [...f.attendance, i],
                          }))}
                          sx={{ cursor: 'pointer' }}
                        />
                      </Tooltip>
                    );
                  });
                })()}
              </Box>
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
