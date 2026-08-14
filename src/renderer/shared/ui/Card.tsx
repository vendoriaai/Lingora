// Card — token-bound container. §2 of docs/05.
// `default` (flat), `interactive` (hover lift), `ai-tinted` (violet surface).
// When `title` is provided it renders a `<section aria-labelledby>` landmark;
// otherwise it stays a plain div so it can be composed freely.
import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from './cn';

export type CardVariant = 'default' | 'interactive' | 'ai-tinted';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Optional title; renders a header + promotes the root to a <section> landmark keyed by an auto id. */
  title?: string;
  /** Render padding as `unset` (use when a child owns its own spacing). */
  flush?: boolean;
}

const base = 'rounded-lg border transition';

const variants: Record<CardVariant, string> = {
  default: 'border-border bg-bg shadow-1',
  interactive:
    'border-border bg-bg shadow-1 hover:-translate-y-0.5 hover:shadow-2 cursor-pointer motion-reduce:transition-none',
  'ai-tinted':
    'bg-ai-surface border-[color-mix(in_srgb,var(--ai)_30%,transparent)] shadow-1',
};

let cardTitleSeq = 0;

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', title, flush = false, className, children, ...props },
  ref,
) {
  const cls = cn(base, variants[variant], flush ? 'p-0' : 'p-6', className);
  if (title) {
    const titleId = `card-title-${cardTitleSeq++}`;
    return (
      <section ref={ref} className={cls} aria-labelledby={titleId} {...props}>
        <header className="mb-4">
          <h3 id={titleId} className="font-display text-lg font-semibold text-text">
            {title}
          </h3>
        </header>
        {children}
      </section>
    );
  }
  return (
    <div ref={ref} className={cls} {...props}>
      {children}
    </div>
  );
});
