import React, { useState } from 'react';
import {
  Button,
  Column,
  DataTable,
  PageHeader,
  Panel,
  StatBlock,
  Toast,
} from '../../design-system';

export interface AuditEventItem extends Record<string, unknown> {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  details: string;
}

const SEED_AUDIT_LOGS: AuditEventItem[] = [
  {
    id: 'evt_01jk9000000000000001',
    timestamp: '2026-03-10T14:22:15Z',
    actor: 'admin@brightloop.io',
    action: 'INVOICE_GENERATED',
    entity: 'INV-2026-0004',
    details: 'Generated recurring invoice for SUB-2026-0004 (Initech Consulting)',
  },
  {
    id: 'evt_01jk9000000000000002',
    timestamp: '2026-03-02T16:45:00Z',
    actor: 'admin@brightloop.io',
    action: 'PAYMENT_REVERSED',
    entity: 'PAY-2026-0003',
    details: 'Compensating reversal of ₹500.00 for Soylent Bio Labs',
  },
  {
    id: 'evt_01jk9000000000000003',
    timestamp: '2026-02-05T10:15:00Z',
    actor: 'finance@brightloop.io',
    action: 'PAYMENT_POSTED',
    entity: 'PAY-2026-0002',
    details: 'Recorded NEFT receipt of ₹10,000.00 against INV-2026-0002',
  },
  {
    id: 'evt_01jk9000000000000004',
    timestamp: '2026-02-01T00:00:00Z',
    actor: 'admin@brightloop.io',
    action: 'CONTRACT_ACTIVATED',
    entity: 'SUB-2026-0002',
    details: 'FSM transitioned state to [ACTIVE] for Globex Robotics',
  },
  {
    id: 'evt_01jk9000000000000005',
    timestamp: '2026-01-16T14:32:00Z',
    actor: 'system@brightloop.io',
    action: 'PAYMENT_SETTLED',
    entity: 'PAY-2026-0001',
    details: 'Automatic status transition of INV-2026-0001 to [PAID]',
  },
];

export const ReportsPage: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,TIMESTAMP,ACTOR,ACTION,ENTITY,DETAILS\n' +
      SEED_AUDIT_LOGS.map(
        (e) => `"${e.timestamp}","${e.actor}","${e.action}","${e.entity}","${e.details}"`
      ).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'brightloop_audit_trail_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage('Audit trail CSV exported successfully');
  };

  const auditColumns: Column<AuditEventItem>[] = [
    {
      key: 'timestamp',
      header: 'TIMESTAMP (UTC)',
      render: (row) => (
        <span className="font-mono text-[11px] text-ink">
          {new Date(row.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'ACTOR / SYSTEM',
      render: (row) => (
        <span className="font-mono text-xs text-ink-muted">{row.actor}</span>
      ),
    },
    {
      key: 'action',
      header: 'ACTION CODE',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-olive">
          [{row.action}]
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'TARGET ENTITY',
      render: (row) => (
        <span className="font-mono text-xs text-ink font-semibold">
          {row.entity}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'AUDIT EVENT LOG DETAILS',
      render: (row) => (
        <span className="text-xs text-ink">{row.details}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto py-6">
      <PageHeader
        title="REPORTS & IMMUTABLE AUDIT TRAIL"
        subtitle="SaaS financial recurring analytics, aging receivable buckets, and system audit journal"
        breadcrumbs={['SYSTEM', 'INTELLIGENCE', 'REPORTS & AUDIT']}
        actions={
          <Button variant="primary" onClick={handleExportCSV}>
            EXPORT AUDIT JOURNAL (CSV)
          </Button>
        }
      />

      {toastMessage && (
        <Toast
          variant="ok"
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBlock
          label="MRR (NORMALIZED)"
          value="₹1,75,600"
          subtext="Active monthly recurring revenue"
          accent="cyan"
          change="+14.2% MoM"
        />
        <StatBlock
          label="ARR RUN-RATE"
          value="₹21,07,200"
          subtext="Annualized recurring projection"
          accent="cobalt"
          change="₹21.07L ANNUAL"
        />
        <StatBlock
          label="REVENUE RETENTION"
          value="98.4%"
          subtext="Negative net churn rate"
          accent="emerald"
          change="↑ TOP DECILE"
        />
        <StatBlock
          label="AVG REVENUE / ACCOUNT"
          value="₹43,900"
          subtext="Blended contract value"
          accent="olive"
          change="4 ACCOUNTS"
        />
      </div>

      {/* Aging Receivables Buckets */}
      <Panel
        title="RECEIVABLES AGING SCHEDULE (STATUTORY INR)"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
          <div className="border border-line border-t-4 border-t-emerald p-4 bg-surface-alt flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted block text-[10px] uppercase font-bold tracking-wider">
                  CURRENT (0 - 30 DAYS)
                </span>
                <span className="text-[9px] font-bold text-emerald">[OK]</span>
              </div>
              <span className="text-xl font-bold text-ink block mt-1.5 tabular-nums">
                ₹10,650.00
              </span>
            </div>
            <span className="text-[10px] text-ink-muted border-t border-line-soft pt-2 mt-2">
              1 pending invoice (Globex Robotics)
            </span>
          </div>

          <div className="border border-line border-t-4 border-t-amber p-4 bg-surface-alt flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted block text-[10px] uppercase font-bold tracking-wider">
                  31 - 60 DAYS OVERDUE
                </span>
                <span className="text-[9px] font-bold text-amber">[WARNING]</span>
              </div>
              <span className="text-xl font-bold text-amber block mt-1.5 tabular-nums">
                ₹2,360.00
              </span>
            </div>
            <span className="text-[10px] text-ink-muted border-t border-line-soft pt-2 mt-2">
              1 overdue bill (Soylent Bio Labs)
            </span>
          </div>

          <div className="border border-line border-t-4 border-t-olive p-4 bg-surface-alt flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted block text-[10px] uppercase font-bold tracking-wider">
                  61 - 90 DAYS OVERDUE
                </span>
                <span className="text-[9px] font-bold text-ink-muted">[NONE]</span>
              </div>
              <span className="text-xl font-bold text-ink-muted block mt-1.5 tabular-nums">
                ₹0.00
              </span>
            </div>
            <span className="text-[10px] text-ink-muted border-t border-line-soft pt-2 mt-2">
              Zero delinquent accounts
            </span>
          </div>

          <div className="border border-line border-t-4 border-t-red p-4 bg-surface-alt flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted block text-[10px] uppercase font-bold tracking-wider">
                  90+ DAYS (BAD DEBT RISK)
                </span>
                <span className="text-[9px] font-bold text-red">[CRITICAL]</span>
              </div>
              <span className="text-xl font-bold text-ink-muted block mt-1.5 tabular-nums">
                ₹0.00
              </span>
            </div>
            <span className="text-[10px] text-ink-muted border-t border-line-soft pt-2 mt-2">
              Zero defaults on ledger
            </span>
          </div>
        </div>
      </Panel>

      {/* Immutable Audit Trail */}
      <Panel
        title="IMMUTABLE AUDIT TRAIL LOG"
      >
        <DataTable
          columns={auditColumns}
          data={SEED_AUDIT_LOGS}
          emptyText="No audit logs recorded."
        />
      </Panel>
    </div>
  );
};
