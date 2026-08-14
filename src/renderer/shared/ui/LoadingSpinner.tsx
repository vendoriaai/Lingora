// LoadingSpinner — inline spinner for short async waits.
// `role=status` + `aria-busy` parent expected. Reduced-motion renders a static dot.
import { cn } from './cn';

export interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 16, className, label = 'Loading' }: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-block align-middle', className)}
      style={{ width: size, height: size }}
    >
      <span
        className="block h-full w-full animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none motion-reduce:rounded-full motion-reduce:border-2 motion-reduce:border-current motion-reduce:border-t-current"
        style={{ borderWidth: Math.max(2, Math.round(size / 8)) }}
      />
    </span>
  );
}
