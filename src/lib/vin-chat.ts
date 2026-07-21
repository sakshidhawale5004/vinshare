import { supabase } from "@/integrations/supabase/client";
import type { UIMessage } from "ai";

export type VinDocType = "invoice" | "proposal" | "global";

export async function loadVinChat(docType: VinDocType, docId: string): Promise<UIMessage[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data, error } = await supabase
    .from("vin_chats")
    .select("messages")
    .eq("doc_type", docType)
    .eq("doc_id", docId)
    .maybeSingle();
  if (error || !data) return [];
  const arr = (data as any).messages;
  return Array.isArray(arr) ? (arr as UIMessage[]) : [];
}

export async function saveVinChat(docType: VinDocType, docId: string, messages: UIMessage[]) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase.from("vin_chats").upsert(
    {
      user_id: u.user.id,
      doc_type: docType,
      doc_id: docId,
      messages: messages as any,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,doc_type,doc_id" },
  );
}

export async function clearVinChat(docType: VinDocType, docId: string) {
  await supabase.from("vin_chats").delete().eq("doc_type", docType).eq("doc_id", docId);
}

/** Snapshot the current doc as a version with a "Vin insert" label. */
export async function snapshotVinInsert(
  docType: "invoice" | "proposal",
  docId: string,
  snapshot: unknown,
  targetLabel: string,
) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase.from("document_versions").insert({
    user_id: u.user.id,
    doc_type: docType,
    doc_id: docId,
    snapshot: snapshot as any,
    label: `Vin insert → ${targetLabel} · ${new Date().toLocaleString()}`,
  });
}
