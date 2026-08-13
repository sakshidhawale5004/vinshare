-- Vinshare: combined migrations (idempotent — safe to run multiple times)
-- Run this in: supabase.com/dashboard/project/rkdneoxdzdhbupwkiaqs/sql/new

-- ================================================
-- Helper function: auto-update updated_at
-- ================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ================================================
-- profiles
-- ================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
DROP POLICY IF EXISTS "own profile" ON public.profiles;
CREATE POLICY "own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP TRIGGER IF EXISTS profiles_updated ON public.profiles;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- brand_settings
-- ================================================
CREATE TABLE IF NOT EXISTS public.brand_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_settings TO authenticated;
GRANT ALL ON public.brand_settings TO service_role;
DROP POLICY IF EXISTS "own brand" ON public.brand_settings;
CREATE POLICY "own brand" ON public.brand_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS brand_updated ON public.brand_settings;
CREATE TRIGGER brand_updated BEFORE UPDATE ON public.brand_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================================================
-- clients
-- ================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  gstin TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
DROP POLICY IF EXISTS "own clients" ON public.clients;
CREATE POLICY "own clients" ON public.clients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS clients_updated ON public.clients;
CREATE TRIGGER clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS clients_user_idx ON public.clients(user_id);

-- ================================================
-- invoices
-- ================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  issue_date DATE,
  due_date DATE,
  client_name TEXT,
  client_email TEXT,
  client_address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  terms TEXT,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
DROP POLICY IF EXISTS "own invoices" ON public.invoices;
CREATE POLICY "own invoices" ON public.invoices FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS invoices_updated ON public.invoices;
CREATE TRIGGER invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS invoices_user_idx ON public.invoices(user_id, updated_at DESC);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS share_token uuid UNIQUE DEFAULT gen_random_uuid();
UPDATE public.invoices SET share_token = gen_random_uuid() WHERE share_token IS NULL;

-- ================================================
-- proposals
-- ================================================
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  number TEXT NOT NULL,
  title TEXT,
  issue_date DATE,
  valid_until DATE,
  client_name TEXT,
  client_email TEXT,
  client_address TEXT,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  terms TEXT,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;
DROP POLICY IF EXISTS "own proposals" ON public.proposals;
CREATE POLICY "own proposals" ON public.proposals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS proposals_updated ON public.proposals;
CREATE TRIGGER proposals_updated BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS proposals_user_idx ON public.proposals(user_id, updated_at DESC);
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS share_token uuid UNIQUE DEFAULT gen_random_uuid();
UPDATE public.proposals SET share_token = gen_random_uuid() WHERE share_token IS NULL;

-- ================================================
-- document_versions
-- ================================================
CREATE TABLE IF NOT EXISTS public.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  doc_type text NOT NULL CHECK (doc_type IN ('invoice','proposal')),
  doc_id uuid NOT NULL,
  snapshot jsonb NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS document_versions_doc_idx ON public.document_versions(user_id, doc_type, doc_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.document_versions TO authenticated;
GRANT ALL ON public.document_versions TO service_role;
DROP POLICY IF EXISTS "own versions" ON public.document_versions;
CREATE POLICY "own versions" ON public.document_versions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ================================================
-- vin_chats
-- ================================================
CREATE TABLE IF NOT EXISTS public.vin_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('invoice','proposal','global')),
  doc_id text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, doc_type, doc_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vin_chats TO authenticated;
GRANT ALL ON public.vin_chats TO service_role;
DROP POLICY IF EXISTS "own vin chats" ON public.vin_chats;
CREATE POLICY "own vin chats" ON public.vin_chats FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS vin_chats_set_updated_at ON public.vin_chats;
CREATE TRIGGER vin_chats_set_updated_at BEFORE UPDATE ON public.vin_chats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================================================
-- Disable RLS (all tables publicly accessible via anon key)
-- ================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vin_chats DISABLE ROW LEVEL SECURITY;
