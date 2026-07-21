import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Nav } from "@/components/nav";
import { useBrand } from "@/lib/brand";
import { listInvoices, listProposals, saveInvoice, saveProposal, deleteInvoice, deleteProposal, rowToInvoice, rowToProposal } from "@/lib/doc-store";
import { fmt, uid } from "@/lib/doc-types";
import { useMemo, useState } from "react";
import { Search, FileText, FilePlus, Copy, Trash2, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — Vinshare" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { brand } = useBrand();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "invoice" | "proposal">("all");
  const [q, setQ] = useState("");

  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: listInvoices });
  const { data: proposals = [] } = useQuery({ queryKey: ["proposals"], queryFn: listProposals });

  const rows = useMemo(() => {
    let items: any[] = [];
    if (tab !== "proposal") items = items.concat(invoices.map((i: any) => ({ ...i, kind: "invoice" })));
    if (tab !== "invoice") items = items.concat(proposals.map((p: any) => ({ ...p, kind: "proposal" })));
    if (q) {
      const s = q.toLowerCase();
      items = items.filter((r) => [r.number, r.client_name, r.title, r.client_email].some((v) => (v || "").toLowerCase().includes(s)));
    }
    return items.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [invoices, proposals, tab, q]);

  const duplicate = async (r: any) => {
    if (r.kind === "invoice") {
      const inv = rowToInvoice(r);
      inv.id = uid();
      inv.number = `${inv.number}-COPY`;
      inv.status = "draft";
      await saveInvoice(inv);
      qc.invalidateQueries({ queryKey: ["invoices"] });
    } else {
      const pr = rowToProposal(r);
      pr.id = uid();
      pr.number = `${pr.number}-COPY`;
      await saveProposal(pr);
      qc.invalidateQueries({ queryKey: ["proposals"] });
    }
  };

  const remove = async (r: any) => {
    if (!confirm(`Delete ${r.number}?`)) return;
    if (r.kind === "invoice") { await deleteInvoice(r.id); qc.invalidateQueries({ queryKey: ["invoices"] }); }
    else { await deleteProposal(r.id); qc.invalidateQueries({ queryKey: ["proposals"] }); }
  };

  const reopen = (r: any) => {
    navigate({ to: r.kind === "invoice" ? "/invoice" : "/proposal", search: { id: r.id } });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">/// Saved Documents</div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter">History</h1>
          <p className="text-muted-foreground mt-2">Search, duplicate, and reopen everything you've saved.</p>
        </motion.div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex bg-muted/50 rounded-full p-1.5 border border-border/60">
            {(["all", "invoice", "proposal"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${tab === t ? "bg-background shadow-sm" : "hover:bg-background/60"}`}>
                {t === "all" ? "All" : t + "s"}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by number, client, title…"
              className="w-full bg-card border border-border rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center">
            <div className="text-muted-foreground text-sm mb-4">No saved documents yet.</div>
            <div className="flex justify-center gap-2">
              <Link to="/invoice" className="text-white px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>Create invoice</Link>
              <Link to="/proposal" className="bg-card border border-border px-4 py-2 rounded-xl text-sm font-semibold hover:bg-muted">Create proposal</Link>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[auto_1.5fr_1.5fr_1fr_auto_auto] gap-4 px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
              <span>Type</span><span>Number</span><span>Client</span><span>Amount</span><span>Updated</span><span></span>
            </div>
            {rows.map((r) => (
              <div key={r.kind + r.id} className="grid md:grid-cols-[auto_1.5fr_1.5fr_1fr_auto_auto] gap-4 px-5 py-4 border-b border-border last:border-0 items-center hover:bg-muted/30 transition-colors">
                <div className="size-9 rounded-lg grid place-items-center" style={{ background: r.kind === "invoice" ? `${brand.primary}18` : `${brand.accent}18`, color: r.kind === "invoice" ? brand.primary : brand.accent }}>
                  {r.kind === "invoice" ? <FileText className="size-4" /> : <FilePlus className="size-4" />}
                </div>
                <div>
                  <div className="font-semibold text-sm">{r.number}</div>
                  <div className="text-xs text-muted-foreground capitalize">{r.kind} · {r.status || "—"}</div>
                </div>
                <div>
                  <div className="text-sm truncate">{r.client_name || "—"}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.title || r.client_email || ""}</div>
                </div>
                <div className="font-mono font-semibold text-sm">{fmt(Number(r.total || 0), brand.currency)}</div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(r.updated_at).toLocaleDateString()}</div>
                <div className="flex items-center gap-1">
                  <button onClick={() => reopen(r)} className="p-2 rounded-lg hover:bg-muted" title="Open"><Eye className="size-4" /></button>
                  <button onClick={() => duplicate(r)} className="p-2 rounded-lg hover:bg-muted" title="Duplicate"><Copy className="size-4" /></button>
                  <button onClick={() => remove(r)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10" title="Delete"><Trash2 className="size-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
