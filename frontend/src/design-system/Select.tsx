import React from 'react';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, error, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`h-8 px-2.5 py-1 font-mono text-xs text-ink bg-[#F5F4EE] border cursor-pointer ${
          error ? 'border-red ring-1 ring-red' : 'border-line'
        } focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  },
);

Select.displayName = 'Select';
