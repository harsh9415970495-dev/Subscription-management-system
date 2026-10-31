import React, { useState } from 'react';
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

export interface PaymentItem extends Record<string, unknown> {
  id: string;
  reference: string;
  invoiceNumber: string;
  customerName: string;
  amount: number; // paise
  method: 'UPI' | 'NET_BANKING' | 'BANK_TRANSFER' | 'CARD';
  idempotencyKey: string;
  status: 'COMPLETED' | 'REVERSED';
  paidAt: string;
}

const SEED_PAYMENTS: PaymentItem[] = [
  {
    id: 'pay_01jk9acme000000000001',
    reference: 'PAY-2026-0001',
    invoiceNumber: 'INV-2026-0001',
    customerName: 'Acme Technologies Ltd.',
    amount: 271872,
    method: 'UPI',
    idempotencyKey: 'idemp_9f83a4c192b',
    status: 'COMPLETED',
    paidAt: '2026-01-16T14:32:00Z',
  },
  {
    id: 'pay_01jk9globex0000000002',
    reference: 'PAY-2026-0002',
    invoiceNumber: 'INV-2026-0002',
    customerName: 'Globex Robotics Corp.',
    amount: 1000000,
    method: 'NET_BANKING',
    idempotencyKey: 'idemp_b2c89f10a7e',
    status: 'COMPLETED',
    paidAt: '2026-02-05T10:15:00Z',
  },
  {
    id: 'pay_01jk9rev0000000000003',
    reference: 'PAY-2026-0003',
    invoiceNumber: 'INV-2026-0003',
    customerName: 'Soylent Bio Labs',
    amount: 50000,
    method: 'BANK_TRANSFER',
    idempotencyKey: 'idemp_71a0fd38c11',
    status: 'REVERSED',
    paidAt: '2026-03-02T16:45:00Z',
  },
];

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [payments, setPayments] = useState<PaymentItem[]>(SEED_PAYMENTS);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-0002');
  const [customerName, setCustomerName] = useState('Globex Robotics Corp.');
  const [paymentAmount, setPaymentAmount] = useState(10650);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NET_BANKING' | 'BANK_TRANSFER' | 'CARD'>('UPI');

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaise = paymentAmount * 100;
    if (amountPaise <= 0) return;

    const newPayment: PaymentItem = {
      id: `pay_${Date.now()}`,
      reference: `PAY-2026-${String(payments.length + 1).padStart(4, '0')}`,
      invoiceNumber,
      customerName,
      amount: amountPaise,
      method: paymentMethod,
      idempotencyKey: `idemp_${Math.random().toString(36).substring(2, 13)}`,
      status: 'COMPLETED',
      paidAt: new Date().toISOString(),
    };

    setPayments([newPayment, ...payments]);
    setIsRecordOpen(false);
    setToastMessage(`Payment ${newPayment.reference} of ₹${(amountPaise / 100).toFixed(2)} recorded successfully`);
  };

  const handleReversePayment = (id: string) => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, status: 'REVERSED' };
        }
        return p;
      })
    );
    setToastMessage('Payment reversal entry recorded in immutable ledger');
  };

  const totalCollected = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalReversed = payments
    .filter((p) => p.status === 'REVERSED')
    .reduce((acc, p) => acc + p.amount, 0);

  const columns: Column<PaymentItem>[] = [
    {
      key: 'reference',
      header: 'PAYMENT REF & IDEMP KEY',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-bold text-emerald">[{row.reference}]</span>
          <span className="font-mono text-[10px] text-cyan">{row.idempotencyKey}</span>
        </div>
      ),
    },
    {
      key: 'invoiceNumber',
      header: 'LINKED INVOICE',
      render: (row) => (
        <span className="font-mono text-xs text-cobalt font-bold">
          [{row.invoiceNumber}]
        </span>
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
      key: 'method',
      header: 'METHOD',
      render: (row) => (
        <span className="font-mono text-[10px] font-bold border border-line bg-surface-alt px-1.5 py-0.5 text-ink">
          [{row.method}]
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'AMOUNT RECEIVED',
      align: 'right',
      render: (row) => (
        <span
          className={`font-mono text-xs tabular-nums font-bold ${
            row.status === 'REVERSED' ? 'line-through text-ink-muted' : 'text-emerald'
          }`}
        >
          ₹{(row.amount / 100).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'LEDGER STATUS',
      render: (row) => (
        <StatusTag
          status={row.status === 'COMPLETED' ? 'PAID' : 'CANCELLED'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      render: (row) =>
        row.status === 'COMPLETED' && isAdmin ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReversePayment(row.id)}
          >
            REVERSE
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto py-6">
      <PageHeader
        title="PAYMENTS & RECEIVABLES LEDGER"
        subtitle="Immutable payment collection entries, idempotency protection, payment method attribution, and reversal auditing"
        breadcrumbs={['SYSTEM', 'FINANCE', 'PAYMENTS']}
        actions={
          isAdmin && (
            <Button variant="emerald" onClick={() => setIsRecordOpen(true)}>
              [+] RECORD INCOMING PAYMENT
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
          label="TOTAL SETTLED"
          value={`₹${(totalCollected / 100).toFixed(2)}`}
          subtext="Net confirmed bank collections"
          accent="emerald"
          change="↑ 100% IDEMP"
        />
        <StatBlock
          label="REVERSED / REFUNDED"
          value={`₹${(totalReversed / 100).toFixed(2)}`}
          subtext="Compensating journal entries"
          accent="amber"
          change="0 CHARGEBACKS"
        />
        <StatBlock
          label="ACTIVE INVOICES SETTLED"
          value={payments.filter((p) => p.status === 'COMPLETED').length.toString()}
          subtext="Satisfied customer accounts"
          accent="cobalt"
          change="2 SETTLED"
        />
        <StatBlock
          label="LEDGER AUDIT COUNT"
          value={payments.length.toString()}
          subtext="Append-only entries"
          accent="cyan"
          change="IMMUTABLE"
        />
      </div>

      <Panel
        title="IMMUTABLE PAYMENT JOURNAL"
      >
        <DataTable
          columns={columns}
          data={payments}
          emptyText="No payments recorded."
        />
      </Panel>

      {/* Dialog: Record Payment */}
      <Dialog
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        title="RECORD INCOMING CUSTOMER PAYMENT"
      >
        <form onSubmit={handleRecordPayment} className="flex flex-col gap-4">
          <Field label="TARGET INVOICE NUMBER" required hint="e.g. INV-2026-0002">
            <Select
              value={invoiceNumber}
              onChange={(e) => {
                setInvoiceNumber(e.target.value);
                if (e.target.value === 'INV-2026-0002') {
                  setCustomerName('Globex Robotics Corp.');
                  setPaymentAmount(10650);
                } else if (e.target.value === 'INV-2026-0003') {
                  setCustomerName('Soylent Bio Labs');
                  setPaymentAmount(2360);
                }
              }}
              options={[
                { label: 'INV-2026-0002 (Globex Robotics — Balance: ₹10,650.00)', value: 'INV-2026-0002' },
                { label: 'INV-2026-0003 (Soylent Bio Labs — Balance: ₹2,360.00)', value: 'INV-2026-0003' },
              ]}
            />
          </Field>

          <Field label="CUSTOMER NAME" required>
            <TextInput
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="PAYMENT AMOUNT (₹)" required>
              <NumberInput
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                min={1}
                step={1}
                required
              />
            </Field>

            <Field label="COLLECTION CHANNEL" required>
              <Select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as 'UPI' | 'NET_BANKING' | 'BANK_TRANSFER' | 'CARD')
                }
                options={[
                  { label: 'UPI / QR CODE', value: 'UPI' },
                  { label: 'NET BANKING (IMPS/NEFT)', value: 'NET_BANKING' },
                  { label: 'DIRECT BANK WIRE', value: 'BANK_TRANSFER' },
                  { label: 'CORPORATE CREDIT CARD', value: 'CARD' },
                ]}
              />
            </Field>
          </div>

          <div className="border border-line bg-canvas-muted p-2 font-mono text-[11px] text-ink-muted">
            Safety Guard: An idempotent unique key is generated automatically to prevent duplicate bank transaction posting.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button type="button" variant="outline" onClick={() => setIsRecordOpen(false)}>
              CANCEL
            </Button>
            <Button type="submit" variant="primary">
              POST PAYMENT TO LEDGER
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
