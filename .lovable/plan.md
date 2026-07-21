## Scope

A big set of related changes. Grouping them for one implementation pass.

### 1. Lovable Cloud + Auth
- Enable Lovable Cloud (Supabase under the hood).
- Add email/password + Google sign-in on a new `/auth` route.
- Add a `_authenticated` layout gate that redirects unauthenticated users to `/auth`.
- Nav shows Sign in when logged out, and an account menu (email + Sign out) when logged in.

### 2. Database
Tables (RLS: owner-only via `auth.uid()`):
- `profiles` (id, email, display_name)
- `brand_settings` (user_id PK, jsonb settings) — cross-device brand sync
- `clients` (id, user_id, name, email, phone, address, gstin, notes)
- `invoices` (id, user_id, number, status, client snapshot, items jsonb, totals, notes, terms, issue/due dates, timestamps)
- `proposals` (id, user_id, number, title, client snapshot, sections jsonb, items jsonb, terms, notes, dates, timestamps)

Each table gets GRANTs + RLS policies (select/insert/update/delete own rows).

### 3. New routes (all under `_authenticated`)
- `/dashboard` — stats (total invoices, proposals, paid, outstanding), recent activity, quick-create CTAs.
- `/history` — combined searchable list of saved invoices + proposals with tabs, search, duplicate, and "reopen" (loads into editor).
- `/clients` — CRUD list of customers with search; used to autofill invoices/proposals.
- Existing `/invoice`, `/proposal`, `/settings` move under `_authenticated`.

### 4. Editor upgrades
- Invoice/Proposal editors gain **Save**, **Save as draft**, **Duplicate**, and **Load client** buttons.
- Query param `?id=` loads an existing record for editing (reopen from history).
- On save, upsert into `invoices` / `proposals`.

### 5. Brand sync
- `BrandProvider` now loads from `brand_settings` on login, falls back to localStorage when signed out, and pushes updates to Cloud (debounced upsert).

### 6. PDF template polish (Vinshare brand)
Redesign `src/lib/pdf.ts`:
- Full-width gradient-tone header block with logo, brand name, and doc title stacked cleanly.
- Colored side ribbon + monogram badge.
- Cleaner two-column parties block with subtle divider.
- New items table: rounded header pill, zebra rows, right-aligned monetary columns, subtle grid.
- Totals card with primary-tinted background and large TOTAL.
- Footer with fine rule, gradient underline, page number.
- Consistent fonts, generous spacing, matching brand primary/accent throughout.

### 7. More visible 3D motion
- Increase float amplitudes, rotation ranges, and blob scale in `HeroScene`.
- Add a smaller `<DocScene>` mounted **inside the invoice and proposal editor previews** (top-right of the preview card) — spinning coin + tilting document driven by scroll and pointer.
- Add subtle parallax tilt on the preview cards using framer-motion.

### 8. Technical notes
- Use `@supabase/supabase-js` browser client for auth + data (RLS keeps it safe).
- `onAuthStateChange` in root wires `router.invalidate()` and refetches brand.
- Sign-out flow: cancel queries, clear cache, `signOut()`, navigate to `/auth` with `replace: true`.
- Landing page (`/`) remains public; "Get started" → `/auth`, signed-in users see "Open dashboard".

Ready to build on approval.