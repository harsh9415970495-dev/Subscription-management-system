import React from 'react';

export interface PanelProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  action,
  actions,
  children,
  className = '',
}) => {
  const resolvedAction = action || actions;
  return (
    <div className={`bg-surface border border-line p-4 ${className}`}>
      {(title || resolvedAction) && (
        <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3.5">
          <div className="flex flex-col">
            {title && (
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-olive inline-block shrink-0" />
                <h3 className="font-mono text-xs uppercase font-bold tracking-wider text-ink m-0">
                  {title}
                </h3>
              </div>
            )}
            {subtitle && (
              <span className="font-mono text-[11px] text-ink-muted mt-0.5 ml-3.5">
                {subtitle}
              </span>
            )}
          </div>
          {resolvedAction && <div>{resolvedAction}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
