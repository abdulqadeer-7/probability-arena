'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

const sizeStyles = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const indicatorSizes = {
  sm: 'h-2 w-2 border',
  md: 'h-2.5 w-2.5 border',
  lg: 'h-3 w-3 border',
  xl: 'h-3.5 w-3.5 border',
};

const avatarColors = [
  'bg-aero-500/20 text-aero-400',
  'bg-accent-500/20 text-accent-400',
  'bg-purple-500/20 text-purple-400',
  'bg-pink-500/20 text-pink-400',
  'bg-green-500/20 text-green-400',
  'bg-red-500/20 text-red-400',
  'bg-blue-500/20 text-blue-400',
  'bg-cyan-500/20 text-cyan-400',
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getAvatarColor(name: string): string {
  return avatarColors[hashName(name) % avatarColors.length];
}

export type AvatarSize = keyof typeof sizeStyles;

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  showOnline?: boolean;
  className?: string;
  alt?: string;
}

export function Avatar({
  src,
  name,
  size = 'md',
  showOnline = false,
  className,
  alt,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src && !imgError ? (
        <img
          src={src}
          alt={alt || `${name}'s avatar`}
          className={cn(
            'rounded-full object-cover',
            sizeStyles[size],
          )}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full font-medium',
            sizeStyles[size],
            colorClass,
          )}
          aria-hidden="true"
        >
          {initials}
        </div>
      )}
      {showOnline && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-gray-950 bg-green-500',
            indicatorSizes[size],
          )}
          aria-label="Online"
        />
      )}
    </div>
  );
}
