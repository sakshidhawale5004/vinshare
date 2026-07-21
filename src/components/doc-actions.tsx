import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { Share2, Mail, History, Save, Copy, Check, X, RotateCcw, Loader2, GitCompare, ArrowLeft } from "lucide-react";
import type { Invoice, Proposal } from "@/lib/doc-types";
import { useBrand } from "@/lib/brand";
import { saveInvoice, saveProposal, listVersions, getShareToken } from "@/lib/doc-store";
import { sendDocumentEmail } from "@/lib/share.functions";

type Props =
  | { docType: "invoice"; doc: Invoice; onRestore: (snapshot: Invoice) => void }
  | { docType: "proposal"; doc: Proposal; onRestore: (snapshot: Proposal) => void };

export function DocActions(props: Props) {
  const { brand } = useBrand();
  const [busy, setBusy] = useState<null | "save" | "share" | "email">(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [openDialog, setOpenDialog] = useState<null | "share" | "email" | "versions">(null);
  const sendEmail = useServerFn(sendDocumentEmail);

  const saveNow = async () => {
    setBusy("save");
    try {
      if (props.docType === "invoice") await saveInvoice(props.doc);
      else await saveProposal(props.doc);
      const t = await getShareToken(props.docType, props.doc.id);
      if (t) setShareUrl(buildShareUrl(props.docType, t));
    } catch (e: any) {
      alert(e.message || "Save failed");
    } finally {
      setBusy(null);
    }
  };

  const openShare = async () => {
    setBusy("share");
    try {
      // Ensure saved so token exists
      if (props.docType === "invoice") await saveInvoice(props.doc);
      else await saveProposal(props.doc);
      const t = await getShareToken(props.docType, props.doc.id);
      if (!t) throw new Error("No share link available");
      setShareUrl(buildShareUrl(props.docType, t));
      setOpenDialog("share");
    } catch (e: any) {
      alert(e.message || "Could not create share link");
    } finally {
      setBusy(null);
    }
  };

  const openEmail = async () => {
    await openShare();
    setOpenDialog("email");
  };

  const btn =
    "inline-flex items-center gap-2 bg-card border border-border px-4 py-2.5 rounded-xl font-semibold hover:bg-muted transition-colors text-sm";

  return (
    <>
      <button onClick={saveNow} disabled={busy === "save"} className={btn}>
        {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
      </button>
      <button onClick={openShare} disabled={busy === "share"} className={btn}>
        {busy === "share" ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />} Share link
      </button>
      <button onClick={openEmail} className={btn}>
        <Mail className="size-4" /> Email
      </button>
      <button onClick={() => setOpenDialog("versions")} className={btn}>
        <History className="size-4" /> Versions
      </button>

      <AnimatePresence>
        {openDialog === "share" && shareUrl && (
          <Dialog title="Shareable preview link" onClose={() => setOpenDialog(null)}>
            <p className="text-sm text-muted-foreground mb-3">
              Anyone with this link can view a read-only preview — no sign-in, no download required.
            </p>
            <div className="flex gap-2 items-center">
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono"
              />
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="text-white px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5"
                style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <a href={shareUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm underline" style={{ color: brand.primary }}>
              Open preview in new tab →
            </a>
          </Dialog>
        )}

        {openDialog === "email" && shareUrl && (
          <EmailDialog
            defaultTo={(props.doc as any).clientEmail || ""}
            defaultSubject={`${props.docType === "invoice" ? "Invoice" : "Proposal"} ${props.doc.number} from ${brand.companyName}`}
            shareUrl={shareUrl}
            onClose={() => setOpenDialog(null)}
            onSend={async ({ to, cc, bcc, subject, message }) => {
              await sendEmail({ data: { docType: props.docType, docId: props.doc.id, to, cc, bcc, subject, message, shareUrl } });
            }}
          />
        )}


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

function buildShareUrl(docType: "invoice" | "proposal", token: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/share/${docType}/${token}`;
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

function EmailDialog({
  defaultTo, defaultSubject, shareUrl, onSend, onClose,
}: { defaultTo: string; defaultSubject: string; shareUrl: string; onSend: (v: { to: string; cc: string; bcc: string; subject: string; message: string }) => Promise<void>; onClose: () => void }) {
  const { brand } = useBrand();
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(`Hi,\n\nPlease find the document at the link below. Let me know if you have any questions.\n\nThanks,\n${brand.companyName}`);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <Dialog title="Send by email" onClose={onClose}>
      <div className="space-y-3 text-sm">
        <p className="text-xs text-muted-foreground">
          The email includes your branded preview link. Attachments aren't supported — recipients open the document via the link (no download needed).
        </p>
        <Row label="To">
          <div className="flex gap-2">
            <input value={to} onChange={(e) => setTo(e.target.value)} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm" />
            {!showCcBcc && (
              <button type="button" onClick={() => setShowCcBcc(true)} className="text-xs px-2.5 py-2 rounded-lg border border-border hover:bg-muted whitespace-nowrap">
                + Cc / Bcc
              </button>
            )}
          </div>
        </Row>
        {showCcBcc && (
          <>
            <Row label="Cc"><input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="comma-separated emails" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></Row>
            <Row label="Bcc"><input value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="comma-separated emails" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></Row>
          </>
        )}
        <Row label="Subject"><input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></Row>
        <Row label="Message"><textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono resize-y" /></Row>
        <div className="text-[11px] text-muted-foreground font-mono truncate">Link: {shareUrl}</div>
        {err && <div className="text-xs text-destructive bg-destructive/10 rounded-lg p-2.5 whitespace-pre-wrap">{err}</div>}
        {done && <div className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2.5">Email sent ✓</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm">Cancel</button>
          <button
            disabled={sending || done}
            onClick={async () => {
              setErr(null); setSending(true);
              try { await onSend({ to, cc, bcc, subject, message }); setDone(true); setTimeout(onClose, 1200); }
              catch (e: any) { setErr(e?.message || "Send failed"); }
              finally { setSending(false); }
            }}
            className="text-white px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />} Send email
          </button>
        </div>
      </div>
    </Dialog>
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

