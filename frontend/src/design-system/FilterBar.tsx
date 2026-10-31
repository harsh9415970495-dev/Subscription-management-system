import React from 'react';
import { TextInput } from './TextInput';
import { Button } from './Button';

export interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  onReset?: () => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'FILTER BY NUMBER / NAME…',
  children,
  onReset,
  className = '',
}) => {
  return (
    <div
      className={`bg-surface border border-line p-2.5 flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        <TextInput
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-64"
        />
        {children}
      </div>
      {onReset && (
        <Button variant="outline" size="sm" onClick={onReset}>
          RESET FILTERS
        </Button>
      )}
    </div>
  );
};
