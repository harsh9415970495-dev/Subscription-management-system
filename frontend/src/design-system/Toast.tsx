import React from 'react';
import { motion } from 'framer-motion';

export interface ToastProps {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'ok';
  variant?: 'info' | 'warning' | 'error' | 'success' | 'ok';
  onDismiss?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  variant,
  onDismiss,
  className = '',
}) => {
  const resolvedType = variant || type;
  let borderColor = 'border-line';
  let badge = '[INFO]';
  let badgeColor = 'text-steel';

  if (resolvedType === 'error') {
    borderColor = 'border-red';
    badge = '[ERR]';
    badgeColor = 'text-red';
  } else if (resolvedType === 'warning') {
    borderColor = 'border-amber';
    badge = '[WARN]';
    badgeColor = 'text-amber';
  } else if (resolvedType === 'success' || resolvedType === 'ok') {
    borderColor = 'border-green';
    badge = '[OK]';
    badgeColor = 'text-green';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className={`bg-surface border-2 ${borderColor} p-2.5 font-mono text-xs text-ink flex items-center justify-between select-none ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className={`font-bold ${badgeColor}`}>{badge}</span>
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="font-mono text-xs font-bold text-ink hover:text-red px-1 cursor-pointer"
        >
          [×]
        </button>
      )}
    </motion.div>
  );
};
