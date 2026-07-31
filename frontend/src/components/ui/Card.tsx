'use client';

import { type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export type CardVariant = 'default' | 'interactive' | 'highlight';
export type CardPadding = keyof typeof paddingStyles;

export interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  onClick,
}: CardProps) {
  const shouldReduceMotion = useReducedMotion();
  const isInteractive = variant === 'interactive';

  return (
    <motion.div
      whileHover={isInteractive && !shouldReduceMotion ? { y: -4, scale: 1.01 } : undefined}
      whileTap={isInteractive && !shouldReduceMotion ? { scale: 0.99 } : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : undefined}
      onKeyDown={
        isInteractive && onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'rounded-xl backdrop-blur-xl border transition-colors duration-200',
        'bg-white/5 dark:bg-white/5 border-white/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aero-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
        isInteractive && 'cursor-pointer hover:border-white/20',
        variant === 'highlight' && 'relative gradient-border',
        paddingStyles[padding],
        className,
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col space-y-1.5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold leading-none tracking-tight text-white', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-gray-400', className)} {...props}>
      {children}
    </p>
  );
}
