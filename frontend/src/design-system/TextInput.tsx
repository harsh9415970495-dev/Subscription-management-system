import React from 'react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        className={`h-8 px-2.5 py-1 font-mono text-xs text-ink bg-input-bg border ${
          error ? 'border-red ring-1 ring-red' : 'border-line'
        } focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 ${className}`}
        {...props}
      />
    );
  },
);

TextInput.displayName = 'TextInput';
