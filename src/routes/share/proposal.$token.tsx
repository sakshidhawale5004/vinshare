import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSharedProposal } from "@/lib/share.functions";
import { SharedDocView } from "@/components/shared-doc-view";
import { rowToProposal } from "@/lib/doc-store";
import { computeTotals } from "@/lib/doc-types";

export const Route = createFileRoute("/share/proposal/$token")({
  head: () => ({ meta: [{ title: `Proposal preview — Vinshare` }, { name: "robots", content: "noindex" }] }),
  component: SharedProposalPage,
});

function SharedProposalPage() {
  const { token } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["shared-proposal", token],
    queryFn: () => getSharedProposal({ data: { token } }),
  });

  if (isLoading) return <Center>Loading…</Center>;
  if (error) return <Center>Couldn't load this preview.</Center>;
  if (!data) return <Center>This link is invalid or has been revoked.</Center>;

  const pr = rowToProposal(data.doc);
  const totals = computeTotals(pr.items);
  const b = normalize(data.brand);
  const fmt = (n: number) => `${b.currency}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <SharedDocView brand={data.brand} kind="proposal" title={pr.title || `Proposal ${pr.number}`}>
      <div className="bg-white text-slate-900 rounded-3xl shadow-2xl ring-1 ring-black/5 overflow-hidden text-sm">
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${b.primary}, ${b.accent})` }} />
        <div className="p-8 border-b border-slate-100 flex items-start justify-between gap-6">
          <div className="flex items-start gap-3">
            {b.logoDataUrl ? (
              <img src={b.logoDataUrl} alt="logo" className="size-14 rounded-xl object-contain bg-slate-50" />
            ) : (
              <div className="size-14 rounded-2xl grid place-items-center text-white text-xl font-black shadow-md"
                style={{ background: `linear-gradient(135deg, ${b.primary}, ${b.accent})` }}>{b.companyName.charAt(0)}</div>
            )}
            <div>
              <div className="font-bold text-lg">{b.companyName}</div>
              <div className="text-xs text-slate-500">{b.tagline}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black tracking-tight" style={{ color: b.primary }}>PROPOSAL</div>
            <div className="text-xs font-mono text-slate-400 mt-1">#{pr.number}</div>
            <div className="text-[11px] text-slate-500 mt-2">Issued {pr.issueDate}</div>
            <div className="text-[11px] text-slate-500">Valid until {pr.validUntil}</div>
          </div>
        </div>
        <div className="px-8 py-4 grid grid-cols-2 gap-4 border-b border-slate-100">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Prepared By</div>
            <div className="font-semibold">{b.companyName}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Prepared For</div>
            <div className="font-semibold">{pr.clientName || "—"}</div>
            <div className="text-xs text-slate-500 whitespace-pre-line">{pr.clientAddress}</div>
          </div>
        </div>
        <div className="p-8 space-y-6">
          {pr.sections.map((s) => (
            <div key={s.id}>
              <h3 className="font-bold text-base mb-1" style={{ color: b.primary }}>{s.heading}</h3>
              <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{s.body}</p>
            </div>
          ))}
          {pr.items.length > 0 && (
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="grid grid-cols-[1fr_60px_100px_100px] text-[10px] uppercase tracking-widest text-white p-3"
                style={{ background: `linear-gradient(90deg, ${b.primary}, ${b.accent})` }}>
                <span>Item</span><span className="text-right">Qty</span><span className="text-right">Rate</span><span className="text-right">Amount</span>
              </div>
              {pr.items.map((it, i) => {
                const gross = it.qty * it.rate;
                const net = gross - gross * (it.discountPct / 100);
                const amt = net + net * (it.taxPct / 100);
                return (
                  <div key={it.id} className={`grid grid-cols-[1fr_60px_100px_100px] p-3 text-xs border-t border-slate-100 ${i % 2 ? "bg-slate-50/50" : ""}`}>
                    <span className="truncate">{it.description || "—"}</span>
                    <span className="text-right">{it.qty}</span>
                    <span className="text-right font-mono">{b.currency}{it.rate.toLocaleString("en-IN")}</span>
                    <span className="text-right font-mono font-semibold">{fmt(amt)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between items-center px-4 py-3 text-white"
                style={{ background: `linear-gradient(135deg, ${b.primary}, ${b.accent})` }}>
                <span className="text-[10px] uppercase tracking-widest">Total Estimate</span>
                <span className="text-xl font-black">{fmt(totals.total)}</span>
              </div>
            </div>
          )}
          {pr.terms && (
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Terms</div>
              <div className="text-xs text-slate-600 whitespace-pre-line">{pr.terms}</div>
            </div>
          )}
        </div>
      </div>
    </SharedDocView>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">{children}</div>;
}
function normalize(b: any) {
  return {
    companyName: b?.companyName ?? "Vinshare",
    tagline: b?.tagline ?? "",
    logoDataUrl: b?.logoDataUrl ?? "",
    primary: b?.primary ?? "#0ea5e9",
    accent: b?.accent ?? "#8b5cf6",
    currency: b?.currency ?? "₹",
  };
}
