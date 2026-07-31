'use client';

import { type ReactNode } from 'react';
import {
  Toaster as HotToaster,
  toast as hotToast,
  type ToastOptions,
  type DefaultToastOptions,
} from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const variantConfig = {
  success: {
    icon: CheckCircle,
    containerClass: 'bg-green-500/15 border-green-500/25 text-green-400',
  },
  error: {
    icon: XCircle,
    containerClass: 'bg-red-500/15 border-red-500/25 text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'bg-yellow-500/15 border-yellow-500/25 text-yellow-400',
  },
  info: {
    icon: Info,
    containerClass: 'bg-aero-500/15 border-aero-500/25 text-aero-400',
  },
};

export type ToastVariant = keyof typeof variantConfig;

export interface ShowToastOptions {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  id?: string;
}

const defaultToastOptions: DefaultToastOptions = {
  duration: 4000,
  style: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: 0,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    fontSize: '14px',
    lineHeight: '1.5',
    maxWidth: '400px',
  },
};

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      gutter={12}
      containerClassName="!pointer-events-auto"
      toastOptions={defaultToastOptions}
    >
      {(t) => {
        const variant = (t.type === 'success'
          ? 'success'
          : t.type === 'error'
            ? 'error'
            : 'info') as ToastVariant;
        const config = variantConfig[variant];
        const Icon = config.icon;

        return (
          <div
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl',
              config.containerClass,
            )}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="flex-1 text-sm text-gray-200">{t.message as ReactNode}</p>
            <button
              onClick={() => hotToast.dismiss(t.id)}
              className="shrink-0 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      }}
    </HotToaster>
  );
}

function createToast(message: string, variant: ToastVariant, options?: ToastOptions) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return hotToast.custom(
    (t) => (
      <div
        className={cn(
          'flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl',
          config.containerClass,
        )}
      >
        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        <p className="flex-1 text-sm text-gray-200">{message}</p>
        <button
          onClick={() => hotToast.dismiss(t.id)}
          className="shrink-0 text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ),
    { ...options, duration: options?.duration ?? 4000 },
  );
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    createToast(message, 'success', options),
  error: (message: string, options?: ToastOptions) =>
    createToast(message, 'error', options),
  warning: (message: string, options?: ToastOptions) =>
    createToast(message, 'warning', options),
  info: (message: string, options?: ToastOptions) =>
    createToast(message, 'info', options),
  dismiss: hotToast.dismiss,
};
