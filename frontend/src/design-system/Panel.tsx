import React from 'react';

export interface PanelProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  action,
  children,
  className = '',
}) => {
  return (
    <div className={`bg-surface border border-line p-4 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3.5">
          {title && (
            <h3 className="font-mono text-xs uppercase font-bold tracking-wider text-ink m-0">
              {title}
            </h3>
          )}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
