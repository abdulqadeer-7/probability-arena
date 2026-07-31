'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Rocket, Shield, FileText, HeartHandshake, Mail, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

const footerLinks = [
  { href: '/privacy', label: 'Privacy Policy', icon: Shield },
  { href: '/terms', label: 'Terms of Service', icon: FileText },
  { href: '/responsible-play', label: 'Responsible Play', icon: HeartHandshake },
  { href: '/contact', label: 'Contact Us', icon: Mail },
  { href: '/fairness', label: 'Fairness', icon: Scale },
];

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-sm" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
              <Rocket className="h-5 w-5 text-aero-500" aria-hidden="true" />
              <span className="text-gradient">{t('app.name')}</span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
              {t('app.tagline')}
            </p>
          </div>

          <div className="md:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {footerLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Icon className="h-4 w-4 text-aero-500" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            &copy; {year} {t('app.name')}. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-2xl mx-auto leading-relaxed">
            <strong>Important Notice:</strong> This is a real-money gaming platform. Play responsibly.
            If you or someone you know has a gambling problem, please seek professional help.
            Must be 18+ to play.
          </p>
        </div>
      </div>
    </footer>
  );
}
