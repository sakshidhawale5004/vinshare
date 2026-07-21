
DROP POLICY IF EXISTS "public can view invoices via share_token" ON public.invoices;
DROP POLICY IF EXISTS "public can view proposals via share_token" ON public.proposals;
REVOKE SELECT ON public.invoices FROM anon;
REVOKE SELECT ON public.proposals FROM anon;
