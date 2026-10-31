import React from 'react';
import { NavRail } from './NavRail';

export interface AppShellProps {
  children: React.ReactNode;
  currentUserRole?: string | null;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentUserRole }) => {
  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <NavRail currentUserRole={currentUserRole} />
      <main className="flex-1 p-6 overflow-y-auto max-w-full">
        {children}
      </main>
    </div>
  );
};
