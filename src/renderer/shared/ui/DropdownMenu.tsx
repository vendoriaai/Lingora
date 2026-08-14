// DropdownMenu — Radix-backed. §2 of docs/05.
// §2 calls for roving focus, Esc to close, click-outside — all native to Radix.
// Sub-menu wiring available but omitted in v0 (not in the immediate phase work).
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';

import { cn } from './cn';

export interface DropdownMenuProps extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root> {
  /** The trigger — must be focusable. */
  trigger: ReactNode;
  /** Alignment of the content relative to the trigger. */
  align?: 'start' | 'center' | 'end';
  /** Edge gap (px) between trigger and content. */
  sideOffset?: number;
  /** Panel width; useful to keep menu widths consistent. */
  contentWidth?: number | string;
  children: ReactNode;
}

export function DropdownMenu({
  trigger,
  align = 'end',
  sideOffset = 6,
  contentWidth = 'auto',
  children,
  ...props
}: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive.Root {...props}>
      <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          sideOffset={sideOffset}
          style={{ minWidth: contentWidth === 'auto' ? undefined : contentWidth, width: contentWidth === 'auto' ? undefined : contentWidth }}
          className={cn(
            'z-modal min-w-44 overflow-hidden rounded-md border border-border bg-bg p-1 shadow-2',
            'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-160',
          )}
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

export interface DropdownMenuItemProps
  extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  /** Render a destructive intent state (red text). */
  danger?: boolean;
  /** Optional icon node shown at the start of the row. */
  icon?: ReactNode;
}

export const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownMenuItemProps>(function DropdownMenuItem(
  { danger = false, icon, className, children, ...props },
  ref,
) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm outline-none',
        'data-[highlighted]:bg-bg-2 data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
        'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        danger ? 'text-state-danger data-[highlighted]:bg-state-danger/10' : 'text-text',
        className,
      )}
      {...props}
    >
      {icon && <span className="text-text-muted" aria-hidden>{icon}</span>}
      {children}
    </DropdownMenuPrimitive.Item>
  );
});

export type DropdownMenuLabelProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>;

export function DropdownMenuLabel({ className, ...props }: DropdownMenuLabelProps) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn('px-3 py-1.5 text-xs font-medium tracking-wide text-text-muted', className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn('my-1 h-px bg-border', className)}
      {...props}
    />
  );
}
