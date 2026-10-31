import React from 'react';
import { motion } from 'framer-motion';

export interface StatBlockProps {
  label: string;
  value: string | number;
  subtext?: string;
  helperText?: string;
  change?: string;
  accent?: 'olive' | 'cyan' | 'cobalt' | 'emerald' | 'amber' | 'red' | 'purple';
  className?: string;
}

export const StatBlock: React.FC<StatBlockProps> = ({
  label,
  value,
  subtext,
  helperText,
  change,
  accent = 'olive',
  className = '',
}) => {
  const displaySubtext = subtext || helperText;

  let accentBorder = 'border-t-olive';
  let accentDot = 'bg-olive';
  let accentText = 'text-olive';

  if (accent === 'cyan' || label.includes('MRR') || label.includes('ARR')) {
    accentBorder = 'border-t-cyan';
    accentDot = 'bg-cyan';
    accentText = 'text-cyan';
  } else if (accent === 'emerald' || label.includes('ACTIVE') || label.includes('PAID')) {
    accentBorder = 'border-t-emerald';
    accentDot = 'bg-emerald';
    accentText = 'text-emerald';
  } else if (accent === 'amber' || label.includes('DRAFT') || label.includes('PENDING')) {
    accentBorder = 'border-t-amber';
    accentDot = 'bg-amber';
    accentText = 'text-amber';
  } else if (accent === 'red' || label.includes('OVERDUE') || label.includes('FAILED')) {
    accentBorder = 'border-t-red';
    accentDot = 'bg-red';
    accentText = 'text-red';
  } else if (accent === 'purple' || label.includes('STAFF') || label.includes('ROLE')) {
    accentBorder = 'border-t-purple';
    accentDot = 'bg-purple';
    accentText = 'text-purple';
  } else if (accent === 'cobalt' || label.includes('CONTRACT') || label.includes('TOTAL')) {
    accentBorder = 'border-t-cobalt';
    accentDot = 'bg-cobalt';
    accentText = 'text-cobalt';
  }

  const isPositiveChange = change && (change.startsWith('+') || change.includes('↑'));
  const isNegativeChange = change && (change.startsWith('-') || change.includes('↓'));
  const changeColor = isPositiveChange ? 'text-emerald' : isNegativeChange ? 'text-red' : 'text-ink-muted';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`bg-surface border border-line border-t-4 ${accentBorder} p-3.5 flex flex-col justify-between ${className}`}
    >
      <div className="font-mono text-[10px] uppercase font-bold tracking-wider text-ink-muted select-none flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 ${accentDot} shrink-0`} />
          {label}
        </span>
        <span className={`text-[9px] font-bold ${accentText}`}>[METRIC]</span>
      </div>
      <div className="font-mono text-2xl font-bold text-ink tabular-nums my-1.5 tracking-tight flex items-baseline justify-between">
        <span>{value}</span>
      </div>
      {(displaySubtext || change) && (
        <div className="font-mono text-[10px] text-ink-muted flex items-center justify-between border-t border-line-soft pt-1.5 mt-1">
          {displaySubtext && <span className="truncate pr-1">{displaySubtext}</span>}
          {change && <span className={`font-bold tabular-nums shrink-0 ${changeColor}`}>{change}</span>}
        </div>
      )}
    </motion.div>
  );
};
