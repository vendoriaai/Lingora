// Toast — Radix Toast surface + provider + imperative helper.
// §2 of docs/05: title+desc+action; info/success/warning/danger; auto-dismiss
// 5s except danger (sticky until closed). Live region roles are Radix-native.
import * as ToastPrimitive from '@radix-ui/react-toast';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';

import { cn } from './cn';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ToastRecord {
  id: string;
  variant: ToastVariant;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Override default duration. Danger defaults to Infinity (sticky). */
  duration?: number;
}

interface ToastContextValue {
  toast: (t: Omit<ToastRecord, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps extends ComponentPropsWithoutRef<typeof ToastPrimitive.Provider> {
  children: ReactNode;
}

export function ToastProvider({ children, ...props }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const seqRef = useRef(0);
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const toast = useCallback((t: Omit<ToastRecord, 'id'>) => {
    const id = `toast-${seqRef.current++}`;
    setToasts((prev) => [...prev, { ...t, id }]);
    return id;
  }, []);
  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider
        swipeDirection="right"
        duration={5000}
        {...props}
      >
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            defaultOpen
            duration={t.duration ?? (t.variant === 'danger' ? Number.POSITIVE_INFINITY : 5000)}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-md border p-4 shadow-2',
              'motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:fade-in motion-safe:duration-220',
              variantWrap[t.variant],
            )}
          >
            <div className="min-w-0 flex-1">
              {t.title && <ToastPrimitive.Title className="text-sm font-semibold">{t.title}</ToastPrimitive.Title>}
              {t.description && (
                <ToastPrimitive.Description className="text-sm text-text-muted">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            {t.action && <div className="shrink-0 self-center">{t.action}</div>}
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport
          className={cn(
            'fixed bottom-4 right-4 z-toast flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2',
            'outline-none',
          )}
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

const variantWrap: Record<ToastVariant, string> = {
  info:     'border-border bg-bg text-text',
  success:  'border-state-success/40 bg-state-success/10 text-text',
  warning:  'border-state-warning/40 bg-state-warning/10 text-text',
  danger:   'border-state-danger/40 bg-state-danger/10 text-text',
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

// Re-export so consumers that want to fuse with their own viewports can.
export { ToastPrimitive };
