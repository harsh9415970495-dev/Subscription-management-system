import React from 'react';

export interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="number"
        className={`h-8 px-2.5 py-1 font-mono text-xs text-ink bg-input-bg border text-right tabular-nums ${
          error ? 'border-red ring-1 ring-red' : 'border-line'
        } focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 ${className}`}
        {...props}
      />
    );
  },
);

NumberInput.displayName = 'NumberInput';
