import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const tokenInput = z.object({ token: z.string().uuid() });

export const getSharedInvoice = createServerFn({ method: "GET" })
  .inputValidator((d) => tokenInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doc, error } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("share_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc) return null;
    const { data: brand } = await supabaseAdmin
      .from("brand_settings")
      .select("settings")
      .eq("user_id", doc.user_id)
      .maybeSingle();
    return { doc, brand: (brand?.settings as any) ?? null };
  });

export const getSharedProposal = createServerFn({ method: "GET" })
  .inputValidator((d) => tokenInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doc, error } = await supabaseAdmin
      .from("proposals")
      .select("*")
      .eq("share_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc) return null;
    const { data: brand } = await supabaseAdmin
      .from("brand_settings")
      .select("settings")
      .eq("user_id", doc.user_id)
      .maybeSingle();
    return { doc, brand: (brand?.settings as any) ?? null };
  });

const emailList = z
  .string()
  .max(1000)
  .optional()
  .default("")
  .transform((s) =>
    s
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().email()).max(20));

const emailInput = z.object({
  docType: z.enum(["invoice", "proposal"]),
  docId: z.string().uuid(),
  to: z.string().email(),
  cc: emailList,
  bcc: emailList,
  subject: z.string().min(1).max(200),
  message: z.string().max(4000).optional().default(""),
  shareUrl: z.string().url(),
});

export const sendDocumentEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => emailInput.parse(d))
  .handler(async ({ data, context }) => {
    // Verify ownership via RLS-scoped client
    const table = data.docType === "invoice" ? "invoices" : "proposals";
    const { data: owned, error } = await context.supabase
      .from(table)
      .select("id, number, client_name")
      .eq("id", data.docId)
      .maybeSingle();
    if (error || !owned) throw new Error("Document not found");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const senderDomain = process.env.LOVABLE_EMAIL_SENDER_DOMAIN;
    if (!senderDomain) {
      throw new Error(
        "Email sending is not set up yet — please configure your email domain in Cloud → Emails, then try again.",
      );
    }
    const from = `${(context.claims?.email as string | undefined)?.split("@")[0] ?? "no-reply"}@${senderDomain}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 12px">${escapeHtml(data.subject)}</h2>
        <p style="color:#334155;line-height:1.6">${escapeHtml(data.message || "Please review the document at the link below.").replace(/\n/g, "<br/>")}</p>
        <p style="margin:24px 0"><a href="${data.shareUrl}" style="background:#111;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">View ${data.docType} ${escapeHtml(owned.number ?? "")}</a></p>
        <p style="color:#94a3b8;font-size:12px">Link: <a href="${data.shareUrl}">${data.shareUrl}</a></p>
      </div>`;

    const res = await fetch("https://api.lovable.dev/v1/emails/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from,
        to: data.to,
        cc: data.cc.length ? data.cc : undefined,
        bcc: data.bcc.length ? data.bcc : undefined,
        subject: data.subject,
        html,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Email send failed (${res.status}): ${t}`);
    }
    return { sent: true };
  });


function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
