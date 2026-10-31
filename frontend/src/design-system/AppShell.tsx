import React from 'react';
import { NavRail } from './NavRail';

export interface AppShellProps {
  children: React.ReactNode;
  currentUserRole?: string | null;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentUserRole }) => {
  return (
    <div className="flex min-h-screen bg-paper text-ink font-mono">
      <NavRail currentUserRole={currentUserRole} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Telemetry Status Bar */}
        <header className="h-9 border-b border-line bg-surface flex items-center justify-between px-4 text-[11px] font-mono select-none">
          <div className="flex items-center gap-4">
            <span className="font-bold text-ink">
              BRIGHTLOOP // SYSTEM STATUS
            </span>
            <span className="text-ink-muted hidden md:inline">
              STACK: NODE 22 LTS · NESTJS · DRIZZLE ORM
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green inline-block shrink-0" />
              <span className="font-bold text-ink">[ONLINE]</span>
            </div>
            <span className="text-ink-muted hidden sm:inline">
              TZ: ASIA/KOLKATA (IST)
            </span>
            <span className="border border-line px-1.5 py-0.5 text-ink-muted text-[10px]">
              ZERO-FLOAT / ADR-0002
            </span>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-6 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
