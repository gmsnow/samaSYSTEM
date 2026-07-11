import { type ReactNode } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import PatientsPage from './features/patients/PatientsPage';
import SessionsPage from './features/sessions/SessionsPage';
import AppointmentsPage from './features/appointments/AppointmentsPage';
import CalendarPage from './features/calendar/CalendarPage';
import AdvancesPage from './features/advances/AdvancesPage';
import ExpensesPage from './features/expenses/ExpensesPage';

import EmployeesPage from './features/employees/EmployeesPage';
import UsersPage from './features/users/UsersPage';
import DailyReportPage from './features/reports/DailyReportPage';
import WeeklyReportPage from './features/reports/WeeklyReportPage';
import MonthlyReportPage from './features/reports/MonthlyReportPage';
import ProfilePage from './features/profile/ProfilePage';
import NotFoundPage from './features/NotFoundPage';

function ProtectedRoute({ roles }: { roles?: string[] }) {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  if (isLoading) return <div>{t('app.loading')}</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function PermissionGuard({ permission, children }: { permission: string; children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return children;
  if (!user?.permissions?.includes(permission)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<PermissionGuard permission="dashboard"><DashboardPage /></PermissionGuard>} />
          <Route path="/patients" element={<PermissionGuard permission="patients"><PatientsPage /></PermissionGuard>} />
          <Route path="/sessions" element={<PermissionGuard permission="sessions"><SessionsPage /></PermissionGuard>} />
          <Route path="/appointments" element={<PermissionGuard permission="appointments"><AppointmentsPage /></PermissionGuard>} />
          <Route path="/calendar" element={<PermissionGuard permission="calendar"><CalendarPage /></PermissionGuard>} />
          <Route path="/advances" element={<PermissionGuard permission="advances"><AdvancesPage /></PermissionGuard>} />
          <Route path="/expenses" element={<PermissionGuard permission="expenses"><ExpensesPage /></PermissionGuard>} />
          <Route path="/employees" element={<PermissionGuard permission="employees"><EmployeesPage /></PermissionGuard>} />
          <Route path="/users" element={<PermissionGuard permission="users"><UsersPage /></PermissionGuard>} />
          <Route path="/reports/daily" element={<DailyReportPage />} />
          <Route path="/reports/weekly" element={<WeeklyReportPage />} />
          <Route path="/reports/monthly" element={<MonthlyReportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/404" element={<AuthLayout />}>
        <Route index element={<NotFoundPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
