
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
