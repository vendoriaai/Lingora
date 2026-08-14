// Slider — Radix-backed; used for volume / playback rate. §2 of docs/05.
// min/max labels rendered when `showLabels` is set so keyboard + low-vision
// users have non-color cues for the range extents.
import * as SliderPrimitive from '@radix-ui/react-slider';
import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cn } from './cn';

export interface SliderProps
  extends Omit<ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'asChild'> {
  /** When true, renders the min/max as text labels on either side of the track. */
  showLabels?: boolean;
  /** Optional textual ranges (e.g., \"0.5x\" / \"2x\"); defaults to the raw min/max. */
  minLabel?: ReactNode;
  maxLabel?: ReactNode;
}

export function Slider({
  className,
  showLabels = false,
  minLabel,
  maxLabel,
  min = 0,
  max = 100,
  ...props
}: SliderProps) {
  const track = (
    <SliderPrimitive.Root
      min={min}
      max={max}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        'disabled:opacity-50 disabled:pointer-events-none',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full overflow-hidden rounded-pill bg-bg-2">
        <SliderPrimitive.Range className="absolute h-full rounded-pill bg-brand-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          'block size-4 rounded-pill bg-bg border border-brand-primary shadow-1',
          'transition-transform duration-160 ease-standard motion-reduce:transition-none',
          'hover:scale-110',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          'disabled:cursor-not-allowed',
        )}
      />
    </SliderPrimitive.Root>
  );

  if (!showLabels) return track;

  return (
    <div className="flex w-full flex-col gap-1">
      {track}
      <div className="flex items-center justify-between text-xs text-text-muted tabular-nums">
        <span>{minLabel ?? min}</span>
        <span>{maxLabel ?? max}</span>
      </div>
    </div>
  );
}
