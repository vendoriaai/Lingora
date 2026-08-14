// Progress — linear + ring styles. §2 of docs/05.
// `role=progressbar` with `aria-valuenow/min/max`. Indeterminate state used
// for unknown durations (e.g., live-session warm-up): pass `value={undefined}`.
// The indeterminate shimmer keyframe (`progress-indeterminate`) is registered
// in tailwind.config.ts; reduced-motion users see a static half-width bar.
import { type HTMLAttributes, type SVGProps } from 'react';

import { cn } from './cn';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** 0..max. Omit (pass undefined) to render the indeterminate shimmer. */
  value?: number;
  min?: number;
  max?: number;
  /** Optional label announced via aria-label and shown beside the bar. */
  label?: string;
}

export function Progress({
  value,
  min = 0,
  max = 100,
  label,
  className,
  ...props
}: ProgressProps) {
  const isIndeterminate = typeof value !== 'number';
  const clamped = isIndeterminate ? 0 : Math.max(min, Math.min(max, value));
  const pct = isIndeterminate ? 0 : ((clamped - min) / (max - min)) * 100;

  return (
    <div className={cn('flex w-full items-center gap-3', className)} {...props}>
      <div
        role="progressbar"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={isIndeterminate ? undefined : clamped}
        aria-label={label}
        className="relative h-2 w-full overflow-hidden rounded-pill bg-bg-2"
      >
        {isIndeterminate ? (
          <div className="absolute inset-y-0 left-0 w-1/3 animate-progress-indeterminate bg-brand-primary motion-reduce:animate-none" />
        ) : (
          <div
            className="absolute inset-y-0 left-0 rounded-pill bg-brand-primary transition-[width] duration-300 ease-standard motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      {label && <span className="text-xs tabular-nums text-text-muted">{label}</span>}
    </div>
  );
}

export interface ProgressRingProps extends Omit<SVGProps<SVGSVGElement>, 'value'> {
  value?: number;
  min?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ProgressRing({
  value,
  min = 0,
  max = 100,
  size = 40,
  strokeWidth = 4,
  label,
  className,
  ...props
}: ProgressRingProps) {
  const isIndeterminate = typeof value !== 'number';
  const clamped = isIndeterminate ? 0 : Math.max(min, Math.min(max, value));
  const ratio = isIndeterminate ? 0.25 : (clamped - min) / (max - min);
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = isIndeterminate ? c * 0.25 : c * ratio;
  const rotate = isIndeterminate ? 0 : -90;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('inline-block motion-reduce:animate-none', className)}
      role="progressbar"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={isIndeterminate ? undefined : clamped}
      aria-label={label}
      {...props}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--bg-surface-2)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--brand-primary)"
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform={`rotate(${rotate} ${size / 2} ${size / 2})`}
        className={cn(
          'transition-[stroke-dasharray] duration-300 ease-standard',
          isIndeterminate && 'animate-spin',
        )}
      />
    </svg>
  );
}
