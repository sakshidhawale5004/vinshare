import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Eye, ThumbsUp, ThumbsDown, PauseCircle, RotateCcw,
  ShieldCheck, CheckCircle2, AlertCircle, Bell, Mail, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import {
  PROPOSAL_STATUS_META, INVOICE_STATUS_META,
  type Proposal, type Invoice, type MessageLogEntry,
} from "@/lib/doc-types";
import {
  submitProposalForReview, verifyProposal, requestProposalChanges,
  sendProposal, sendProposalReminder, markProposalViewed,
  approveProposal, rejectProposal, stallProposal, reopenProposal,
  submitInvoiceForReview, approveInvoice, requestInvoiceChanges,
  sendInvoice, markInvoicePaid,
  listMessages,
} from "@/lib/doc-store";

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status, meta }: { status: string; meta: Record<string, { label: string; color: string; bg: string }> }) {
  const m = meta[status] ?? { label: status, color: "#6B7280", bg: "#F3F4F6" };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: m.bg, color: m.color }}>
      <span className="size-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

// ── Action button ──────────────────────────────────────────────────────────
function ActionBtn({
  icon: Icon, label, onClick, variant = "default", disabled,
}: {
  icon: React.ElementType; label: string; onClick: () => void;
  variant?: "default" | "success" | "danger" | "warning"; disabled?: boolean;
}) {
  const colors = {
    default: "border-border hover:bg-muted text-foreground",
    success: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700",
    danger:  "border-red-200 bg-red-50 hover:bg-red-100 text-red-700",
    warning: "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-40 ${colors[variant]}`}>
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

// ── Message log ────────────────────────────────────────────────────────────
function MessageLog({ entityType, entityId }: { entityType: "invoice" | "proposal"; entityId: string }) {
  const [messages, setMessages] = useState<MessageLogEntry[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listMessages(entityType, entityId).then(setMessages);
  }, [entityType, entityId]);

  if (messages.length === 0) return null;

  return (
    <div className="border-t border-border pt-3 mt-3">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full">
        <Mail className="size-3.5" />
        <span className="font-medium">{messages.length} message{messages.length !== 1 ? "s" : ""} sent</span>
        {open ? <ChevronUp className="size-3.5 ml-auto" /> : <ChevronDown className="size-3.5 ml-auto" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="mt-2 space-y-1.5">
              {messages.map((m) => (
                <div key={m.id} className="flex items-start gap-2 text-xs bg-muted/50 rounded-lg px-3 py-2">
                  <Bell className={`size-3.5 mt-0.5 shrink-0 ${m.isReminder ? "text-amber-500" : "text-blue-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{m.subject}</div>
                    <div className="text-muted-foreground">{new Date(m.sentAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Proposal work panel ────────────────────────────────────────────────────
export function ProposalWorkPanel({
  proposal,
  onChange,
}: {
  proposal: Proposal;
  onChange: (updated: Proposal) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<Proposal>) => {
    setBusy(key);
    try {
      const updated = await fn();
      onChange(updated);
      // refresh message log
    } catch (e: any) {
      alert(e.message || "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const s = proposal.status;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</span>
        <StatusBadge status={s} meta={PROPOSAL_STATUS_META} />
      </div>

      {/* Reminder badge */}
      {proposal.reminderCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Bell className="size-3.5" />
          {proposal.reminderCount} reminder{proposal.reminderCount !== 1 ? "s" : ""} sent
          {proposal.lastReminderAt && (
            <span className="text-muted-foreground ml-auto">Last: {new Date(proposal.lastReminderAt).toLocaleDateString()}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {s === "draft" && (
          <ActionBtn icon={ShieldCheck} label="Submit for review" variant="default"
            disabled={busy === "submit"} onClick={() => run("submit", () => submitProposalForReview(proposal))} />
        )}

        {s === "in_review" && (<>
          <ActionBtn icon={CheckCircle2} label="Verify" variant="success"
            disabled={!!busy} onClick={() => run("verify", () => verifyProposal(proposal))} />
          <ActionBtn icon={RotateCcw} label="Request changes" variant="warning"
            disabled={!!busy} onClick={() => run("changes", () => requestProposalChanges(proposal))} />
        </>)}

        {s === "verified" && (
          <ActionBtn icon={Send} label="Send to client" variant="success"
            disabled={busy === "send"} onClick={() => run("send", () => sendProposal(proposal))} />
        )}

        {(s === "sent" || s === "viewed" || s === "stalled") && (<>
          {s === "sent" && (
            <ActionBtn icon={Eye} label="Mark viewed" variant="default"
              disabled={!!busy} onClick={() => run("viewed", () => markProposalViewed(proposal))} />
          )}
          <ActionBtn icon={ThumbsUp} label="Approved" variant="success"
            disabled={!!busy} onClick={() => run("approve", () => approveProposal(proposal))} />
          <ActionBtn icon={ThumbsDown} label="Rejected" variant="danger"
            disabled={!!busy} onClick={() => run("reject", () => rejectProposal(proposal))} />
          {s !== "stalled" && (
            <ActionBtn icon={PauseCircle} label="Stalled" variant="warning"
              disabled={!!busy} onClick={() => run("stall", () => stallProposal(proposal))} />
          )}
          <ActionBtn icon={Bell} label="Send reminder" variant="warning"
            disabled={!!busy} onClick={() => run("remind", () => sendProposalReminder(proposal))} />
        </>)}

        {(s === "rejected" || s === "stalled") && (
          <ActionBtn icon={RotateCcw} label="Reopen as draft" variant="default"
            disabled={!!busy} onClick={() => run("reopen", () => reopenProposal(proposal))} />
        )}

        {s === "approved" && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 w-full">
            <CheckCircle2 className="size-3.5 shrink-0" />
            Client approved — fill in detailing below to generate an invoice.
          </div>
        )}
      </div>

      {busy && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Processing…
        </div>
      )}

      <MessageLog entityType="proposal" entityId={proposal.id} />
    </div>
  );
}

// ── Invoice work panel ─────────────────────────────────────────────────────
export function InvoiceWorkPanel({
  invoice,
  onChange,
}: {
  invoice: Invoice;
  onChange: (updated: Invoice) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<Invoice>) => {
    setBusy(key);
    try {
      onChange(await fn());
    } catch (e: any) {
      alert(e.message || "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const s = invoice.status;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</span>
        <StatusBadge status={s} meta={INVOICE_STATUS_META} />
      </div>

      <div className="flex flex-wrap gap-2">
        {s === "draft" && (
          <ActionBtn icon={ShieldCheck} label="Submit for review" variant="default"
            disabled={busy === "submit"} onClick={() => run("submit", () => submitInvoiceForReview(invoice))} />
        )}

        {s === "in_review" && (<>
          <ActionBtn icon={CheckCircle2} label="Approve" variant="success"
            disabled={!!busy} onClick={() => run("approve", () => approveInvoice(invoice))} />
          <ActionBtn icon={RotateCcw} label="Request changes" variant="warning"
            disabled={!!busy} onClick={() => run("changes", () => requestInvoiceChanges(invoice))} />
        </>)}

        {s === "approved" && (
          <ActionBtn icon={Send} label="Send to client" variant="success"
            disabled={busy === "send"} onClick={() => run("send", () => sendInvoice(invoice))} />
        )}

        {s === "sent" && (
          <ActionBtn icon={CheckCircle2} label="Mark as paid" variant="success"
            disabled={busy === "paid"} onClick={() => run("paid", () => markInvoicePaid(invoice))} />
        )}

        {s === "paid" && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 w-full">
            <CheckCircle2 className="size-3.5" /> Invoice paid — closed.
          </div>
        )}
      </div>

      {busy && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Processing…
        </div>
      )}

      <MessageLog entityType="invoice" entityId={invoice.id} />
    </div>
  );
}

// ── Detailing form (shown after proposal approved) ─────────────────────────
export function DetailingForm({
  proposal,
  onChange,
  onAuthorizeInvoice,
}: {
  proposal: Proposal;
  onChange: (updated: Proposal) => void;
  onAuthorizeInvoice: () => void;
}) {
  const det = proposal.detailing ?? { scope: "", schedule: "", resources: "", notes: "", filledAt: "" };

  const update = (patch: Partial<typeof det>) => {
    const updated = { ...det, ...patch };
    onChange({ ...proposal, detailing: { ...updated, filledAt: new Date().toISOString() } });
  };

  const ready = det.scope.trim() && det.schedule.trim();

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="size-7 rounded-lg bg-amber-50 border border-amber-200 grid place-items-center">
          <AlertCircle className="size-4 text-amber-600" />
        </div>
        <div>
          <div className="font-bold text-sm">Manual Detailing</div>
          <div className="text-xs text-muted-foreground">Fill in scope, schedule & resources before authorizing an invoice.</div>
        </div>
      </div>

      <label className="block">
        <div className="text-xs font-medium text-muted-foreground mb-1">Scope of work <span className="text-red-500">*</span></div>
        <textarea rows={3} value={det.scope} onChange={(e) => update({ scope: e.target.value })} placeholder="Describe the deliverables…"
          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </label>

      <label className="block">
        <div className="text-xs font-medium text-muted-foreground mb-1">Schedule / timeline <span className="text-red-500">*</span></div>
        <textarea rows={2} value={det.schedule} onChange={(e) => update({ schedule: e.target.value })} placeholder="e.g. Week 1–2: discovery, Week 3–6: design…"
          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </label>

      <label className="block">
        <div className="text-xs font-medium text-muted-foreground mb-1">Resources assigned</div>
        <textarea rows={2} value={det.resources} onChange={(e) => update({ resources: e.target.value })} placeholder="e.g. 1 × designer, 1 × PM…"
          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </label>

      <label className="block">
        <div className="text-xs font-medium text-muted-foreground mb-1">Additional notes</div>
        <textarea rows={2} value={det.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Any internal notes…"
          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </label>

      <button onClick={onAuthorizeInvoice} disabled={!ready}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-40 hover:opacity-90">
        <ShieldCheck className="size-4" />
        Authorize Invoice
      </button>
      {!ready && (
        <p className="text-xs text-muted-foreground text-center">Fill in scope and schedule to enable authorization.</p>
      )}
    </div>
  );
}
