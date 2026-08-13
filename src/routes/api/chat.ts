import { createFileRoute } from "@tanstack/react-router";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = { messages?: UIMessage[]; context?: string };

const BASE_SYSTEM =
  "You are Vin, the friendly in-app assistant for Vinshare — a proposal and invoice automation platform for Indian freelancers and agencies. Help users craft proposal sections, write professional invoice notes, draft polite payment reminders, explain GST calculations, and guide them through the app. When the user attaches images or PDFs (invoice templates, scanned documents, screenshots, logos), read them carefully and perform OCR — extract every visible line of text (company names, addresses, GSTIN, line items with quantity/rate, totals, dates, terms). Quote specific values back to the user, and when they ask for a revised section or note, use the extracted content directly. When the user asks for a section, note, term, reminder, or email body, output ONLY the drafted text (no preamble like 'Here is…'), so it can be pasted directly into the editor. Keep answers concise, warm, and actionable. Use markdown sparingly — plain prose usually pastes better into invoice/proposal fields.";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, context } = (await request.json()) as Body;
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const system = context
          ? `${BASE_SYSTEM}\n\n=== CURRENT DOCUMENT CONTEXT ===\nThe user is currently editing this document. Use these details when drafting or answering.\n${context}\n=== END CONTEXT ===`
          : BASE_SYSTEM;

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system,
          messages: await convertToModelMessages(messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
