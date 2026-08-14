// EmptyState — icon + title + optional description/action. §2 of docs/05.
// Always offers a next action per §7 (e.g., “No live sessions yet — start one”).
import { type ReactNode } from 'react';

import { cn } from './cn';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Visually compressed layout for inline (list/card) use rather than full-page. */
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, className, compact = false }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center motion-reduce:transition-none',
        compact ? 'gap-2 py-8' : 'gap-3 py-16',
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-pill bg-brand-primary-surface text-brand-primary',
            compact ? 'size-10' : 'size-14',
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className={cn('font-display font-semibold text-text', compact ? 'text-sm' : 'text-lg')}>{title}</h3>
      {description && <p className="max-w-reading text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
