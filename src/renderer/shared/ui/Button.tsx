// Button — variant-styled, theme-token-bound, keyboard-first.
// Source: docs/05-DESIGN-SYSTEM.md §2. Variants per the spec table.
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from './cn';
import { LoadingSpinner } from './LoadingSpinner';

export type ButtonVariant = 'primary' | 'accent' | 'ai' | 'ghost' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Disables the button and renders a spinner; sets `aria-busy`. */
  loading?: boolean;
  /** Stretch to fill the parent's inline/block width. */
  fullWidth?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 active:scale-[.99]';

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-md',
  md: 'h-10 px-4 text-sm rounded-md',
  lg: 'h-12 px-6 text-base rounded-lg',
};

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-primary text-text-onPrimary shadow-1 hover:bg-brand-primary-deep',
  accent: 'bg-brand-accent text-text-onPrimary shadow-1 hover:bg-brand-accent-deep',
  ai: 'bg-ai text-text-onPrimary shadow-1 hover:opacity-90',
  ghost: 'text-text hover:bg-bg-2',
  outline: 'border border-border text-text hover:bg-bg-2 hover:border-border-strong',
  danger: 'bg-state-danger/10 text-state-danger border border-state-danger/30 hover:bg-state-danger/20',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, fullWidth = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={props.type ?? 'button'}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], fullWidth && 'w-full', className)}
      {...props}
    >
      {loading && <LoadingSpinner size={size === 'lg' ? 18 : 14} className="-ms-0.5" />}
      {children}
    </button>
  );
});
