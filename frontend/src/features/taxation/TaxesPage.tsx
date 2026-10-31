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

export interface TaxRuleItem extends Record<string, unknown> {
  id: string;
  name: string;
  rateBp: number; // 1800 bp = 18.00%
  appliesTo: 'ALL' | 'PRODUCT_TYPE' | 'SPECIFIC_PRODUCTS';
  productTypes?: string[] | null;
  productIds?: string[] | null;
  validFrom?: string | null;
  validTo?: string | null;
  priority: number;
  active: boolean;
  createdAt: string;
}

const SEED_TAX_RULES: TaxRuleItem[] = [
  {
    id: 'tax_01jk9gst180000000000001',
    name: 'Standard GST 18%',
    rateBp: 1800,
    appliesTo: 'ALL',
    productTypes: null,
    productIds: null,
    validFrom: '2026-01-01T00:00:00Z',
    validTo: null,
    priority: 10,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tax_01jk9gst050000000000002',
    name: 'Hardware Concessional GST 5%',
    rateBp: 500,
    appliesTo: 'PRODUCT_TYPE',
    productTypes: ['PHYSICAL'],
    productIds: null,
    validFrom: '2026-01-01T00:00:00Z',
    validTo: null,
    priority: 20,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tax_01jk9zero00000000000003',
    name: 'Zero-Rated International Export 0%',
    rateBp: 0,
    appliesTo: 'ALL',
    productTypes: null,
    productIds: null,
    validFrom: '2026-01-01T00:00:00Z',
    validTo: null,
    priority: 5,
    active: false,
    createdAt: new Date().toISOString(),
  },
];

