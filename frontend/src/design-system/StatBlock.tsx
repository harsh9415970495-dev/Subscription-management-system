import React from 'react';

export interface StatBlockProps {
  label: string;
  value: string | number;
  subtext?: string;
  change?: string;
  className?: string;
}

export const StatBlock: React.FC<StatBlockProps> = ({
  label,
  value,
  subtext,
  change,
  className = '',
}) => {
  return (
    <div className={`bg-surface border border-line p-3 flex flex-col justify-between ${className}`}>
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-muted select-none">
        {label}
      </div>
      <div className="font-mono text-2xl font-bold text-ink tabular-nums my-1">
        {value}
      </div>
      {(subtext || change) && (
        <div className="font-mono text-[11px] text-ink-muted flex items-center justify-between border-t border-line-soft pt-1.5 mt-1">
          {subtext && <span>{subtext}</span>}
          {change && <span className="font-bold">{change}</span>}
        </div>
      )}
    </div>
  );
};
