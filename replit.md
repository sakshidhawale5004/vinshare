# Vinshare

Proposal & invoice automation for modern businesses. Draft beautiful proposals, generate GST-ready invoices, and export branded PDFs in one click.

## Stack

- **Framework**: TanStack Start (React 19 + Vite 8)
- **Auth/Backend**: Supabase (`@lovable.dev/cloud-auth-js` + Supabase anon key)
- **Styling**: Tailwind CSS v4 + Radix UI + shadcn/ui components
- **3D**: Three.js / React Three Fiber (hero scene — requires WebGL)
- **PDF**: jsPDF + html2canvas
- **AI**: Vercel AI SDK (`@ai-sdk/openai-compatible`)

## Running the app

```bash
npm run dev
```

Starts Vite dev server on **port 5000**. The workflow `Start application` handles this automatically.

## Environment variables

Supabase credentials are stored as Replit env vars (shared environment):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Routes

| Path | Description |
|---|---|
| `/` | Landing page with hero, features, pricing |
| `/dashboard` | Authenticated dashboard |
| `/invoice` | Create & export invoices |
| `/proposal` | Build proposals |
| `/clients` | Manage clients |
| `/history` | Document history |
| `/settings` | Brand settings |
| `/auth` | Login / sign-up |

## Notes

- The 3D hero scene (Three.js) requires WebGL — it won't render in screenshot/server environments but works in real browsers.
- Vite config uses `@lovable.dev/vite-tanstack-config`; port override is set in `vite.config.ts`.

## User preferences

- Keep the existing project structure and stack.
