
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
