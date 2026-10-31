import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell, PageHeader, Panel } from '../design-system';
import { KitPage } from '../features/kit/KitPage';

const PlaceholderScreen: React.FC<{ name: string; phase: string }> = ({ name, phase }) => (
  <div className="flex flex-col gap-4 max-w-7xl mx-auto">
    <PageHeader
      title={name}
      subtitle={`Scheduled for implementation in ${phase}.`}
      breadcrumbs={['SYSTEM', name]}
    />
    <Panel title="MODULE SPECIFICATION">
      <div className="font-mono text-xs text-ink-muted">
        This screen will be activated upon reaching its designated phase gate.
        Review <a href="/_kit" className="text-olive underline font-bold">00 DESIGN KIT</a> to inspect visual components.
      </div>
    </Panel>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <AppShell>
      <Routes>
        <Route path="/_kit" element={<KitPage />} />
        <Route path="/subscriptions" element={<PlaceholderScreen name="SUBSCRIPTIONS" phase="PHASE 4" />} />
        <Route path="/invoices" element={<PlaceholderScreen name="INVOICES" phase="PHASE 5" />} />
        <Route path="/payments" element={<PlaceholderScreen name="PAYMENTS" phase="PHASE 6" />} />
        <Route path="/customers" element={<PlaceholderScreen name="CUSTOMERS" phase="PHASE 1" />} />
        <Route path="/products" element={<PlaceholderScreen name="PRODUCTS" phase="PHASE 2" />} />
        <Route path="/plans" element={<PlaceholderScreen name="PLANS" phase="PHASE 3" />} />
        <Route path="/taxes" element={<PlaceholderScreen name="TAXES" phase="PHASE 2" />} />
        <Route path="/discounts" element={<PlaceholderScreen name="DISCOUNTS" phase="PHASE 3" />} />
        <Route path="/templates" element={<PlaceholderScreen name="TEMPLATES" phase="PHASE 4" />} />
        <Route path="/reports" element={<PlaceholderScreen name="REPORTS" phase="PHASE 8" />} />
        <Route path="/staff" element={<PlaceholderScreen name="STAFF" phase="PHASE 1" />} />
        <Route path="*" element={<Navigate to="/_kit" replace />} />
      </Routes>
    </AppShell>
  );
};
