import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Nav } from "@/components/nav";
import { useBrand } from "@/lib/brand";
import { computeTotals, fmt, uid, type Invoice, type LineItem } from "@/lib/doc-types";
import { downloadInvoicePDF } from "@/lib/pdf";
import { DocActions } from "@/components/doc-actions";
import { useVinBind } from "@/lib/vin-context";
import { Plus, Trash2, Download, FileText, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/invoice")({
  component: InvoicePage,
});

const today = () => new Date().toISOString().slice(0, 10);
const plus = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

function newItem(): LineItem {
  return { id: uid(), description: "", qty: 1, rate: 0, taxPct: 18, discountPct: 0 };
}

function InvoicePage() {
  const { brand } = useBrand();
  const [inv, setInv] = useState<Invoice>({
    id: uid(),
    number: `${brand.invoicePrefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`,
    issueDate: today(),
    dueDate: plus(15),
    clientName: "Arcline Ventures Pvt. Ltd.",
    clientAddress: "MG Road, Bengaluru, KA 560001\nGSTIN 29XXXX1234F1Z5",
    clientEmail: "accounts@arcline.co",
    items: [
      { id: uid(), description: "Q3 brand refresh", qty: 1, rate: 240000, taxPct: 18, discountPct: 0 },
      { id: uid(), description: "Design system audit", qty: 1, rate: 84000, taxPct: 18, discountPct: 5 },
    ],
    notes: brand.defaultNotes,
    terms: brand.defaultTerms,
    status: "draft",
  });

  const set = (p: Partial<Invoice>) => setInv((s) => ({ ...s, ...p }));
  const setItem = (id: string, p: Partial<LineItem>) =>
    setInv((s) => ({ ...s, items: s.items.map((it) => (it.id === id ? { ...it, ...p } : it)) }));
  const addItem = () => setInv((s) => ({ ...s, items: [...s.items, newItem()] }));
  const removeItem = (id: string) => setInv((s) => ({ ...s, items: s.items.filter((it) => it.id !== id) }));

  const totals = computeTotals(inv.items);

  const restore = (snap: Invoice) => setInv({ ...snap, id: inv.id });

  // Vin context binding — lets the chatbot see this invoice and insert into fields.
  const binding = useMemo(() => ({
    sessionKey: `invoice:${inv.id}`,
    sessionLabel: `Invoice ${inv.number}`,
    contextText: [
      `Document type: Invoice`,
      `Number: ${inv.number}`,
      `Status: ${inv.status}`,
      `Issue date: ${inv.issueDate}   Due date: ${inv.dueDate}`,
      `Company (from): ${brand.companyName} — ${brand.tagline}`,
      brand.gstin ? `Company GSTIN: ${brand.gstin}` : "",
      `Client: ${inv.clientName}${inv.clientEmail ? ` <${inv.clientEmail}>` : ""}`,
      inv.clientAddress ? `Client address: ${inv.clientAddress}` : "",
      `Currency: ${brand.currency}`,
      "Line items:",
      ...inv.items.map((it, i) => `  ${i + 1}. ${it.description || "(unnamed)"} — qty ${it.qty} @ ${brand.currency}${it.rate} (disc ${it.discountPct}%, tax ${it.taxPct}%)`),
      `Subtotal: ${fmt(totals.subtotal, brand.currency)}`,
      `Discount: ${fmt(totals.discount, brand.currency)}`,
      `Tax: ${fmt(totals.tax, brand.currency)}`,
      `Total due: ${fmt(totals.total, brand.currency)}`,
      inv.notes ? `Existing notes: ${inv.notes}` : "",
      inv.terms ? `Existing terms: ${inv.terms}` : "",
    ].filter(Boolean).join("\n"),
    targets: [
      { id: "notes", label: "Notes", apply: (t: string) => set({ notes: t }) },
      { id: "terms", label: "Terms", apply: (t: string) => set({ terms: t }) },
      { id: "clientAddress", label: "Client address", apply: (t: string) => set({ clientAddress: t }) },
      {
        id: "appendNotes",
        label: "Append to notes",
        apply: (t: string) => set({ notes: inv.notes ? `${inv.notes}\n\n${t}` : t }),
      },
    ],
    docType: "invoice" as const,
    docId: inv.id,
    getSnapshot: () => inv,
  }), [inv, brand, totals]);
  useVinBind(binding);

  return (
    <div className="min-h-screen bg-muted/30">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">/// Invoice Generator</div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Create Invoice</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <DocActions docType="invoice" doc={inv} onRestore={restore} />
            <a href={`mailto:${inv.clientEmail}?subject=Invoice%20${inv.number}&body=Hi%20${encodeURIComponent(inv.clientName)},%0D%0A%0D%0APlease%20find%20attached%20invoice%20${inv.number}.%0D%0A%0D%0AThanks,%0D%0A${encodeURIComponent(brand.companyName)}`}
              className="inline-flex items-center gap-2 bg-card border border-border px-4 py-2.5 rounded-xl font-semibold hover:bg-muted transition-colors text-sm">
              <Mail className="size-4" /> Email
            </a>
            <button onClick={() => downloadInvoicePDF(inv, brand)}
              className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:scale-[1.03] transition-transform"
              style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>
              <Download className="size-4" /> Download PDF
            </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6">
          {/* Form */}
          <div className="space-y-4">
            <Card title="Invoice Details">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Number"><Input value={inv.number} onChange={(v) => set({ number: v })} /></Field>
                <Field label="Issue Date"><Input type="date" value={inv.issueDate} onChange={(v) => set({ issueDate: v })} /></Field>
                <Field label="Due Date"><Input type="date" value={inv.dueDate} onChange={(v) => set({ dueDate: v })} /></Field>
                <Field label="Status">
                  <select value={inv.status} onChange={(e) => set({ status: e.target.value as Invoice["status"] })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
                    <option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option>
                  </select>
                </Field>
              </div>
            </Card>

            <Card title="Client">
              <Field label="Name"><Input value={inv.clientName} onChange={(v) => set({ clientName: v })} /></Field>
              <Field label="Email"><Input value={inv.clientEmail} onChange={(v) => set({ clientEmail: v })} /></Field>
              <Field label="Address"><Textarea rows={2} value={inv.clientAddress} onChange={(v) => set({ clientAddress: v })} /></Field>
            </Card>

            <Card title="Line Items" action={
              <button onClick={addItem} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg" style={{ background: `${brand.primary}18`, color: brand.primary }}>
                <Plus className="size-4" /> Add Item
              </button>
            }>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {inv.items.map((it) => (
                    <motion.div key={it.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl border border-border bg-background p-3 space-y-2">
                      <Input value={it.description} onChange={(v) => setItem(it.id, { description: v })} placeholder="Description" />
                      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
                        <NumField label="Qty" value={it.qty} onChange={(v) => setItem(it.id, { qty: v })} />
                        <NumField label="Rate" value={it.rate} onChange={(v) => setItem(it.id, { rate: v })} />
                        <NumField label="Disc %" value={it.discountPct} onChange={(v) => setItem(it.id, { discountPct: v })} />
                        <NumField label="Tax %" value={it.taxPct} onChange={(v) => setItem(it.id, { taxPct: v })} />
                        <button onClick={() => removeItem(it.id)} className="self-end p-2 rounded-lg text-destructive hover:bg-destructive/10">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </Card>

            <Card title="Notes & Terms">
              <Field label="Notes"><Textarea rows={2} value={inv.notes} onChange={(v) => set({ notes: v })} /></Field>
              <Field label="Terms"><Textarea rows={4} value={inv.terms} onChange={(v) => set({ terms: v })} /></Field>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="size-3.5" /> Live Preview
            </div>
            <InvoicePreview inv={inv} totals={totals} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold tracking-tight">{title}</h3>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}

export function Input({ value, onChange, type = "text", placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
  );
}

export function Textarea({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono resize-y" />
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
    </label>
  );
}

export function InvoicePreview({ inv, totals }: { inv: Invoice; totals: ReturnType<typeof computeTotals> }) {
  const { brand } = useBrand();
  const style = brand.templateStyle;
  return (
    <div className="bg-white text-slate-900 rounded-3xl shadow-2xl ring-1 ring-black/5 overflow-hidden text-sm">
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${brand.primary}, ${brand.accent})` }} />
      <div className={`p-8 grid grid-cols-[1fr_auto] gap-4 ${style === "bold" ? "" : "border-b border-slate-100"}`}>
        <div className="flex items-start gap-3">
          {brand.logoDataUrl ? (
            <img src={brand.logoDataUrl} alt="logo" className="size-14 rounded-xl object-contain bg-slate-50" />
          ) : (
            <div className="size-14 rounded-2xl grid place-items-center text-white text-xl font-black shadow-md"
              style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>
              {brand.companyName.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-bold text-lg">{brand.companyName}</div>
            <div className="text-xs text-slate-500">{brand.tagline}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">{brand.email} · {brand.phone}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black tracking-tight" style={{ color: brand.primary }}>INVOICE</div>
          <div className="text-xs font-mono text-slate-400 mt-1">#{inv.number}</div>
          <div className="text-[11px] text-slate-500 mt-2">Issued {inv.issueDate}</div>
          <div className="text-[11px] text-slate-500">Due {inv.dueDate}</div>
        </div>
      </div>
      <div className="px-8 pb-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">From</div>
          <div className="font-semibold">{brand.companyName}</div>
          <div className="text-xs text-slate-500 whitespace-pre-line">{brand.address}</div>
          <div className="text-xs text-slate-500">GSTIN {brand.gstin}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Billed To</div>
          <div className="font-semibold">{inv.clientName || "—"}</div>
          <div className="text-xs text-slate-500 whitespace-pre-line">{inv.clientAddress}</div>
          <div className="text-xs text-slate-500">{inv.clientEmail}</div>
        </div>
      </div>
      <div className="p-8 pt-4">
        <div className="rounded-2xl border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-[1fr_50px_90px_60px_100px] text-[10px] uppercase tracking-widest text-white p-3"
            style={{ background: `linear-gradient(90deg, ${brand.primary}, ${brand.accent})` }}>
            <span>Description</span><span className="text-right">Qty</span><span className="text-right">Rate</span><span className="text-right">Tax</span><span className="text-right">Amount</span>
          </div>
          {inv.items.map((it, i) => {
            const gross = it.qty * it.rate;
            const net = gross - gross * (it.discountPct / 100);
            const amt = net + net * (it.taxPct / 100);
            return (
              <div key={it.id} className={`grid grid-cols-[1fr_50px_90px_60px_100px] p-3 text-xs border-t border-slate-100 ${i % 2 ? "bg-slate-50/50" : ""}`}>
                <span className="truncate">{it.description || "—"}</span>
                <span className="text-right">{it.qty}</span>
                <span className="text-right font-mono">{brand.currency}{it.rate.toLocaleString("en-IN")}</span>
                <span className="text-right">{it.taxPct}%</span>
                <span className="text-right font-mono font-semibold">{fmt(amt, brand.currency)}</span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-[1fr_240px] gap-4 mt-5">
          <div className="text-xs text-slate-500 space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Bank Details</div>
            <div className="whitespace-pre-line font-mono">{brand.bankDetails}</div>
          </div>
          <div className="space-y-1 text-xs">
            {[
              ["Subtotal", fmt(totals.subtotal, brand.currency)],
              ["Discount", `−${fmt(totals.discount, brand.currency)}`],
              ["Tax", fmt(totals.tax, brand.currency)],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between px-3 py-1.5 text-slate-500">
                <span>{l}</span><span className="font-mono">{v}</span>
              </div>
            ))}
            <div className="flex justify-between items-center rounded-xl px-4 py-3 text-white mt-2"
              style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>
              <span className="text-[10px] uppercase tracking-widest">Total Due</span>
              <span className="text-xl font-black">{fmt(totals.total, brand.currency)}</span>
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
