// Avatar — src / initials / gradient fallback. §2 of docs/05.
// Decorative avatars (no alt info) get `aria-hidden="true"`; meaningful ones
// still pass an `alt`. Falls back to initials → gradient tile on src/initials
// unavailability. Sizes are fixed by the size prop to keep optical consistency.
import { forwardRef, useState, type ImgHTMLAttributes, type ReactNode } from 'react';

import { cn } from './cn';

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Initials shown when src is broken or omitted (e.g., " bananbenbadr" → "BB"). */
  initials?: string;
  /** Marks the avatar as decorative so it is hidden from assistive tech. */
  decorative?: boolean;
  children?: ReactNode;
}

const sizePx: Record<NonNullable<AvatarProps['size']>, number> = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 56,
};

const initialsFrom = (raw?: string): string => {
  if (!raw) return '';
  const parts = raw.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0] ?? '').slice(0, 2).toUpperCase();
  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
};

export const Avatar = forwardRef<HTMLImageElement, AvatarProps>(function Avatar(
  { size = 'md', initials, alt, decorative = false, src, className, children, ...props },
  ref,
) {
  const [broken, setBroken] = useState(false);
  const px = sizePx[size];
  const showImage = src && !broken;
  const showInitials = !showImage && initials;
  const showGradient = !showImage && !showInitials;
  const ariaProps = decorative
    ? { 'aria-hidden': true as const, role: 'presentation' as const }
    : { alt: alt ?? initials ?? 'User avatar' };

  if (showImage) {
    return (
      <img
        ref={ref}
        src={src}
        className={cn('rounded-pill object-cover bg-bg-2', className)}
        style={{ width: px, height: px }}
        onError={() => setBroken(true)}
        {...ariaProps}
        {...props}
      />
    );
  }

  // Fallback tile wraps the initials or a circular gradient marker.
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-pill bg-avatar-tile text-text-onPrimary font-semibold select-none',
        showGradient && 'opacity-80',
        className,
      )}
      style={{ width: px, height: px, fontSize: px * 0.36 }}
      aria-label={decorative ? undefined : (alt) ?? initials ?? 'User avatar'}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? 'presentation' : undefined}
    >
      {children ?? (showInitials ? initialsFrom(initials) : null)}
    </div>
  );
});
