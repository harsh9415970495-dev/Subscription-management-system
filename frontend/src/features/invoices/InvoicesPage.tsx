import React, { useState } from 'react';
import {
  Button,
  Column,
  DataTable,
  PageHeader,
  Panel,
  StatBlock,
  StatusTag,
  Toast,
} from '../../design-system';
import { useAuth } from '../auth/AuthContext';

export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'OVERDUE';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // paise
  amount: number; // paise
}

export interface InvoiceItem extends Record<string, unknown> {
  id: string;
  number: string;
  customerName: string;
  subscriptionNumber?: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number; // paise
  discountTotal: number; // paise
  taxTotal: number; // paise
  totalAmount: number; // paise
  amountPaid: number; // paise
  amountDue: number; // paise
  lines: InvoiceLineItem[];
}

const SEED_INVOICES: InvoiceItem[] = [
  {
    id: 'inv_01jk9acme0000000000001',
    number: 'INV-2026-0001',
    customerName: 'Acme Technologies Ltd.',
    subscriptionNumber: 'SUB-2026-0001',
    issueDate: '2026-01-15T00:00:00Z',
    dueDate: '2026-01-30T00:00:00Z',
    status: 'PAID',
    subtotal: 256000,
    discountTotal: 25600,
    taxTotal: 41472,
    totalAmount: 271872,
    amountPaid: 271872,
    amountDue: 0,
    lines: [
      {
        id: 'line_1',
        description: 'Cloud ERP Software Suite (Odoo)',
        quantity: 1,
        unitPrice: 256000,
        amount: 256000,
      },
    ],
  },
  {
    id: 'inv_01jk9globex00000000002',
    number: 'INV-2026-0002',
    customerName: 'Globex Robotics Corp.',
    subscriptionNumber: 'SUB-2026-0002',
    issueDate: '2026-02-01T00:00:00Z',
    dueDate: '2026-03-03T00:00:00Z',
    status: 'CONFIRMED',
    subtotal: 1800000,
    discountTotal: 50000,
    taxTotal: 315000,
    totalAmount: 2065000,
    amountPaid: 1000000,
    amountDue: 1065000,
    lines: [
      {
        id: 'line_2',
        description: 'Cloud ERP Software Suite + Dedicated Support',
        quantity: 3,
        unitPrice: 600000,
        amount: 1800000,
      },
    ],
  },
  {
    id: 'inv_01jk9soylent0000000003',
    number: 'INV-2026-0003',
    customerName: 'Soylent Bio Labs',
    subscriptionNumber: 'SUB-2026-0003',
    issueDate: '2026-03-01T00:00:00Z',
    dueDate: '2026-03-16T00:00:00Z',
    status: 'OVERDUE',
    subtotal: 200000,
    discountTotal: 0,
    taxTotal: 36000,
    totalAmount: 236000,
    amountPaid: 0,
    amountDue: 236000,
    lines: [
      {
        id: 'line_3',
        description: 'Cloud ERP Software Suite License',
        quantity: 1,
        unitPrice: 200000,
        amount: 200000,
      },
    ],
  },
  {
    id: 'inv_01jk9draft000000000004',
    number: '[DRAFT-GEN]',
    customerName: 'Initech Consulting',
    subscriptionNumber: 'SUB-2026-0004',
    issueDate: '2026-03-10T00:00:00Z',
    dueDate: '2026-03-25T00:00:00Z',
    status: 'DRAFT',
    subtotal: 150000,
    discountTotal: 0,
    taxTotal: 27000,
    totalAmount: 177000,
    amountPaid: 0,
    amountDue: 177000,
    lines: [
      {
        id: 'line_4',
        description: '24/7 Priority SLA Technical Support',
        quantity: 1,
        unitPrice: 150000,
        amount: 150000,
      },
    ],
  },
];

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [invoices, setInvoices] = useState<InvoiceItem[]>(SEED_INVOICES);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(invoices[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confirm / Post Draft Invoice
  const handleConfirmInvoice = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          const nextNum = `INV-2026-${String(prev.filter((i) => i.number !== '[DRAFT-GEN]').length + 1).padStart(4, '0')}`;
          const updated: InvoiceItem = {
            ...inv,
            number: nextNum,
            status: 'CONFIRMED',
          };
          if (selectedInvoice?.id === id) {
            setSelectedInvoice(updated);
          }
          return updated;
        }
        return inv;
      })
    );
    setToastMessage('Invoice confirmed and assigned gapless sequence number');
  };

  const totalBilled = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalCollected = invoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const totalOutstanding = invoices.reduce((acc, i) => acc + i.amountDue, 0);
  const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length;

  const columns: Column<InvoiceItem>[] = [
    {
      key: 'number',
      header: 'INVOICE NUMBER',
      render: (row) => (
        <button
          onClick={() => setSelectedInvoice(row)}
          className="font-mono text-xs font-bold text-cyan hover:underline text-left cursor-pointer transition-colors"
        >
          [{row.number}]
        </button>
      ),
    },
    {
      key: 'customerName',
      header: 'CUSTOMER & CONTRACT',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-xs text-ink">{row.customerName}</span>
          <span className="font-mono text-[10px] text-cobalt font-semibold">
            {row.subscriptionNumber ? `[${row.subscriptionNumber}]` : '[ADHOC]'}
          </span>
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'DUE DATE',
      render: (row) => (
        <span className="font-mono text-xs text-ink">
          {new Date(row.dueDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'TOTAL INVOICE',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-ink font-bold">
          ₹{(row.totalAmount / 100).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'amountDue',
      header: 'BALANCE DUE',
      align: 'right',
      render: (row) => (
        <span
          className={`font-mono text-xs tabular-nums font-bold ${
            row.amountDue > 0 ? 'text-red' : 'text-emerald'
          }`}
        >
          ₹{(row.amountDue / 100).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (row) => (
        <StatusTag status={row.status} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto py-6">
      <PageHeader
        title="BILLING ENGINE & TAX INVOICES"
        subtitle="Gapless sequential invoice issuance, statutory GST calculation, discount allocation, and payment status tracking"
        breadcrumbs={['SYSTEM', 'FINANCE', 'INVOICES']}
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
          label="TOTAL INVOICED"
          value={`₹${(totalBilled / 100).toFixed(2)}`}
          subtext="Gross receivables generated"
          accent="cobalt"
          change="₹22.13L"
        />
        <StatBlock
          label="TOTAL COLLECTED"
          value={`₹${(totalCollected / 100).toFixed(2)}`}
          subtext="Settled via payments"
          accent="emerald"
          change="↑ 89% SETTLED"
        />
        <StatBlock
          label="OUTSTANDING"
          value={`₹${(totalOutstanding / 100).toFixed(2)}`}
          subtext="Pending payment reception"
          accent="amber"
          change="₹2,360 DUE"
        />
        <StatBlock
          label="OVERDUE INVOICES"
          value={overdueCount.toString()}
          subtext="Requires dunning follow-up"
          accent="red"
          change="1 ACCOUNT"
        />
      </div>

      {/* Selected Invoice Print / Detail View */}
      {selectedInvoice && (
        <Panel
          title={`TAX INVOICE DETAIL — ${selectedInvoice.number}`}
          action={
            <div className="flex gap-2">
              {selectedInvoice.status === 'DRAFT' && isAdmin && (
                <Button
                  variant="primary"
                  onClick={() => handleConfirmInvoice(selectedInvoice.id)}
                >
                  CONFIRM & POST INVOICE →
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => window.print()}
              >
                PRINT BILL / PDF
              </Button>
            </div>
          }
        >
          {/* Statutory Tax Invoice Breakdown Box */}
          <div className="border border-line bg-canvas p-4 font-mono text-xs flex flex-col gap-3">
            <div className="flex justify-between items-start border-b border-line pb-3">
              <div>
                <span className="font-bold text-sm text-ink block">BRIGHTLOOP SYSTEMS PVT. LTD.</span>
                <span className="text-[10px] text-ink-muted">GSTIN: 27AABCB1234D1ZP · STATE CODE: 27 (MAHARASHTRA)</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-xs text-olive block">[{selectedInvoice.number}]</span>
                <span className="text-[10px] text-ink-muted">STATUS: [{selectedInvoice.status}]</span>
              </div>
            </div>

            {/* Line items */}
            <table className="w-full text-left border border-line">
              <thead className="bg-sand border-b border-line text-[11px] text-ink font-bold">
                <tr>
                  <th className="p-2">ITEM DESCRIPTION</th>
                  <th className="p-2 text-right">QTY</th>
                  <th className="p-2 text-right">UNIT RATE (₹)</th>
                  <th className="p-2 text-right">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.lines.map((l) => (
                  <tr key={l.id} className="border-b border-line last:border-b-0">
                    <td className="p-2 text-ink">{l.description}</td>
                    <td className="p-2 text-right tabular-nums">{l.quantity}</td>
                    <td className="p-2 text-right tabular-nums">{(l.unitPrice / 100).toFixed(2)}</td>
                    <td className="p-2 text-right tabular-nums font-semibold">
                      {(l.amount / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations and summary */}
            <div className="flex justify-end">
              <div className="w-72 flex flex-col gap-1 text-[11px] pt-1">
                <div className="flex justify-between">
                  <span className="text-ink-muted">SUBTOTAL:</span>
                  <span className="tabular-nums">₹{(selectedInvoice.subtotal / 100).toFixed(2)}</span>
                </div>
                {selectedInvoice.discountTotal > 0 && (
                  <div className="flex justify-between text-olive">
                    <span>DISCOUNT SAVINGS:</span>
                    <span className="tabular-nums">-₹{(selectedInvoice.discountTotal / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-ink-muted">GST (CGST 9% + SGST 9%):</span>
                  <span className="tabular-nums">₹{(selectedInvoice.taxTotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-ink border-t border-line pt-1 text-xs">
                  <span>TOTAL PAYABLE:</span>
                  <span className="tabular-nums">₹{(selectedInvoice.totalAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>AMOUNT PAID:</span>
                  <span className="tabular-nums">₹{(selectedInvoice.amountPaid / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-red-500 border-t border-line pt-1">
                  <span>BALANCE DUE:</span>
                  <span className="tabular-nums">₹{(selectedInvoice.amountDue / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Main Invoices Table */}
      <Panel
        title="INVOICE REGISTER"
      >
        <DataTable
          columns={columns}
          data={invoices}
          emptyText="No invoices generated yet."
        />
      </Panel>
    </div>
  );
};
