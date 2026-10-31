import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, PageHeader, Panel } from '../../design-system';
import { useAuth } from './AuthContext';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-lg mx-auto py-16 flex flex-col gap-6">
        <PageHeader
          title="SECURITY VIOLATION"
          subtitle="Resource request blocked by authorization policy."
          breadcrumbs={['SECURITY', 'ERR 403']}
        />

        <Panel title="ACCESS DENIED">
          <div className="flex flex-col gap-4 font-mono text-xs">
            <div className="p-3 bg-red/10 border border-red text-red font-bold">
              [ERR 403 · ACCESS DENIED]
            </div>
            <p className="text-ink leading-relaxed">
              Your active authorization role <strong>[{user.role}]</strong> is not permitted to access this module.
              Required role: {allowedRoles.map((r) => `[${r}]`).join(' or ')}.
            </p>
            <div className="border-t border-line pt-3 flex justify-end">
              <Button variant="primary" onClick={() => navigate('/profile')}>
                RETURN TO PROFILE
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  return <>{children}</>;
};
