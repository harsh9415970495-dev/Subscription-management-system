import React from 'react';
import { NavLink } from 'react-router-dom';

export interface NavItem {
  number: string;
  label: string;
  path: string;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { number: '01', label: 'SUBSCRIPTIONS', path: '/subscriptions' },
  { number: '02', label: 'INVOICES', path: '/invoices' },
  { number: '03', label: 'PAYMENTS', path: '/payments' },
  { number: '04', label: 'CUSTOMERS', path: '/customers' },
  { number: '05', label: 'PRODUCTS', path: '/products' },
  { number: '06', label: 'PLANS', path: '/plans' },
  { number: '07', label: 'TAXES', path: '/taxes' },
  { number: '08', label: 'DISCOUNTS', path: '/discounts' },
  { number: '09', label: 'TEMPLATES', path: '/templates' },
  { number: '10', label: 'REPORTS', path: '/reports' },
  { number: '11', label: 'STAFF', path: '/staff' },
  { number: '99', label: 'DESIGN KIT', path: '/_kit' },
];

export const NavRail: React.FC<{ items?: NavItem[] }> = ({ items = DEFAULT_NAV_ITEMS }) => {
  return (
    <aside className="w-56 bg-surface border-r border-line flex flex-col shrink-0 min-h-screen select-none">
      <div className="p-3.5 border-b border-line flex flex-col gap-0.5">
        <span className="font-sans text-sm uppercase font-bold tracking-wider text-ink">
          BRIGHTLOOP
        </span>
        <span className="font-mono text-[10px] tracking-widest text-ink-muted">
          // SYS: v0.1.0-PHASE-0
        </span>
      </div>

      <nav className="flex-1 py-2 flex flex-col">
        {items.map((item) => (
          <NavLink
            key={item.number}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 font-mono text-xs tracking-wider border-l-2 ${
                isActive
                  ? 'bg-ink text-paper border-amber font-bold'
                  : 'text-ink border-transparent hover:bg-surface-alt'
              }`
            }
          >
            <span className="opacity-60 text-[11px]">{item.number}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-line font-mono text-[11px] text-ink-muted flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span>OPERATOR:</span>
          <span className="font-bold text-ink">[ADMIN]</span>
        </div>
        <div className="flex items-center justify-between">
          <span>CURRENCY:</span>
          <span className="text-ink">INR (PAISE)</span>
        </div>
      </div>
    </aside>
  );
};
