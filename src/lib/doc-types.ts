export type LineItem = {
  id: string;
  description: string;
  qty: number;
  rate: number;
  taxPct: number;
  discountPct: number;
};

// ── Status lifecycles ──────────────────────────────────────────────────────
export type ProposalStatus =
  | "draft"
  | "in_review"
  | "verified"
  | "sent"
  | "viewed"
  | "approved"
  | "rejected"
  | "stalled";

export type InvoiceStatus = "draft" | "in_review" | "approved" | "sent" | "paid";

// ── Detailing (filled by ops after proposal approval) ──────────────────────
export type Detailing = {
  scope: string;
  schedule: string;
  resources: string;
  notes: string;
  filledAt: string;
};

// ── Message log ────────────────────────────────────────────────────────────
export type MessageLogEntry = {
  id: string;
  entityType: "invoice" | "proposal";
  entityId: string;
  channel: "email";
  subject: string;
  sentAt: string;
  isReminder: boolean;
  reminderNumber: number;
};

// ── Core documents ─────────────────────────────────────────────────────────
export type Invoice = {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  items: LineItem[];
  notes: string;
  terms: string;
  status: InvoiceStatus;
  proposalId?: string;
};

export type ProposalSection = {
  id: string;
  heading: string;
  body: string;
};

export type Proposal = {
  id: string;
  number: string;
  title: string;
  issueDate: string;
  validUntil: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  sections: ProposalSection[];
  items: LineItem[];
  terms: string;
  notes: string;
  status: ProposalStatus;
  sentAt: string;
  lastReminderAt: string;
  reminderCount: number;
  detailing?: Detailing;
};

// ── Helpers ────────────────────────────────────────────────────────────────
export function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function computeTotals(items: LineItem[]) {
  let subtotal = 0;
  let discount = 0;
  let tax = 0;
  for (const it of items) {
    const gross = it.qty * it.rate;
    const disc = gross * (it.discountPct / 100);
    const net = gross - disc;
    const t = net * (it.taxPct / 100);
    subtotal += gross;
    discount += disc;
    tax += t;
  }
  const total = subtotal - discount + tax;
  return { subtotal, discount, tax, total };
}

export function fmt(n: number, sym = "₹") {
  return `${sym}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Status display metadata ────────────────────────────────────────────────
export const PROPOSAL_STATUS_META: Record<ProposalStatus, { label: string; color: string; bg: string }> = {
  draft:     { label: "Draft",      color: "#6B7280", bg: "#F3F4F6" },
  in_review: { label: "In Review",  color: "#7C3AED", bg: "#EDE9FE" },
  verified:  { label: "Verified",   color: "#0369A1", bg: "#E0F2FE" },
  sent:      { label: "Sent",       color: "#B45309", bg: "#FEF3C7" },
  viewed:    { label: "Viewed",     color: "#0891B2", bg: "#CFFAFE" },
  approved:  { label: "Approved",   color: "#15803D", bg: "#DCFCE7" },
  rejected:  { label: "Rejected",   color: "#B91C1C", bg: "#FEE2E2" },
  stalled:   { label: "Stalled",    color: "#92400E", bg: "#FEF3C7" },
};

export const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  draft:     { label: "Draft",      color: "#6B7280", bg: "#F3F4F6" },
  in_review: { label: "In Review",  color: "#7C3AED", bg: "#EDE9FE" },
  approved:  { label: "Approved",   color: "#0369A1", bg: "#E0F2FE" },
  sent:      { label: "Sent",       color: "#B45309", bg: "#FEF3C7" },
  paid:      { label: "Paid",       color: "#15803D", bg: "#DCFCE7" },
};
