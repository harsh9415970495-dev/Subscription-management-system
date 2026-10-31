import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { NavRail } from './NavRail';

export interface AppShellProps {
  children: React.ReactNode;
  currentUserRole?: string | null;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentUserRole }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('bl_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('bl_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="flex min-h-screen bg-paper text-ink font-mono">
      <NavRail currentUserRole={currentUserRole} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Telemetry Status Bar */}
        <header className="h-9 border-b border-line bg-surface flex items-center justify-between px-4 text-[11px] font-mono select-none">
          <div className="flex items-center gap-4">
            <span className="font-bold text-ink flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-cyan inline-block shrink-0" />
              BRIGHTLOOP // SYSTEM STATUS
            </span>
            <span className="text-ink-muted hidden md:inline">
              STACK: NODE 22 LTS · NESTJS · DRIZZLE ORM
            </span>
            <span className="text-cyan hidden lg:inline font-bold">
              [LATENCY: 14ms]
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <motion.span
                animate={{ opacity: [1, 0.25, 1], scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                className="w-2 h-2 bg-emerald inline-block shrink-0"
              />
              <span className="font-bold text-emerald">[ONLINE]</span>
            </div>
            <span className="text-ink-muted hidden sm:inline">
              TZ: ASIA/KOLKATA (IST)
            </span>
            
            {/* Utilitarian Theme Switcher */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.94 }}
              onClick={toggleTheme}
              className="flex items-center gap-1 px-2.5 py-0.5 border border-line bg-surface-alt hover:bg-paper font-bold text-ink cursor-pointer select-none transition-colors"
              title="Toggle Light/Dark Theme"
            >
              <span className="text-[10px] text-ink-muted">THEME:</span>
              <span className={theme === 'dark' ? 'text-amber' : 'text-olive'}>
                [{theme.toUpperCase()}]
              </span>
            </motion.button>
          </div>
        </header>

        {/* Main Content Viewport with Framer Motion entry */}
        <motion.main
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="flex-1 p-6 overflow-y-auto max-w-full"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};
