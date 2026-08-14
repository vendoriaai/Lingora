// IconButton — square Button + required accessible label. §2 of docs/05.
// `aria-label` is mandatory (icons-only controls never rely on visual meaning).
// Plain `title` is used as the inline tooltip for now; the formal Radix-based
// Tooltip wrapper lands with the rest of the Radix-backed set.
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { Button, type ButtonVariant, type ButtonSize } from './Button';
import { cn } from './cn';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'prefix'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Required accessible name (e.g., \"Open menu\"), never the icon label alone. */
  'aria-label': string;
  /** Native tooltip shown on hover/focus — useful for sightedkeyboard users. */
  title?: string;
  children?: ReactNode;
}

const sizeBox: Record<ButtonSize, string> = {
  sm: 'size-8 p-0',
  md: 'size-10 p-0',
  lg: 'size-12 p-0',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', size = 'md', loading = false, className, children, ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      loading={loading}
      className={cn('shrink-0 justify-center', sizeBox[size], className)}
      {...props}
    >
      {children}
    </Button>
  );
});
