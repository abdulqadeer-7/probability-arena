'use client';

import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const variantStyles = {
  primary:
    'bg-aero-500 text-white hover:bg-aero-600 focus-visible:ring-aero-500 shadow-lg shadow-aero-500/25',
  secondary:
    'bg-white/10 text-gray-100 hover:bg-white/20 focus-visible:ring-white/30 backdrop-blur-xl border border-white/10',
  ghost:
    'text-gray-300 hover:text-white hover:bg-white/10 focus-visible:ring-white/30',
  danger:
    'bg-red-500/90 text-white hover:bg-red-600 focus-visible:ring-red-500 shadow-lg shadow-red-500/25',
  warning:
    'bg-amber-500/90 text-white hover:bg-amber-600 focus-visible:ring-amber-500 shadow-lg shadow-amber-500/25',
  success:
    'bg-green-500/90 text-white hover:bg-green-600 focus-visible:ring-green-500 shadow-lg shadow-green-500/25',
  outline:
    'border border-white/20 text-gray-200 hover:bg-white/10 hover:text-white focus-visible:ring-white/30',
};

const sizeStyles = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  onClick,
}: ButtonProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      type={type}
      onClick={onClick}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : iconLeft ? (
        <span className="shrink-0" aria-hidden="true">
          {iconLeft}
        </span>
      ) : null}
      {children}
      {!loading && iconRight ? (
        <span className="shrink-0" aria-hidden="true">
          {iconRight}
        </span>
      ) : null}
    </motion.button>
  );
}
