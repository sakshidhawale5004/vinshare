import { db } from "@/integrations/firebase/client";
import { doc, getDoc, setDoc, deleteDoc, collection, addDoc } from "firebase/firestore";
import type { UIMessage } from "ai";

export type VinDocType = "invoice" | "proposal" | "global";

export async function loadVinChat(docType: VinDocType, docId: string): Promise<UIMessage[]> {
  const docRef = doc(db, "vin_chats", `${docType}_${docId}`);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return [];
  const data = docSnap.data();
  const arr = data.messages;
  return Array.isArray(arr) ? (arr as UIMessage[]) : [];
}

export async function saveVinChat(docType: VinDocType, docId: string, messages: UIMessage[]) {
  const docRef = doc(db, "vin_chats", `${docType}_${docId}`);
  await setDoc(docRef, {
    user_id: "default-user",
    doc_type: docType,
    doc_id: docId,
    messages: messages,
    updated_at: new Date().toISOString(),
  }, { merge: true });
}

export async function clearVinChat(docType: VinDocType, docId: string) {
  const docRef = doc(db, "vin_chats", `${docType}_${docId}`);
  await deleteDoc(docRef);
}

/** Snapshot the current doc as a version with a "Vin insert" label. */
export async function snapshotVinInsert(
  docType: "invoice" | "proposal",
  docId: string,
  snapshot: unknown,
  targetLabel: string,
) {
  await addDoc(collection(db, "document_versions"), {
    user_id: "default-user",
    doc_type: docType,
    doc_id: docId,
    snapshot: snapshot,
    label: `Vin insert → ${targetLabel} · ${new Date().toLocaleString()}`,
    created_at: new Date().toISOString(),
  });
}
