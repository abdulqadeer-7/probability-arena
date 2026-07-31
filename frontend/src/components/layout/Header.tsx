'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Rocket,
  Menu,
  X,
  Sun,
  Moon,
  Gamepad2,
  BookOpen,
  Trophy,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Coins,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { usePreferencesStore } from '@/store/preferences-store';
import { useGameStore } from '@/store/game-store';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/games', labelKey: 'nav.games', icon: Gamepad2 },
  { href: '/learn', labelKey: 'nav.learn', icon: BookOpen },
  { href: '/leaderboard', labelKey: 'nav.leaderboard', icon: Trophy },
  { href: '/dashboard', labelKey: 'nav.achievements', icon: LayoutDashboard },
];

export function Header() {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuthStore();
  const { theme, language, toggleTheme, setLanguage, reducedMotion } = usePreferencesStore();
  const { wallet } = useGameStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const transition = reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-glass-border dark:border-glass-border-dark'
      )}
      role="banner"
    >
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6" aria-label="Main navigation">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight"
            aria-label={`${t('app.name')} - ${t('app.tagline')}`}
          >
            <motion.span
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-aero-500"
              aria-hidden="true"
            >
              <Rocket className="h-6 w-6" />
            </motion.span>
            <span className="text-gradient">{t('app.name')}</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, labelKey, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'text-aero-400 dark:text-aero-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {t(labelKey)}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-aero-500"
                      transition={transition}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {wallet && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-sm font-medium text-accent-500 dark:text-accent-400"
              aria-label={`${t('game.balance')}: ${wallet.balance} ${t('common.points')}`}
            >
              <Coins className="h-4 w-4" aria-hidden="true" />
              <span>{wallet.balance.toLocaleString()}</span>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg glass text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            aria-label={theme === 'dark' ? t('settings.light') : t('settings.dark')}
          >
            <AnimatePresence mode="wait">
              {theme === 'dark' ? (
                <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Sun className="h-4 w-4" />
                </motion.span>
              ) : (
                <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Moon className="h-4 w-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
            className="flex h-9 w-9 items-center justify-center rounded-lg glass text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            aria-label={`Switch language to ${language === 'en' ? 'Urdu' : 'English'}`}
          >
            {language === 'en' ? 'EN' : 'UR'}
          </button>

          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg glass hover:glass-hover transition-all"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label={`${t('nav.settings')}: ${user.displayName}`}
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-aero-400 to-accent-400 flex items-center justify-center text-xs font-bold text-white">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                  {user.displayName}
                </span>
                <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 transition-transform', userMenuOpen && 'rotate-180')} aria-hidden="true" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl glass border border-glass-border dark:border-glass-border-dark shadow-xl overflow-hidden"
                    role="menu"
                  >
                    <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-medium">{user.displayName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</p>
                      {wallet && (
                        <p className="flex items-center gap-1 mt-1.5 text-xs font-medium text-accent-500">
                          <Coins className="h-3 w-3" aria-hidden="true" />
                          {wallet.balance.toLocaleString()} {t('common.points')}
                        </p>
                      )}
                    </div>
                    <div className="p-1">
                      <Link
                        href="/wallet"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('nav.wallet')}
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('nav.settings')}
                      </Link>
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        disabled={authLoading}
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        {authLoading ? t('common.loading') : t('nav.logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 glass hover:glass-hover transition-all"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-aero-500 to-accent-500 hover:from-aero-600 hover:to-accent-600 transition-all shadow-lg shadow-aero-500/20"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg glass text-gray-600 dark:text-gray-400"
            aria-label={mobileMenuOpen ? t('common.close') : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden glass border-t border-glass-border dark:border-glass-border-dark overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(({ href, labelKey, icon: Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-aero-500/10 text-aero-500 dark:text-aero-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {t(labelKey)}
                  </Link>
                );
              })}

              {!isAuthenticated && (
                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Link href="/login" className="flex-1 text-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 glass hover:glass-hover transition-all">
                    {t('nav.login')}
                  </Link>
                  <Link href="/register" className="flex-1 text-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-aero-500 to-accent-500 transition-all">
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
