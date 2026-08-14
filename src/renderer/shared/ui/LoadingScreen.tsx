// LoadingScreen — full-viewport bootstrap splash. Used only at app start
// while the auth/session state resolves. `aria-busy` on the wrapper.
import { cn } from './cn';
import { LoadingSpinner } from './LoadingSpinner';

export interface LoadingScreenProps {
  label?: string;
  className?: string;
}

export function LoadingScreen({ label = 'Loading Lingora', className }: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        'flex min-h-screen flex-col items-center justify-center gap-4 bg-bg text-text-muted',
        className,
      )}
    >
      <LoadingSpinner size={32} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
