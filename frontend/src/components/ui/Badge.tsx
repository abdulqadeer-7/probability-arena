import { cn } from '@/lib/utils';

const variantStyles = {
  default: 'bg-white/10 text-gray-200 border-white/10',
  success: 'bg-green-500/15 text-green-400 border-green-500/25',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  danger: 'bg-red-500/15 text-red-400 border-red-500/25',
  info: 'bg-aero-500/15 text-aero-400 border-aero-500/25',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
};

const dotColors: Record<string, string> = {
  default: 'bg-gray-400',
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  danger: 'bg-red-400',
  info: 'bg-aero-400',
};

export type BadgeVariant = keyof typeof variantStyles;
export type BadgeSize = keyof typeof sizeStyles;

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium backdrop-blur-xl',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
