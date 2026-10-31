import React from 'react';

export interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  error,
  hint,
  required,
  children,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="font-mono text-[11px] uppercase tracking-wider text-ink-muted flex items-center gap-1 select-none">
          {label}
          {required && <span className="text-red font-bold">*</span>}
        </label>
      )}
      {children}
      {error && (
        <span className="font-mono text-[11px] text-red tracking-tight">
          ERR · {error}
        </span>
      )}
      {!error && hint && (
        <span className="font-mono text-[11px] text-ink-muted">
          {hint}
        </span>
      )}
    </div>
  );
};
