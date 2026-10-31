-- 0003 Catalog and Taxation Schema Migration

-- 1. Create Catalog Products Table
CREATE TABLE IF NOT EXISTS catalog.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('SERVICE', 'SOFTWARE', 'ADD_ON', 'PHYSICAL')),
  sales_price integer NOT NULL, -- minor units (paise)
  cost_price integer NOT NULL DEFAULT 0,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE catalog.products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE catalog.products FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE catalog.products FROM authenticated;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_type ON catalog.products(type);
CREATE INDEX IF NOT EXISTS idx_products_active ON catalog.products(active);

-- 2. Create Catalog Product Variants Table
CREATE TABLE IF NOT EXISTS catalog.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  attribute text NOT NULL,
  value text NOT NULL,
  extra_price integer NOT NULL DEFAULT 0, -- minor units (paise)
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_variants_attr_val UNIQUE (product_id, attribute, value)
);
ALTER TABLE catalog.product_variants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE catalog.product_variants FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE catalog.product_variants FROM authenticated;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON catalog.product_variants(product_id);

-- 3. Create Taxation Tax Rules Table
CREATE TABLE IF NOT EXISTS taxation.tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rate_bp integer NOT NULL, -- basis points (1800 bp = 18.00%)
  applies_to text NOT NULL DEFAULT 'ALL' CHECK (applies_to IN ('ALL', 'PRODUCT_TYPE', 'SPECIFIC_PRODUCTS')),
  product_types jsonb,
  product_ids jsonb,
  valid_from timestamptz,
  valid_to timestamptz,
  priority integer NOT NULL DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE taxation.tax_rules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE taxation.tax_rules FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE taxation.tax_rules FROM authenticated;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tax_rules_priority ON taxation.tax_rules(priority);
CREATE INDEX IF NOT EXISTS idx_tax_rules_active ON taxation.tax_rules(active);
