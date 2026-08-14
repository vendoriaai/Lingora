// Input — text/search, optional leading + trailing adornments, error + disabled.
// §2 of docs/05. Field row wires `label` association (`htmlFor` ↔ `id`),
// `aria-invalid`, and `aria-describedby` linking the error helper text.
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from './cn';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: ReactNode;
  /** Optional helper shown below the field when there is no error. */
  helper?: ReactNode;
  error?: ReactNode;
  /** Slot before the input (e.g., a search icon). */
  leading?: ReactNode;
  /** Slot after the input (e.g., a “reveal” toggle for passwords). */
  trailing?: ReactNode;
  /** Stretch to the parent's block width. */
  fullWidth?: boolean;
}

const base =
  'h-10 rounded-md border bg-bg px-3 text-text placeholder:text-text-muted ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-bg disabled:bg-bg-2 disabled:opacity-60 ' +
  'transition-colors';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helper,
    error,
    leading,
    trailing,
    fullWidth = true,
    className,
    id: idProp,
    type = 'text',
    required,
    disabled,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const invalidId = error ? errorId : helper ? helperId : undefined;
  const describedBy = invalidId ? { 'aria-describedby': invalidId } : {};
  const hasAdornment = Boolean(leading || trailing);

  const inputCls = cn(
    base,
    error
      ? 'border-state-danger focus-visible:ring-state-danger'
      : 'border-border focus-visible:ring-focus',
    hasAdornment && 'flex-1',
    leading && 'ps-2',
    trailing && 'pe-2',
    className,
  );

  const field = (
    <input
      ref={ref}
      id={inputId}
      type={type}
      required={required}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      {...describedBy}
      className={inputCls}
      {...props}
    />
  );

  const wrappedAdorned = hasAdornment ? (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border bg-bg px-3',
        error ? 'border-state-danger' : 'border-border',
        'focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-bg',
        error ? 'focus-within:ring-state-danger' : 'focus-within:ring-focus',
        fullWidth && 'w-full',
      )}
    >
      {leading && <span className="text-text-muted shrink-0">{leading}</span>}
      {field}
      {trailing && <span className="text-text-muted shrink-0">{trailing}</span>}
    </div>
  ) : (
    field
  );

  return (
    <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
          {required && <span className="ms-0.5 text-state-danger">*</span>}
        </label>
      )}
      {wrappedAdorned}
      {error ? (
        <p id={errorId} className="text-xs text-state-danger">
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className="text-xs text-text-muted">
          {helper}
        </p>
      ) : null}
    </div>
  );
});
