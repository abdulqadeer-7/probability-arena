'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const sizeConfig = {
  sm: { track: 'h-4 w-7', thumb: 'h-3 w-3', checked: 'peer-checked:translate-x-3' },
  md: { track: 'h-5 w-9', thumb: 'h-4 w-4', checked: 'peer-checked:translate-x-4' },
};

const colorConfig = {
  default: 'bg-gray-600 peer-checked:bg-aero-500',
  success: 'bg-gray-600 peer-checked:bg-green-500',
  warning: 'bg-gray-600 peer-checked:bg-yellow-500',
  danger: 'bg-gray-600 peer-checked:bg-red-500',
};

export type ToggleSize = keyof typeof sizeConfig;
export type ToggleColor = keyof typeof colorConfig;

export interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?: string;
  size?: ToggleSize;
  color?: ToggleColor;
  srLabel?: boolean;
}

export function Toggle({
  label,
  size = 'md',
  color = 'default',
  srLabel = false,
  checked: controlledChecked,
  defaultChecked,
  onChange,
  className,
  disabled,
  id,
  ...props
}: ToggleProps) {
  const [internalChecked, setInternalChecked] = useState(
    defaultChecked || false,
  );
  const isControlled = controlledChecked !== undefined;
  const isChecked = isControlled ? controlledChecked : internalChecked;
  const toggleId =
    id || (label ? `toggle-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalChecked(e.target.checked);
    }
    onChange?.(e);
  };

  const dims = sizeConfig[size];

  return (
    <label
      htmlFor={toggleId}
      className={cn(
        'inline-flex items-center gap-3',
        disabled && 'cursor-not-allowed opacity-50',
        !disabled && 'cursor-pointer',
        className,
      )}
    >
      <div className="relative">
        <input
          id={toggleId}
          type="checkbox"
          role="switch"
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
          aria-checked={isChecked}
          {...props}
        />
        <div
          className={cn(
            dims.track,
            'rounded-full transition-colors duration-200',
            colorConfig[color],
            'peer-focus-visible:ring-2 peer-focus-visible:ring-aero-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-gray-950',
          )}
        >
          <div
            className={cn(
              dims.thumb,
              'mt-0.5 ml-0.5 rounded-full bg-white shadow transition-transform duration-200',
              dims.checked,
            )}
          />
        </div>
      </div>
      {label && (
        <span
          className={cn(
            'text-sm text-gray-300 select-none',
            srLabel && 'sr-only',
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
}
