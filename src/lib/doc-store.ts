import { computeTotals, type Invoice, type Proposal } from "./doc-types";

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

export async function listInvoices(): Promise<Invoice[]> {
  const invoices = getStorage<any>("vinshare_invoices");
  return invoices.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).map(rowToInvoice);
}

export async function listProposals(): Promise<Proposal[]> {
  const proposals = getStorage<any>("vinshare_proposals");
  return proposals.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).map(rowToProposal);
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const invoices = getStorage<any>("vinshare_invoices");
  const inv = invoices.find((i) => i.id === id);
  return inv ? rowToInvoice(inv) : null;
}

export async function getProposal(id: string): Promise<Proposal | null> {
  const proposals = getStorage<any>("vinshare_proposals");
  const pr = proposals.find((p) => p.id === id);
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

async function snapshotVersion(userId: string, docType: "invoice" | "proposal", docId: string, snapshot: any) {
  const versions = getStorage<any>("vinshare_versions");
  versions.push({
    id: crypto.randomUUID(),
    user_id: userId,
    doc_type: docType,
    doc_id: docId,
    snapshot: snapshot,
    label: new Date().toLocaleString(),
    created_at: new Date().toISOString(),
  });
  setStorage("vinshare_versions", versions);
}

export async function listVersions(docType: "invoice" | "proposal", docId: string) {
  const versions = getStorage<any>("vinshare_versions");
  return versions
    .filter((v) => v.doc_type === docType && v.doc_id === docId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50);
}

export async function getShareToken(docType: "invoice" | "proposal", docId: string): Promise<string | null> {
  // Share tokens are no longer supported with localStorage
  return null;
}

export async function deleteInvoice(id: string) {
  const invoices = getStorage<any>("vinshare_invoices");
  setStorage("vinshare_invoices", invoices.filter((i) => i.id !== id));
}

export async function deleteProposal(id: string) {
  const proposals = getStorage<any>("vinshare_proposals");
  setStorage("vinshare_proposals", proposals.filter((p) => p.id !== id));
}

export function rowToInvoice(r: any): Invoice {
  return {
    id: r.id,
    number: r.number,
    status: (r.status as Invoice["status"]) || "draft",
    issueDate: r.issue_date || "",
    dueDate: r.due_date || "",
    clientName: r.client_name || "",
    clientEmail: r.client_email || "",
    clientAddress: r.client_address || "",
    items: (r.items as any) || [],
    notes: r.notes || "",
    terms: r.terms || "",
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
  };
}