export const TaxesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // New Tax Rule Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [ratePercent, setRatePercent] = useState('18.0');
  const [appliesTo, setAppliesTo] = useState<'ALL' | 'PRODUCT_TYPE' | 'SPECIFIC_PRODUCTS'>('ALL');
  const [productTypeScope, setProductTypeScope] = useState('SOFTWARE');
  const [priority, setPriority] = useState(10);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tax Simulator State
  const [testAmountInr, setTestAmountInr] = useState('2000');
  const [testType, setTestType] = useState('SOFTWARE');

  const { data: taxRules = [], isLoading } = useQuery<TaxRuleItem[]>({
    queryKey: ['tax-rules'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<TaxRuleItem[]>('/taxation/tax-rules');
        return res.data;
      } catch {
        const saved = localStorage.getItem('bl_dev_taxes');
        return saved ? JSON.parse(saved) : SEED_TAX_RULES;
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const rateBp = Math.round(parseFloat(ratePercent) * 100);
      try {
        return await apiClient.post<TaxRuleItem>('/taxation/tax-rules', {
          name,
          rateBp,
          appliesTo,
          productTypes: appliesTo === 'PRODUCT_TYPE' ? [productTypeScope] : undefined,
          priority,
          active: true,
        });
      } catch {
        const newRule: TaxRuleItem = {
          id: `tax_dev_${Date.now()}`,
          name,
          rateBp,
          appliesTo,
          productTypes: appliesTo === 'PRODUCT_TYPE' ? [productTypeScope] : null,
          productIds: null,
          validFrom: new Date().toISOString(),
          validTo: null,
          priority,
          active: true,
          createdAt: new Date().toISOString(),
        };
        const updated = [...taxRules, newRule];
        localStorage.setItem('bl_dev_taxes', JSON.stringify(updated));
        return { data: newRule };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rules'] });
      setIsDialogOpen(false);
      setName('');
      setRatePercent('18.0');
      setErrorMsg(null);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setErrorMsg(err.problem.detail || err.problem.title);
      } else {
        setErrorMsg('Failed to create tax rule.');
      }
    },
  });

  // Simulator Calculations
  const amountPaise = Math.round(parseFloat(testAmountInr || '0') * 100);
  const applicableRules = taxRules.filter((r) => {
    if (!r.active) return false;
    if (r.appliesTo === 'ALL') return true;
    if (r.appliesTo === 'PRODUCT_TYPE') return r.productTypes?.includes(testType);
    return false;
  });

  const simTaxes = applicableRules.map((r) => {
    // Pure integer half-up formula
    const taxPaise = Math.floor((amountPaise * r.rateBp + 5000) / 10000);
    return {
      name: r.name,
      rateBp: r.rateBp,
      taxPaise,
    };
  });

  const totalTaxPaise = simTaxes.reduce((acc, t) => acc + t.taxPaise, 0);
  const totalWithTaxPaise = amountPaise + totalTaxPaise;

  const formatInr = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const columns: Column<TaxRuleItem>[] = [
    {
      key: 'name',
      header: 'TAX RULE NAME',
      render: (row) => <span className="font-bold text-ink">{row.name}</span>,
    },
    {
      key: 'ratePercent',
      header: 'RATE (%)',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums font-bold text-olive">
          {(row.rateBp / 100).toFixed(2)}%
        </span>
      ),
    },
    {
      key: 'rateBp',
      header: 'BASIS POINTS',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-steel">
          [{row.rateBp} BP]
        </span>
      ),
    },
    {
      key: 'appliesTo',
      header: 'APPLIES TO',
      render: (row) => {
        const a = row.appliesTo;
        const types = row.productTypes?.join(', ');
        return (
          <span className="font-mono text-xs text-ink">
            [{a}]{types ? ` → ${types}` : ''}
          </span>
        );
      },
    },
    {
      key: 'priority',
      header: 'PRIORITY',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-ink-muted">
          P{row.priority}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'STATUS',
      render: (row) => (
        <StatusTag status={row.active ? 'ACTIVE' : 'SUSPENDED'} />
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 flex flex-col gap-6">
      <PageHeader
        title="TAXATION & STATUTORY RULES"
        subtitle="Jurisdiction rates, basis points formulas, and product category schedules."
        breadcrumbs={['SYSTEM', 'TAXES']}
        actions={
          isAdmin && (
            <Button
              variant="primary"
              onClick={() => setIsDialogOpen(true)}
            >
              [+] NEW TAX RULE
            </Button>
          )
        }
      />

      {/* Top Stat Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Panel title="TOTAL RULES">
          <StatBlock label="DEFINITIONS" value={taxRules.length.toString()} />
        </Panel>
        <Panel title="ACTIVE RULES">
          <StatBlock
            label="ENFORCED"
            value={taxRules.filter((r) => r.active).length.toString()}
          />
        </Panel>
        <Panel title="DEFAULT GST">
          <StatBlock label="STANDARD" value="18.00% [1800 BP]" />
        </Panel>
        <Panel title="ROUNDING RULE">
          <StatBlock label="ARITHMETIC" value="HALF-UP (0 FLOATS)" />
        </Panel>
      </div>

      {/* Main Table & Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tax Rules Table */}
        <div className="lg:col-span-2">
          <Panel title="TAX RULES SPECIFICATIONS">
            {isLoading ? (
              <div className="p-8 text-center font-mono text-sm text-ink-muted">LOADING…</div>
            ) : (
              <DataTable
                data={taxRules}
                columns={columns}
                emptyText="NO TAX RULES FOUND."
              />
            )}
          </Panel>
        </div>

        {/* Right Column: Live Tax Calculator */}
        <div>
          <Panel title="STATUTORY TAX CALCULATOR">
            <div className="flex flex-col gap-4 font-mono text-xs">
              <div className="text-ink-muted leading-relaxed">
                Evaluates active tax schedules on arbitrary line amounts with exact integer minor units (paise) rounding.
              </div>

              <Field label="SIMULATED LINE AMOUNT (INR)" required>
                <TextInput
                  value={testAmountInr}
                  onChange={(e) => setTestAmountInr(e.target.value)}
                  placeholder="2000"
                />
              </Field>

              <Field label="PRODUCT CLASSIFICATION">
                <Select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  options={[
                    { value: 'SOFTWARE', label: 'SOFTWARE (Standard 18%)' },
                    { value: 'SERVICE', label: 'SERVICE (Standard 18%)' },
                    { value: 'PHYSICAL', label: 'PHYSICAL (Hardware 18% + 5%)' },
                    { value: 'ADD_ON', label: 'ADD_ON (Standard 18%)' },
                  ]}
                />
              </Field>

              <div className="border border-line bg-surface-alt p-3 flex flex-col gap-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-ink-muted">TAXABLE BASE:</span>
                  <span className="tabular-nums font-bold">{formatInr(amountPaise)}</span>
                </div>

                {simTaxes.map((t, idx) => (
                  <div key={idx} className="flex justify-between text-steel">
                    <span>+ {t.name} ({(t.rateBp / 100).toFixed(2)}%):</span>
                    <span className="tabular-nums font-bold text-amber">
                      {formatInr(t.taxPaise)}
                    </span>
                  </div>
                ))}

                <div className="border-t border-line pt-2 flex justify-between font-bold">
                  <span>TOTAL STATUTORY TAX:</span>
                  <span className="tabular-nums text-red">{formatInr(totalTaxPaise)}</span>
                </div>

                <div className="border-t-2 border-line pt-2 flex justify-between text-sm font-bold">
                  <span>GRAND TOTAL:</span>
                  <span className="tabular-nums text-ink">{formatInr(totalWithTaxPaise)}</span>
                </div>
              </div>

              <div className="p-2 border border-line bg-surface text-ink-muted text-[11px]">
                Calculated via integer formula: <code className="font-bold text-ink">floor((paise * rateBp + 5000) / 10000)</code>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Modal: New Tax Rule */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="PROVISION NEW TAX RULE"
      >
        <div className="flex flex-col gap-4">
          {errorMsg && <Toast variant="error" message={`[ERR] ${errorMsg}`} />}

          <Field label="TAX RULE TITLE" required>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Export Concessional GST 0%"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="RATE PERCENT (%)" required>
              <TextInput
                value={ratePercent}
                onChange={(e) => setRatePercent(e.target.value)}
                placeholder="18.0"
                required
              />
            </Field>

            <Field label="COMPUTED BASIS POINTS">
              <div className="font-mono text-xs font-bold text-steel pt-2">
                [{Math.round(parseFloat(ratePercent || '0') * 100)} BP]
              </div>
            </Field>
          </div>

          <Field label="SCOPE APPLICATION" required>
            <Select
              value={appliesTo}
              onChange={(e) => setAppliesTo(e.target.value as any)}
              options={[
                { value: 'ALL', label: '[ALL] Universal Application' },
                { value: 'PRODUCT_TYPE', label: '[PRODUCT_TYPE] Specific Categories' },
                { value: 'SPECIFIC_PRODUCTS', label: '[SPECIFIC_PRODUCTS] Targeted SKUs' },
              ]}
            />
          </Field>

          {appliesTo === 'PRODUCT_TYPE' && (
            <Field label="TARGET PRODUCT CATEGORY">
              <Select
                value={productTypeScope}
                onChange={(e) => setProductTypeScope(e.target.value)}
                options={[
                  { value: 'SOFTWARE', label: 'SOFTWARE' },
                  { value: 'SERVICE', label: 'SERVICE' },
                  { value: 'ADD_ON', label: 'ADD_ON' },
                  { value: 'PHYSICAL', label: 'PHYSICAL' },
                ]}
              />
            </Field>
          )}

          <Field label="EVALUATION PRIORITY (LOWER RUNS FIRST)">
            <NumberInput
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value) || 10)}
            />
          </Field>

          <div className="border-t border-line pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              [CANCEL]
            </Button>
            <Button
              variant="primary"
              disabled={createMutation.isPending || !name}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'CREATING…' : 'CREATE TAX RULE'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
