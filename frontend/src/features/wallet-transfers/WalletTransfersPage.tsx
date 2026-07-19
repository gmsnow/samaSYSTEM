import { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Paper, TablePagination,
} from '@mui/material';
import { AccountBalanceWallet } from '@mui/icons-material';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface Session {
  id: string;
  fullname: string;
  price: number | null;
  sessionDate: string | null;
  walletType: string | null;
  transactionNumber: string | null;
  paymentMethod: string | null;
}

export default function WalletTransfersPage() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    api.get('/sessions').then(({ data }) => setSessions(data)).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let list = sessions.filter(s => s.paymentMethod === 'محفظة');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.fullname.toLowerCase().includes(q) ||
        (s.walletType || '').toLowerCase().includes(q) ||
        (s.transactionNumber || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.sessionDate || '').getTime() - new Date(a.sessionDate || '').getTime());
  }, [sessions, search]);

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        الحوالات المالية (المحافظ)
      </Typography>

      <Card>
        <CardContent>
          <TextField
            size="small"
            placeholder="بحث باسم المريض أو المحفظة..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            sx={{ mb: 2, maxWidth: 400 }}
          />

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'action.hover' } }}>
                  <TableCell>المريض</TableCell>
                  <TableCell>نوع المحفظة</TableCell>
                  <TableCell>رقم العملية</TableCell>
                  <TableCell>المبلغ</TableCell>
                  <TableCell>التاريخ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map(s => (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{s.fullname}</TableCell>
                    <TableCell>
                      <Chip icon={<AccountBalanceWallet />} label={s.walletType || '-'} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell dir="ltr" sx={{ fontFamily: 'monospace' }}>{s.transactionNumber || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>{s.price ?? '-'} ريال</TableCell>
                    <TableCell>{s.sessionDate ? new Date(s.sessionDate).toLocaleDateString('ar-SA') : '-'}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      لا توجد حوالات مالية
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {filtered.length > rowsPerPage && (
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[rowsPerPage]}
              labelRowsPerPage=""
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
