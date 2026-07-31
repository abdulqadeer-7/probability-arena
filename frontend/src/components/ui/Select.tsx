'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  srLabel?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, srLabel = false, className, children, id, ...props }, ref) => {
    const selectId =
      id ||
      (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              'block text-sm font-medium text-gray-300',
              srLabel && 'sr-only',
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'block w-full appearance-none rounded-lg px-3 py-2.5 pr-10 text-sm text-gray-100',
              'bg-white/5 backdrop-blur-xl border border-white/10',
              'focus:outline-none focus:ring-2 focus:ring-aero-500/20 focus:border-aero-500/50',
              'transition-all duration-200',
              error &&
                'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={
              error && selectId ? `${selectId}-error` : undefined
            }
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        {error && (
          <p
            id={`${selectId}-error`}
            className="text-sm text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
