import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Nav } from "@/components/nav";
import { useBrand } from "@/lib/brand";
import { computeTotals, fmt, uid, type LineItem, type Proposal, type ProposalSection } from "@/lib/doc-types";
import { downloadProposalPDF } from "@/lib/pdf";
import { Input, Textarea } from "./invoice";
import { DocActions } from "@/components/doc-actions";
import { getProposal } from "@/lib/doc-store";
import { useVinBind } from "@/lib/vin-context";
import { Plus, Trash2, Download, FileText, GripVertical, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/proposal")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id : undefined }),
  component: ProposalPage,
});

const today = () => new Date().toISOString().slice(0, 10);
const plus = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

function newSection(): ProposalSection {
  return { id: uid(), heading: "New Section", body: "Describe this part of your proposal…" };
}
function newItem(): LineItem {
  return { id: uid(), description: "", qty: 1, rate: 0, taxPct: 18, discountPct: 0 };
}

function ProposalPage() {
  const { brand } = useBrand();
  const { id } = Route.useSearch();
  const [pr, setPr] = useState<Proposal>(() => ({
    id: uid(),
    number: `${brand.proposalPrefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`,
    title: "Brand & Product Design Engagement",
    issueDate: today(),
    validUntil: plus(30),
    clientName: "Arcline Ventures Pvt. Ltd.",
    clientAddress: "MG Road, Bengaluru, KA 560001",
    clientEmail: "hello@arcline.co",
    sections: [
      { id: uid(), heading: "Overview", body: "Vinshare will partner with Arcline to redefine the brand foundation and translate it into a working product design system across web and mobile surfaces." },
      { id: uid(), heading: "Scope of Work", body: "1. Discovery workshops (2 weeks)\n2. Brand identity & guidelines\n3. Design system v1 (60+ components)\n4. Web + iOS product screens" },
      { id: uid(), heading: "Timeline", body: "10 weeks end-to-end. Weekly reviews on Fridays. Final handover with Notion documentation." },
    ],
    items: [
      { id: uid(), description: "Discovery & strategy", qty: 1, rate: 120000, taxPct: 18, discountPct: 0 },
      { id: uid(), description: "Brand identity & guidelines", qty: 1, rate: 180000, taxPct: 18, discountPct: 0 },
      { id: uid(), description: "Design system v1", qty: 1, rate: 240000, taxPct: 18, discountPct: 5 },
    ],
    terms: brand.defaultTerms,
    notes: brand.defaultNotes,
  }));

  // Load existing proposal when an id is provided (e.g. reopened from History)
  useEffect(() => {
    if (!id) return;
    getProposal(id).then((loaded) => {
      if (loaded) setPr(loaded);
    });
  }, [id]);

  const set = (p: Partial<Proposal>) => setPr((s) => ({ ...s, ...p }));
  const setSection = (id: string, p: Partial<ProposalSection>) =>
    setPr((s) => ({ ...s, sections: s.sections.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const addSection = () => setPr((s) => ({ ...s, sections: [...s.sections, newSection()] }));
  const removeSection = (id: string) => setPr((s) => ({ ...s, sections: s.sections.filter((x) => x.id !== id) }));
  const setItem = (id: string, p: Partial<LineItem>) =>
    setPr((s) => ({ ...s, items: s.items.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const addItem = () => setPr((s) => ({ ...s, items: [...s.items, newItem()] }));
  const removeItem = (id: string) => setPr((s) => ({ ...s, items: s.items.filter((x) => x.id !== id) }));

  const totals = computeTotals(pr.items);

  const restore = (snap: Proposal) => setPr({ ...snap, id: pr.id });

  // Vin context binding — surfaces this proposal to the chatbot and lets it insert drafts.
  const binding = useMemo(() => ({
    sessionKey: `proposal:${pr.id}`,
    sessionLabel: `Proposal ${pr.number}`,
    contextText: [
      `Document type: Proposal`,
      `Number: ${pr.number}   Title: ${pr.title}`,
      `Issue date: ${pr.issueDate}   Valid until: ${pr.validUntil}`,
      `Prepared by: ${brand.companyName} — ${brand.tagline}`,
      `Client: ${pr.clientName}${pr.clientEmail ? ` <${pr.clientEmail}>` : ""}`,
      pr.clientAddress ? `Client address: ${pr.clientAddress}` : "",
      `Currency: ${brand.currency}`,
      "Sections:",
      ...pr.sections.map((s, i) => `  ${i + 1}. ${s.heading}\n     ${s.body.replace(/\n/g, "\n     ")}`),
      "Investment / line items:",
      ...pr.items.map((it, i) => `  ${i + 1}. ${it.description || "(unnamed)"} — qty ${it.qty} @ ${brand.currency}${it.rate} (disc ${it.discountPct}%, tax ${it.taxPct}%)`),
      `Subtotal: ${fmt(totals.subtotal, brand.currency)}   Total: ${fmt(totals.total, brand.currency)}`,
      pr.notes ? `Existing notes: ${pr.notes}` : "",
      pr.terms ? `Existing terms: ${pr.terms}` : "",
    ].filter(Boolean).join("\n"),
    targets: [
      { id: "title", label: "Title", apply: (t: string) => set({ title: t.split("\n")[0].slice(0, 120) }) },
      { id: "notes", label: "Notes", apply: (t: string) => set({ notes: t }) },
      { id: "terms", label: "Terms", apply: (t: string) => set({ terms: t }) },
      {
        id: "newSection",
        label: "Add as new section",
        apply: (t: string) => {
          const lines = t.split("\n");
          const heading = (lines[0] || "New Section").replace(/^#+\s*/, "").slice(0, 80);
          const body = lines.slice(1).join("\n").trim() || t;
          setPr((s) => ({ ...s, sections: [...s.sections, { id: uid(), heading, body }] }));
        },
      },
    ],
    docType: "proposal" as const,
    docId: pr.id,
    getSnapshot: () => pr,
  }), [pr, brand, totals]);
  useVinBind(binding);

  return (
    <div className="min-h-screen bg-muted/30">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">/// Proposal Generator</div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Build Proposal</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <DocActions docType="proposal" doc={pr} onRestore={restore} />
            <a href={`mailto:${pr.clientEmail}?subject=Proposal%20${pr.number}&body=Hi%20${encodeURIComponent(pr.clientName)},%0D%0A%0D%0APlease%20find%20attached%20our%20proposal%20for%20${encodeURIComponent(pr.title)}.%0D%0A%0D%0AThanks,%0D%0A${encodeURIComponent(brand.companyName)}`}
              className="inline-flex items-center gap-2 bg-card border border-border px-4 py-2.5 rounded-xl font-semibold hover:bg-muted transition-colors text-sm">
              <Mail className="size-4" /> Email
            </a>
            <button onClick={() => downloadProposalPDF(pr, brand)}
              className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:scale-[1.03] transition-transform"
              style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>
              <Download className="size-4" /> Download PDF
            </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6">
          <div className="space-y-4">
            <Card title="Proposal Details">
              <Field label="Title"><Input value={pr.title} onChange={(v) => set({ title: v })} /></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Number"><Input value={pr.number} onChange={(v) => set({ number: v })} /></Field>
                <Field label="Issued"><Input type="date" value={pr.issueDate} onChange={(v) => set({ issueDate: v })} /></Field>
                <Field label="Valid Until"><Input type="date" value={pr.validUntil} onChange={(v) => set({ validUntil: v })} /></Field>
              </div>
            </Card>

            <Card title="Client">
              <Field label="Name"><Input value={pr.clientName} onChange={(v) => set({ clientName: v })} /></Field>
              <Field label="Email"><Input value={pr.clientEmail} onChange={(v) => set({ clientEmail: v })} /></Field>
              <Field label="Address"><Textarea rows={2} value={pr.clientAddress} onChange={(v) => set({ clientAddress: v })} /></Field>
            </Card>

            <Card title="Sections" action={
              <button onClick={addSection} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg" style={{ background: `${brand.primary}18`, color: brand.primary }}>
                <Plus className="size-4" /> Add Section
              </button>
            }>
              <AnimatePresence initial={false}>
                {pr.sections.map((s) => (
                  <motion.div key={s.id}
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-border bg-background p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="size-4 text-muted-foreground shrink-0" />
                      <Input value={s.heading} onChange={(v) => setSection(s.id, { heading: v })} />
                      <button onClick={() => removeSection(s.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <Textarea rows={4} value={s.body} onChange={(v) => setSection(s.id, { body: v })} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </Card>

            <Card title="Itemized Pricing" action={
              <button onClick={addItem} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg" style={{ background: `${brand.primary}18`, color: brand.primary }}>
                <Plus className="size-4" /> Add Item
              </button>
            }>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {pr.items.map((it) => (
                    <motion.div key={it.id}
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
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

            <Card title="Customizable Terms">
              <Field label="Terms & Conditions"><Textarea rows={5} value={pr.terms} onChange={(v) => set({ terms: v })} /></Field>
              <Field label="Notes"><Textarea rows={2} value={pr.notes} onChange={(v) => set({ notes: v })} /></Field>
            </Card>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="size-3.5" /> Live Preview
            </div>
            <ProposalPreview pr={pr} totals={totals} />
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
function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
    </label>
  );
}

function ProposalPreview({ pr, totals }: { pr: Proposal; totals: ReturnType<typeof computeTotals> }) {
  const { brand } = useBrand();
  return (
    <div className="bg-white text-slate-900 rounded-3xl shadow-2xl ring-1 ring-black/5 overflow-hidden text-sm">
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${brand.primary}, ${brand.accent})` }} />
      <div className="p-8 grid grid-cols-[1fr_auto] gap-4 border-b border-slate-100">
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
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black tracking-tight" style={{ color: brand.primary }}>PROPOSAL</div>
          <div className="text-xs font-mono text-slate-400 mt-1">#{pr.number}</div>
        </div>
      </div>
      <div className="p-8 space-y-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400">For {pr.clientName}</div>
          <h2 className="text-3xl font-black tracking-tight mt-1 leading-tight">{pr.title}</h2>
          <div className="text-xs text-slate-500 mt-2 font-mono">Issued {pr.issueDate} · Valid until {pr.validUntil}</div>
        </div>

        {pr.sections.map((s) => (
          <div key={s.id} className="border-l-2 pl-4" style={{ borderColor: brand.primary }}>
            <h3 className="font-bold text-base mb-2">{s.heading}</h3>
            <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{s.body}</p>
          </div>
        ))}

        {pr.items.length > 0 && (
          <div>
            <h3 className="font-bold text-base mb-3">Investment</h3>
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="grid grid-cols-[1fr_50px_100px_100px] text-[10px] uppercase tracking-widest text-white p-3"
                style={{ background: `linear-gradient(90deg, ${brand.primary}, ${brand.accent})` }}>
                <span>Item</span><span className="text-right">Qty</span><span className="text-right">Rate</span><span className="text-right">Amount</span>
              </div>
              {pr.items.map((it, i) => {
                const gross = it.qty * it.rate;
                const net = gross - gross * (it.discountPct / 100);
                const amt = net + net * (it.taxPct / 100);
                return (
                  <div key={it.id} className={`grid grid-cols-[1fr_50px_100px_100px] p-3 text-xs border-t border-slate-100 ${i % 2 ? "bg-slate-50/50" : ""}`}>
                    <span className="truncate">{it.description || "—"}</span>
                    <span className="text-right">{it.qty}</span>
                    <span className="text-right font-mono">{brand.currency}{it.rate.toLocaleString("en-IN")}</span>
                    <span className="text-right font-mono font-semibold">{fmt(amt, brand.currency)}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-4">
              <div className="rounded-xl px-5 py-3 text-white min-w-[240px] flex justify-between items-center"
                style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>
                <span className="text-[10px] uppercase tracking-widest">Total</span>
                <span className="text-xl font-black">{fmt(totals.total, brand.currency)}</span>
              </div>
            </div>
          </div>
        )}

        {pr.terms && (
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Terms</div>
            <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{pr.terms}</div>
          </div>
        )}
      </div>
    </div>
  );
}
