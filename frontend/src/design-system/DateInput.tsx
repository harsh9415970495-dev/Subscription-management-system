import React from 'react';

export interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="date"
        className={`h-8 px-2.5 py-1 font-mono text-xs text-ink bg-input-bg border ${
          error ? 'border-red ring-1 ring-red' : 'border-line'
        } focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 ${className}`}
        {...props}
      />
    );
  },
);

DateInput.displayName = 'DateInput';
