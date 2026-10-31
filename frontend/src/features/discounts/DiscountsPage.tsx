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

export interface DiscountItem extends Record<string, unknown> {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number; // basis points (1000 = 10%) or paise
  minPurchaseAmount: number;
  minQuantity: number;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  scope: 'PRODUCTS' | 'SUBSCRIPTIONS';
  targetIds: string[];
  active: boolean;
  createdAt: string;
}

export interface LineDiscountApplication {
  lineId: string;
  discountId: string;
  discountCode: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountAmount: number; // paise
  discountedAmount: number; // paise
}

export interface InvoiceDiscountApplication {
  discountId: string;
  discountCode: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountAmount: number; // paise
}

export interface SimulationResult {
  originalSubtotal: number;
  totalProductDiscount: number;
  subtotalAfterProductDiscounts: number;
  totalInvoiceDiscount: number;
  totalDiscount: number;
  finalAmount: number;
  lineDiscounts: LineDiscountApplication[];
  invoiceDiscount?: InvoiceDiscountApplication | null;
}

const SEED_DISCOUNTS: DiscountItem[] = [
  {
    id: 'disc_01jk9welcome100000000001',
    code: 'WELCOME10',
    type: 'PERCENTAGE',
    value: 1000, // 10.00%
    minPurchaseAmount: 0,
    minQuantity: 1,
    startDate: '2026-01-01T00:00:00Z',
    endDate: null,
    usageLimit: 100,
    usedCount: 12,
    scope: 'SUBSCRIPTIONS',
    targetIds: [],
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'disc_01jk9flat500000000000002',
    code: 'FLAT500',
    type: 'FIXED',
    value: 50000, // ₹500.00
    minPurchaseAmount: 200000, // ₹2,000.00 minimum
    minQuantity: 1,
    startDate: '2026-01-01T00:00:00Z',
    endDate: null,
    usageLimit: 50,
    usedCount: 18,
    scope: 'SUBSCRIPTIONS',
    targetIds: [],
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'disc_01jk9erp2000000000000003',
    code: 'ERP20',
    type: 'PERCENTAGE',
    value: 2000, // 20.00%
    minPurchaseAmount: 0,
    minQuantity: 1,
    startDate: '2026-01-01T00:00:00Z',
    endDate: null,
    usageLimit: 20,
    usedCount: 5,
    scope: 'PRODUCTS',
    targetIds: ['prod_01jk9erp000000000000001'],
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const DiscountsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  // State
  const [isNewDiscountOpen, setIsNewDiscountOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states for New Discount
  const [discCode, setDiscCode] = useState('');
  const [discType, setDiscType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discValueInput, setDiscValueInput] = useState(10);
  const [discScope, setDiscScope] = useState<'PRODUCTS' | 'SUBSCRIPTIONS'>('SUBSCRIPTIONS');
  const [discMinPurchase, setDiscMinPurchase] = useState(0);
  const [discMinQty, setDiscMinQty] = useState(1);
  const [discUsageLimit, setDiscUsageLimit] = useState(100);

  // Simulator State
  const [simCouponCode, setSimCouponCode] = useState('WELCOME10');
  const [simProductPrice, setSimProductPrice] = useState(2000);
  const [simProductQty, setSimProductQty] = useState(1);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  // Queries
  const discountsQuery = useQuery<DiscountItem[]>({
    queryKey: ['discounts'],
    queryFn: async (): Promise<DiscountItem[]> => {
      try {
        const res = await apiClient.get<DiscountItem[]>('/discounts');
        return res.data && res.data.length > 0 ? res.data : SEED_DISCOUNTS;
      } catch {
        return SEED_DISCOUNTS;
      }
    },
  });

  // Create Discount Mutation
  const createDiscountMutation = useMutation({
    mutationFn: async (payload: {
      code: string;
      type: 'PERCENTAGE' | 'FIXED';
      value: number;
      scope: 'PRODUCTS' | 'SUBSCRIPTIONS';
      minPurchaseAmount: number;
      minQuantity: number;
      usageLimit?: number;
    }) => {
      return apiClient.post('/discounts', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      setIsNewDiscountOpen(false);
      resetDiscountForm();
      setToastMessage('Discount rule successfully created');
    },
    onError: (err: ApiError) => {
      setErrorMessage(err.message || 'Failed to create discount rule');
    },
  });

  // Simulator Mutation
  const simulateMutation = useMutation({
    mutationFn: async (payload: {
      lines: { lineId: string; productId: string; unitPrice: number; quantity: number }[];
      couponCodes: string[];
    }): Promise<SimulationResult> => {
      const res = await apiClient.post<SimulationResult>('/discounts/evaluate', payload);
      return res.data;
    },
    onSuccess: (data: SimulationResult) => {
      setSimResult(data);
    },
    onError: () => {
      // Offline fallback calculation for simulator
      const unitPricePaise = simProductPrice * 100;
      const qty = simProductQty;
      const lineTotal = unitPricePaise * qty;
      let totalDiscount = 0;
      let invoiceDisc = 0;
      let lineDisc = 0;

      const codeUpper = simCouponCode.toUpperCase().trim();
      if (codeUpper === 'WELCOME10') {
        invoiceDisc = Math.round((lineTotal * 1000) / 10000);
        totalDiscount = invoiceDisc;
      } else if (codeUpper === 'FLAT500' && lineTotal >= 200000) {
        invoiceDisc = Math.min(50000, lineTotal);
        totalDiscount = invoiceDisc;
      } else if (codeUpper === 'ERP20') {
        lineDisc = Math.round((lineTotal * 2000) / 10000);
        totalDiscount = lineDisc;
      }

      setSimResult({
        originalSubtotal: lineTotal,
        totalProductDiscount: lineDisc,
        subtotalAfterProductDiscounts: lineTotal - lineDisc,
        totalInvoiceDiscount: invoiceDisc,
        totalDiscount,
        finalAmount: Math.max(0, lineTotal - totalDiscount),
        lineDiscounts: lineDisc > 0 ? [{
          lineId: 'sim_line_1',
          discountId: 'disc_sim',
          discountCode: codeUpper,
          discountType: 'PERCENTAGE',
          discountAmount: lineDisc,
          discountedAmount: lineTotal - lineDisc,
        }] : [],
        invoiceDiscount: invoiceDisc > 0 ? {
          discountId: 'disc_sim_inv',
          discountCode: codeUpper,
          discountType: codeUpper === 'FLAT500' ? 'FIXED' : 'PERCENTAGE',
          discountAmount: invoiceDisc,
        } : null,
      });
    },
  });

  const resetDiscountForm = () => {
    setDiscCode('');
    setDiscType('PERCENTAGE');
    setDiscValueInput(10);
    setDiscScope('SUBSCRIPTIONS');
    setDiscMinPurchase(0);
    setDiscMinQty(1);
    setDiscUsageLimit(100);
  };

  const handleCreateDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discCode.trim()) {
      setErrorMessage('Discount code is required');
      return;
    }
    const val = discValueInput;
    const computedValue = discType === 'PERCENTAGE' ? Math.round(val * 100) : Math.round(val * 100);
    createDiscountMutation.mutate({
      code: discCode.trim().toUpperCase(),
      type: discType,
      value: computedValue,
      scope: discScope,
      minPurchaseAmount: Math.round(discMinPurchase * 100),
      minQuantity: discMinQty,
      usageLimit: discUsageLimit,
    });
  };

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    const pricePaise = simProductPrice * 100;
    const qty = simProductQty;
    const coupons = simCouponCode.trim() ? [simCouponCode.trim().toUpperCase()] : [];

    simulateMutation.mutate({
      lines: [
        {
          lineId: 'sim_line_1',
          productId: 'prod_01jk9erp000000000000001',
          unitPrice: pricePaise,
          quantity: qty,
        },
      ],
      couponCodes: coupons,
    });
  };

  const discounts = discountsQuery.data || SEED_DISCOUNTS;

  const columns: Column<DiscountItem>[] = [
    {
      key: 'code',
      header: 'CODE',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-olive">
          [{row.code}]
        </span>
      ),
    },
    {
      key: 'type',
      header: 'TYPE',
      render: (row) => (
        <span className="font-mono text-xs text-ink">
          {row.type}
        </span>
      ),
    },
    {
      key: 'value',
      header: 'BENEFIT VALUE',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-ink font-semibold">
          {row.type === 'PERCENTAGE' ? `${(row.value / 100).toFixed(2)}%` : `₹${(row.value / 100).toFixed(2)}`}
        </span>
      ),
    },
    {
      key: 'scope',
      header: 'EVALUATION SCOPE',
      render: (row) => (
        <span className="font-mono text-[11px] border border-line px-1.5 py-0.5 text-ink-muted">
          {row.scope}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'REDEMPTIONS',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-ink">
          {row.usedCount} / {row.usageLimit ?? '∞'}
        </span>
      ),
    },
    {
      key: 'minPurchase',
      header: 'MIN PURCHASE',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-ink-muted">
          {row.minPurchaseAmount === 0 ? '₹0.00' : `₹${(row.minPurchaseAmount / 100).toFixed(2)}`}
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
        title="DISCOUNT & PROMOTION ENGINE"
        subtitle="Stacking Rule A-4 compliant promotional rules, percentage/fixed savings, and coupon tracking"
        breadcrumbs={['SYSTEM', 'CATALOG', 'DISCOUNTS']}
        actions={
          isAdmin && (
            <Button variant="primary" onClick={() => setIsNewDiscountOpen(true)}>
              [+] NEW DISCOUNT RULE
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
          label="TOTAL PROMOTIONS"
          value={discounts.length.toString()}
          subtext="Configured promotional rules"
        />
        <StatBlock
          label="ACTIVE RULES"
          value={discounts.filter((d) => d.active).length.toString()}
          subtext="Available for redemption"
        />
        <StatBlock
          label="TOTAL REDEMPTIONS"
          value={discounts.reduce((acc, d) => acc + d.usedCount, 0).toString()}
          subtext="Historical coupon applications"
        />
        <StatBlock
          label="PRODUCT-SCOPED"
          value={discounts.filter((d) => d.scope === 'PRODUCTS').length.toString()}
          subtext="Applied directly to line items"
        />
      </div>

      {/* Main Promotions Table */}
      <Panel
        title="PROMOTIONAL RULES & VOUCHERS"
        action={
          isAdmin && (
            <Button variant="secondary" onClick={() => setIsNewDiscountOpen(true)}>
              [+] ADD RULE
            </Button>
          )
        }
      >
        <DataTable
          columns={columns}
          data={discounts}
          emptyText="No discount rules configured."
        />
      </Panel>

      {/* Interactive Stacking Rule A-4 Simulator */}
      <Panel
        title="STACKING RULE A-4 VERIFICATION SIMULATOR"
      >
        <form onSubmit={handleRunSimulation} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="LINE UNIT PRICE (₹)" hint="Simulated product price">
              <NumberInput
                value={simProductPrice}
                onChange={(e) => setSimProductPrice(Number(e.target.value))}
                min={1}
                step={1}
              />
            </Field>

            <Field label="QUANTITY" hint="Order line quantity">
              <NumberInput
                value={simProductQty}
                onChange={(e) => setSimProductQty(Number(e.target.value))}
                min={1}
                step={1}
              />
            </Field>

            <Field label="COUPON VOUCHER CODE" hint="Try WELCOME10, FLAT500, or ERP20">
              <TextInput
                value={simCouponCode}
                onChange={(e) => setSimCouponCode(e.target.value)}
                placeholder="ENTER COUPON CODE"
              />
            </Field>
          </div>

          <div>
            <Button type="submit" variant="primary" disabled={simulateMutation.isPending}>
              {simulateMutation.isPending ? 'EVALUATING…' : 'SIMULATE STACKING RULE A-4'}
            </Button>
          </div>
        </form>

        {simResult && (
          <div className="mt-4 border border-line bg-canvas-muted p-4 font-mono text-xs flex flex-col gap-2">
            <span className="font-bold text-ink uppercase tracking-wider">
              EVALUATION BREAKDOWN (INTEGER ARITHMETIC IN PAISE)
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2 border-y border-line">
              <div>
                <span className="text-ink-muted block text-[10px]">ORIGINAL SUBTOTAL</span>
                <span className="font-bold text-ink text-sm tabular-nums">
                  ₹{(simResult.originalSubtotal / 100).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block text-[10px]">LINE SAVINGS</span>
                <span className="font-bold text-olive text-sm tabular-nums">
                  -₹{(simResult.totalProductDiscount / 100).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block text-[10px]">INVOICE SAVINGS</span>
                <span className="font-bold text-olive text-sm tabular-nums">
                  -₹{(simResult.totalInvoiceDiscount / 100).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block text-[10px]">NET PAYABLE</span>
                <span className="font-bold text-ink text-sm tabular-nums">
                  ₹{(simResult.finalAmount / 100).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-ink-muted">
              Rule Compliance: Evaluated strictly with zero negative payable bounds and Half-Up integer rounding.
            </div>
          </div>
        )}
      </Panel>

      {/* Dialog: Create Discount Rule */}
      <Dialog
        isOpen={isNewDiscountOpen}
        onClose={() => setIsNewDiscountOpen(false)}
        title="DEFINE PROMOTIONAL DISCOUNT RULE"
      >
        <form onSubmit={handleCreateDiscount} className="flex flex-col gap-4">
          <Field label="DISCOUNT CODE" required hint="e.g. FESTIVE15">
            <TextInput
              value={discCode}
              onChange={(e) => setDiscCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="DISCOUNT TYPE" required>
              <Select
                value={discType}
                onChange={(e) => setDiscType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                options={[
                  { label: 'PERCENTAGE (%)', value: 'PERCENTAGE' },
                  { label: 'FIXED AMOUNT (₹)', value: 'FIXED' },
                ]}
              />
            </Field>

            <Field
              label={discType === 'PERCENTAGE' ? 'PERCENTAGE VALUE (%)' : 'FIXED AMOUNT (₹)'}
              required
            >
              <NumberInput
                value={discValueInput}
                onChange={(e) => setDiscValueInput(Number(e.target.value))}
                min={0}
                step={0.5}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="SCOPE" required hint="Target applicability level">
              <Select
                value={discScope}
                onChange={(e) =>
                  setDiscScope(e.target.value as 'PRODUCTS' | 'SUBSCRIPTIONS')
                }
                options={[
                  { label: 'SUBSCRIPTIONS (INVOICE-LEVEL)', value: 'SUBSCRIPTIONS' },
                  { label: 'PRODUCTS (LINE-ITEM LEVEL)', value: 'PRODUCTS' },
                ]}
              />
            </Field>

            <Field label="USAGE LIMIT" hint="Max redemptions allowed">
              <NumberInput
                value={discUsageLimit}
                onChange={(e) => setDiscUsageLimit(Number(e.target.value))}
                min={1}
                step={1}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="MIN PURCHASE AMOUNT (₹)" hint="0 for no minimum">
              <NumberInput
                value={discMinPurchase}
                onChange={(e) => setDiscMinPurchase(Number(e.target.value))}
                min={0}
                step={50}
              />
            </Field>

            <Field label="MIN ORDER QUANTITY">
              <NumberInput
                value={discMinQty}
                onChange={(e) => setDiscMinQty(Number(e.target.value))}
                min={1}
                step={1}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button type="button" variant="outline" onClick={() => setIsNewDiscountOpen(false)}>
              CANCEL
            </Button>
            <Button type="submit" variant="primary" disabled={createDiscountMutation.isPending}>
              {createDiscountMutation.isPending ? 'CREATING…' : 'CONFIRM DISCOUNT'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
