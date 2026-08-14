// ErrorBoundary — React class boundary with fallback UI + report button.
// §2 of docs/05. Shows the stack only when `import.meta.env.DEV` is true.
// Phase 0 wiring: surfaces via console + optional reportError callback; the
// real report pipeline lands in Phase 7 (observability).
import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Alert } from './Alert';
import { Button } from './Button';

export interface ErrorBoundaryProps {
  /** Boundary label shown in the error UI (e.g., page or feature name). */
  label?: string;
  /** Optional render-prop to use in place of the default fallback UI. */
  fallback?: (args: { error: Error; reset: () => void }) => ReactNode;
  /** Authenticate-bound callback, e.g., push to telemetry in Phase 7. */
  onReport?: (error: Error, info: ErrorInfo) => void;
  /** Children to render in the error-free case. */
  children?: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | undefined;
  info: ErrorInfo | undefined;
  reported: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: undefined, info: undefined, reported: false };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[Lingora ErrorBoundary]', error, info);
    this.setState({ info });
  }

  private readonly reset = (): void => {
    this.setState({ error: undefined, info: undefined, reported: false });
  };

  private readonly report = (): void => {
    const { error, info } = this.state;
    if (error && info) this.props.onReport?.(error, info);
    this.setState({ reported: true });
  };

  override render(): ReactNode {
    const { error, info, reported } = this.state;
    const { label, fallback, children } = this.props;
    if (!error) return children;

    if (fallback) return fallback({ error, reset: this.reset });

    const dev = Boolean(import.meta.env?.DEV);
    return (
      <Alert
        variant="danger"
        title={`${label ?? 'Something went wrong'}${reported ? ' · reported' : ''}`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={this.reset}>
              Try again
            </Button>
            <Button size="sm" variant="primary" onClick={this.report}>
              Report
            </Button>
          </div>
        }
      >
        <p className="mt-1 break-words text-sm text-text-muted">{error.message}</p>
        {/* Stack is dev-only to avoid leaking internals in prod builds. */}
        {dev && info?.componentStack && (
          <pre className="mt-3 overflow-auto rounded-md bg-bg-2 p-3 text-xs font-mono text-text-muted">
            {String(info.componentStack).trim()}
          </pre>
        )}
      </Alert>
    );
  }
}
