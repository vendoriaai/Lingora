// Dialog — Radix-backed. §2 of docs/05.
// size sm/md/lg; side="right" creates a slide-in drawer.
// Radix handles focus trap, restore, Esc, and `aria-labelledby` wiring.
// The `aria-describedby` links description automatically when `description` set.
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cn } from './cn';

export type DialogSize = 'sm' | 'md' | 'lg';
export type DialogSide = 'center' | 'right';

export interface DialogProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {
  /** Visible only while `open` (controlled) or set as the trigger's parent. */
  trigger?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  /** Optional footer slot (e.g., Save/Discard action row for §6). */
  footer?: ReactNode;
  size?: DialogSize;
  side?: DialogSide;
  /** Render a close affordance (X). Default true. */
  showClose?: boolean;
  children?: ReactNode;
}

const sizeCls: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

const sideCls: Record<DialogSide, string> = {
  center:
    'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 data-[state=open]:animate-in data-[state=closed]:animate-out',
  right:
    'left-auto right-0 top-0 bottom-0 h-full rounded-l-xl rounded-r-none translate-x-0',
};

export function Dialog({
  trigger,
  title,
  description,
  footer,
  size = 'md',
  side = 'center',
  showClose = true,
  children,
  ...props
}: DialogProps) {
  return (
    <DialogPrimitive.Root {...props}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-modal bg-black/40 backdrop-blur-sm',
            'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-160',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-modal flex flex-col gap-4 rounded-xl border border-border bg-bg p-6 shadow-3',
            'focus:outline-none',
            sizeCls[size],
            sideCls[side],
            side === 'center' && 'w-[calc(100vw-3rem)]',
          )}
          aria-describedby={description ? 'lingora-dialog-desc' : undefined}
        >
          {(title || showClose) && (
            <header className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                {title && (
                  <DialogPrimitive.Title className="font-display text-lg font-semibold text-text">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description && (
                  <DialogPrimitive.Description
                    id="lingora-dialog-desc"
                    className="text-sm text-text-muted"
                  >
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              {showClose && (
                <DialogPrimitive.Close
                  aria-label="Close"
                  className={cn(
                    'shrink-0 rounded-md p-1 text-text-muted hover:bg-bg-2 hover:text-text',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  )}
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 6 12 12M6 18 18 6" strokeLinecap="round" />
                  </svg>
                </DialogPrimitive.Close>
              )}
            </header>
          )}
          <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
          {footer && <footer className="flex justify-end gap-2">{footer}</footer>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// Convenience: a styled close button to embed in custom layouts.
export type DialogCloseProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Close>;

export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(function DialogClose(
  { className, ...props },
  ref,
) {
  return (
    <DialogPrimitive.Close
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium',
        'text-text-muted hover:bg-bg-2 hover:text-text',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        className,
      )}
      {...props}
    />
  );
});
