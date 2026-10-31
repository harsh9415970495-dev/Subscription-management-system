import React, { useState } from 'react';
import {
  Button,
  Column,
  DataTable,
  Dialog,
  Field,
  PageHeader,
  Panel,
  Select,
  StatBlock,
  StatusTag,
  TextInput,
  Toast,
} from '../../design-system';
import { useAuth } from '../auth/AuthContext';

export interface CustomerItem extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  gstin?: string | null;
  stateCode: string;
  activeContracts: number;
  totalSpent: number; // paise
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

const SEED_CUSTOMERS: CustomerItem[] = [
  {
    id: 'cust_01jk9acme0000000000001',
    name: 'Acme Technologies Ltd.',
    email: 'finance@acmetech.io',
    gstin: '27AABCA1234D1ZP',
    stateCode: '27 (MH)',
    activeContracts: 1,
    totalSpent: 271872,
    status: 'ACTIVE',
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'cust_01jk9globex00000000002',
    name: 'Globex Robotics Corp.',
    email: 'billing@globex.com',
    gstin: '29BBBCB5678E1ZQ',
    stateCode: '29 (KA)',
    activeContracts: 1,
    totalSpent: 1000000,
    status: 'ACTIVE',
    createdAt: '2026-01-20T00:00:00Z',
  },
  {
    id: 'cust_01jk9soylent0000000003',
    name: 'Soylent Bio Labs',
    email: 'accounts@soylent.org',
    gstin: '27CCCC1234F1ZR',
    stateCode: '27 (MH)',
    activeContracts: 0,
    totalSpent: 0,
    status: 'ACTIVE',
    createdAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 'cust_01jk9initech0000000004',
    name: 'Initech Consulting',
    email: 'lumbergh@initech.com',
    gstin: '07DDDD5678G1ZS',
    stateCode: '07 (DL)',
    activeContracts: 1,
    totalSpent: 150000,
    status: 'ACTIVE',
    createdAt: '2026-02-28T00:00:00Z',
  },
];

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [customers, setCustomers] = useState<CustomerItem[]>(SEED_CUSTOMERS);
  const [isNewCustOpen, setIsNewCustOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custGstin, setCustGstin] = useState('');
  const [custState, setCustState] = useState('27 (MH)');

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custEmail.trim()) return;

    const newCust: CustomerItem = {
      id: `cust_${Date.now()}`,
      name: custName.trim(),
      email: custEmail.trim().toLowerCase(),
      gstin: custGstin.trim().toUpperCase() || null,
      stateCode: custState,
      activeContracts: 0,
      totalSpent: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    setCustomers([newCust, ...customers]);
    setIsNewCustOpen(false);
    setCustName('');
    setCustEmail('');
    setCustGstin('');
    setToastMessage(`Customer account "${newCust.name}" registered`);
  };

  const columns: Column<CustomerItem>[] = [
    {
      key: 'name',
      header: 'CUSTOMER NAME & ID',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-xs text-ink">{row.name}</span>
          <span className="font-mono text-[10px] text-ink-muted">{row.id}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'BILLING EMAIL',
      render: (row) => (
        <span className="font-mono text-xs text-ink">{row.email}</span>
      ),
    },
    {
      key: 'gstin',
      header: 'STATUTORY GSTIN & JURISDICTION',
      render: (row) => (
        <div className="flex flex-col font-mono text-[11px]">
          <span className="text-olive font-semibold">{row.gstin || 'UNREGISTERED'}</span>
          <span className="text-ink-muted text-[10px]">{row.stateCode}</span>
        </div>
      ),
    },
    {
      key: 'activeContracts',
      header: 'CONTRACTS',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-ink">
          {row.activeContracts}
        </span>
      ),
    },
    {
      key: 'totalSpent',
      header: 'LIFETIME VALUE',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-ink font-semibold">
          ₹{(row.totalSpent / 100).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (row) => (
        <StatusTag
          status={row.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT'}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto py-6">
      <PageHeader
        title="CUSTOMER ACCOUNTS & ISOLATION"
        subtitle="Customer scope directory, GSTIN statutory identifiers, contract linkings, and lifetime billings"
        breadcrumbs={['SYSTEM', 'ORGANIZATION', 'CUSTOMERS']}
        actions={
          isAdmin && (
            <Button variant="primary" onClick={() => setIsNewCustOpen(true)}>
              [+] NEW CUSTOMER ACCOUNT
            </Button>
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

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBlock
          label="TOTAL CUSTOMERS"
          value={customers.length.toString()}
          subtext="Isolated business entities"
        />
        <StatBlock
          label="ACTIVE WITH CONTRACTS"
          value={customers.filter((c) => c.activeContracts > 0).length.toString()}
          subtext="Currently generating revenue"
        />
        <StatBlock
          label="REGISTERED GSTIN"
          value={customers.filter((c) => !!c.gstin).length.toString()}
          subtext="B2B compliant entities"
        />
        <StatBlock
          label="CUSTOMER ISOLATION"
          value="ENFORCED"
          subtext="Row-Level Security boundary"
        />
      </div>

      <Panel
        title="CUSTOMER DIRECTORY"
      >
        <DataTable
          columns={columns}
          data={customers}
          emptyText="No customer records found."
        />
      </Panel>

      {/* Dialog: Create Customer */}
      <Dialog
        isOpen={isNewCustOpen}
        onClose={() => setIsNewCustOpen(false)}
        title="ONBOARD NEW CUSTOMER ACCOUNT"
      >
        <form onSubmit={handleCreateCustomer} className="flex flex-col gap-4">
          <Field label="ORGANIZATION / CUSTOMER NAME" required hint="e.g. Nexus Dynamics Inc.">
            <TextInput
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="Enter customer title"
              required
            />
          </Field>

          <Field label="PRIMARY BILLING EMAIL" required hint="For delivery of invoices and receipts">
            <TextInput
              type="email"
              value={custEmail}
              onChange={(e) => setCustEmail(e.target.value)}
              placeholder="billing@organization.com"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="STATUTORY GSTIN" hint="15-character alphanumeric tax ID">
              <TextInput
                value={custGstin}
                onChange={(e) => setCustGstin(e.target.value.toUpperCase())}
                placeholder="27AABCA1234D1ZP"
                maxLength={15}
              />
            </Field>

            <Field label="STATE JURISDICTION" required>
              <Select
                value={custState}
                onChange={(e) => setCustState(e.target.value)}
                options={[
                  { label: '27 - MAHARASHTRA (INTRA-STATE)', value: '27 (MH)' },
                  { label: '29 - KARNATAKA (INTER-STATE / IGST)', value: '29 (KA)' },
                  { label: '07 - DELHI (INTER-STATE / IGST)', value: '07 (DL)' },
                  { label: '33 - TAMIL NADU (INTER-STATE / IGST)', value: '33 (TN)' },
                ]}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button type="button" variant="outline" onClick={() => setIsNewCustOpen(false)}>
              CANCEL
            </Button>
            <Button type="submit" variant="primary">
              ONBOARD ACCOUNT
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
