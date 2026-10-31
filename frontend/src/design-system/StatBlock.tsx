import React from 'react';

export interface StatBlockProps {
  label: string;
  value: string | number;
  subtext?: string;
  helperText?: string;
  change?: string;
  className?: string;
}

export const StatBlock: React.FC<StatBlockProps> = ({
  label,
  value,
  subtext,
  helperText,
  change,
  className = '',
}) => {
  const displaySubtext = subtext || helperText;
  return (
    <div
      className={`bg-surface border border-line border-t-2 border-t-olive p-3.5 flex flex-col justify-between ${className}`}
    >
      <div className="font-mono text-[10px] uppercase font-bold tracking-wider text-ink-muted select-none">
        {label}
      </div>
      <div className="font-mono text-2xl font-bold text-ink tabular-nums my-1.5 tracking-tight">
        {value}
      </div>
      {(displaySubtext || change) && (
        <div className="font-mono text-[10px] text-ink-muted flex items-center justify-between border-t border-line-soft pt-1.5 mt-1">
          {displaySubtext && <span>{displaySubtext}</span>}
          {change && <span className="font-bold text-olive">{change}</span>}
        </div>
      )}
    </div>
  );
};
