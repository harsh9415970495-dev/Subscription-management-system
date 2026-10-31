import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell, PageHeader, Panel } from '../design-system';
import { AuthProvider, useAuth } from '../features/auth/AuthContext';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { LoginPage } from '../features/auth/LoginPage';
import { ProfilePage } from '../features/auth/ProfilePage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { KitPage } from '../features/kit/KitPage';
import { StaffListPage } from '../features/staff/StaffListPage';
import { ProductsPage } from '../features/catalog/ProductsPage';
import { TaxesPage } from '../features/taxation/TaxesPage';

const PlaceholderScreen: React.FC<{ name: string; phase: string }> = ({ name, phase }) => (
  <div className="flex flex-col gap-4 max-w-7xl mx-auto py-6">
    <PageHeader
      title={name}
      subtitle={`Scheduled for implementation in ${phase}.`}
      breadcrumbs={['SYSTEM', name]}
    />
    <Panel title="MODULE SPECIFICATION">
      <div className="font-mono text-xs text-ink-muted">
        This screen will be activated upon reaching its designated phase gate.
        Review <a href="/_kit" className="text-olive underline font-bold">99 DESIGN KIT</a> to inspect visual components.
      </div>
    </Panel>
  </div>
);

const RoutesContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <AppShell currentUserRole={user?.role}>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Authenticated Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <StaffListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <PlaceholderScreen name="CUSTOMERS" phase="PHASE 1" />
            </ProtectedRoute>
          }
        />

        {/* Design System Reference Kit */}
        <Route path="/_kit" element={<KitPage />} />

        {/* Subsequent Phase Placeholders */}
        <Route path="/subscriptions" element={<PlaceholderScreen name="SUBSCRIPTIONS" phase="PHASE 4" />} />
        <Route path="/invoices" element={<PlaceholderScreen name="INVOICES" phase="PHASE 5" />} />
        <Route path="/payments" element={<PlaceholderScreen name="PAYMENTS" phase="PHASE 6" />} />
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/plans" element={<PlaceholderScreen name="PLANS" phase="PHASE 3" />} />
        <Route
          path="/taxes"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <TaxesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/discounts" element={<PlaceholderScreen name="DISCOUNTS" phase="PHASE 3" />} />
        <Route path="/templates" element={<PlaceholderScreen name="TEMPLATES" phase="PHASE 4" />} />
        <Route path="/reports" element={<PlaceholderScreen name="REPORTS" phase="PHASE 8" />} />

        {/* Default route */}
        <Route path="/" element={<Navigate to="/profile" replace />} />
        <Route path="*" element={<Navigate to="/profile" replace />} />
      </Routes>
    </AppShell>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <AuthProvider>
      <RoutesContent />
    </AuthProvider>
  );
};
