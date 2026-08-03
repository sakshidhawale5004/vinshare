import {
  computeTotals,
  uid,
  type Invoice,
  type InvoiceStatus,
  type MessageLogEntry,
  type Proposal,
  type ProposalStatus,
} from "./doc-types";

// ── Storage helpers ────────────────────────────────────────────────────────
function getStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setStorage<T>(key: string, data: T[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// ── Row mappers ────────────────────────────────────────────────────────────
export function rowToInvoice(r: any): Invoice {
  return {
    id: r.id,
    number: r.number,
    status: (r.status as InvoiceStatus) || "draft",
    issueDate: r.issue_date || "",
    dueDate: r.due_date || "",
    clientName: r.client_name || "",
    clientEmail: r.client_email || "",
    clientAddress: r.client_address || "",
    items: (r.items as any) || [],
    notes: r.notes || "",
    terms: r.terms || "",
    proposalId: r.proposal_id,
  };
}

export function rowToProposal(r: any): Proposal {
  return {
    id: r.id,
    number: r.number,
    title: r.title || "",
    issueDate: r.issue_date || "",
    validUntil: r.valid_until || "",
    clientName: r.client_name || "",
    clientEmail: r.client_email || "",
    clientAddress: r.client_address || "",
    sections: (r.sections as any) || [],
    items: (r.items as any) || [],
    notes: r.notes || "",
    terms: r.terms || "",
    status: (r.status as ProposalStatus) || "draft",
    sentAt: r.sent_at || "",
    lastReminderAt: r.last_reminder_at || "",
    reminderCount: r.reminder_count || 0,
    detailing: r.detailing,
  };
}

// ── CRUD ───────────────────────────────────────────────────────────────────
export async function listInvoices(): Promise<Invoice[]> {
  return getStorage<any>("vinshare_invoices")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .map(rowToInvoice);
}

export async function listProposals(): Promise<Proposal[]> {
  return getStorage<any>("vinshare_proposals")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .map(rowToProposal);
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const inv = getStorage<any>("vinshare_invoices").find((i) => i.id === id);
  return inv ? rowToInvoice(inv) : null;
}

export async function getProposal(id: string): Promise<Proposal | null> {
  const pr = getStorage<any>("vinshare_proposals").find((p) => p.id === id);
  return pr ? rowToProposal(pr) : null;
}

export async function saveInvoice(inv: Invoice) {
  const totals = computeTotals(inv.items);
  const row = {
    id: inv.id,
    user_id: "default-user",
    number: inv.number,
    status: inv.status,
    issue_date: inv.issueDate || null,
    due_date: inv.dueDate || null,
    client_name: inv.clientName,
    client_email: inv.clientEmail,
    client_address: inv.clientAddress,
    items: inv.items,
    notes: inv.notes,
    terms: inv.terms,
    total: totals.total,
    proposal_id: inv.proposalId,
    updated_at: new Date().toISOString(),
  };

  const invoices = getStorage<any>("vinshare_invoices");
  const index = invoices.findIndex((i) => i.id === inv.id);
  if (index >= 0) invoices[index] = row;
  else invoices.push(row);
  setStorage("vinshare_invoices", invoices);

  await snapshotVersion("default-user", "invoice", inv.id, inv);
  return rowToInvoice(row);
}

export async function saveProposal(pr: Proposal) {
  const totals = computeTotals(pr.items);
  const row = {
    id: pr.id,
    user_id: "default-user",
    number: pr.number,
    title: pr.title,
    issue_date: pr.issueDate || null,
    valid_until: pr.validUntil || null,
    client_name: pr.clientName,
    client_email: pr.clientEmail,
    client_address: pr.clientAddress,
    sections: pr.sections,
    items: pr.items,
    notes: pr.notes,
    terms: pr.terms,
    total: totals.total,
    status: pr.status,
    sent_at: pr.sentAt || null,
    last_reminder_at: pr.lastReminderAt || null,
    reminder_count: pr.reminderCount || 0,
    detailing: pr.detailing,
    updated_at: new Date().toISOString(),
  };

  const proposals = getStorage<any>("vinshare_proposals");
  const index = proposals.findIndex((p) => p.id === pr.id);
  if (index >= 0) proposals[index] = row;
  else proposals.push(row);
  setStorage("vinshare_proposals", proposals);

  await snapshotVersion("default-user", "proposal", pr.id, pr);
  return rowToProposal(row);
}

export async function deleteInvoice(id: string) {
  setStorage("vinshare_invoices", getStorage<any>("vinshare_invoices").filter((i) => i.id !== id));
}

export async function deleteProposal(id: string) {
  setStorage("vinshare_proposals", getStorage<any>("vinshare_proposals").filter((p) => p.id !== id));
}

// ── Status transitions ─────────────────────────────────────────────────────

/** Proposal: draft → in_review */
export async function submitProposalForReview(pr: Proposal): Promise<Proposal> {
  return saveProposal({ ...pr, status: "in_review" });
}

/** Proposal: in_review → verified */
export async function verifyProposal(pr: Proposal): Promise<Proposal> {
  return saveProposal({ ...pr, status: "verified" });
}

/** Proposal: in_review → draft (request changes) */
export async function requestProposalChanges(pr: Proposal): Promise<Proposal> {
  return saveProposal({ ...pr, status: "draft" });
}

/** Proposal: verified → sent (simulates email send) */
export async function sendProposal(pr: Proposal): Promise<Proposal> {
  const now = new Date().toISOString();
  await logMessage({
    id: uid(),
    entityType: "proposal",
    entityId: pr.id,
    channel: "email",
    subject: `Proposal ${pr.number} — ${pr.title || pr.clientName}`,
    sentAt: now,
    isReminder: false,
    reminderNumber: 0,
  });
  return saveProposal({ ...pr, status: "sent", sentAt: now });
}

/** Proposal: sent/viewed/stalled → reminder logged */
export async function sendProposalReminder(pr: Proposal): Promise<Proposal> {
  const now = new Date().toISOString();
  const reminderCount = (pr.reminderCount || 0) + 1;
  await logMessage({
    id: uid(),
    entityType: "proposal",
    entityId: pr.id,
    channel: "email",
    subject: `Reminder #${reminderCount}: Proposal ${pr.number} — ${pr.title || pr.clientName}`,
    sentAt: now,
    isReminder: true,
    reminderNumber: reminderCount,
  });
  return saveProposal({ ...pr, reminderCount, lastReminderAt: now });
}

/** Proposal: sent → viewed */
export async function markProposalViewed(pr: Proposal): Promise<Proposal> {
  return saveProposal({ ...pr, status: "viewed" });
}

/** Proposal: sent/viewed/stalled → approved */
export async function approveProposal(pr: Proposal): Promise<Proposal> {
  return saveProposal({ ...pr, status: "approved" });
}

/** Proposal: sent/viewed → rejected */
export async function rejectProposal(pr: Proposal): Promise<Proposal> {
  return saveProposal({ ...pr, status: "rejected" });
}

/** Proposal: sent/viewed → stalled */
export async function stallProposal(pr: Proposal): Promise<Proposal> {
  return saveProposal({ ...pr, status: "stalled" });
}

/** Proposal: rejected/stalled → draft (reopen) */
export async function reopenProposal(pr: Proposal): Promise<Proposal> {
  return saveProposal({ ...pr, status: "draft" });
}

/** Invoice: draft → in_review */
export async function submitInvoiceForReview(inv: Invoice): Promise<Invoice> {
  return saveInvoice({ ...inv, status: "in_review" });
}

/** Invoice: in_review → approved (finance authorizes) */
export async function approveInvoice(inv: Invoice): Promise<Invoice> {
  return saveInvoice({ ...inv, status: "approved" });
}

/** Invoice: in_review → draft (request changes) */
export async function requestInvoiceChanges(inv: Invoice): Promise<Invoice> {
  return saveInvoice({ ...inv, status: "draft" });
}

/** Invoice: approved → sent (simulates email send) */
export async function sendInvoice(inv: Invoice): Promise<Invoice> {
  const now = new Date().toISOString();
  await logMessage({
    id: uid(),
    entityType: "invoice",
    entityId: inv.id,
    channel: "email",
    subject: `Invoice ${inv.number} — ${inv.clientName}`,
    sentAt: now,
    isReminder: false,
    reminderNumber: 0,
  });
  return saveInvoice({ ...inv, status: "sent" });
}

/** Invoice: sent → paid */
export async function markInvoicePaid(inv: Invoice): Promise<Invoice> {
  return saveInvoice({ ...inv, status: "paid" });
}

// ── Message log ────────────────────────────────────────────────────────────
export async function logMessage(entry: MessageLogEntry) {
  const log = getStorage<MessageLogEntry>("vinshare_message_log");
  log.push(entry);
  setStorage("vinshare_message_log", log);
}

export async function listMessages(entityType: "invoice" | "proposal", entityId: string): Promise<MessageLogEntry[]> {
  return getStorage<MessageLogEntry>("vinshare_message_log")
    .filter((e) => e.entityType === entityType && e.entityId === entityId)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

// ── Versions ───────────────────────────────────────────────────────────────
async function snapshotVersion(userId: string, docType: "invoice" | "proposal", docId: string, snapshot: any) {
  const versions = getStorage<any>("vinshare_versions");
  versions.push({
    id: uid(),
    user_id: userId,
    doc_type: docType,
    doc_id: docId,
    snapshot,
    label: new Date().toLocaleString(),
    created_at: new Date().toISOString(),
  });
  setStorage("vinshare_versions", versions);
}

export async function listVersions(docType: "invoice" | "proposal", docId: string) {
  return getStorage<any>("vinshare_versions")
    .filter((v) => v.doc_type === docType && v.doc_id === docId)
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50);
}

export async function getShareToken(_docType: "invoice" | "proposal", _docId: string): Promise<string | null> {
  return null;
}
