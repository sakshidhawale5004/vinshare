import { db } from "@/integrations/firebase/client";
import { computeTotals, type Invoice, type Proposal } from "./doc-types";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, orderBy, limit, where, addDoc } from "firebase/firestore";

export async function listInvoices() {
  const q = query(collection(db, "invoices"), orderBy("updated_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export async function listProposals() {
  const q = query(collection(db, "proposals"), orderBy("updated_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export async function getInvoice(id: string) {
  const docSnap = await getDoc(doc(db, "invoices", id));
  if (!docSnap.exists()) return null;
  return { ...docSnap.data(), id: docSnap.id };
}

export async function getProposal(id: string) {
  const docSnap = await getDoc(doc(db, "proposals", id));
  if (!docSnap.exists()) return null;
  return { ...docSnap.data(), id: docSnap.id };
}

export async function saveInvoice(inv: Invoice) {
  const totals = computeTotals(inv.items);
  const row = {
    user_id: "default-user",
    number: inv.number,
    status: inv.status,
    issue_date: inv.issueDate || null,
    due_date: inv.dueDate || null,
    client_name: inv.clientName,
    client_email: inv.clientEmail,
    client_address: inv.clientAddress,
    items: inv.items as any,
    notes: inv.notes,
    terms: inv.terms,
    total: totals.total,
    updated_at: new Date().toISOString(),
  };
  await setDoc(doc(db, "invoices", inv.id), row, { merge: true });
  await snapshotVersion("default-user", "invoice", inv.id, inv);
  return { ...row, id: inv.id };
}

export async function saveProposal(pr: Proposal) {
  const totals = computeTotals(pr.items);
  const row = {
    user_id: "default-user",
    number: pr.number,
    title: pr.title,
    issue_date: pr.issueDate || null,
    valid_until: pr.validUntil || null,
    client_name: pr.clientName,
    client_email: pr.clientEmail,
    client_address: pr.clientAddress,
    sections: pr.sections as any,
    items: pr.items as any,
    notes: pr.notes,
    terms: pr.terms,
    total: totals.total,
    updated_at: new Date().toISOString(),
  };
  await setDoc(doc(db, "proposals", pr.id), row, { merge: true });
  await snapshotVersion("default-user", "proposal", pr.id, pr);
  return { ...row, id: pr.id };
}

async function snapshotVersion(userId: string, docType: "invoice" | "proposal", docId: string, snapshot: any) {
  await addDoc(collection(db, "document_versions"), {
    user_id: userId,
    doc_type: docType,
    doc_id: docId,
    snapshot: snapshot,
    label: new Date().toLocaleString(),
    created_at: new Date().toISOString(),
  });
}

export async function listVersions(docType: "invoice" | "proposal", docId: string) {
  const q = query(
    collection(db, "document_versions"), 
    where("doc_type", "==", docType), 
    where("doc_id", "==", docId),
    orderBy("created_at", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export async function getShareToken(docType: "invoice" | "proposal", docId: string): Promise<string | null> {
  const table = docType === "invoice" ? "invoices" : "proposals";
  const docSnap = await getDoc(doc(db, table, docId));
  if (!docSnap.exists()) return null;
  return (docSnap.data()?.share_token as string | undefined) ?? null;
}

export async function deleteInvoice(id: string) {
  await deleteDoc(doc(db, "invoices", id));
}

export async function deleteProposal(id: string) {
  await deleteDoc(doc(db, "proposals", id));
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
