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

    let rows = '';
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      const dayName = dayNames[d.getDay()];
      const signed = attended.includes(i) ? '✓' : '';
      rows += `<tr>
        <td>${dateStr}</td>
        <td>${dayName}</td>
        <td>${typeLabels[s.sessionType] || s.sessionType}</td>
        <td style="font-size:18px;font-weight:900;color:${attended.includes(i) ? '#1a5276' : '#ccc'}">${attended.includes(i) ? '✓' : ''}</td>
        <td>&nbsp;</td>
      </tr>`;
    }

    const html = `
<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="UTF-8">
<title>كشف اشتراك - ${s.fullname}</title>
<style>
  @page{ size:A4 landscape; margin:4mm; }
  body{ margin:0; font-family:"Cairo",sans-serif; direction:rtl; font-size:9px; }
  .page{ width:297mm; min-height:210mm; margin:auto; background:white; padding:4mm 6mm; box-sizing:border-box; }
  header{ display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #1a5276; padding-bottom:4px; margin-bottom:6px; }
  header .left, header .right{ text-align:center; }
  header .left h2, header .right h2{ margin:0; font-size:12px; color:#1a5276; font-weight:900; }
  header .left p, header .right p{ margin:0; font-size:8px; color:#888; }
  .title-bar{ display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
  .title-bar h1{ font-size:13px; color:#1a5276; margin:0; font-weight:900; }
  .title-bar .patient-info{ font-size:10px; color:#333; }
  .title-bar .patient-info strong{ color:#1a5276; }
  table{ width:100%; border-collapse:collapse; font-size:9px; }
  th{ background:#1a5276; color:white; padding:2px 3px; font-weight:700; font-size:9px; }
  td{ border:1px solid #bbb; padding:2px 3px; text-align:center; }
  tr:nth-child(even){ background:#f8fbff; }
  .footer{ margin-top:6px; display:flex; justify-content:space-between; font-size:8px; color:#555; }
</style>
</head>
<body>
<div class="page">
  <header>
    <div class="left">
      <h2>SAMA CENTER</h2>
      <p>FOR PHYSIOTHERAPY & REHABILITATION</p>
    </div>
    <div class="right">
      <h2>مركز سما</h2>
      <p>للعلاج الطبيعي وإعادة التأهيل</p>
    </div>
  </header>
  <div class="title-bar">
    <h1>كشف متابعة الاشتراك</h1>
    <div class="patient-info">
      <strong>المريض:</strong> ${s.fullname} &nbsp;|&nbsp; <strong>المعالج:</strong> ${s.speacial || '-'} &nbsp;|&nbsp; <strong>المبلغ:</strong> ${s.subscriptionAmount?.toLocaleString()} YER
    </div>
  </div>
  <table>
    <tr>
      <th>التاريخ</th>
      <th>اليوم</th>
      <th>نوع الخدمة</th>
      <th>التوقيع</th>
      <th>ملاحظات</th>
    </tr>
    ${rows}
  </table>
  <div class="footer">
    <span>مركز سما للعلاج الطبيعي وإعادة التأهيل</span>
    <span>تمت الطباعة: ${today.toLocaleDateString('ar-EG')}</span>
  </div>
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
