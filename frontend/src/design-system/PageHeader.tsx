import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  tag?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: string[];
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  tag,
  actions,
  breadcrumbs,
  className = '',
}) => {
  return (
    <div className={`border-b border-line pb-3 mb-5 flex flex-col gap-1.5 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink-muted flex items-center gap-1.5 select-none">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span>{crumb}</span>
              {idx < breadcrumbs.length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-sans text-xl uppercase font-bold tracking-wider text-ink m-0">
            {title}
          </h1>
          {tag}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {subtitle && (
        <div className="font-mono text-xs text-ink-muted">
          {subtitle}
        </div>
      )}
    </div>
  );
};
