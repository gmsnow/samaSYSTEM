'use client';
import { type ReactNode } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

const theme = createTheme({
  direction: 'ltr',
  typography: { fontFamily: '"Nunito", sans-serif' },
  palette: {
    primary: { main: '#3e5679' },
    secondary: { main: '#7c4dff' },
  },
});

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LanguageProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
