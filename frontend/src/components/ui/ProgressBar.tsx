'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const variantStyles = {
  default: 'bg-aero-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
};

export type ProgressVariant = keyof typeof variantStyles;

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: ProgressVariant;
  className?: string;
  barClassName?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  variant = 'default',
  className,
  barClassName,
}: ProgressBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm text-gray-300">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-gray-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${Math.round(percentage)}%`}
      >
        <motion.div
          initial={
            shouldReduceMotion
              ? { width: `${percentage}%` }
              : { width: '0%' }
          }
          animate={{ width: `${percentage}%` }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.8, ease: 'easeOut' }
          }
          className={cn(
            'h-full rounded-full transition-colors',
            variantStyles[variant],
            barClassName,
          )}
        />
      </div>
    </div>
  );
}
