-- =========================================================================
-- GLOWING FORTUNE CORPORATION (LDN-Lanao): RBAC & Configuration Schema for Supabase
--
-- Project URL: https://ctvxumxqcirlqjlhwmjf.supabase.co
--
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/ctvxumxqcirlqjlhwmjf
-- 2. Go to "SQL Editor" in the left sidebar.
-- 3. Click "New Query", paste this entire script, and click "RUN".
-- =========================================================================

-- 1. Create the dedicated rbac_users table
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

-- 2. Create the dedicated rbac_matrix_config table for RBAC & Commission settings
CREATE TABLE IF NOT EXISTS public.rbac_matrix_config (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.rbac_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_matrix_config ENABLE ROW LEVEL SECURITY;

-- 4. Allow full access to rbac_users via anon key
DROP POLICY IF EXISTS "Allow anon full access to rbac_users" ON public.rbac_users;
CREATE POLICY "Allow anon full access to rbac_users"
ON public.rbac_users
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Allow full access to rbac_matrix_config via anon key
DROP POLICY IF EXISTS "Allow anon full access to rbac_matrix_config" ON public.rbac_matrix_config;
CREATE POLICY "Allow anon full access to rbac_matrix_config"
ON public.rbac_matrix_config
FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Insert Initial Default Users
INSERT INTO public.rbac_users (id, username, password, name, role, role_label, branch, status, avatar, email)
VALUES
  ('usr_admin', 'admin', 'adminpassword', 'Jay Ryan Lim', 'admin', 'System Administrator', 'LDN HQ (All Zones)', 'active', 'JL', 'admin@glowingfortune.ph'),
  ('usr_accountant', 'ldn.staff', 'luckybet2026', 'Elena Morales', 'accountant', 'Head Cashier', 'LDN Branch', 'active', 'EM', 'elena.m@glowingfortune.ph'),
  ('usr_supervisor', 'supervisor.carlos', 'luckybet2026', 'Carlos Tan', 'supervisor', 'Branch Supervisor', 'LDN Central Zone', 'active', 'CT', 'carlos.tan@glowingfortune.ph'),
  ('usr_terminal', 'teller.ldn', 'luckybet2026', 'Rico Dela Cruz', 'staff', 'Terminal Staff', 'LDN Terminal 01', 'active', 'RD', 'rico.staff@glowingfortune.ph')
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  role_label = EXCLUDED.role_label,
  branch = EXCLUDED.branch,
  status = EXCLUDED.status;

