import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Save, X, RotateCcw, Loader2, GitCompare, ArrowLeft } from "lucide-react";
import type { Invoice, Proposal } from "@/lib/doc-types";
import { useBrand } from "@/lib/brand";
import { saveInvoice, saveProposal, listVersions } from "@/lib/doc-store";

type Props =
  | { docType: "invoice"; doc: Invoice; onRestore: (snapshot: Invoice) => void }
  | { docType: "proposal"; doc: Proposal; onRestore: (snapshot: Proposal) => void };

export function DocActions(props: Props) {
  const { brand } = useBrand();
  const [busy, setBusy] = useState<null | "save">(null);
  const [openDialog, setOpenDialog] = useState<null | "versions">(null);

  const saveNow = async () => {
    setBusy("save");
    try {
      if (props.docType === "invoice") await saveInvoice(props.doc);
      else await saveProposal(props.doc);
    } catch (e: any) {
      alert(e.message || "Save failed");
    } finally {
      setBusy(null);
    }
  };

  const btn =
    "inline-flex items-center gap-2 bg-card border border-border px-4 py-2.5 rounded-xl font-semibold hover:bg-muted transition-colors text-sm";

  return (
    <>
      <button onClick={saveNow} disabled={busy === "save"} className={btn}>
        {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
      </button>
      <button onClick={() => setOpenDialog("versions")} className={btn}>
        <History className="size-4" /> Versions
      </button>

      <AnimatePresence>
        {openDialog === "versions" && (
          <VersionsDialog
            docType={props.docType}
            docId={props.doc.id}
            onClose={() => setOpenDialog(null)}
            onRestore={(snap: any) => {
              props.onRestore(snap);
              setOpenDialog(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
        className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="size-4" /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}


function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function VersionsDialog({
  docType, docId, onClose, onRestore,
}: { docType: "invoice" | "proposal"; docId: string; onClose: () => void; onRestore: (snap: any) => void }) {
  const [versions, setVersions] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    listVersions(docType, docId).then(setVersions).catch((e) => setErr(e.message));
  }, [docType, docId]);

  const toggle = (id: string) => {
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 2) return [cur[1], id];
      return [...cur, id];
    });
  };

  const [a, b] = selected.map((id) => versions?.find((v) => v.id === id)).filter(Boolean) as any[];

  if (compareOpen && a && b) {
    // Order: older on the left, newer on the right
    const [left, right] = new Date(a.created_at) < new Date(b.created_at) ? [a, b] : [b, a];
    return (
      <Dialog title="Compare versions" onClose={onClose}>
        <button onClick={() => setCompareOpen(false)} className="inline-flex items-center gap-1.5 text-xs mb-3 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to history
        </button>
        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
          <div className="bg-muted rounded-lg p-2">
            <div className="font-semibold">Older</div>
            <div className="text-muted-foreground">{new Date(left.created_at).toLocaleString()}</div>
          </div>
          <div className="bg-muted rounded-lg p-2">
            <div className="font-semibold">Newer</div>
            <div className="text-muted-foreground">{new Date(right.created_at).toLocaleString()}</div>
          </div>
        </div>
        <DiffView docType={docType} left={left.snapshot} right={right.snapshot} />
      </Dialog>
    );
  }

  return (
    <Dialog title="Version history" onClose={onClose}>
      <p className="text-xs text-muted-foreground mb-3">Every save creates a snapshot. Restore any version, or select two to compare what changed.</p>
      {err && <div className="text-xs text-destructive">{err}</div>}
      {!versions ? (
        <div className="py-6 text-center text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin inline" /> Loading…</div>
      ) : versions.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">No snapshots yet. Save the document to create the first version.</div>
      ) : (
        <>
          <div className="max-h-72 overflow-auto divide-y divide-border rounded-xl border border-border">
            {versions.map((v, i) => {
              const checked = selected.includes(v.id);
              return (
                <div key={v.id} className={`flex items-center justify-between px-3 py-2.5 text-sm ${checked ? "bg-muted/50" : ""}`}>
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                    <input type="checkbox" checked={checked} onChange={() => toggle(v.id)} className="size-4" />
                    <div>
                      <div className="font-semibold">{i === 0 ? "Latest" : `v${versions.length - i}`}</div>
                      <div className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
                    </div>
                  </label>
                  <button
                    onClick={() => onRestore(v.snapshot)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/70"
                  >
                    <RotateCcw className="size-3.5" /> Restore
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-muted-foreground">{selected.length === 0 ? "Select two versions to compare" : selected.length === 1 ? "Select one more…" : "Ready to compare"}</div>
            <button
              disabled={selected.length !== 2}
              onClick={() => setCompareOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-foreground text-background disabled:opacity-40"
            >
              <GitCompare className="size-3.5" /> Compare
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}

function DiffView({ docType, left, right }: { docType: "invoice" | "proposal"; left: any; right: any }) {
  const scalarFields: Array<[string, string]> =
    docType === "invoice"
      ? [
          ["number", "Number"], ["status", "Status"], ["issueDate", "Issue date"], ["dueDate", "Due date"],
          ["clientName", "Client name"], ["clientEmail", "Client email"], ["clientAddress", "Client address"],
          ["notes", "Notes"], ["terms", "Terms"],
        ]
      : [
          ["number", "Number"], ["title", "Title"], ["issueDate", "Issue date"], ["validUntil", "Valid until"],
          ["clientName", "Client name"], ["clientEmail", "Client email"], ["clientAddress", "Client address"],
          ["notes", "Notes"], ["terms", "Terms"],
        ];

  const scalarRows = scalarFields
    .map(([k, label]) => ({ k, label, lv: left?.[k] ?? "", rv: right?.[k] ?? "" }))
    .filter((r) => String(r.lv) !== String(r.rv));

  const itemDiffs = diffLists(left?.items || [], right?.items || [], (it: any) => `${it.description || ""}·${it.quantity ?? ""}·${it.rate ?? ""}·${it.tax ?? ""}·${it.discount ?? ""}`);
  const sectionDiffs = docType === "proposal"
    ? diffLists(left?.sections || [], right?.sections || [], (s: any) => `${s.title || ""}·${s.body || ""}`)
    : null;

  const nothing = scalarRows.length === 0 && itemDiffs.added.length === 0 && itemDiffs.removed.length === 0 && (!sectionDiffs || (sectionDiffs.added.length === 0 && sectionDiffs.removed.length === 0));

  if (nothing) {
    return <div className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-4 text-center">No differences between these two snapshots.</div>;
  }

  return (
    <div className="max-h-[50vh] overflow-auto space-y-4 text-sm">
      {scalarRows.length > 0 && (
        <section>
          <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Fields</h4>
          <div className="rounded-lg border border-border divide-y divide-border">
            {scalarRows.map((r) => (
              <div key={r.k} className="grid grid-cols-[120px_1fr_1fr] gap-2 px-3 py-2 text-xs">
                <div className="font-medium">{r.label}</div>
                <div className="bg-red-50 text-red-900 rounded px-2 py-1 line-through break-words">{String(r.lv) || <em className="opacity-50">empty</em>}</div>
                <div className="bg-emerald-50 text-emerald-900 rounded px-2 py-1 break-words">{String(r.rv) || <em className="opacity-50">empty</em>}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(itemDiffs.added.length > 0 || itemDiffs.removed.length > 0) && (
        <section>
          <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Line items</h4>
          <ItemChangeList removed={itemDiffs.removed} added={itemDiffs.added} render={(it: any) => `${it.description || "—"} · qty ${it.quantity ?? 0} · rate ${it.rate ?? 0}`} />
        </section>
      )}

      {sectionDiffs && (sectionDiffs.added.length > 0 || sectionDiffs.removed.length > 0) && (
        <section>
          <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Sections</h4>
          <ItemChangeList removed={sectionDiffs.removed} added={sectionDiffs.added} render={(s: any) => s.title || "(untitled section)"} />
        </section>
      )}
    </div>
  );
}

function diffLists<T>(left: T[], right: T[], key: (t: T) => string) {
  const lk = new Map(left.map((x) => [key(x), x]));
  const rk = new Map(right.map((x) => [key(x), x]));
  const removed = left.filter((x) => !rk.has(key(x)));
  const added = right.filter((x) => !lk.has(key(x)));
  return { removed, added };
}

function ItemChangeList({ removed, added, render }: { removed: any[]; added: any[]; render: (x: any) => string }) {
  return (
    <div className="space-y-1 text-xs">
      {removed.map((x, i) => (
        <div key={`r${i}`} className="bg-red-50 text-red-900 rounded px-2 py-1.5 flex gap-2"><span className="font-mono">−</span><span className="break-words">{render(x)}</span></div>
      ))}
      {added.map((x, i) => (
        <div key={`a${i}`} className="bg-emerald-50 text-emerald-900 rounded px-2 py-1.5 flex gap-2"><span className="font-mono">+</span><span className="break-words">{render(x)}</span></div>
      ))}
    </div>
  );
}

