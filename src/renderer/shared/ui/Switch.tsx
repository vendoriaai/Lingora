// Switch — Radix-backed, on=brand-primary. §2 of docs/05.
// Accessible name rides on `aria-label` (or wrapped Field label via htmlFor).
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cn } from './cn';

export type SwitchSize = 'sm' | 'md';

export interface SwitchProps
  extends Omit<ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>, 'asChild'> {
  size?: SwitchSize;
  /** Optional helper text shown to the right of the switch. */
  label?: string;
}

const trackSize: Record<SwitchSize, string> = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
};

const knobSize: Record<SwitchSize, string> = {
  sm: 'size-4 data-[state=checked]:translate-x-4',
  md: 'size-5 data-[state=checked]:translate-x-5',
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { size = 'md', label, className, ...props },
  ref,
) {
  const control = (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-pill border border-transparent bg-bg-2',
        'transition-colors duration-160 ease-standard motion-reduce:transition-none',
        'data-[state=checked]:bg-brand-primary',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:cursor-not-allowed disabled:opacity-50',
        trackSize[size],
        className,
      )}
      role="switch"
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'ms-0.5 inline-block rounded-pill bg-white shadow-1 transition-transform duration-160 ease-standard',
          'motion-reduce:transition-none',
          knobSize[size],
        )}
      />
    </SwitchPrimitive.Root>
  );

  if (!label) return control;

  return (
    <label className="inline-flex items-center gap-2 text-sm text-text">
      {control}
      <span>{label}</span>
    </label>
  );
});
