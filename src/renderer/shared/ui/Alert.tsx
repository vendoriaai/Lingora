// Alert / Banner — inline info/warning/danger. §2 of docs/05.
// `role=alert` for the danger variant (assertive), `role=status` for info and
// warning (polite) so screen readers announce them appropriately.
import { type HTMLAttributes, type ReactNode } from 'react';

import { cn } from './cn';

export type AlertVariant = 'info' | 'warning' | 'danger';

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: AlertVariant;
  title?: ReactNode;
  /** Icon node rendered in a coloured chip; defaults to a status-appropriate glyph. */
  icon?: ReactNode;
  /** End-of-row action (e.g., a dismiss button or retry CTA). */
  action?: ReactNode;
}

const variants: Record<AlertVariant, { wrap: string; title: string }> = {
  info: {
    wrap: 'border-border bg-bg-1 text-text',
    title: 'text-brand-primary',
  },
  warning: {
    wrap: 'border-state-warning/40 bg-state-warning/10 text-text',
    title: 'text-state-warning',
  },
  danger: {
    wrap: 'border-state-danger/40 bg-state-danger/10 text-text',
    title: 'text-state-danger',
  },
};

export function Alert({
  variant = 'info',
  title,
  icon,
  action,
  className,
  children,
  ...props
}: AlertProps) {
  const role = variant === 'danger' ? 'alert' : 'status';
  return (
    <div
      role={role}
      className={cn('flex items-start gap-3 rounded-md border p-4', variants[variant].wrap, className)}
      {...props}
    >
      {icon && <div className="mt-0.5 shrink-0" aria-hidden="true">{icon}</div>}
      <div className="min-w-0 flex-1">
        {title && <p className={cn('font-semibold', variants[variant].title)}>{title}</p>}
        {children && <div className="text-sm text-text-muted">{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
