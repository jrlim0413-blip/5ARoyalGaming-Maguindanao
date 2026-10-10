-- =========================================================================
-- LUCKY BETPLAY CORPORATION - COMPLETE DATABASE SCHEMA & RLS POLICIES
-- 
-- Instructions for Supabase / PostgreSQL:
-- 1. Open your target Database / Supabase Dashboard.
-- 2. Go to "SQL Editor".
-- 3. Click "New Query", paste this entire script, and click "RUN".
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. TABLE: rbac_users
-- Purpose: User directory, authentication, and role assignments
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rbac_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  role_label TEXT,
  branch TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  avatar TEXT,
  email TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.rbac_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy for rbac_users
DROP POLICY IF EXISTS "Allow anon full access to rbac_users" ON public.rbac_users;
CREATE POLICY "Allow anon full access to rbac_users"
ON public.rbac_users
FOR ALL
USING (true)
WITH CHECK (true);


-- -------------------------------------------------------------------------
-- 2. TABLE: rbac_matrix_config
-- Purpose: Cloud permissions matrix and dynamic user capabilities
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rbac_matrix_config (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.rbac_matrix_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy for rbac_matrix_config
DROP POLICY IF EXISTS "Allow anon full access to rbac_matrix_config" ON public.rbac_matrix_config;
CREATE POLICY "Allow anon full access to rbac_matrix_config"
ON public.rbac_matrix_config
FOR ALL
USING (true)
WITH CHECK (true);


-- -------------------------------------------------------------------------
-- 3. TABLE: cashier_negative_claims
-- Purpose: Cashier negative claims logging
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cashier_negative_claims (
  id TEXT PRIMARY KEY,
  branch TEXT NOT NULL,
  claim_date DATE NOT NULL,
  supervisor TEXT NOT NULL,
  draw_rotation TEXT NOT NULL DEFAULT '1st Draw',
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.cashier_negative_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policy for cashier_negative_claims
DROP POLICY IF EXISTS "Allow anon full access to cashier_negative_claims" ON public.cashier_negative_claims;
CREATE POLICY "Allow anon full access to cashier_negative_claims"
ON public.cashier_negative_claims
FOR ALL
USING (true)
WITH CHECK (true);


-- -------------------------------------------------------------------------
-- 4. TABLE: payout_shortage_replenishments
-- Purpose: Payout shortage replenishments logging
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payout_shortage_replenishments (
  id TEXT PRIMARY KEY,
  branch TEXT NOT NULL,
  claim_date DATE NOT NULL,
  supervisor TEXT NOT NULL,
  draw_rotation TEXT NOT NULL DEFAULT '1st Draw',
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payout_shortage_replenishments ENABLE ROW LEVEL SECURITY;

-- RLS Policy for payout_shortage_replenishments
DROP POLICY IF EXISTS "Allow anon full access to payout_shortage_replenishments" ON public.payout_shortage_replenishments;
CREATE POLICY "Allow anon full access to payout_shortage_replenishments"
ON public.payout_shortage_replenishments
FOR ALL
USING (true)
WITH CHECK (true);


-- -------------------------------------------------------------------------
-- 5. INITIAL SEED DATA (Default System Accounts)
-- -------------------------------------------------------------------------
INSERT INTO public.rbac_users (id, username, password, name, role, role_label, branch, status, avatar, email)
VALUES
  ('usr_admin', 'admin', 'adminpassword', 'Jay Ryan Lim', 'admin', 'System Administrator', 'Mandaue HQ (All Zones)', 'active', 'JL', 'admin@luckybetplay.ph'),
  ('usr_accountant', 'mandaue.staff', 'luckybet2026', 'Elena Morales', 'accountant', 'Head Accountant', 'Mandaue Branch', 'active', 'EM', 'elena.m@luckybetplay.ph'),
  ('usr_supervisor', 'supervisor.carlos', 'luckybet2026', 'Carlos Tan', 'supervisor', 'Branch Supervisor', 'Mandaue Central Zone', 'active', 'CT', 'carlos.tan@luckybetplay.ph'),
  ('usr_terminal', 'teller.mandaue', 'luckybet2026', 'Rico Dela Cruz', 'staff', 'Terminal Staff', 'Mandaue Terminal 01', 'active', 'RD', 'rico.staff@luckybetplay.ph')
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  role_label = EXCLUDED.role_label,
  branch = EXCLUDED.branch,
  status = EXCLUDED.status;
