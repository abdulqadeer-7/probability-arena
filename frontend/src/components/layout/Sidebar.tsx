'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  X,
  Gamepad2,
  BookOpen,
  Trophy,
  LayoutDashboard,
  Medal,
  Swords,
  LogOut,
  Coins,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useGameStore } from '@/store/game-store';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { href: '/games', labelKey: 'nav.games', icon: Gamepad2 },
  { href: '/learn', labelKey: 'nav.learn', icon: BookOpen },
  { href: '/leaderboard', labelKey: 'nav.leaderboard', icon: Trophy },
  { href: '/dashboard', labelKey: 'nav.achievements', icon: LayoutDashboard },
  { href: '/challenges', labelKey: 'nav.challenges', icon: Swords },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { wallet } = useGameStore();

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-72 glass border-r border-glass-border dark:border-glass-border-dark shadow-2xl md:hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <span className="text-lg font-bold text-gradient">{t('app.name')}</span>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={t('common.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isAuthenticated && user && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-aero-400 to-accent-400 flex items-center justify-center text-base font-bold text-white shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user.displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
                  </div>
                </div>
                {wallet && (
                  <div className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-500/10 text-accent-500 dark:text-accent-400 text-sm font-medium">
                    <Coins className="h-4 w-4" aria-hidden="true" />
                    {wallet.balance.toLocaleString()} {t('common.points')}
                  </div>
                )}
              </div>
            )}

            <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin" aria-label="Sidebar navigation">
              {navItems.map(({ href, labelKey, icon: Icon }) => {
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
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {t(labelKey)}
                  </Link>
                );
              })}
            </nav>

            <div className="p-3 border-t border-gray-200 dark:border-gray-800">
              {isAuthenticated ? (
                <button
                  onClick={() => { logout(); onClose(); }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {t('nav.logout')}
                </button>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 glass hover:glass-hover transition-all"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    href="/register"
                    className="flex w-full items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-aero-500 to-accent-500 transition-all"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
