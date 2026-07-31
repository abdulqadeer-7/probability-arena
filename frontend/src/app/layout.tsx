'use client';

import { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import { usePreferencesStore } from '@/store/preferences-store';
import { Toaster } from 'react-hot-toast';
import '@/lib/i18n';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme, language } = usePreferencesStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [theme, language]);

  return (
    <html
      lang={language}
      dir={language === 'ur' ? 'rtl' : 'ltr'}
      className={`${inter.variable} ${theme === 'dark' ? 'dark' : ''}`}
      suppressHydrationWarning
    >
      <head>
        <title>AeroArcade - Learn Probability Through Play</title>
        <meta name="description" content="Master probability and statistics through interactive gameplay. Practice points have no monetary value. Learn, play, and earn achievements." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content={theme === 'dark' ? '#030712' : '#ffffff'} />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} font-sans antialiased ${!mounted ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}>
        {children}
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
      </body>
    </html>
  );
}
