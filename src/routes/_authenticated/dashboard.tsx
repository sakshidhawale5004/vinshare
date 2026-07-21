import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Nav } from "@/components/nav";
import { useBrand } from "@/lib/brand";
import { listInvoices, listProposals } from "@/lib/doc-store";
import { fmt } from "@/lib/doc-types";
import { FileText, FilePlus, Users, TrendingUp, Wallet, Clock, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Vinshare" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { brand } = useBrand();
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: listInvoices });
  const { data: proposals = [] } = useQuery({ queryKey: ["proposals"], queryFn: listProposals });

  const paid = invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.total || 0), 0);
  const outstanding = invoices.filter((i: any) => i.status !== "paid").reduce((s: number, i: any) => s + Number(i.total || 0), 0);
  const recent = [...invoices.map((i: any) => ({ ...i, kind: "invoice" })), ...proposals.map((p: any) => ({ ...p, kind: "proposal" }))]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);

  const stats = [
    { label: "Invoices", value: invoices.length, icon: FileText, color: brand.primary },
    { label: "Proposals", value: proposals.length, icon: FilePlus, color: brand.accent },
    { label: "Paid", value: fmt(paid, brand.currency), icon: Wallet, color: "#12E29A" },
    { label: "Outstanding", value: fmt(outstanding, brand.currency), icon: TrendingUp, color: "#F59E0B" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">/// Dashboard</div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Good to see you back.</h1>
          <p className="text-muted-foreground mt-2">Everything you make lives here — synced across every device you sign in on.</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
                <div className="size-8 rounded-lg grid place-items-center" style={{ background: `${s.color}18`, color: s.color }}>
                  <s.icon className="size-4" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-black tracking-tight">{s.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <QuickAction to="/invoice" label="New Invoice" desc="Line items, taxes, PDF" icon={FileText} color={brand.primary} />
          <QuickAction to="/proposal" label="New Proposal" desc="Sections, pricing, terms" icon={FilePlus} color={brand.accent} />
          <QuickAction to="/clients" label="Add Client" desc="Save for reuse" icon={Users} color="#8B5CF6" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold tracking-tight flex items-center gap-2"><Clock className="size-4" /> Recent activity</h3>
            <Link to="/history" className="text-sm font-semibold" style={{ color: brand.primary }}>View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-sm">Nothing here yet. Create your first document.</div>
              <Link to="/invoice" className="inline-flex mt-4 items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>
                <Plus className="size-4" /> Create invoice
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((r: any) => (
                <Link
                  key={r.kind + r.id}
                  to={r.kind === "invoice" ? "/invoice" : "/proposal"}
                  search={{ id: r.id }}
                  className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-lg grid place-items-center" style={{ background: r.kind === "invoice" ? `${brand.primary}18` : `${brand.accent}18`, color: r.kind === "invoice" ? brand.primary : brand.accent }}>
                      {r.kind === "invoice" ? <FileText className="size-4" /> : <FilePlus className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{r.number} · {r.client_name || "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.title || r.kind.toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="text-sm font-mono font-semibold shrink-0 ml-3">{fmt(Number(r.total || 0), brand.currency)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, label, desc, icon: Icon, color }: any) {
  return (
    <Link to={to} className="group bg-card border border-border rounded-2xl p-5 hover:border-foreground/30 transition-colors">
      <div className="size-10 rounded-xl grid place-items-center mb-3 transition-transform group-hover:scale-110" style={{ background: `${color}18`, color }}>
        <Icon className="size-5" />
      </div>
      <div className="font-bold">{label}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </Link>
  );
}
