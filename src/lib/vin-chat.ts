import type { UIMessage } from "ai";

export type VinDocType = "invoice" | "proposal" | "global";

function getStorage<T>(key: string): T {
  if (typeof window === "undefined") return {} as T;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  } catch {
    return {} as T;
  }
}

function setStorage<T>(key: string, data: T) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

export async function loadVinChat(docType: VinDocType, docId: string): Promise<UIMessage[]> {
  const chats = getStorage<Record<string, UIMessage[]>>("vinshare_chats");
  return chats[`${docType}_${docId}`] || [];
}

export async function saveVinChat(docType: VinDocType, docId: string, messages: UIMessage[]) {
  const chats = getStorage<Record<string, UIMessage[]>>("vinshare_chats");
  chats[`${docType}_${docId}`] = messages;
  setStorage("vinshare_chats", chats);
}

export async function clearVinChat(docType: VinDocType, docId: string) {
  const chats = getStorage<Record<string, UIMessage[]>>("vinshare_chats");
  delete chats[`${docType}_${docId}`];
  setStorage("vinshare_chats", chats);
}

/** Snapshot the current doc as a version with a "Vin insert" label. */
export async function snapshotVinInsert(
  docType: "invoice" | "proposal",
  docId: string,
  snapshot: unknown,
  targetLabel: string,
) {
  if (typeof window === "undefined") return;
  
  try {
    const data = localStorage.getItem("vinshare_versions");
    const versions = data ? JSON.parse(data) : [];
    versions.push({
      id: crypto.randomUUID(),
      user_id: "default-user",
      doc_type: docType,
      doc_id: docId,
      snapshot: snapshot,
      label: `Vin insert → ${targetLabel} · ${new Date().toLocaleString()}`,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem("vinshare_versions", JSON.stringify(versions));
  } catch (e) {
    console.error(e);
  }
}
