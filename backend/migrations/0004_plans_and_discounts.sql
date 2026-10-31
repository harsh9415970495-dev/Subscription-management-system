-- 0004 Plans and Discounts Schema Migration

-- 1. Create Plans Table
CREATE TABLE IF NOT EXISTS plans.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price integer NOT NULL DEFAULT 0, -- base plan recurring fee in paise
  billing_period text NOT NULL CHECK (billing_period IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
  min_quantity integer NOT NULL DEFAULT 1,
  available_from timestamptz,
  available_to timestamptz,
  auto_close_on_end boolean NOT NULL DEFAULT true,
  closable boolean NOT NULL DEFAULT true,
  pausable boolean NOT NULL DEFAULT false,
  renewable boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE plans.plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE plans.plans FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE plans.plans FROM authenticated;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_plans_billing_period ON plans.plans(billing_period);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans.plans(active);

-- 2. Create Subscriptions Payment Terms Table
CREATE TABLE IF NOT EXISTS subscriptions.payment_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  days integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE subscriptions.payment_terms ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE subscriptions.payment_terms FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE subscriptions.payment_terms FROM authenticated;
  END IF;
END $$;

-- 3. Create Discounts Table
CREATE TABLE IF NOT EXISTS discounts.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED')),
  value integer NOT NULL, -- basis points for % or minor units (paise) for fixed
  min_purchase_amount integer NOT NULL DEFAULT 0,
  min_quantity integer NOT NULL DEFAULT 1,
  start_date timestamptz,
  end_date timestamptz,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  scope text NOT NULL DEFAULT 'PRODUCTS' CHECK (scope IN ('PRODUCTS', 'SUBSCRIPTIONS')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE discounts.discounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE discounts.discounts FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE discounts.discounts FROM authenticated;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts.discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts.discounts(active);

-- 4. Create Discount Targets Table
CREATE TABLE IF NOT EXISTS discounts.discount_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id uuid NOT NULL REFERENCES discounts.discounts(id) ON DELETE CASCADE,
  target_id text NOT NULL
);
ALTER TABLE discounts.discount_targets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE discounts.discount_targets FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE discounts.discount_targets FROM authenticated;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_discount_targets_discount_id ON discounts.discount_targets(discount_id);

-- 5. Create Redemptions Table
CREATE TABLE IF NOT EXISTS discounts.redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id uuid NOT NULL REFERENCES discounts.discounts(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL,
  amount integer NOT NULL, -- minor units (paise)
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_redemptions_discount_invoice UNIQUE (discount_id, invoice_id)
);
ALTER TABLE discounts.redemptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE discounts.redemptions FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE discounts.redemptions FROM authenticated;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_redemptions_discount_id ON discounts.redemptions(discount_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_invoice_id ON discounts.redemptions(invoice_id);
