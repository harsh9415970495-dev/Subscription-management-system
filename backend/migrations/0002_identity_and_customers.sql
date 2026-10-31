-- 0002 Identity and Customers Schema Migration

-- 1. Create Identity Users Table
CREATE TABLE IF NOT EXISTS identity.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email extensions.citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN', 'STAFF', 'CUSTOMER')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INVITED')),
  customer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE identity.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE identity.users FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE identity.users FROM authenticated;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_email ON identity.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON identity.users(role);

-- 2. Create Identity Refresh Tokens Table
CREATE TABLE IF NOT EXISTS identity.refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE identity.refresh_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE identity.refresh_tokens FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE identity.refresh_tokens FROM authenticated;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON identity.refresh_tokens(user_id);

-- 3. Create Identity Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS identity.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE identity.password_reset_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE identity.password_reset_tokens FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE identity.password_reset_tokens FROM authenticated;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON identity.password_reset_tokens(user_id);

-- 4. Create Customers Table
CREATE TABLE IF NOT EXISTS customers.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_name text,
  phone text,
  billing_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  tax_id text,
  user_id uuid REFERENCES identity.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE customers.customers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE customers.customers FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE customers.customers FROM authenticated;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers.customers(user_id);

-- 5. Foreign Key from identity.users to customers.customers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_users_customer' AND table_schema = 'identity'
  ) THEN
    ALTER TABLE identity.users
      ADD CONSTRAINT fk_users_customer
      FOREIGN KEY (customer_id) REFERENCES customers.customers(id) ON DELETE SET NULL;
  END IF;
END $$;
