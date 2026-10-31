import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

export interface NavItem {
  number: string;
  label: string;
  path: string;
  section?: string;
  sectionColor?: string;
  roles?: string[];
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  // Commercial
  { number: '01', label: 'SUBSCRIPTIONS', path: '/subscriptions', section: 'COMMERCIAL & LIFECYCLE', sectionColor: 'text-cobalt' },
  { number: '02', label: 'TEMPLATES', path: '/templates' },
  { number: '03', label: 'CUSTOMERS', path: '/customers', roles: ['ADMIN', 'STAFF'] },

  // Catalog & Rules
  { number: '04', label: 'PRODUCTS', path: '/products', section: 'CATALOG & RULES', sectionColor: 'text-olive' },
  { number: '05', label: 'PLANS & TERMS', path: '/plans' },
  { number: '06', label: 'TAX RULES', path: '/taxes', roles: ['ADMIN', 'STAFF'] },
  { number: '07', label: 'DISCOUNTS', path: '/discounts', roles: ['ADMIN', 'STAFF'] },

  // Finance
  { number: '08', label: 'INVOICES', path: '/invoices', section: 'FINANCE & RECEIVABLES', sectionColor: 'text-cyan' },
  { number: '09', label: 'PAYMENTS', path: '/payments' },
  { number: '10', label: 'REPORTS & AUDIT', path: '/reports', roles: ['ADMIN'] },

  // System
  { number: '11', label: 'STAFF & RBAC', path: '/staff', section: 'SYSTEM CONFIG', sectionColor: 'text-purple', roles: ['ADMIN'] },
  { number: '12', label: 'OPERATOR PROFILE', path: '/profile' },
  { number: '99', label: 'DESIGN SYSTEM', path: '/_kit' },
];

export const NavRail: React.FC<{
  items?: NavItem[];
  currentUserRole?: string | null;
}> = ({ items = DEFAULT_NAV_ITEMS, currentUserRole }) => {
  const visibleItems = items.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    if (!currentUserRole) return false;
    return item.roles.includes(currentUserRole);
  });

  return (
    <aside className="w-64 bg-surface border-r border-line flex flex-col shrink-0 min-h-screen select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-line flex flex-col gap-1 bg-surface-alt">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-olive inline-block shrink-0" />
            <span className="font-sans text-base uppercase font-bold tracking-wider text-ink">
              BRIGHTLOOP
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-mono text-[9px] bg-olive text-canvas px-1.5 py-0.5 font-bold">
            [v1.0.0-PROD]
          </span>
        </div>
        <span className="font-mono text-[10px] tracking-widest text-ink-muted">
          SUBSCRIPTION MANAGEMENT SYSTEM
        </span>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {visibleItems.map((item) => (
          <React.Fragment key={item.number}>
            {item.section && (
              <div className="px-4 pt-3 pb-1 font-mono text-[9px] font-bold tracking-widest text-ink-muted uppercase border-t border-line-soft first:border-t-0 first:pt-1 flex items-center gap-1.5">
                <span className="opacity-60">//</span>
                <span className={item.sectionColor || 'text-ink-muted'}>{item.section}</span>
              </div>
            )}
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center justify-between px-4 py-2 font-mono text-xs tracking-wider border-l-4 transition-colors duration-75 ${
                  isActive
                    ? 'bg-ink text-paper border-amber font-bold'
                    : 'text-ink border-transparent hover:bg-surface-alt hover:border-line-soft'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.08 }}
                    className="flex items-center gap-2.5"
                  >
                    <span className={`text-[10px] font-bold ${isActive ? 'text-amber' : 'opacity-40 group-hover:opacity-75'}`}>
                      {item.number}
                    </span>
                    <span>{item.label}</span>
                  </motion.div>
                  <span className={`text-[10px] font-mono ${isActive ? 'text-amber' : 'opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform'}`}>
                    →
                  </span>
                </>
              )}
            </NavLink>
          </React.Fragment>
        ))}
      </nav>

      {/* Operator Status Footer */}
      <div className="p-3.5 border-t border-line bg-surface-alt font-mono text-[11px] text-ink-muted flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span>OPERATOR:</span>
          <span className={`font-bold px-1.5 py-0.2 border border-line ${
            currentUserRole === 'ADMIN'
              ? 'text-purple bg-purple/10 border-purple/40'
              : currentUserRole === 'STAFF'
              ? 'text-cyan bg-cyan/10 border-cyan/40'
              : 'text-ink bg-surface border-line'
          }`}>
            {currentUserRole ? `[${currentUserRole}]` : '[ANON]'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span>CURRENCY:</span>
          <span className="font-semibold text-cyan">INR (PAISE MINOR)</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span>RLS ISOLATION:</span>
          <span className="flex items-center gap-1 text-emerald font-bold">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1.5 h-1.5 bg-emerald inline-block"
            />
            [ENFORCED]
          </span>
        </div>
      </div>
    </aside>
  );
};
