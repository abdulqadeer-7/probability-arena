'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

const friendlyMessages = [
  'Something went wrong, but dont worry — we are on it.',
  'This is not supposed to happen. Let us try again.',
  'A glitch in the matrix. One more try should do it.',
  'Oops! The odds were not in our favor this time.',
];

export function ErrorState({
  title = 'Unexpected Error',
  description,
  onRetry,
  retryLabel = 'Try Again',
  className,
}: ErrorStateProps) {
  const message =
    description ||
    friendlyMessages[Math.floor(Math.random() * friendlyMessages.length)];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className,
      )}
      role="alert"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 backdrop-blur-xl border border-red-500/20">
        <AlertTriangle className="h-8 w-8 text-red-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-gray-400">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          className="mt-6"
          onClick={onRetry}
          iconLeft={<RefreshCw className="h-4 w-4" />}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
