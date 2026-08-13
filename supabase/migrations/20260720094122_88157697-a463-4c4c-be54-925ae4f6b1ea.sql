
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
