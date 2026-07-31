import { type ReactNode } from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, type ButtonVariant } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: ReactNode;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  actionVariant = 'primary',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
        <Icon className="h-8 w-8 text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-gray-400">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button
          variant={actionVariant}
          className="mt-6"
          onClick={onAction}
          iconLeft={actionIcon}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
