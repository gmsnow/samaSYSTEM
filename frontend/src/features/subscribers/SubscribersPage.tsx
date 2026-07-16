import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, IconButton, Pagination, Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack } from '@mui/material';
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
}

const typeLabels: Record<string, string> = {
  physiotherapy: 'علاج طبيعي',
  'physiotherapy (adults)': 'جلسات علاج طبيعي (كبار)',
  'physiotherapy (children)': 'جلسات علاج طبيعي (أطفال)',
};

export default function SubscribersPage() {
  const { t } = useLanguage();
  const [subscribers, setSubscribers] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ subscription_amount: '', subscription_day: '' });

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
    setEditForm({ subscription_amount: s.subscriptionAmount?.toString() || '', subscription_day: s.subscriptionDay?.toString() || '' });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      await api.put(`/sessions/${selectedId}`, {
        subscription_amount: editForm.subscription_amount ? Number(editForm.subscription_amount) : null,
        subscription_day: editForm.subscription_day ? Number(editForm.subscription_day) : null,
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

  const handleAttend = async (s: Session) => {
    try {
      await api.put(`/sessions/${s.id}`, {
        subscription_day: Math.max(0, (s.subscriptionDay ?? 1) - 1),
      });
      fetch();
    } catch { /* ignore */ }
  };

  const handleDownload = (s: Session) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    const html = `
<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="UTF-8">
<title>فاتورة اشتراك - ${s.fullname}</title>
<style>
  @page{ size:A4 portrait; margin:8mm; }
  body{ margin:0; font-family:"Cairo",sans-serif; direction:rtl; background:#f5f5f5; }
  .page{ width:210mm; min-height:297mm; margin:auto; background:white; padding:8mm 10mm; box-sizing:border-box; }

  header{ display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #1a5276; padding-bottom:12px; margin-bottom:25px; background:linear-gradient(to bottom,#f8fbff,#fff); padding:15px; border-radius:8px 8px 0 0; }
  header .left, header .right{ text-align:center; }
  header .left h2, header .right h2{ margin:0; font-size:20px; color:#1a5276; font-weight:900; }
  header .left p, header .right p{ margin:0; font-size:11px; color:#888; letter-spacing:0.5px; }
  header .logo-placeholder{ width:60px; height:60px; border-radius:50%; background:linear-gradient(135deg,#1a5276,#2980b9); display:flex; align-items:center; justify-content:center; color:white; font-weight:900; font-size:12px; text-align:center; line-height:1.3; }

  .title-bar{ text-align:center; margin-bottom:20px; }
  .title-bar h1{ font-size:22px; color:#1a5276; margin:0; font-weight:900; }
  .title-bar p{ color:#888; font-size:13px; margin:4px 0 0; }

  .info-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:25px; }
  .info-card{ background:#f8fbff; border:1px solid #e0e7ef; border-radius:8px; padding:10px 14px; }
  .info-card label{ display:block; font-size:11px; color:#888; font-weight:700; margin-bottom:2px; }
  .info-card p{ margin:0; font-size:15px; font-weight:600; color:#222; }

  .amount-box{ background:linear-gradient(135deg,#1a5276,#2980b9); color:white; border-radius:12px; padding:18px; text-align:center; margin-bottom:25px; }
  .amount-box .label{ font-size:12px; opacity:0.85; margin-bottom:4px; }
  .amount-box .value{ font-size:32px; font-weight:900; letter-spacing:1px; }
  .amount-box .sub{ font-size:13px; opacity:0.8; margin-top:4px; }

  .details-grid{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:25px; }
  .detail-item{ background:#f8fbff; border:1px solid #e0e7ef; border-radius:8px; padding:12px; text-align:center; }
  .detail-item .num{ font-size:24px; font-weight:900; color:#1a5276; }
  .detail-item .lbl{ font-size:11px; color:#888; margin-top:2px; }

  table{ width:100%; border-collapse:collapse; margin-bottom:25px; }
  th{ background:#1a5276; color:white; padding:8px 6px; font-size:13px; font-weight:700; }
  td{ border:1px solid #dde3eb; padding:7px 6px; text-align:center; font-size:14px; }
  tr:nth-child(even){ background:#f8fbff; }

  .footer{ display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:10px; }
  .sign-area{ border-top:1px solid #333; width:200px; text-align:center; padding-top:4px; font-size:13px; color:#555; margin-top:50px; }
  .notes-box{ background:#fefefe; border:1px solid #e0e7ef; border-radius:8px; padding:12px; min-height:60px; }
  .notes-box label{ display:block; font-size:11px; color:#888; font-weight:700; margin-bottom:4px; }
  .notes-box p{ margin:0; font-size:14px; color:#333; }

  .badge{ display:inline-block; padding:3px 14px; border-radius:20px; font-size:13px; font-weight:700; }
  .badge.active{ background:#e8f5e9; color:#2e7d32; }
  .badge.done{ background:#fce4ec; color:#c62828; }
</style>
</head>
<body>
<div class="page">
  <header>
    <div class="left">
      <h2>SAMA CENTER</h2>
      <p>FOR PHYSIOTHERAPY & REHABILITATION</p>
    </div>
    <div class="logo-placeholder">SAMA</div>
    <div class="right">
      <h2>مركز سما</h2>
      <p>للعلاج الطبيعي وإعادة التأهيل</p>
    </div>
  </header>

  <div class="title-bar">
    <h1>فاتورة اشتراك</h1>
    <p>${dateStr}</p>
  </div>

  <div class="info-grid">
    <div class="info-card">
      <label>اسم المريض</label>
      <p>${s.fullname}</p>
    </div>
    <div class="info-card">
      <label>نوع الخدمة</label>
      <p>${typeLabels[s.sessionType] || s.sessionType}</p>
    </div>
    <div class="info-card">
      <label>المعالج</label>
      <p>${s.speacial || '-'}</p>
    </div>
    <div class="info-card">
      <label>تاريخ الاشتراك</label>
      <p>${s.sessionDate ? new Date(s.sessionDate).toLocaleDateString('ar-EG') : '-'}</p>
    </div>
  </div>

  <div class="amount-box">
    <div class="label">إجمالي مبلغ الاشتراك</div>
    <div class="value">${s.subscriptionAmount?.toLocaleString()} YER</div>
    <div class="sub">${typeLabels[s.sessionType] || s.sessionType}</div>
  </div>

  <div class="details-grid">
    <div class="detail-item">
      <div class="num">${s.subscriptionDay ?? 0}</div>
      <div class="lbl">الأيام المتبقية</div>
    </div>
    <div class="detail-item">
      <div class="num">${s.subscriptionAmount ? Math.floor((s.subscriptionAmount ?? 0) / Math.max((s.subscriptionDay ?? 1), 1)).toLocaleString() : 0} YER</div>
      <div class="lbl">سعر اليوم الواحد</div>
    </div>
    <div class="detail-item">
      <div class="num">${dayNames[today.getDay()]}</div>
      <div class="lbl">اليوم</div>
    </div>
    <div class="detail-item">
      <div class="num"><span class="badge ${(s.subscriptionDay ?? 0) > 0 ? 'active' : 'done'}">${(s.subscriptionDay ?? 0) > 0 ? 'جاري' : 'مكتمل'}</span></div>
      <div class="lbl">الحالة</div>
    </div>
  </div>

  <table>
    <tr><th>الخدمة</th><th>المبلغ</th><th>الأيام المتبقية</th><th>الحالة</th></tr>
    <tr>
      <td>${typeLabels[s.sessionType] || s.sessionType}</td>
      <td>${s.subscriptionAmount?.toLocaleString()} YER</td>
      <td>${s.subscriptionDay ?? 0}</td>
      <td><span class="badge ${(s.subscriptionDay ?? 0) > 0 ? 'active' : 'done'}">${(s.subscriptionDay ?? 0) > 0 ? 'جاري' : 'مكتمل'}</span></td>
    </tr>
  </table>

  <div class="footer">
    <div>
      <div class="sign-area">التوقيع</div>
    </div>
    <div>
      <div class="notes-box">
        <label>ملاحظات</label>
        <p>................................................................................................................................................</p>
      </div>
    </div>
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
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map(s => (
              <TableRow key={s.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                <TableCell sx={{ fontWeight: 600 }}>{s.fullname}</TableCell>
                <TableCell>{typeLabels[s.sessionType] || s.sessionType}</TableCell>
                <TableCell>{s.speacial || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{s.subscriptionAmount?.toLocaleString()} YER</TableCell>
                <TableCell>{s.subscriptionDay ?? '-'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => openEdit(s)} sx={{ bgcolor: '#007bff15', color: '#007bff', '&:hover': { bgcolor: '#007bff25' } }}>
                      <Edit sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleAttend(s)} sx={{ bgcolor: '#28a74515', color: '#28a745', '&:hover': { bgcolor: '#28a74525' } }}>
                      <CheckCircle sx={{ fontSize: 18 }} />
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
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
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

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={handleEditSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>تعديل الاشتراك</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField fullWidth label="مبلغ الاشتراك" type="number" value={editForm.subscription_amount} onChange={e => setEditForm(f => ({ ...f, subscription_amount: e.target.value }))} />
              <TextField fullWidth label="اليوم" type="number" value={editForm.subscription_day} onChange={e => setEditForm(f => ({ ...f, subscription_day: e.target.value }))} slotProps={{ htmlInput: { min: 1, max: 31 } }} />
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
