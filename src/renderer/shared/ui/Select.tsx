// Select — Radix Select wrapper, size sm/md. §2 of docs/05.
// Searchable variant is deferred to Phase 1 (calls for a Combobox pattern);
// v0 ships the standard picker with full keyboard nav + a11y.
import * as SelectPrimitive from '@radix-ui/react-select';
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cn } from './cn';
import { LoadingSpinner } from './LoadingSpinner';

export type SelectSize = 'sm' | 'md';

export interface SelectProps
  extends Omit<ComponentPropsWithoutRef<typeof SelectPrimitive.Root>, 'asChild'> {
  size?: SelectSize;
  /** Placeholder shown when no value is set. */
  placeholder?: string;
  /** Renders a loading state (e.g., while options resolve). */
  loading?: boolean;
  /** Stretch to the parent's block width. */
  fullWidth?: boolean;
  /** Applied to the trigger element (Radix Root does not accept className). */
  className?: string;
  children?: ReactNode;
}

const sizeCls: Record<SelectSize, string> = {
  sm: 'h-8 text-sm px-3',
  md: 'h-10 text-sm px-3',
};

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { size = 'md', placeholder, loading = false, fullWidth = true, className, children, ...props },
  _ref,
) {
  return (
    <SelectPrimitive.Root {...props}>
      <SelectPrimitive.Trigger
        className={cn(
          'inline-flex items-center justify-between gap-2 rounded-md border border-border bg-bg text-text',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          'disabled:bg-bg-2 disabled:opacity-60 disabled:cursor-not-allowed',
          'transition-colors',
          sizeCls[size],
          fullWidth && 'w-full',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={loading ? undefined : placeholder} />
        <SelectPrimitive.Icon asChild>
          {loading ? (
            <LoadingSpinner size={14} />
          ) : (
            <ChevronDownIcon className="size-4 text-text-muted" aria-hidden />
          )}
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            'z-modal max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden',
            'rounded-md border border-border bg-bg shadow-2',
            'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-160',
          )}
        >
          <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
});

export type SelectItemProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(function SelectItem(
  { className, children, ...props },
  ref,
) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md py-2 pe-8 ps-3 text-sm text-text outline-none',
        'data-[highlighted]:bg-bg-2 data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
        'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute end-2 inline-flex size-4 items-center justify-center text-brand-primary">
        <CheckIcon className="size-4" aria-hidden />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
});

// Inline tiny icons keep the select self-contained; lucide-react is the public
// icon library used elsewhere, these two glyphs mirror its stroke proportions.
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m4 12 5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
