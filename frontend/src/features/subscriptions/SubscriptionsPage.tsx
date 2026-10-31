import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
import { useAuth } from '../auth/AuthContext';

export type SubscriptionStatus =
  | 'DRAFT'
  | 'QUOTATION'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'CLOSED'
  | 'RENEWED';

export interface SubscriptionLine {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number; // paise
  subtotal: number;
}

export interface SubscriptionItem extends Record<string, unknown> {
  id: string;
  number: string;
  customerName: string;
  planName: string;
  billingPeriod: string;
  status: SubscriptionStatus;
  startDate: string;
  nextBillingDate: string;
  recurringAmount: number; // paise
  lines: SubscriptionLine[];
}

const SEED_SUBSCRIPTIONS: SubscriptionItem[] = [
  {
    id: 'sub_01jk9acme00000000000001',
    number: 'SUB-2026-0001',
    customerName: 'Acme Technologies Ltd.',
    planName: 'Startup Modular ERP Monthly',
    billingPeriod: 'MONTHLY',
    status: 'ACTIVE',
    startDate: '2026-01-15T00:00:00Z',
    nextBillingDate: '2026-11-15T00:00:00Z',
    recurringAmount: 256000,
    lines: [
      {
        id: 'line_1',
        productName: 'Cloud ERP Software Suite (Odoo)',
        quantity: 1,
        unitPrice: 256000,
        subtotal: 256000,
      },
    ],
  },
  {
    id: 'sub_01jk9globex00000000002',
    number: 'SUB-2026-0002',
    customerName: 'Globex Robotics Corp.',
    planName: 'Enterprise Scale Infrastructure Yearly',
    billingPeriod: 'YEARLY',
    status: 'CONFIRMED',
    startDate: '2026-02-01T00:00:00Z',
    nextBillingDate: '2026-12-01T00:00:00Z',
    recurringAmount: 1800000,
    lines: [
      {
        id: 'line_2',
        productName: 'Cloud ERP Software Suite + Dedicated Support',
        quantity: 3,
        unitPrice: 600000,
        subtotal: 1800000,
      },
    ],
  },
  {
    id: 'sub_01jk9soylent00000000003',
    number: 'SUB-2026-0003',
    customerName: 'Soylent Bio Labs',
    planName: 'Startup Modular ERP Monthly',
    billingPeriod: 'MONTHLY',
    status: 'QUOTATION',
    startDate: '2026-03-01T00:00:00Z',
    nextBillingDate: '2026-11-01T00:00:00Z',
    recurringAmount: 200000,
    lines: [
      {
        id: 'line_3',
        productName: 'Cloud ERP Software Suite',
        quantity: 1,
        unitPrice: 200000,
        subtotal: 200000,
      },
    ],
  },
  {
    id: 'sub_01jk9initech00000000004',
    number: 'SUB-2026-0004',
    customerName: 'Initech Consulting',
    planName: 'Weekly Sprint Dedicated Support',
    billingPeriod: 'WEEKLY',
    status: 'PAUSED',
    startDate: '2026-01-01T00:00:00Z',
    nextBillingDate: '2026-11-08T00:00:00Z',
    recurringAmount: 150000,
    lines: [
      {
        id: 'line_4',
        productName: '24/7 Priority SLA Technical Support',
        quantity: 1,
        unitPrice: 150000,
        subtotal: 150000,
      },
    ],
  },
];

