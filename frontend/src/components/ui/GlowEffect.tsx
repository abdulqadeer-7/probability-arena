'use client';

import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GlowEffectProps {
  className?: string;
  orbs?: number;
  lowPerformance?: boolean;
  colors?: string[];
}

const defaultColors = [
  'rgba(6, 182, 212, 0.12)',
  'rgba(245, 158, 11, 0.12)',
  'rgba(168, 85, 247, 0.12)',
  'rgba(34, 211, 238, 0.10)',
  'rgba(251, 191, 36, 0.10)',
];

const orbPositions = [
  { x: 15, y: 20 },
  { x: 75, y: 15 },
  { x: 50, y: 70 },
  { x: 80, y: 80 },
  { x: 20, y: 75 },
  { x: 60, y: 30 },
  { x: 30, y: 50 },
  { x: 70, y: 55 },
];

const orbSizes = [180, 220, 160, 240, 200, 190, 210, 170];

export function GlowEffect({
  className,
  orbs = 5,
  lowPerformance = false,
  colors = defaultColors,
}: GlowEffectProps) {
  const shouldReduceMotion = useReducedMotion();

  const gradientBackground = useMemo(() => {
    const gradientStops = colors
      .slice(0, 3)
      .map(
        (color, i) =>
          `radial-gradient(ellipse at ${30 + i * 20}% ${20 + i * 25}%, ${color} 0%, transparent 50%)`,
      )
      .join(', ');
    return gradientStops;
  }, [colors]);

  if (lowPerformance || shouldReduceMotion) {
    return (
      <div
        className={cn('absolute inset-0 pointer-events-none', className)}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{ background: gradientBackground }}
        />
      </div>
    );
  }

  const orbElements = Array.from({ length: Math.min(orbs, orbPositions.length) }, (_, i) => {
    const orb = orbPositions[i];
    const size = orbSizes[i % orbSizes.length];
    const color = colors[i % colors.length];
    const duration = 7 + (i % 5) * 2;
    const delay = i * 0.8;

    return (
      <div
        key={i}
        className="absolute rounded-full animate-float"
        style={{
          width: size,
          height: size,
          left: `${orb.x}%`,
          top: `${orb.y}%`,
          background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    );
  });

  return (
    <div
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      aria-hidden="true"
    >
      <div className="absolute inset-0 opacity-30" style={{ background: gradientBackground }} />
      {orbElements}
    </div>
  );
}
