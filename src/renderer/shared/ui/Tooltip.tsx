// Tooltip — Radix-backed; 300ms show delay, Esc dismiss. §2 of docs/05.
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cn } from './cn';

export interface TooltipProps {
  /** The trigger — needs to be focusable (a `Button`, an `IconButton`, or explicit `<button>`). */
  children: ReactNode;
  /** Plain text shown in the tooltip; keep short (use Popover for rich UI). */
  content: ReactNode;
  /** Render the tooltip on a specific side. */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Pass `false` to opt this instance out of the arrow. Default true. */
  arrow?: boolean;
}

export type TooltipProviderProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>;

export function TooltipProvider({ delayDuration = 300, ...props }: TooltipProviderProps) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={0} {...props} />;
}

export function Tooltip({ children, content, side = 'top', arrow = true }: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={300} disableHoverableContent>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            'z-tooltip max-w-xs rounded-md bg-bg-2 px-2.5 py-1.5 text-xs text-text shadow-2',
            'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-160',
            'select-none',
          )}
        >
          {content}
          {arrow && <TooltipPrimitive.Arrow className="size-2 fill-bg-2" />}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
