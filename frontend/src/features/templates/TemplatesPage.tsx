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

export interface TemplateItem extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  defaultPlan: string;
  defaultPaymentTerm: string;
  defaultDiscount?: string;
  linesCount: number;
  active: boolean;
  createdAt: string;
}

const SEED_TEMPLATES: TemplateItem[] = [
  {
    id: 'tmpl_01jk9startup0000000001',
    name: 'SaaS Startup Standard Bundle',
    description: 'Cloud ERP Software Suite + 24/7 SLA Support with Net 15 credit terms',
    defaultPlan: 'Startup Modular ERP Monthly',
    defaultPaymentTerm: 'Net 15 Days',
    defaultDiscount: 'WELCOME10',
    linesCount: 2,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'tmpl_01jk9enterprise00000002',
    name: 'Enterprise Scale Managed Infrastructure',
    description: 'Yearly high-capacity infrastructure + dedicated IP and priority engineers',
    defaultPlan: 'Enterprise Scale Infrastructure Yearly',
    defaultPaymentTerm: 'Net 30 Days',
    defaultDiscount: 'FLAT500',
    linesCount: 3,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'tmpl_01jk9burst000000000003',
    name: 'Sprint Developer Utility',
    description: 'Weekly compute sprint access for technical development teams',
    defaultPlan: 'Weekly Sprint Dedicated Support',
    defaultPaymentTerm: 'Immediate (Due on receipt)',
    linesCount: 1,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const TemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [templates, setTemplates] = useState<TemplateItem[]>(SEED_TEMPLATES);
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [tmplName, setTmplName] = useState('');
  const [tmplDesc, setTmplDesc] = useState('');
  const [tmplPlan, setTmplPlan] = useState('Startup Modular ERP Monthly');
  const [tmplTerm, setTmplTerm] = useState('Net 15 Days');
  const [tmplDiscount, setTmplDiscount] = useState('WELCOME10');

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmplName.trim()) return;

    const newTmpl: TemplateItem = {
      id: `tmpl_${Date.now()}`,
      name: tmplName.trim(),
      description: tmplDesc.trim() || 'Preconfigured quotation bundle',
      defaultPlan: tmplPlan,
      defaultPaymentTerm: tmplTerm,
      defaultDiscount: tmplDiscount || undefined,
      linesCount: 2,
      active: true,
      createdAt: new Date().toISOString(),
    };

    setTemplates([newTmpl, ...templates]);
    setIsNewTemplateOpen(false);
    setTmplName('');
    setTmplDesc('');
    setToastMessage(`Quotation Template "${newTmpl.name}" created`);
  };

  const columns: Column<TemplateItem>[] = [
    {
      key: 'name',
      header: 'TEMPLATE NAME & DESCRIPTION',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-xs text-ink">{row.name}</span>
          <span className="text-[11px] text-ink-muted">{row.description}</span>
        </div>
      ),
    },
    {
      key: 'defaultPlan',
      header: 'DEFAULT RECURRING PLAN',
      render: (row) => (
        <span className="font-mono text-xs text-olive font-semibold">
          [{row.defaultPlan}]
        </span>
      ),
    },
    {
      key: 'defaultPaymentTerm',
      header: 'PAYMENT TERM',
      render: (row) => (
        <span className="font-mono text-xs text-ink">
          {row.defaultPaymentTerm}
        </span>
      ),
    },
    {
      key: 'defaultDiscount',
      header: 'PRE-ATTACHED VOUCHER',
      render: (row) => (
        <span className="font-mono text-xs text-ink-muted">
          {row.defaultDiscount ? `[${row.defaultDiscount}]` : '—'}
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
        title="QUOTATION TEMPLATES"
        subtitle="Reusable order blueprints with pre-selected plans, products, lines, terms, and discount rules"
        breadcrumbs={['SYSTEM', 'SALES', 'TEMPLATES']}
        actions={
          isAdmin && (
            <Button variant="primary" onClick={() => setIsNewTemplateOpen(true)}>
              [+] NEW QUOTATION TEMPLATE
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatBlock
          label="ACTIVE TEMPLATES"
          value={templates.filter((t) => t.active).length.toString()}
          subtext="Ready for instant quote generation"
        />
        <StatBlock
          label="LINKED RECURRING PLANS"
          value="4"
          subtext="Covering Monthly, Yearly, Weekly"
        />
        <StatBlock
          label="AUTOMATED CONVERSION"
          value="100%"
          subtext="Standardized contract creation"
        />
      </div>

      <Panel
        title="TEMPLATES REPOSITORY"
      >
        <DataTable
          columns={columns}
          data={templates}
          emptyText="No quotation templates configured."
        />
      </Panel>

      {/* Dialog: Create Template */}
      <Dialog
        isOpen={isNewTemplateOpen}
        onClose={() => setIsNewTemplateOpen(false)}
        title="CREATE QUOTATION TEMPLATE"
      >
        <form onSubmit={handleCreateTemplate} className="flex flex-col gap-4">
          <Field label="TEMPLATE NAME" required hint="e.g. Fintech High-Volume Tier">
            <TextInput
              value={tmplName}
              onChange={(e) => setTmplName(e.target.value)}
              placeholder="Enter template name"
              required
            />
          </Field>

          <Field label="DESCRIPTION" hint="Commercial scope and included provisions">
            <TextInput
              value={tmplDesc}
              onChange={(e) => setTmplDesc(e.target.value)}
              placeholder="e.g. Includes cloud ERP license with Net 30 terms"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="DEFAULT PLAN" required>
              <Select
                value={tmplPlan}
                onChange={(e) => setTmplPlan(e.target.value)}
                options={[
                  { label: 'Startup Modular ERP Monthly', value: 'Startup Modular ERP Monthly' },
                  { label: 'Enterprise Scale Infrastructure Yearly', value: 'Enterprise Scale Infrastructure Yearly' },
                  { label: 'Weekly Sprint Dedicated Support', value: 'Weekly Sprint Dedicated Support' },
                  { label: 'Daily Burst Compute Utility', value: 'Daily Burst Compute Utility' },
                ]}
              />
            </Field>

            <Field label="PAYMENT CREDIT TERM" required>
              <Select
                value={tmplTerm}
                onChange={(e) => setTmplTerm(e.target.value)}
                options={[
                  { label: 'Immediate (Due on receipt)', value: 'Immediate (Due on receipt)' },
                  { label: 'Net 15 Days', value: 'Net 15 Days' },
                  { label: 'Net 30 Days', value: 'Net 30 Days' },
                ]}
              />
            </Field>
          </div>

          <Field label="DEFAULT DISCOUNT VOUCHER">
            <Select
              value={tmplDiscount}
              onChange={(e) => setTmplDiscount(e.target.value)}
              options={[
                { label: 'NONE', value: '' },
                { label: 'WELCOME10 (10% OFF)', value: 'WELCOME10' },
                { label: 'FLAT500 (₹500 OFF)', value: 'FLAT500' },
                { label: 'ERP20 (20% OFF ERP)', value: 'ERP20' },
              ]}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button type="button" variant="outline" onClick={() => setIsNewTemplateOpen(false)}>
              CANCEL
            </Button>
            <Button type="submit" variant="primary">
              SAVE TEMPLATE
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
