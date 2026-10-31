import React from 'react';

export interface KeyValueItem {
  key: string;
  value: React.ReactNode;
}

export interface KeyValueListProps {
  items: KeyValueItem[];
  className?: string;
}

export const KeyValueList: React.FC<KeyValueListProps> = ({ items, className = '' }) => {
  return (
    <div className={`border border-line divide-y divide-line ${className}`}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`flex items-center justify-between px-3 py-1.5 text-xs font-mono ${
            idx % 2 === 1 ? 'bg-surface-alt' : 'bg-surface'
          }`}
        >
          <span className="text-ink-muted uppercase tracking-wider text-[11px] select-none">
            {item.key}
          </span>
          <span className="text-ink font-bold tabular-nums text-right">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};
