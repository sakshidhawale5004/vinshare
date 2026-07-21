import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSharedInvoice } from "@/lib/share.functions";
import { SharedDocView } from "@/components/shared-doc-view";
import { rowToInvoice } from "@/lib/doc-store";
import { computeTotals } from "@/lib/doc-types";

export const Route = createFileRoute("/share/invoice/$token")({
  head: ({ params }) => ({ meta: [{ title: `Invoice preview — Vinshare` }, { name: "robots", content: "noindex" }] }),
  component: SharedInvoicePage,
});

function SharedInvoicePage() {
  const { token } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["shared-invoice", token],
    queryFn: () => getSharedInvoice({ data: { token } }),
  });

  if (isLoading) return <Center>Loading…</Center>;
  if (error) return <Center>Couldn't load this preview.</Center>;
  if (!data) return <Center>This link is invalid or has been revoked.</Center>;

  const inv = rowToInvoice(data.doc);
  const totals = computeTotals(inv.items);

  return (
    <SharedDocView brand={data.brand} kind="invoice" title={`Invoice ${inv.number}`}>
      <SharedInvoiceBody inv={inv} totals={totals} brand={data.brand} />
    </SharedDocView>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">{children}</div>;
}

function SharedInvoiceBody({ inv, totals, brand }: any) {
  const b = normalizeBrand(brand);
  const fmt = (n: number) => `${b.currency}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return (
    <div className="bg-white text-slate-900 rounded-3xl shadow-2xl ring-1 ring-black/5 overflow-hidden text-sm">
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${b.primary}, ${b.accent})` }} />
      <div className="p-8 grid grid-cols-[1fr_auto] gap-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          {b.logoDataUrl ? (
            <img src={b.logoDataUrl} alt="logo" className="size-14 rounded-xl object-contain bg-slate-50" />
          ) : (
            <div className="size-14 rounded-2xl grid place-items-center text-white text-xl font-black shadow-md"
              style={{ background: `linear-gradient(135deg, ${b.primary}, ${b.accent})` }}>
              {b.companyName.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-bold text-lg">{b.companyName}</div>
            <div className="text-xs text-slate-500">{b.tagline}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">{b.email} · {b.phone}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black tracking-tight" style={{ color: b.primary }}>INVOICE</div>
          <div className="text-xs font-mono text-slate-400 mt-1">#{inv.number}</div>
          <div className="text-[11px] text-slate-500 mt-2">Issued {inv.issueDate}</div>
          <div className="text-[11px] text-slate-500">Due {inv.dueDate}</div>
        </div>
      </div>
      <div className="px-8 pb-4 pt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">From</div>
          <div className="font-semibold">{b.companyName}</div>
          <div className="text-xs text-slate-500 whitespace-pre-line">{b.address}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Billed To</div>
          <div className="font-semibold">{inv.clientName || "—"}</div>
          <div className="text-xs text-slate-500 whitespace-pre-line">{inv.clientAddress}</div>
          <div className="text-xs text-slate-500">{inv.clientEmail}</div>
        </div>
      </div>
      <div className="p-8 pt-0">
        <div className="rounded-2xl border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-[1fr_50px_90px_60px_100px] text-[10px] uppercase tracking-widest text-white p-3"
            style={{ background: `linear-gradient(90deg, ${b.primary}, ${b.accent})` }}>
            <span>Description</span><span className="text-right">Qty</span><span className="text-right">Rate</span><span className="text-right">Tax</span><span className="text-right">Amount</span>
          </div>
          {inv.items.map((it: any, i: number) => {
            const gross = it.qty * it.rate;
            const net = gross - gross * (it.discountPct / 100);
            const amt = net + net * (it.taxPct / 100);
            return (
              <div key={it.id} className={`grid grid-cols-[1fr_50px_90px_60px_100px] p-3 text-xs border-t border-slate-100 ${i % 2 ? "bg-slate-50/50" : ""}`}>
                <span className="truncate">{it.description || "—"}</span>
                <span className="text-right">{it.qty}</span>
                <span className="text-right font-mono">{b.currency}{it.rate.toLocaleString("en-IN")}</span>
                <span className="text-right">{it.taxPct}%</span>
                <span className="text-right font-mono font-semibold">{fmt(amt)}</span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-[1fr_240px] gap-4 mt-5">
          <div className="text-xs text-slate-500 whitespace-pre-line font-mono">{b.bankDetails}</div>
          <div className="space-y-1 text-xs">
            {[["Subtotal", fmt(totals.subtotal)], ["Discount", `−${fmt(totals.discount)}`], ["Tax", fmt(totals.tax)]].map(([l, v]) => (
              <div key={l} className="flex justify-between px-3 py-1.5 text-slate-500"><span>{l}</span><span className="font-mono">{v}</span></div>
            ))}
            <div className="flex justify-between items-center rounded-xl px-4 py-3 text-white mt-2"
              style={{ background: `linear-gradient(135deg, ${b.primary}, ${b.accent})` }}>
              <span className="text-[10px] uppercase tracking-widest">Total Due</span>
              <span className="text-xl font-black">{fmt(totals.total)}</span>
            </div>
          </div>
        </div>
        {inv.notes && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Notes</div>
            <div className="text-xs text-slate-600 whitespace-pre-line">{inv.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeBrand(b: any) {
  return {
    companyName: b?.companyName ?? "Vinshare",
    tagline: b?.tagline ?? "",
    email: b?.email ?? "",
    phone: b?.phone ?? "",
    address: b?.address ?? "",
    bankDetails: b?.bankDetails ?? "",
    logoDataUrl: b?.logoDataUrl ?? "",
    primary: b?.primary ?? "#0ea5e9",
    accent: b?.accent ?? "#8b5cf6",
    currency: b?.currency ?? "₹",
  };
}
