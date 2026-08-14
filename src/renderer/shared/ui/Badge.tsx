// Badge / Pill — text + optional leading status dot.
// Per docs/05 §2: brand / neutral / state / outline variants.
import { type HTMLAttributes, type ReactNode } from 'react';

import { cn } from './cn';

export type BadgeVariant = 'brand' | 'neutral' | 'success' | 'warning' | 'danger' | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Renders a coloured dot before the label (status indicators). */
  dot?: boolean;
  children?: ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  brand: 'bg-brand-primary-surface text-brand-primary',
  neutral: 'bg-bg-2 text-text-muted',
  success: 'bg-state-success/15 text-state-success',
  warning: 'bg-state-warning/15 text-state-warning',
  danger: 'bg-state-danger/15 text-state-danger',
  outline: 'border border-border text-text-muted',
};

const dotCls: Record<BadgeVariant, string> = {
  brand: 'bg-brand-primary',
  neutral: 'bg-text-muted',
  success: 'bg-state-success',
  warning: 'bg-state-warning',
  danger: 'bg-state-danger',
  outline: 'bg-border-strong',
};

export function Badge({ variant = 'neutral', dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('size-1.5 rounded-pill', dotCls[variant])} aria-hidden="true" />}
      {children}
    </span>
  );
}
