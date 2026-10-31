import React, { useState } from 'react';
import {
  PageHeader,
  Panel,
  Button,
  StatusTag,
  Field,
  TextInput,
  NumberInput,
  Select,
  DateInput,
  StatBlock,
  KeyValueList,
  Timeline,
  Toast,
  Dialog,
  DataTable,
  FilterBar,
} from '../../design-system';

export const KitPage: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const demoTableData = [
    { id: 'SUB-000101', customer: 'Acme Corp', plan: 'Enterprise Monthly', amount: '₹12,500.00', status: 'ACTIVE' },
    { id: 'SUB-000102', customer: 'Globex Inc', plan: 'Standard Annual', amount: '₹45,000.00', status: 'CONFIRMED' },
    { id: 'SUB-000103', customer: 'Stark Labs', plan: 'Developer Monthly', amount: '₹2,500.00', status: 'PAUSED' },
    { id: 'SUB-000104', customer: 'Wayne Ent', plan: 'Enterprise Annual', amount: '₹120,000.00', status: 'OVERDUE' },
    { id: 'SUB-000105', customer: 'Cyberdyne', plan: 'Starter Weekly', amount: '₹850.00', status: 'DRAFT' },
  ];

  const tableColumns = [
    { key: 'id', header: 'SUBSCRIPTION #' },
    { key: 'customer', header: 'CUSTOMER' },
    { key: 'plan', header: 'PLAN' },
    { key: 'amount', header: 'AMOUNT', align: 'right' as const },
    {
      key: 'status',
      header: 'STATUS',
      render: (row: Record<string, unknown>) => (
        <StatusTag status={row.status as string} />
      ),
    },
  ];

  const timelineEvents = [
    {
      timestamp: '2026-10-31 09:30:00',
      actor: 'HARSH (STAFF)',
      fromState: 'DRAFT',
      toState: 'QUOTATION',
      note: 'Quotation template lines applied (Validity: 15 days)',
    },
    {
      timestamp: '2026-10-31 10:15:22',
      actor: 'CUSTOMER PORTAL',
      fromState: 'QUOTATION',
      toState: 'CONFIRMED',
      note: 'Customer approved quotation terms online',
    },
    {
      timestamp: '2026-10-31 11:00:00',
      actor: 'SYSTEM SWEEP',
      fromState: 'CONFIRMED',
      toState: 'ACTIVE',
      note: 'Activated on start date; first invoice INV-2026-000001 generated',
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="DESIGN SYSTEM SPECIFICATION KIT"
        subtitle="Visual regression anchor for Utilitarian Military-Industrial design system (§3.2)."
        breadcrumbs={['SYSTEM', 'SPECIFICATION', 'KIT']}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            OPEN TEST DIALOG
          </Button>
        }
      />

      {/* 1. Status Tags */}
      <Panel title="01 // BRACKETED STATUS TAGS (§3.2)">
        <p className="font-mono text-xs text-ink-muted mb-3">
          Uppercase bracketed tags paired with an 8px solid square marker.
        </p>
        <div className="flex flex-wrap gap-4 items-center bg-[#F5F4EE] p-3 border border-line">
          <StatusTag status="DRAFT" />
          <StatusTag status="QUOTATION" />
          <StatusTag status="CONFIRMED" />
          <StatusTag status="ACTIVE" />
          <StatusTag status="PAUSED" />
          <StatusTag status="CLOSED" />
          <StatusTag status="PAID" />
          <StatusTag status="OVERDUE" />
          <StatusTag status="CANCELLED" />
        </div>
      </Panel>

      {/* 2. Stat Blocks */}
      <Panel title="02 // STAT BLOCKS & METRICS">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <StatBlock label="ACTIVE SUBSCRIPTIONS" value="1,248" change="+12% MT" />
          <StatBlock label="MONTHLY REVENUE (MRR)" value="₹14,52,000" change="INVOICED" />
          <StatBlock label="RECEIVABLES (PAID)" value="₹12,80,000" change="88.1% RATE" />
          <StatBlock label="OVERDUE INVOICES" value="23" subtext="TOTAL: ₹1,72,000" />
        </div>
      </Panel>

      {/* 3. Buttons & Actions */}
      <Panel title="03 // BUTTONS & ACTION CONTROLS">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">PRIMARY ACTION</Button>
            <Button variant="secondary">SECONDARY ACTION</Button>
            <Button variant="destructive">DESTRUCTIVE</Button>
            <Button variant="outline">OUTLINE BUTTON</Button>
            <Button variant="primary" disabled>DISABLED</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="sm">SM BUTTON</Button>
            <Button variant="secondary" size="md">MD BUTTON (DEFAULT)</Button>
            <Button variant="primary" size="lg">LG BUTTON</Button>
          </div>
        </div>
      </Panel>

      {/* 4. Form Controls */}
      <Panel title="04 // FORM INPUTS & LABELS">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="PRODUCT CODE" required hint="Alphanumeric unique identifier">
            <TextInput defaultValue="PRD-SOFTWARE-001" />
          </Field>
          <Field label="UNIT PRICE (PAISE)" required>
            <NumberInput defaultValue={56000} />
          </Field>
          <Field label="BILLING PERIOD" required>
            <Select
              options={[
                { label: 'MONTHLY (DEFAULT)', value: 'MONTHLY' },
                { label: 'DAILY', value: 'DAILY' },
                { label: 'WEEKLY', value: 'WEEKLY' },
                { label: 'YEARLY', value: 'YEARLY' },
              ]}
            />
          </Field>
          <Field label="EFFECTIVE FROM">
            <DateInput defaultValue="2026-11-01" />
          </Field>
          <Field label="PASSWORD VALIDATION EXAMPLE" error="needs at least one uppercase letter">
            <TextInput defaultValue="lowercasepass!" error />
          </Field>
          <Field label="STATUS FILTER">
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { label: 'SHOW ALL', value: 'ALL' },
                { label: 'ACTIVE ONLY', value: 'ACTIVE' },
                { label: 'CONFIRMED ONLY', value: 'CONFIRMED' },
              ]}
            />
          </Field>
        </div>
      </Panel>

      {/* 5. Key-Value List & Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="05 // TECHNICAL KEY-VALUE METADATA">
          <KeyValueList
            items={[
              { key: 'BASE CURRENCY', value: 'INR (PAISE)' },
              { key: 'TAX INCLUSION', value: 'TAX EXCLUSIVE' },
              { key: 'ROUNDING RULE', value: 'HALF-UP PER LINE' },
              { key: 'PRORATION SUPPORT', value: 'DISABLED (NEXT CYCLE)' },
              { key: 'DATABASE SCHEMAS', value: '12 DEDICATED (NON-PUBLIC)' },
              { key: 'RLS LOCKDOWN', value: '[ENFORCED - ZERO POLICIES]' },
            ]}
          />
        </Panel>

        <Panel title="06 // STATE TRANSITION TIMELINE">
          <Timeline events={timelineEvents} />
        </Panel>
      </div>

      {/* 6. Notifications & Toasts */}
      <Panel title="07 // STATIC TOAST NOTIFICATIONS (ZERO MOTION)">
        <div className="flex flex-col gap-2.5">
          <Toast message="DAILY BILLING RUN COMPLETED · 142 INVOICES GENERATED CLEANLY" type="success" />
          <Toast message="MAINTENANCE SWEEP PENDING · SCHEDULED AT 02:00 LOCAL TIME" type="info" />
          <Toast message="INVOICE INV-2026-000104 IS 15 DAYS OVERDUE · SEND REMINDER" type="warning" />
          <Toast message="ERR 409 · CANNOT ADVANCE CLOSED SUBSCRIPTION SUB-000089" type="error" />
        </div>
      </Panel>

      {/* 7. Data Table */}
      <Panel title="08 // DATA TABLE & FILTER BAR">
        <FilterBar
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="SEARCH SUBSCRIPTION ID OR CUSTOMER…"
          onReset={() => setSearch('')}
        />
        <div className="mt-3">
          <DataTable
            columns={tableColumns}
            data={demoTableData}
            onExportCsv={() => alert('CSV Export Triggered')}
          />
        </div>
      </Panel>

      {/* Dialog Modal */}
      <Dialog
        open={dialogOpen}
        title="TECHNICAL PARAMETER OVERRIDE"
        onClose={() => setDialogOpen(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              CANCEL
            </Button>
            <Button variant="primary" onClick={() => setDialogOpen(false)}>
              CONFIRM OVERRIDE
            </Button>
          </>
        }
      >
        <p className="font-mono text-xs text-ink leading-relaxed mb-3">
          This operation will record an immutable entry into the append-only audit log.
          All state machine transitions are strictly verified against the underlying plan flags.
        </p>
        <KeyValueList
          items={[
            { key: 'ACTOR', value: 'ADMINISTRATOR' },
            { key: 'TIMESTAMP', value: '2026-10-31T11:53:00Z' },
            { key: 'SECURITY CONTEXT', value: 'INTERNAL SERVICE ROLE' },
          ]}
        />
      </Dialog>
    </div>
  );
};
