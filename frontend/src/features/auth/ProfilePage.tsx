import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  KeyValueList,
  PageHeader,
  Panel,
  StatusTag,
} from '../../design-system';
import { apiClient } from '../../lib/api-client';
import { useAuth } from './AuthContext';

interface ProfileResponse {
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
    customerId?: string | null;
    createdAt: string;
  };
  customer?: {
    id: string;
    name: string;
    companyName?: string | null;
    phone?: string | null;
    billingAddress?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    taxId?: string | null;
  } | null;
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user: sessionUser, logout } = useAuth();

  const { data, isLoading, error } = useQuery<ProfileResponse>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiClient.get<ProfileResponse>('/auth/me');
      return res.data;
    },
    enabled: !!sessionUser,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!sessionUser) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Panel title="NO ACTIVE SESSION">
          <p className="font-mono text-xs text-ink mb-4">
            You are not currently authenticated.
          </p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            PROCEED TO LOGIN
          </Button>
        </Panel>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="font-mono text-xs text-ink p-8">
        LOADING…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="font-mono text-xs text-red p-8">
        [ERR] Failed to load user profile.
      </div>
    );
  }

  const { user, customer } = data;

  return (
    <div className="max-w-4xl mx-auto py-6 flex flex-col gap-6">
      <PageHeader
        title="USER ACCOUNT PROFILE"
        subtitle="Security credentials, tenant context, and active permissions."
        breadcrumbs={['SYSTEM', 'PROFILE']}
        actions={
          <Button variant="outline" onClick={handleLogout}>
            LOGOUT / TERMINATE SESSION
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="SECURITY CONTEXT">
          <KeyValueList
            items={[
              { key: 'USER IDENTIFIER', value: user.id },
              { key: 'REGISTERED EMAIL', value: user.email },
              {
                key: 'ASSIGNED ROLE',
                value: <StatusTag status={user.role} />,
              },
              {
                key: 'ACCOUNT STATUS',
                value: <StatusTag status={user.status} />,
              },
              { key: 'CREATED AT', value: user.createdAt },
            ]}
          />
        </Panel>

        {customer ? (
          <Panel title="TENANT / CUSTOMER RECORD">
            <KeyValueList
              items={[
                { key: 'CUSTOMER ID', value: customer.id },
                { key: 'CONTACT PERSON', value: customer.name },
                { key: 'COMPANY ENTITY', value: customer.companyName || '[NOT SPECIFIED]' },
                { key: 'TELEPHONE', value: customer.phone || '[NOT SPECIFIED]' },
                { key: 'TAX ID (GSTIN)', value: customer.taxId || '[NOT SPECIFIED]' },
                {
                  key: 'BILLING LOCATION',
                  value: customer.billingAddress
                    ? `${customer.billingAddress.street || ''}, ${customer.billingAddress.city || ''}, ${customer.billingAddress.state || ''} - ${customer.billingAddress.postalCode || ''}`
                    : '[NONE]',
                },
              ]}
            />
          </Panel>
        ) : (
          <Panel title="OPERATOR CONTEXT">
            <p className="font-mono text-xs text-ink-muted">
              This account is an internal administrative operator and is not bound to a customer tenant.
            </p>
          </Panel>
        )}
      </div>
    </div>
  );
};
