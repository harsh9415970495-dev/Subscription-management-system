import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Column,
  DataTable,
  Dialog,
  Field,
  NumberInput,
  PageHeader,
  Panel,
  Select,
  StatBlock,
  StatusTag,
  TextInput,
  Toast,
} from '../../design-system';
import { apiClient, ApiError } from '../../lib/api-client';
import { useAuth } from '../auth/AuthContext';

export interface PlanItem extends Record<string, unknown> {
  id: string;
  name: string;
  price: number; // paise
  billingPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  minQuantity: number;
  availableFrom?: string | null;
  availableTo?: string | null;
  autoCloseOnEnd: boolean;
  closable: boolean;
  pausable: boolean;
  renewable: boolean;
  active: boolean;
  createdAt: string;
}

export interface PaymentTermItem extends Record<string, unknown> {
  id: string;
  name: string;
  days: number;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
}

const SEED_PLANS: PlanItem[] = [
  {
    id: 'plan_01jk9monthly000000000001',
    name: 'Startup Modular ERP Monthly',
    price: 0,
    billingPeriod: 'MONTHLY',
    minQuantity: 1,
    availableFrom: '2026-01-01T00:00:00Z',
    availableTo: null,
    autoCloseOnEnd: true,
    closable: true,
    pausable: true,
    renewable: true,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'plan_01jk9yearly0000000000002',
    name: 'Enterprise Scale Infrastructure Yearly',
    price: 120000,
    billingPeriod: 'YEARLY',
    minQuantity: 3,
    availableFrom: '2026-01-01T00:00:00Z',
    availableTo: null,
    autoCloseOnEnd: false,
    closable: true,
    pausable: true,
    renewable: true,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'plan_01jk9weekly0000000000003',
    name: 'Weekly Sprint Dedicated Support',
    price: 25000,
    billingPeriod: 'WEEKLY',
    minQuantity: 1,
    availableFrom: '2026-01-01T00:00:00Z',
    availableTo: null,
    autoCloseOnEnd: true,
    closable: true,
    pausable: false,
    renewable: true,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'plan_01jk9daily00000000000004',
    name: 'Daily Burst Compute Utility',
    price: 5000,
    billingPeriod: 'DAILY',
    minQuantity: 1,
    availableFrom: '2026-01-01T00:00:00Z',
    availableTo: null,
    autoCloseOnEnd: true,
    closable: true,
    pausable: false,
    renewable: false,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const SEED_PAYMENT_TERMS: PaymentTermItem[] = [
  {
    id: 'pt_01jk9immediate000000000001',
    name: 'Immediate (Due on receipt)',
    days: 0,
    isDefault: true,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'pt_01jk9net150000000000000002',
    name: 'Net 15 Days',
    days: 15,
    isDefault: false,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'pt_01jk9net300000000000000003',
    name: 'Net 30 Days',
    days: 30,
    isDefault: false,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const PlansPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  // State
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [isNewTermOpen, setIsNewTermOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states for New Plan
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState(0);
  const [planPeriod, setPlanPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [planMinQty, setPlanMinQty] = useState(1);
  const [planAutoClose, setPlanAutoClose] = useState(true);
  const [planClosable, setPlanClosable] = useState(true);
  const [planPausable, setPlanPausable] = useState(false);
  const [planRenewable, setPlanRenewable] = useState(true);

  // Form states for New Payment Term
  const [termName, setTermName] = useState('');
  const [termDays, setTermDays] = useState(30);
  const [termDefault, setTermDefault] = useState(false);

  // Queries
  const plansQuery = useQuery<PlanItem[]>({
    queryKey: ['plans'],
    queryFn: async (): Promise<PlanItem[]> => {
      try {
        const res = await apiClient.get<PlanItem[]>('/plans');
        return res.data && res.data.length > 0 ? res.data : SEED_PLANS;
      } catch {
        return SEED_PLANS;
      }
    },
  });

  const termsQuery = useQuery<PaymentTermItem[]>({
    queryKey: ['payment-terms'],
    queryFn: async (): Promise<PaymentTermItem[]> => {
      try {
        const res = await apiClient.get<PaymentTermItem[]>('/subscriptions/payment-terms');
        return res.data && res.data.length > 0 ? res.data : SEED_PAYMENT_TERMS;
      } catch {
        return SEED_PAYMENT_TERMS;
      }
    },
  });

  // Create Plan Mutation
  const createPlanMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      price: number;
      billingPeriod: string;
      minQuantity: number;
      autoCloseOnEnd: boolean;
      closable: boolean;
      pausable: boolean;
      renewable: boolean;
    }) => {
      return apiClient.post('/plans', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setIsNewPlanOpen(false);
      resetPlanForm();
      setToastMessage('Subscription plan successfully created');
    },
    onError: (err: ApiError) => {
      setErrorMessage(err.message || 'Failed to create plan');
    },
  });

  // Create Term Mutation
  const createTermMutation = useMutation({
    mutationFn: async (payload: { name: string; days: number; isDefault: boolean }) => {
      return apiClient.post('/subscriptions/payment-terms', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-terms'] });
      setIsNewTermOpen(false);
      setTermName('');
      setTermDays(30);
      setTermDefault(false);
      setToastMessage('Payment term successfully created');
    },
    onError: (err: ApiError) => {
      setErrorMessage(err.message || 'Failed to create payment term');
    },
  });

  const resetPlanForm = () => {
    setPlanName('');
    setPlanPrice(0);
    setPlanPeriod('MONTHLY');
    setPlanMinQty(1);
    setPlanAutoClose(true);
    setPlanClosable(true);
    setPlanPausable(false);
    setPlanRenewable(true);
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) {
      setErrorMessage('Plan name is required');
      return;
    }
    createPlanMutation.mutate({
      name: planName.trim(),
      price: Math.round(planPrice * 100),
      billingPeriod: planPeriod,
      minQuantity: planMinQty,
      autoCloseOnEnd: planAutoClose,
      closable: planClosable,
      pausable: planPausable,
      renewable: planRenewable,
    });
  };

  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termName.trim()) {
      setErrorMessage('Payment term name is required');
      return;
    }
    createTermMutation.mutate({
      name: termName.trim(),
      days: termDays,
      isDefault: termDefault,
    });
  };

  const plans = plansQuery.data || SEED_PLANS;
  const terms = termsQuery.data || SEED_PAYMENT_TERMS;

  const planColumns: Column<PlanItem>[] = [
    {
      key: 'name',
      header: 'PLAN NAME & ID',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-ink text-xs">{row.name}</span>
          <span className="font-mono text-[10px] text-ink-muted">{row.id}</span>
        </div>
      ),
    },
    {
      key: 'billingPeriod',
      header: 'BILLING PERIOD',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-olive">
          [{row.billingPeriod}]
        </span>
      ),
    },
    {
      key: 'price',
      header: 'BASE RECURRING FEE',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-ink font-semibold">
          {row.price === 0 ? '₹0.00 (LINE USAGE)' : `₹${(row.price / 100).toFixed(2)}`}
        </span>
      ),
    },
    {
      key: 'minQuantity',
      header: 'MIN QTY',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-ink">
          {row.minQuantity}
        </span>
      ),
    },
    {
      key: 'lifecycle',
      header: 'LIFECYCLE RULES',
      render: (row) => (
        <div className="flex flex-wrap gap-1 font-mono text-[10px]">
          {row.autoCloseOnEnd && (
            <span className="px-1 border border-line text-ink-muted">AUTO_CLOSE</span>
          )}
          {row.closable && (
            <span className="px-1 border border-line text-ink-muted">CLOSABLE</span>
          )}
          {row.pausable ? (
            <span className="px-1 border border-line text-olive font-bold">PAUSABLE</span>
          ) : (
            <span className="px-1 border border-line text-ink-muted opacity-40">NO_PAUSE</span>
          )}
          {row.renewable && (
            <span className="px-1 border border-line text-ink-muted">RENEWABLE</span>
          )}
        </div>
      ),
    },
    {
      key: 'active',
      header: 'STATUS',
      render: (row) => (
        <StatusTag status={row.active ? 'ACTIVE' : 'DRAFT'} />
      ),
    },
  ];

  const termColumns: Column<PaymentTermItem>[] = [
    {
      key: 'name',
      header: 'PAYMENT TERM NAME',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-ink text-xs">{row.name}</span>
          {row.isDefault && (
            <span className="font-mono text-[10px] bg-sand border border-line px-1 text-olive font-bold">
              [DEFAULT]
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'days',
      header: 'CREDIT DAYS',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-ink font-semibold">
          {row.days === 0 ? '0 (DUE ON RECEIPT)' : `${row.days} DAYS`}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'STATUS',
      render: (row) => (
        <StatusTag status={row.active ? 'ACTIVE' : 'DRAFT'} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto py-6">
      <PageHeader
        title="RECURRING PLANS & PAYMENT TERMS"
        subtitle="Lifecycle cadence, base platform pricing, auto-closure rules, and receivables credit terms"
        breadcrumbs={['SYSTEM', 'CATALOG', 'PLANS & TERMS']}
        actions={
          isAdmin && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsNewTermOpen(true)}>
                [+] NEW PAYMENT TERM
              </Button>
              <Button variant="primary" onClick={() => setIsNewPlanOpen(true)}>
                [+] NEW RECURRING PLAN
              </Button>
            </div>
          )
        }
      />

      {toastMessage && (
        <Toast
          variant="ok"
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}
      {errorMessage && (
        <Toast
          variant="error"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Metric Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBlock
          label="TOTAL PLANS"
          value={plans.length.toString()}
          subtext="Recurring subscription cadences"
        />
        <StatBlock
          label="ACTIVE PLANS"
          value={plans.filter((p) => p.active).length.toString()}
          subtext="Available for customer subscription"
        />
        <StatBlock
          label="AUTO-CLOSING"
          value={plans.filter((p) => p.autoCloseOnEnd).length.toString()}
          subtext="Terminates automatically on expiry"
        />
        <StatBlock
          label="RENEWABLE"
          value={plans.filter((p) => p.renewable).length.toString()}
          subtext="Permits recurring lifecycle extension"
        />
      </div>

      {/* Recurring Plans Section */}
      <Panel
        title="SUBSCRIPTION PLANS REGISTER"
        action={
          isAdmin && (
            <Button variant="secondary" onClick={() => setIsNewPlanOpen(true)}>
              [+] ADD PLAN
            </Button>
          )
        }
      >
        <DataTable
          columns={planColumns}
          data={plans}
          emptyText="No subscription plans configured."
        />
      </Panel>

      {/* Payment Terms Section */}
      <Panel
        title="PAYMENT CREDIT TERMS"
        action={
          isAdmin && (
            <Button variant="secondary" onClick={() => setIsNewTermOpen(true)}>
              [+] ADD TERM
            </Button>
          )
        }
      >
        <DataTable
          columns={termColumns}
          data={terms}
          emptyText="No payment terms configured."
        />
      </Panel>

      {/* Dialog: Create Plan */}
      <Dialog
        isOpen={isNewPlanOpen}
        onClose={() => setIsNewPlanOpen(false)}
        title="DEFINE RECURRING SUBSCRIPTION PLAN"
      >
        <form onSubmit={handleCreatePlan} className="flex flex-col gap-4">
          <Field label="PLAN NAME" required hint="e.g. Startup Modular ERP Monthly">
            <TextInput
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Enter plan title"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="BILLING CADENCE" required>
              <Select
                value={planPeriod}
                onChange={(e) =>
                  setPlanPeriod(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY')
                }
                options={[
                  { label: 'DAILY', value: 'DAILY' },
                  { label: 'WEEKLY', value: 'WEEKLY' },
                  { label: 'MONTHLY', value: 'MONTHLY' },
                  { label: 'YEARLY', value: 'YEARLY' },
                ]}
              />
            </Field>

            <Field label="BASE RECURRING FEE (₹)" hint="0.00 for line items only">
              <NumberInput
                value={planPrice}
                onChange={(e) => setPlanPrice(Number(e.target.value))}
                min={0}
                step={1}
                placeholder="0.00"
              />
            </Field>
          </div>

          <Field label="MINIMUM QUANTITY">
            <NumberInput
              value={planMinQty}
              onChange={(e) => setPlanMinQty(Number(e.target.value))}
              min={1}
              step={1}
            />
          </Field>

          <div className="border border-line p-3 bg-canvas-muted flex flex-col gap-2">
            <span className="font-mono text-[11px] font-bold text-ink uppercase">
              LIFECYCLE POLICIES & CONTROLS
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planAutoClose}
                  onChange={(e) => setPlanAutoClose(e.target.checked)}
                />
                <span>AUTO-CLOSE ON END</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planClosable}
                  onChange={(e) => setPlanClosable(e.target.checked)}
                />
                <span>MANUAL CLOSABLE</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planPausable}
                  onChange={(e) => setPlanPausable(e.target.checked)}
                />
                <span>ALLOW PAUSE</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planRenewable}
                  onChange={(e) => setPlanRenewable(e.target.checked)}
                />
                <span>RENEWABLE</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button type="button" variant="outline" onClick={() => setIsNewPlanOpen(false)}>
              CANCEL
            </Button>
            <Button type="submit" variant="primary" disabled={createPlanMutation.isPending}>
              {createPlanMutation.isPending ? 'CREATING…' : 'CONFIRM PLAN'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: Create Payment Term */}
      <Dialog
        isOpen={isNewTermOpen}
        onClose={() => setIsNewTermOpen(false)}
        title="DEFINE PAYMENT TERM"
      >
        <form onSubmit={handleCreateTerm} className="flex flex-col gap-4">
          <Field label="TERM NAME" required hint="e.g. Net 45 Days">
            <TextInput
              value={termName}
              onChange={(e) => setTermName(e.target.value)}
              placeholder="e.g. Net 45 Days"
              required
            />
          </Field>

          <Field label="CREDIT DAYS" required hint="0 for immediate receipt">
            <NumberInput
              value={termDays}
              onChange={(e) => setTermDays(Number(e.target.value))}
              min={0}
              step={1}
            />
          </Field>

          <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
            <input
              type="checkbox"
              checked={termDefault}
              onChange={(e) => setTermDefault(e.target.checked)}
            />
            <span>SET AS SYSTEM DEFAULT PAYMENT TERM</span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button type="button" variant="outline" onClick={() => setIsNewTermOpen(false)}>
              CANCEL
            </Button>
            <Button type="submit" variant="primary" disabled={createTermMutation.isPending}>
              {createTermMutation.isPending ? 'SAVING…' : 'CONFIRM TERM'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
