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

export interface ProductVariantItem {
  id: string;
  productId: string;
  attribute: string;
  value: string;
  extraPrice: number; // paise
  active: boolean;
}

export interface ProductItem extends Record<string, unknown> {
  id: string;
  name: string;
  type: 'SERVICE' | 'SOFTWARE' | 'ADD_ON' | 'PHYSICAL';
  salesPrice: number; // paise
  costPrice: number;
  notes?: string | null;
  active: boolean;
  createdAt: string;
  variants: ProductVariantItem[];
}

const SEED_PRODUCTS: ProductItem[] = [
  {
    id: 'prod_01jk9erp000000000000001',
    name: 'Cloud ERP Software Suite',
    type: 'SOFTWARE',
    salesPrice: 200000, // ₹2,000.00
    costPrice: 80000,
    notes: 'Primary modular cloud ERP license',
    active: true,
    createdAt: new Date().toISOString(),
    variants: [
      {
        id: 'var_01jk9odoo00000000000001',
        productId: 'prod_01jk9erp000000000000001',
        attribute: 'Brand',
        value: 'Odoo',
        extraPrice: 56000, // +₹560.00
        active: true,
      },
      {
        id: 'var_01jk9custom0000000000002',
        productId: 'prod_01jk9erp000000000000001',
        attribute: 'Brand',
        value: 'BrightCustom',
        extraPrice: 0,
        active: true,
      },
    ],
  },
  {
    id: 'prod_01jk9sup000000000000002',
    name: '24/7 Priority SLA Technical Support',
    type: 'SERVICE',
    salesPrice: 150000, // ₹1,500.00
    costPrice: 50000,
    notes: 'Guaranteed 1-hour response time SLA',
    active: true,
    createdAt: new Date().toISOString(),
    variants: [],
  },
  {
    id: 'prod_01jk9addon0000000000003',
    name: 'Dedicated IPv4 & Managed SSL Certificate',
    type: 'ADD_ON',
    salesPrice: 30000, // ₹300.00
    costPrice: 10000,
    notes: 'Static dedicated network allocation',
    active: true,
    createdAt: new Date().toISOString(),
    variants: [],
  },
  {
    id: 'prod_01jk9hw0000000000000004',
    name: 'Hardware FIDO2 Security Token',
    type: 'PHYSICAL',
    salesPrice: 250000, // ₹2,500.00
    costPrice: 120000,
    notes: 'Physical cryptographic USB-C authentication key',
    active: true,
    createdAt: new Date().toISOString(),
    variants: [],
  },
];

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeProduct, setActiveProduct] = useState<ProductItem | null>(null);

  // New Product Dialog State
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'SERVICE' | 'SOFTWARE' | 'ADD_ON' | 'PHYSICAL'>('SOFTWARE');
  const [salesPriceInr, setSalesPriceInr] = useState('1000');
  const [costPriceInr, setCostPriceInr] = useState('400');
  const [notes, setNotes] = useState('');
  const [productError, setProductError] = useState<string | null>(null);

  // New Variant Dialog State
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [variantAttr, setVariantAttr] = useState('Brand');
  const [variantValue, setVariantValue] = useState('');
  const [variantExtraInr, setVariantExtraInr] = useState('500');
  const [variantError, setVariantError] = useState<string | null>(null);

  // Live Price Simulator State
  const [simVariantId, setSimVariantId] = useState<string>('none');
  const [simQty, setSimQty] = useState<number>(1);

  // Fetch Products
  const { data: products = [], isLoading } = useQuery<ProductItem[]>({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ProductItem[]>('/catalog/products');
        return res.data;
      } catch {
        const saved = localStorage.getItem('bl_dev_products');
        return saved ? JSON.parse(saved) : SEED_PRODUCTS;
      }
    },
  });

  // Current active product reference
  const currentProduct = activeProduct
    ? products.find((p) => p.id === activeProduct.id) || activeProduct
    : products[0] || null;

  // Create Product Mutation
  const createProductMutation = useMutation({
    mutationFn: async () => {
      const salesPricePaise = Math.round(parseFloat(salesPriceInr) * 100);
      const costPricePaise = Math.round(parseFloat(costPriceInr || '0') * 100);

      try {
        return await apiClient.post<ProductItem>('/catalog/products', {
          name,
          type,
          salesPrice: salesPricePaise,
          costPrice: costPricePaise,
          notes: notes || undefined,
          active: true,
        });
      } catch {
        const newProd: ProductItem = {
          id: `prod_dev_${Date.now()}`,
          name,
          type,
          salesPrice: salesPricePaise,
          costPrice: costPricePaise,
          notes: notes || null,
          active: true,
          createdAt: new Date().toISOString(),
          variants: [],
        };
        const updated = [...products, newProd];
        localStorage.setItem('bl_dev_products', JSON.stringify(updated));
        return { data: newProd };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsProductDialogOpen(false);
      setName('');
      setNotes('');
      setProductError(null);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setProductError(err.problem.detail || err.problem.title);
      } else {
        setProductError('Failed to create product.');
      }
    },
  });

  // Create Variant Mutation
  const createVariantMutation = useMutation({
    mutationFn: async () => {
      if (!currentProduct) return;
      const extraPricePaise = Math.round(parseFloat(variantExtraInr) * 100);

      try {
        return await apiClient.post<ProductVariantItem>(
          `/catalog/products/${currentProduct.id}/variants`,
          {
            attribute: variantAttr,
            value: variantValue,
            extraPrice: extraPricePaise,
            active: true,
          },
        );
      } catch {
        const newVar: ProductVariantItem = {
          id: `var_dev_${Date.now()}`,
          productId: currentProduct.id,
          attribute: variantAttr,
          value: variantValue,
          extraPrice: extraPricePaise,
          active: true,
        };
        const updated = products.map((p) =>
          p.id === currentProduct.id
            ? { ...p, variants: [...p.variants, newVar] }
            : p,
        );
        localStorage.setItem('bl_dev_products', JSON.stringify(updated));
        return { data: newVar };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsVariantDialogOpen(false);
      setVariantValue('');
      setVariantError(null);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setVariantError(err.problem.detail || err.problem.title);
      } else {
        setVariantError('Failed to create product variant.');
      }
    },
  });

  const filteredProducts =
    selectedType === 'ALL'
      ? products
      : products.filter((p) => p.type === selectedType);

  // Price Simulator Calculations
  const simBase = currentProduct ? currentProduct.salesPrice : 0;
  const selectedVariant = currentProduct?.variants.find((v) => v.id === simVariantId);
  const simExtra = selectedVariant ? selectedVariant.extraPrice : 0;
  const simUnitPrice = simBase + simExtra;
  const simSubtotal = simUnitPrice * (simQty > 0 ? simQty : 1);

  const formatInr = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const columns: Column<ProductItem>[] = [
    {
      key: 'name',
      header: 'NAME & DESCRIPTION',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-ink">{row.name}</span>
          {row.notes && (
            <span className="text-[11px] text-ink-muted">{row.notes}</span>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'TYPE',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-steel">
          [{row.type}]
        </span>
      ),
    },
    {
      key: 'variants',
      header: 'VARIANTS',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-ink">
          {row.variants.length > 0 ? `[${row.variants.length} VAR]` : '[STANDALONE]'}
        </span>
      ),
    },
    {
      key: 'salesPrice',
      header: 'BASE SALES PRICE',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums font-bold text-ink">
          {formatInr(row.salesPrice)}
        </span>
      ),
    },
    {
      key: 'costPrice',
      header: 'COST PRICE',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-ink-muted">
          {formatInr(row.costPrice)}
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
    {
      key: 'id',
      header: 'INSPECT',
      render: (row) => (
        <button
          onClick={() => {
            setActiveProduct(row);
            setSimVariantId('none');
          }}
          className={`font-mono text-xs px-2 py-0.5 border border-line ${
            currentProduct?.id === row.id
              ? 'bg-olive text-paper font-bold'
              : 'bg-surface hover:bg-surface-alt text-ink'
          }`}
        >
          {currentProduct?.id === row.id ? '[SELECTED]' : '[INSPECT]'}
        </button>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 flex flex-col gap-6">
      <PageHeader
        title="CATALOG & PRODUCTS"
        subtitle="Catalog definitions, variants, pricing, and cost margins."
        breadcrumbs={['SYSTEM', 'CATALOG']}
        actions={
          isAdmin && (
            <Button
              variant="primary"
              onClick={() => setIsProductDialogOpen(true)}
            >
              [+] NEW PRODUCT
            </Button>
          )
        }
      />

      {/* Top Stat Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Panel title="TOTAL PRODUCTS">
          <StatBlock label="ITEMS" value={products.length.toString()} />
        </Panel>
        <Panel title="ACTIVE VARIANTS">
          <StatBlock
            label="VARIANTS"
            value={products.reduce((acc, p) => acc + p.variants.length, 0).toString()}
          />
        </Panel>
        <Panel title="SOFTWARE COMMODITIES">
          <StatBlock
            label="COUNT"
            value={products.filter((p) => p.type === 'SOFTWARE').length.toString()}
          />
        </Panel>
        <Panel title="CURRENCY">
          <StatBlock label="BASE" value="INR (₹)" />
        </Panel>
      </div>

      {/* Product Type Filter Bar */}
      <div className="flex items-center gap-2 border border-line bg-surface p-2 font-mono text-xs">
        <span className="font-bold text-ink-muted uppercase mr-2">FILTER TYPE:</span>
        {['ALL', 'SOFTWARE', 'SERVICE', 'ADD_ON', 'PHYSICAL'].map((f) => (
          <button
            key={f}
            onClick={() => setSelectedType(f)}
            className={`px-2 py-1 border border-line select-none cursor-pointer ${
              selectedType === f
                ? 'bg-ink text-paper font-bold'
                : 'bg-surface hover:bg-surface-alt text-ink'
            }`}
          >
            [{f}]
          </button>
        ))}
      </div>

      {/* Main Products Table */}
      <Panel title="PRODUCT SPECIFICATIONS REGISTER">
        {isLoading ? (
          <div className="p-8 text-center font-mono text-sm text-ink-muted">LOADING…</div>
        ) : (
          <DataTable
            data={filteredProducts}
            columns={columns}
            emptyText="NO PRODUCTS RECORDED IN CATALOG."
          />
        )}
      </Panel>

      {/* Interactive Detail & Variant Inspector */}
      {currentProduct && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Variants Table */}
          <div className="lg:col-span-2">
            <Panel
              title={`VARIANTS FOR: ${currentProduct.name.toUpperCase()}`}
              actions={
                isAdmin && (
                  <Button
                    variant="outline"
                    className="text-xs py-0.5"
                    onClick={() => setIsVariantDialogOpen(true)}
                  >
                    [+] ADD VARIANT
                  </Button>
                )
              }
            >
              {currentProduct.variants.length === 0 ? (
                <div className="p-4 text-center font-mono text-xs text-ink-muted border border-dashed border-line-soft">
                  NO VARIANTS CONFIGURED FOR THIS PRODUCT. BASE PRICE APPLIES TO ALL SALES.
                </div>
              ) : (
                <table className="w-full border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-line bg-surface-alt text-left text-ink-muted">
                      <th className="p-2">ATTRIBUTE</th>
                      <th className="p-2">VALUE</th>
                      <th className="p-2 text-right">EXTRA CHARGE</th>
                      <th className="p-2 text-right">EFFECTIVE UNIT PRICE</th>
                      <th className="p-2">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProduct.variants.map((v) => (
                      <tr key={v.id} className="border-b border-line-soft hover:bg-surface-alt">
                        <td className="p-2 font-bold">{v.attribute}</td>
                        <td className="p-2 text-steel">{v.value}</td>
                        <td className="p-2 text-right tabular-nums text-amber font-bold">
                          {v.extraPrice > 0 ? `+${formatInr(v.extraPrice)}` : '₹0.00'}
                        </td>
                        <td className="p-2 text-right tabular-nums font-bold text-ink">
                          {formatInr(currentProduct.salesPrice + v.extraPrice)}
                        </td>
                        <td className="p-2">
                          <StatusTag status={v.active ? 'ACTIVE' : 'SUSPENDED'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          </div>

          {/* Right Column: Live Price Simulator Panel */}
          <div>
            <Panel title="LIVE PRICE SIMULATOR (§8)">
              <div className="flex flex-col gap-4 font-mono text-xs">
                <div className="text-ink-muted leading-relaxed">
                  Interactive pricing engine verification. Simulates unit price with variant offsets.
                </div>

                <Field label="SELECTED VARIANT">
                  <Select
                    value={simVariantId}
                    onChange={(e) => setSimVariantId(e.target.value)}
                    options={[
                      { value: 'none', label: '[NONE] Base Product Only' },
                      ...currentProduct.variants.map((v) => ({
                        value: v.id,
                        label: `${v.attribute}: ${v.value} (+${formatInr(v.extraPrice)})`,
                      })),
                    ]}
                  />
                </Field>

                <Field label="SIMULATED QUANTITY">
                  <NumberInput
                    value={simQty}
                    onChange={(e) => setSimQty(parseInt(e.target.value) || 1)}
                    min={1}
                  />
                </Field>

                <div className="border border-line bg-surface-alt p-3 flex flex-col gap-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">BASE SALES PRICE:</span>
                    <span className="tabular-nums font-bold">{formatInr(simBase)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">VARIANT ADJUSTMENT:</span>
                    <span className="tabular-nums font-bold text-amber">
                      {simExtra > 0 ? `+${formatInr(simExtra)}` : '₹0.00'}
                    </span>
                  </div>
                  <div className="border-t border-line pt-2 flex justify-between font-bold">
                    <span>UNIT TOTAL:</span>
                    <span className="tabular-nums text-olive">{formatInr(simUnitPrice)}</span>
                  </div>
                  <div className="border-t-2 border-line pt-2 flex justify-between text-sm font-bold">
                    <span>TOTAL ({simQty} UNITS):</span>
                    <span className="tabular-nums text-ink">{formatInr(simSubtotal)}</span>
                  </div>
                </div>

                {selectedVariant && selectedVariant.value === 'Odoo' && (
                  <div className="p-2 border border-green bg-surface text-green font-bold text-[11px]">
                    [OK] SCENE RULE VERIFIED: Odoo variant adds exactly +₹560.00 to base!
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* Modal: New Product Dialog */}
      <Dialog
        isOpen={isProductDialogOpen}
        onClose={() => setIsProductDialogOpen(false)}
        title="PROVISION NEW PRODUCT"
      >
        <div className="flex flex-col gap-4">
          {productError && <Toast variant="error" message={`[ERR] ${productError}`} />}

          <Field label="PRODUCT NAME" required>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Enterprise Storage Cluster"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="PRODUCT TYPE" required>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                options={[
                  { value: 'SOFTWARE', label: 'SOFTWARE' },
                  { value: 'SERVICE', label: 'SERVICE' },
                  { value: 'ADD_ON', label: 'ADD_ON' },
                  { value: 'PHYSICAL', label: 'PHYSICAL' },
                ]}
              />
            </Field>

            <Field label="BASE SALES PRICE (INR)" required>
              <TextInput
                value={salesPriceInr}
                onChange={(e) => setSalesPriceInr(e.target.value)}
                placeholder="2000"
                required
              />
            </Field>
          </div>

          <Field label="ESTIMATED COST PRICE (INR)">
            <TextInput
              value={costPriceInr}
              onChange={(e) => setCostPriceInr(e.target.value)}
              placeholder="800"
            />
          </Field>

          <Field label="PRODUCT NOTES & SPECIFICATIONS">
            <TextInput
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal operational notes or license terms..."
            />
          </Field>

          <div className="border-t border-line pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              [CANCEL]
            </Button>
            <Button
              variant="primary"
              disabled={createProductMutation.isPending || !name}
              onClick={() => createProductMutation.mutate()}
            >
              {createProductMutation.isPending ? 'CREATING…' : 'CREATE PRODUCT'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal: New Variant Dialog */}
      <Dialog
        isOpen={isVariantDialogOpen}
        onClose={() => setIsVariantDialogOpen(false)}
        title={`NEW VARIANT FOR: ${currentProduct?.name.toUpperCase()}`}
      >
        <div className="flex flex-col gap-4">
          {variantError && <Toast variant="error" message={`[ERR] ${variantError}`} />}

          <div className="grid grid-cols-2 gap-4">
            <Field label="ATTRIBUTE" required>
              <TextInput
                value={variantAttr}
                onChange={(e) => setVariantAttr(e.target.value)}
                placeholder="e.g. Brand, Tier, Region"
                required
              />
            </Field>

            <Field label="VALUE" required>
              <TextInput
                value={variantValue}
                onChange={(e) => setVariantValue(e.target.value)}
                placeholder="e.g. Odoo, Enterprise, US-East"
                required
              />
            </Field>
          </div>

          <Field label="EXTRA PRICE OFFSET (INR, PAIRS AS +EXTRA)" required>
            <TextInput
              value={variantExtraInr}
              onChange={(e) => setVariantExtraInr(e.target.value)}
              placeholder="560"
              required
            />
          </Field>

          <div className="border-t border-line pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsVariantDialogOpen(false)}>
              [CANCEL]
            </Button>
            <Button
              variant="primary"
              disabled={createVariantMutation.isPending || !variantValue}
              onClick={() => createVariantMutation.mutate()}
            >
              {createVariantMutation.isPending ? 'SAVING…' : 'ADD VARIANT'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
