'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem,
} from '@mui/material';
import { Menu as MenuIcon, Dashboard, People, CalendarMonth, MedicalServices, Paid, Receipt, EventNote, Message, Logout, Assessment } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const DRAWER_WIDTH = 260;

interface NavItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  permission?: string;
}

const navItems: NavItem[] = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', permission: 'dashboard' },
  { text: 'Patients', icon: <People />, path: '/patients', permission: 'patients' },
  { text: 'Appointments', icon: <EventNote />, path: '/appointments', permission: 'appointments' },
  { text: 'Sessions', icon: <MedicalServices />, path: '/sessions', permission: 'sessions' },
  { text: 'Calendar', icon: <CalendarMonth />, path: '/calendar', permission: 'calendar' },
  { text: 'Advances', icon: <Paid />, path: '/advances', permission: 'advances' },
  { text: 'Expenses', icon: <Receipt />, path: '/expenses', permission: 'expenses' },
  { text: 'Employees', icon: <People />, path: '/employees', permission: 'employees' },
  { text: 'Users', icon: <People />, path: '/users', permission: 'users' },
  { text: 'Reports', icon: <Assessment />, path: '/reports/daily', permission: 'reports' },
  { text: 'Chat', icon: <Message />, path: '/chat', permission: 'chat' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (!user) return null;

  const hasPermission = (perm?: string) => {
    if (!perm) return true;
    if (user.role === 'ADMIN') return true;
    return user.permissions?.includes(perm);
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>SAMA CENTER</Typography>
      </Box>
      <List>
        {navItems.filter(n => hasPermission(n.permission)).map(item => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={pathname === item.path || pathname.startsWith(item.path + '/')}
              onClick={() => { router.push(item.path); setMobileOpen(false); }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` } }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>{t('app.title')}</Typography>
          <IconButton color="inherit" onClick={e => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user.firstName?.charAt(0) || 'A'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => { setAnchorEl(null); router.push('/profile'); }}>{t('app.profile')}</MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); logout(); }}>{t('app.logout')}</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
        {drawer}
      </Drawer>
      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }} open>
        {drawer}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
}
