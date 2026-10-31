import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../design-system';
import { AuthProvider, useAuth } from '../features/auth/AuthContext';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { LoginPage } from '../features/auth/LoginPage';
import { ProfilePage } from '../features/auth/ProfilePage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { KitPage } from '../features/kit/KitPage';
import { StaffListPage } from '../features/staff/StaffListPage';
import { CustomersPage } from '../features/customers/CustomersPage';
import { ProductsPage } from '../features/catalog/ProductsPage';
import { TaxesPage } from '../features/taxation/TaxesPage';
import { PlansPage } from '../features/plans/PlansPage';
import { DiscountsPage } from '../features/discounts/DiscountsPage';
import { SubscriptionsPage } from '../features/subscriptions/SubscriptionsPage';
import { TemplatesPage } from '../features/templates/TemplatesPage';
import { InvoicesPage } from '../features/invoices/InvoicesPage';
import { PaymentsPage } from '../features/payments/PaymentsPage';
import { ReportsPage } from '../features/reports/ReportsPage';

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
              <CustomersPage />
            </ProtectedRoute>
          }
        />

        {/* Sales & Subscriptions */}
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
              <SubscriptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <TemplatesPage />
            </ProtectedRoute>
          }
        />

        {/* Catalog, Plans, Discounts & Taxation */}
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <PlansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/taxes"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <TaxesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discounts"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <DiscountsPage />
            </ProtectedRoute>
          }
        />

        {/* Finance, Billing & Payments */}
        <Route
          path="/invoices"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
              <InvoicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />

        {/* Reporting & Audit */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Design System Reference Kit */}
        <Route path="/_kit" element={<KitPage />} />

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