export const SubscriptionsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(SEED_SUBSCRIPTIONS);
  const [selectedSub, setSelectedSub] = useState<SubscriptionItem | null>(subscriptions[0]);
  const [isNewSubOpen, setIsNewSubOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [planChoice, setPlanChoice] = useState('Startup Modular ERP Monthly');
  const [productChoice, setProductChoice] = useState('Cloud ERP Software Suite');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(2000);

  const handleStateTransition = (id: string, nextStatus: SubscriptionStatus) => {
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.id === id) {
          const updated = { ...sub, status: nextStatus };
          if (selectedSub?.id === id) {
            setSelectedSub(updated);
          }
          return updated;
        }
        return sub;
      })
    );
    setToastMessage(`Subscription status updated to [${nextStatus}]`);
  };

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const pricePaise = unitPrice * 100;
    const qty = quantity;
    const lineTotal = pricePaise * qty;

    const newSub: SubscriptionItem = {
      id: `sub_${Date.now()}`,
      number: `SUB-2026-${String(subscriptions.length + 1).padStart(4, '0')}`,
      customerName: customerName.trim(),
      planName: planChoice,
      billingPeriod: planChoice.includes('Yearly') ? 'YEARLY' : 'MONTHLY',
      status: 'DRAFT',
      startDate: new Date().toISOString(),
      nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      recurringAmount: lineTotal,
      lines: [
        {
          id: `line_${Date.now()}`,
          productName: productChoice,
          quantity: qty,
          unitPrice: pricePaise,
          subtotal: lineTotal,
        },
      ],
    };

    setSubscriptions([newSub, ...subscriptions]);
    setSelectedSub(newSub);
    setIsNewSubOpen(false);
    setCustomerName('');
    setToastMessage(`Draft Quotation ${newSub.number} created`);
  };

  const subColumns: Column<SubscriptionItem>[] = [
    {
      key: 'number',
      header: 'SUBSCRIPTION #',
      render: (row) => (
        <button
          onClick={() => setSelectedSub(row)}
          className="font-mono text-xs font-bold text-cobalt hover:text-cyan text-left cursor-pointer transition-colors"
        >
          [{row.number}]
        </button>
      ),
    },
    {
      key: 'customerName',
      header: 'CUSTOMER',
      render: (row) => (
        <span className="font-bold text-xs text-ink">{row.customerName}</span>
      ),
    },
    {
      key: 'planName',
      header: 'PLAN & CADENCE',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-xs text-ink">{row.planName}</span>
          <span className="font-mono text-[10px] text-cyan font-semibold">[{row.billingPeriod}]</span>
        </div>
      ),
    },
    {
      key: 'recurringAmount',
      header: 'RECURRING AMOUNT',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-ink font-bold">
          ₹{(row.recurringAmount / 100).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'FSM STATUS',
      render: (row) => (
        <StatusTag status={row.status} />
      ),
    },
  ];

  const ORDERED_STEPS: SubscriptionStatus[] = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED'];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto py-6">
      <PageHeader
        title="SUBSCRIPTION & QUOTATION LIFECYCLE"
        subtitle="Finite State Machine driven order transitions, recurrence scheduling, and line-item contract management"
        breadcrumbs={['SYSTEM', 'SALES', 'SUBSCRIPTIONS']}
        actions={
          isAdmin && (
            <Button variant="cyan" onClick={() => setIsNewSubOpen(true)}>
              [+] NEW SUBSCRIPTION / QUOTATION
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
          label="ACTIVE CONTRACTS"
          value={subscriptions.filter((s) => s.status === 'ACTIVE').length.toString()}
          subtext="Generating recurring invoices"
          accent="emerald"
          change="↑ LIVE"
        />
        <StatBlock
          label="QUOTATIONS / DRAFTS"
          value={subscriptions.filter((s) => s.status === 'QUOTATION' || s.status === 'DRAFT').length.toString()}
          subtext="Pending client approval"
          accent="amber"
          change="1 PENDING"
        />
        <StatBlock
          label="PAUSED CONTRACTS"
          value={subscriptions.filter((s) => s.status === 'PAUSED').length.toString()}
          subtext="Temporarily halted billing"
          accent="red"
          change="0 OVERDUE"
        />
        <StatBlock
          label="ESTIMATED MRR"
          value="₹1,75,600"
          subtext="Normalized monthly recurring"
          accent="cyan"
          change="+14.2% MoM"
        />
      </div>

      {/* Detail & Lifecycle Inspector */}
      {selectedSub && (
        <Panel
          title={`CONTRACT INSPECTOR — ${selectedSub.number}`}
          action={
            <div className="flex gap-2 font-mono text-xs">
              {selectedSub.status === 'DRAFT' && (
                <Button
                  variant="cyan"
                  onClick={() => handleStateTransition(selectedSub.id, 'QUOTATION')}
                >
                  SEND QUOTATION →
                </Button>
              )}
              {selectedSub.status === 'QUOTATION' && (
                <Button
                  variant="emerald"
                  onClick={() => handleStateTransition(selectedSub.id, 'CONFIRMED')}
                >
                  CONFIRM QUOTATION →
                </Button>
              )}
              {selectedSub.status === 'CONFIRMED' && (
                <Button
                  variant="emerald"
                  onClick={() => handleStateTransition(selectedSub.id, 'ACTIVE')}
                >
                  ACTIVATE CONTRACT →
                </Button>
              )}
              {selectedSub.status === 'ACTIVE' && (
                <>
                  <Button
                    variant="amber"
                    onClick={() => handleStateTransition(selectedSub.id, 'PAUSED')}
                  >
                    PAUSE CONTRACT
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleStateTransition(selectedSub.id, 'CLOSED')}
                  >
                    CLOSE CONTRACT
                  </Button>
                  <Button
                    variant="cyan"
                    onClick={() => handleStateTransition(selectedSub.id, 'RENEWED')}
                  >
                    RENEW
                  </Button>
                </>
              )}
              {selectedSub.status === 'PAUSED' && (
                <Button
                  variant="emerald"
                  onClick={() => handleStateTransition(selectedSub.id, 'ACTIVE')}
                >
                  RESUME CONTRACT →
                </Button>
              )}
            </div>
          }
        >
          {/* FSM Horizontal Lifecycle Progression */}
          <div className="border border-line bg-surface-alt p-4 mb-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-ink-muted uppercase font-bold tracking-wider">
                // FSM STATE PIPELINE (STRICT DETERMINISTIC ORDER)
              </span>
              <span className="font-mono text-[10px] text-cyan font-bold">
                CURRENT: [{selectedSub.status}]
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto text-xs font-mono py-1">
              {ORDERED_STEPS.map((step, idx) => {
                const isCurrent = selectedSub.status === step;
                const currentIdx = ORDERED_STEPS.indexOf(selectedSub.status as SubscriptionStatus);
                const isPassed = currentIdx > idx;

                let badgeStyle = 'bg-surface text-ink-muted border-line';
                if (isCurrent) {
                  if (step === 'ACTIVE') badgeStyle = 'bg-emerald text-white font-bold border-emerald';
                  else if (step === 'CONFIRMED') badgeStyle = 'bg-olive text-paper font-bold border-olive';
                  else if (step === 'QUOTATION') badgeStyle = 'bg-cobalt text-white font-bold border-cobalt';
                  else if (step === 'DRAFT') badgeStyle = 'bg-amber text-white font-bold border-amber';
                  else if (step === 'CLOSED') badgeStyle = 'bg-red text-white font-bold border-red';
                } else if (isPassed) {
                  badgeStyle = 'bg-emerald/15 text-emerald border-emerald/40 font-semibold';
                }

                return (
                  <React.Fragment key={step}>
                    <motion.div
                      animate={isCurrent ? { scale: [1, 1.04, 1] } : {}}
                      transition={isCurrent ? { repeat: Infinity, duration: 2.5 } : {}}
                      className={`px-2.5 py-1 border flex items-center gap-1.5 ${badgeStyle}`}
                    >
                      {isPassed && <span className="text-[10px]">✓</span>}
                      {isCurrent && <span className="w-1.5 h-1.5 bg-current inline-block" />}
                      <span>[{step}]</span>
                    </motion.div>
                    {idx < ORDERED_STEPS.length - 1 && (
                      <span className={`text-xs ${isPassed ? 'text-emerald' : 'text-ink-muted'}`}>
                        →
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Line items table */}
          <div className="border border-line">
            <div className="bg-sand px-3 py-1.5 border-b border-line font-mono text-xs font-bold text-ink flex justify-between">
              <span>CONTRACTED LINE ITEMS</span>
              <span className="tabular-nums">
                TOTAL: ₹{(selectedSub.recurringAmount / 100).toFixed(2)} / {selectedSub.billingPeriod}
              </span>
            </div>
            <table className="w-full text-xs font-mono text-left">
              <thead className="border-b border-line bg-canvas text-ink-muted">
                <tr>
                  <th className="p-2">PRODUCT / SERVICE</th>
                  <th className="p-2 text-right">QUANTITY</th>
                  <th className="p-2 text-right">UNIT PRICE</th>
                  <th className="p-2 text-right">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {selectedSub.lines.map((l) => (
                  <tr key={l.id} className="border-b border-line last:border-b-0">
                    <td className="p-2 font-bold text-ink">{l.productName}</td>
                    <td className="p-2 text-right tabular-nums">{l.quantity}</td>
                    <td className="p-2 text-right tabular-nums">₹{(l.unitPrice / 100).toFixed(2)}</td>
                    <td className="p-2 text-right tabular-nums font-semibold text-ink">
                      ₹{(l.subtotal / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Subscriptions Table */}
      <Panel
        title="SUBSCRIPTION CONTRACTS REGISTER"
      >
        <DataTable
          columns={subColumns}
          data={subscriptions}
          emptyText="No subscription contracts found."
        />
      </Panel>

      {/* Dialog: New Subscription */}
      <Dialog
        isOpen={isNewSubOpen}
        onClose={() => setIsNewSubOpen(false)}
        title="DRAFT NEW SUBSCRIPTION QUOTATION"
      >
        <form onSubmit={handleCreateSubscription} className="flex flex-col gap-4">
          <Field label="CUSTOMER NAME" required hint="e.g. Apex Global Solutions">
            <TextInput
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer title"
              required
            />
          </Field>

          <Field label="RECURRING PLAN" required>
            <Select
              value={planChoice}
              onChange={(e) => setPlanChoice(e.target.value)}
              options={[
                { label: 'Startup Modular ERP Monthly', value: 'Startup Modular ERP Monthly' },
                { label: 'Enterprise Scale Infrastructure Yearly', value: 'Enterprise Scale Infrastructure Yearly' },
                { label: 'Weekly Sprint Dedicated Support', value: 'Weekly Sprint Dedicated Support' },
                { label: 'Daily Burst Compute Utility', value: 'Daily Burst Compute Utility' },
              ]}
            />
          </Field>

          <Field label="BASE PRODUCT / SERVICE" required>
            <Select
              value={productChoice}
              onChange={(e) => setProductChoice(e.target.value)}
              options={[
                { label: 'Cloud ERP Software Suite', value: 'Cloud ERP Software Suite' },
                { label: 'Cloud ERP Software Suite (Odoo)', value: 'Cloud ERP Software Suite (Odoo)' },
                { label: '24/7 Priority SLA Technical Support', value: '24/7 Priority SLA Technical Support' },
                { label: 'Dedicated IPv4 & Managed SSL Certificate', value: 'Dedicated IPv4 & Managed SSL Certificate' },
              ]}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="QUANTITY" required>
              <NumberInput
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={1}
                step={1}
              />
            </Field>

            <Field label="UNIT PRICE (₹)" required>
              <NumberInput
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                min={0}
                step={50}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button type="button" variant="outline" onClick={() => setIsNewSubOpen(false)}>
              CANCEL
            </Button>
            <Button type="submit" variant="primary">
              CONFIRM DRAFT CONTRACT
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
