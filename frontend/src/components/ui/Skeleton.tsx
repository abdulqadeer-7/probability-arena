'use client';

import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type SkeletonVariant = 'text' | 'card' | 'avatar' | 'circle' | 'custom';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  width?: string | number;
  height?: string | number;
  lines?: number;
  size?: string | number;
}

export function Skeleton({
  variant = 'text',
  className,
  width,
  height,
  lines = 3,
  size,
}: SkeletonProps) {
  const shouldReduceMotion = useReducedMotion();

  const baseClass = cn(
    'rounded-lg bg-white/10',
    !shouldReduceMotion && 'animate-pulse',
  );

  if (variant === 'text') {
    return (
      <div className={cn('space-y-2', className)} aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={baseClass}
            style={{
              width: width ?? (i === lines - 1 ? '60%' : '100%'),
              height: height ?? 14,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(baseClass, 'h-40', className)}
        style={{ width, height }}
        aria-hidden="true"
      />
    );
  }

  if (variant === 'avatar') {
    return (
      <div
        className={cn(baseClass, 'h-10 w-10 rounded-full', className)}
        style={{ width, height }}
        aria-hidden="true"
      />
    );
  }

  if (variant === 'circle') {
    const dimension = size ?? 40;
    return (
      <div
        className={cn(baseClass, 'rounded-full', className)}
        style={{
          width: width ?? dimension,
          height: height ?? dimension,
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={cn(baseClass, className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
