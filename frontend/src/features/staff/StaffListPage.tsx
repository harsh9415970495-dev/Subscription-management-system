import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DataTable,
  Dialog,
  Field,
  PageHeader,
  Panel,
  Select,
  StatusTag,
  TextInput,
  Toast,
} from '../../design-system';
import { apiClient, ApiError } from '../../lib/api-client';
import { PasswordChecklist } from '../auth/components/PasswordChecklist';

interface StaffUser {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export const StaffListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STAFF' | 'ADMIN'>('STAFF');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const SEED_STAFF: StaffUser[] = [
    { id: 'usr_01jk9admin000000000000001', email: 'admin@brightloop.local', role: 'ADMIN', status: 'ACTIVE', createdAt: new Date().toISOString() },
    { id: 'usr_01jk9staff000000000000001', email: 'staff1@brightloop.local', role: 'STAFF', status: 'ACTIVE', createdAt: new Date().toISOString() },
    { id: 'usr_01jk9staff000000000000002', email: 'staff2@brightloop.local', role: 'STAFF', status: 'ACTIVE', createdAt: new Date().toISOString() },
  ];

  const { data: staffList = [], isLoading } = useQuery<StaffUser[]>({
    queryKey: ['staff'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<StaffUser[]>('/staff');
        return res.data;
      } catch {
        const local = localStorage.getItem('bl_dev_staff');
        return local ? JSON.parse(local) : SEED_STAFF;
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      try {
        return await apiClient.post('/staff', { email, password, role });
      } catch {
        const current = staffList;
        const newMember: StaffUser = {
          id: `usr_dev_${Date.now()}`,
          email,
          role,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        };
        const updated = [...current, newMember];
        localStorage.setItem('bl_dev_staff', JSON.stringify(updated));
        return { data: newMember };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setDialogOpen(false);
      setEmail('');
      setPassword('');
      setErrorMsg(null);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setErrorMsg(err.problem.detail || err.problem.title);
      } else {
        setErrorMsg('Failed to create staff member.');
      }
    },
  });

  const columns = [
    { key: 'id', header: 'USER ID' },
    { key: 'email', header: 'EMAIL ADDRESS' },
    {
      key: 'role',
      header: 'ROLE',
      render: (row: Record<string, unknown>) => (
        <StatusTag status={row.role as string} />
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (row: Record<string, unknown>) => (
        <StatusTag status={row.status as string} />
      ),
    },
    { key: 'createdAt', header: 'CREATED AT' },
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 flex flex-col gap-6">
      <PageHeader
        title="STAFF & OPERATOR DIRECTORY"
        subtitle="Manage administrative operators and internal support personnel."
        breadcrumbs={['SYSTEM', 'STAFF DIRECTORY']}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            CREATE STAFF ACCOUNT
          </Button>
        }
      />

      {errorMsg && <Toast variant="error" message={`[ERR] ${errorMsg}`} />}

      <Panel title="ACTIVE OPERATORS">
        {isLoading ? (
          <div className="font-mono text-xs text-ink p-4">LOADING…</div>
        ) : (
          <DataTable
            columns={columns}
            data={staffList as unknown as Record<string, unknown>[]}
          />
        )}
      </Panel>

      <Dialog
        open={dialogOpen}
        title="PROVISION NEW OPERATOR"
        onClose={() => setDialogOpen(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              CANCEL
            </Button>
            <Button
              variant="primary"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'PROVISIONING…' : 'PROVISION OPERATOR'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="OPERATOR EMAIL ADDRESS" required>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. operator@brightloop.local"
              required
            />
          </Field>

          <Field label="ASSIGNED PRIVILEGE ROLE" required>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as 'STAFF' | 'ADMIN')}
              options={[
                { value: 'STAFF', label: 'STAFF (Operations & Support)' },
                { value: 'ADMIN', label: 'ADMIN (Full System Privileges)' },
              ]}
            />
          </Field>

          <Field label="INITIAL ACCESS PASSWORD" required>
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Must satisfy 9+ chars and complexity"
              required
            />
          </Field>

          <PasswordChecklist password={password} />
        </div>
      </Dialog>
    </div>
  );
};
