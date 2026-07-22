-- Vinshare: combined migrations
-- Run this in: supabase.com/dashboard/project/rkdneoxdzdhbupwkiaqs/sql/new

-- ================================================
-- 20260715055902_1e819eaa-7602-4214-958a-34762aa52359.sql
-- ================================================

-- Auto-updating updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
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
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- brand_settings (one per user)
CREATE TABLE public.brand_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_settings TO authenticated;
GRANT ALL ON public.brand_settings TO service_role;
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own brand" ON public.brand_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER brand_updated BEFORE UPDATE ON public.brand_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- clients
CREATE TABLE public.clients (
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
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own clients" ON public.clients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX clients_user_idx ON public.clients(user_id);

-- invoices
CREATE TABLE public.invoices (
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
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own invoices" ON public.invoices FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX invoices_user_idx ON public.invoices(user_id, updated_at DESC);

-- proposals
CREATE TABLE public.proposals (
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
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own proposals" ON public.proposals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER proposals_updated BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX proposals_user_idx ON public.proposals(user_id, updated_at DESC);

-- ================================================
-- 20260715055920_036d874b-7a59-4b2c-a7fe-bc02bc0bb881.sql
-- ================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- ================================================
-- 20260717115407_e5dde20a-ddcb-4446-a868-49d260c6466e.sql
-- ================================================

-- Add share tokens to invoices and proposals
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS share_token uuid UNIQUE DEFAULT gen_random_uuid();
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS share_token uuid UNIQUE DEFAULT gen_random_uuid();
UPDATE public.invoices SET share_token = gen_random_uuid() WHERE share_token IS NULL;
UPDATE public.proposals SET share_token = gen_random_uuid() WHERE share_token IS NULL;

-- Document versions audit trail
CREATE TABLE public.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  doc_type text NOT NULL CHECK (doc_type IN ('invoice','proposal')),
  doc_id uuid NOT NULL,
  snapshot jsonb NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX document_versions_doc_idx ON public.document_versions(user_id, doc_type, doc_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.document_versions TO authenticated;
GRANT ALL ON public.document_versions TO service_role;

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own versions" ON public.document_versions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ================================================
-- 20260718174905_eed68e46-a4c5-4e17-9d0e-f9139e5fb265.sql
-- ================================================

GRANT SELECT (id, number, status, issue_date, due_date, client_name, client_address, items, notes, terms, total, share_token, created_at, updated_at) ON public.invoices TO anon;
CREATE POLICY "public can view invoices via share_token"
  ON public.invoices FOR SELECT
  TO anon
  USING (share_token IS NOT NULL);

GRANT SELECT (id, number, title, issue_date, valid_until, client_name, client_address, sections, items, notes, terms, total, share_token, created_at, updated_at) ON public.proposals TO anon;
CREATE POLICY "public can view proposals via share_token"
  ON public.proposals FOR SELECT
  TO anon
  USING (share_token IS NOT NULL);

-- ================================================
-- 20260718175058_4cebd41f-83e4-4256-b954-91b3b7b9cf43.sql
-- ================================================

DROP POLICY IF EXISTS "public can view invoices via share_token" ON public.invoices;
DROP POLICY IF EXISTS "public can view proposals via share_token" ON public.proposals;
REVOKE SELECT ON public.invoices FROM anon;
REVOKE SELECT ON public.proposals FROM anon;

-- ================================================
-- 20260720094122_88157697-a463-4c4c-be54-925ae4f6b1ea.sql
-- ================================================

CREATE TABLE public.vin_chats (
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
ALTER TABLE public.vin_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own vin chats" ON public.vin_chats FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER vin_chats_set_updated_at BEFORE UPDATE ON public.vin_chats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================================================
-- 20260721000000_disable_rls.sql
-- ================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vin_chats DISABLE ROW LEVEL SECURITY;

