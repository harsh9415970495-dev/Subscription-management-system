import React from 'react';

export type StatusType =
  | 'DRAFT'
  | 'QUOTATION'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'CLOSED'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export interface StatusTagProps {
  status: StatusType | string;
  className?: string;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  DRAFT: 'bg-ink-muted',
  QUOTATION: 'bg-steel',
  CONFIRMED: 'bg-olive',
  ACTIVE: 'bg-green',
  PAUSED: 'bg-amber',
  CLOSED: 'bg-ink-muted',
  PAID: 'bg-green',
  OVERDUE: 'bg-red',
  CANCELLED: 'bg-red',
};

export const StatusTag: React.FC<StatusTagProps> = ({ status, className = '' }) => {
  const normalized = status.toUpperCase();
  const swatchColor = STATUS_COLOR_MAP[normalized] || 'bg-ink-muted';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[12px] font-bold text-ink select-none tracking-tight ${className}`}
    >
      <span className={`w-2 h-2 ${swatchColor} shrink-0`} />
      <span>[{normalized}]</span>
    </span>
  );
};
