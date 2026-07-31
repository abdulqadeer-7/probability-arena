'use client';

import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { usePreferencesStore } from '@/store/preferences-store';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { t } = useTranslation();
  const { theme, language, reducedMotion } = usePreferencesStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950" dir="ltr">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-aero-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100',
        reducedMotion && 'motion-reduce'
      )}
      dir={language === 'ur' ? 'rtl' : 'ltr'}
    >
      <Header />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 pt-16" id="main-content" role="main">
        {children}
      </main>

      <Footer />

      <Toaster
        position={language === 'ur' ? 'top-left' : 'top-right'}
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)',
            color: theme === 'dark' ? '#f3f4f6' : '#111827',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.18)'}`,
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#06b6d4', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
          },
        }}
      />
    </div>
  );
}
