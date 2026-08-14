// Textarea — auto-grow option + char count. §2 of docs/05.
// Mirrors Input's label/error association. Auto-grow uses inline onInput to
// expand row count instead of an underlying height calc library; controlled
// consumers can opt out by setting `autoGrow={false}`
import { forwardRef, useId, type TextareaHTMLAttributes, type ReactNode } from 'react';

import { cn } from './cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  autoGrow?: boolean;
  showCount?: boolean;
  fullWidth?: boolean;
}

function grow(el: HTMLTextAreaElement): void {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    helper,
    error,
    autoGrow = false,
    showCount = false,
    fullWidth = true,
    className,
    id: idProp,
    required,
    disabled,
    maxLength,
    value,
    defaultValue,
    onInput,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const countId = `${inputId}-count`;
  const describedBy: Record<string, string> = {};
  if (error) describedBy['aria-describedby'] = errorId;
  else if (helper) describedBy['aria-describedby'] = helperId;
  if (showCount && (!error || !describedBy['aria-describedby'])) {
    describedBy['aria-describedby'] = describedBy['aria-describedby']
      ? `${describedBy['aria-describedby']} ${countId}`
      : countId;
  }

  const inputCls = cn(
    'min-h-20 rounded-md border bg-bg p-3 text-text placeholder:text-text-muted',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:bg-bg-2 disabled:opacity-60 transition-colors resize-y',
    error ? 'border-state-danger focus-visible:ring-state-danger' : 'border-border focus-visible:ring-focus',
    fullWidth && 'w-full',
    className,
  );

  const currentLength =
    typeof value === 'string' ? value.length : typeof defaultValue === 'string' ? defaultValue.length : 0;

  return (
    <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
          {required && <span className="ms-0.5 text-state-danger">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        onInput={(e) => {
          if (autoGrow) grow(e.currentTarget);
          onInput?.(e);
        }}
        className={inputCls}
        {...describedBy}
        {...props}
      />
      <div className="flex items-center justify-between gap-2">
        {error ? (
          <p id={errorId} className="text-xs text-state-danger">
            {error}
          </p>
        ) : helper ? (
          <p id={helperId} className="text-xs text-text-muted">
            {helper}
          </p>
        ) : (
          <span />
        )}
        {showCount && (
          <p id={countId} className="text-xs text-text-muted tabular-nums">
            {currentLength}
            {maxLength ? `/${maxLength}` : ''}
          </p>
        )}
      </div>
    </div>
  );
});
