'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const variantStyles = {
  default:
    'bg-white/5 border-white/10 focus:border-aero-500/50 focus:bg-white/10',
  filled:
    'bg-white/10 border-transparent focus:bg-white/15 focus:border-aero-500/50',
};

export type InputVariant = keyof typeof variantStyles;

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  variant?: InputVariant;
  srLabel?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      iconLeft,
      iconRight,
      variant = 'default',
      srLabel = false,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId =
      id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-gray-300',
              srLabel && 'sr-only',
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {iconLeft}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500',
              'backdrop-blur-xl border transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-aero-500/20',
              variantStyles[variant],
              error &&
                'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
              iconLeft && 'pl-10',
              iconRight && 'pr-10',
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            {...props}
          />
          {iconRight && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              {iconRight}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
