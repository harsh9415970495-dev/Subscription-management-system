-- 0001 Baseline Migration: Extensions, Schemas, RLS lockdown

-- 1. Create Extensions Schema and Extensions
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- 2. Create One Schema per Domain Module (Never public)
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS customers;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS plans;
CREATE SCHEMA IF NOT EXISTS taxation;
CREATE SCHEMA IF NOT EXISTS discounts;
CREATE SCHEMA IF NOT EXISTS subscriptions;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS reporting;
CREATE SCHEMA IF NOT EXISTS notifications;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS pgboss;

-- 3. Lock-Down Schemas from Supabase Public/Anon Roles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON SCHEMA identity, customers, catalog, plans, taxation, discounts, subscriptions, billing, payments, reporting, notifications, audit FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON SCHEMA identity, customers, catalog, plans, taxation, discounts, subscriptions, billing, payments, reporting, notifications, audit FROM authenticated;
  END IF;
END $$;

-- 4. Reusable Function to Assert and Enable RLS on All Module Tables
CREATE OR REPLACE FUNCTION enable_module_rls(target_schema text) RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = target_schema) LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', target_schema, r.tablename);
        EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM anon, authenticated;', target_schema, r.tablename);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
