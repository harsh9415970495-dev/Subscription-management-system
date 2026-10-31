import React from 'react';
import { motion } from 'framer-motion';

export type StatusType =
  | 'DRAFT'
  | 'QUOTATION'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'CLOSED'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'PENDING'
  | 'FAILED'
  | 'REFUNDED'
  | 'RENEWED'
  | 'ONLINE'
  | 'ADMIN'
  | 'STAFF'
  | 'CUSTOMER';

export interface StatusTagProps {
  status: StatusType | string;
  className?: string;
  pulse?: boolean;
}

const STATUS_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-ink-muted', text: 'text-ink-muted' },
  QUOTATION: { bg: 'bg-cobalt', text: 'text-cobalt' },
  CONFIRMED: { bg: 'bg-olive', text: 'text-olive' },
  ACTIVE: { bg: 'bg-emerald', text: 'text-emerald' },
  PAUSED: { bg: 'bg-amber', text: 'text-amber' },
  CLOSED: { bg: 'bg-ink-muted', text: 'text-ink-muted' },
  PAID: { bg: 'bg-emerald', text: 'text-emerald' },
  OVERDUE: { bg: 'bg-red', text: 'text-red' },
  CANCELLED: { bg: 'bg-red', text: 'text-red' },
  PENDING: { bg: 'bg-amber', text: 'text-amber' },
  FAILED: { bg: 'bg-red', text: 'text-red' },
  REFUNDED: { bg: 'bg-cyan', text: 'text-cyan' },
  RENEWED: { bg: 'bg-cobalt', text: 'text-cobalt' },
  ONLINE: { bg: 'bg-emerald', text: 'text-emerald' },
  ADMIN: { bg: 'bg-purple', text: 'text-purple' },
  STAFF: { bg: 'bg-cyan', text: 'text-cyan' },
  CUSTOMER: { bg: 'bg-cobalt', text: 'text-cobalt' },
};

export const StatusTag: React.FC<StatusTagProps> = ({ status, className = '', pulse }) => {
  const normalized = status.toUpperCase();
  const config = STATUS_COLOR_MAP[normalized] || { bg: 'bg-ink-muted', text: 'text-ink-muted' };

  const shouldPulse = pulse ?? (normalized === 'ACTIVE' || normalized === 'ONLINE');
  const isAlert = normalized === 'OVERDUE' || normalized === 'FAILED';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-bold select-none tracking-tight ${className}`}
    >
      {shouldPulse ? (
        <motion.span
          animate={{ opacity: [1, 0.4, 1], scale: [1, 1.25, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className={`w-2 h-2 ${config.bg} shrink-0`}
        />
      ) : isAlert ? (
        <motion.span
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className={`w-2 h-2 ${config.bg} shrink-0`}
        />
      ) : (
        <span className={`w-2 h-2 ${config.bg} shrink-0`} />
      )}
      <span className={config.text}>[{normalized}]</span>
    </span>
  );
};
