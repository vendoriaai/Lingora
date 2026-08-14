// Skeleton — shimmer placeholder for lists/cards/async content regions.
// Reduced-motion flattens to a solid surface (no shimmer keyframe).
import { cn } from './cn';

export interface SkeletonProps {
  className?: string;
  /** Width — accepts any CSS size; defaults to 100%. */
  width?: string | number;
  /** Height — accepts any CSS size. */
  height?: string | number;
  /** Render a rounded-full pill (avatars, badges). */
  circle?: boolean;
}

export function Skeleton({ className, width = '100%', height, circle = false }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-bg-2 motion-reduce:animate-none',
        circle ? 'rounded-full' : 'rounded-md',
        className,
      )}
      style={{ width, height }}
    />
  );
}
