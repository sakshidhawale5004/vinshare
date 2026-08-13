import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { MessageCircle, Send, X, Sparkles, Paperclip, ClipboardPaste, FileText as FileIcon, Trash2 } from "lucide-react";
import { useVinBinding, type VinBinding } from "@/lib/vin-context";
import { loadVinChat, saveVinChat, clearVinChat, snapshotVinInsert, type VinDocType } from "@/lib/vin-chat";

const SUGGESTIONS_GENERIC = [
  "Draft a proposal intro for a brand redesign",
  "Write a polite overdue invoice reminder",
  "How do I share an invoice link?",
  "Explain GST 18% on ₹50,000",
];
const SUGGESTIONS_INVOICE = [
  "Write friendly notes for this invoice",
  "Draft a payment reminder email",
  "Summarize what this invoice bills for",
];
const SUGGESTIONS_PROPOSAL = [
  "Draft an Executive Summary section",
  "Write a Scope of Work based on the line items",
  "Suggest Terms & Conditions for this proposal",
];

function localKey(sessionKey: string) { return `vin:chat:${sessionKey}`; }
function loadLocal(sessionKey: string): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(localKey(sessionKey));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as UIMessage[]) : [];
  } catch { return []; }
}
function saveLocal(sessionKey: string, messages: UIMessage[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(localKey(sessionKey), JSON.stringify(messages)); } catch { /* quota */ }
}

export function ChatbotWidget() {
  const binding = useVinBinding();
  const [open, setOpen] = useState(false);

  const sessionKey = binding?.sessionKey ?? "global";

  // Remount the whole session when sessionKey changes so useChat resets cleanly.
  return (
    <>
      <Launcher open={open} onToggle={() => setOpen((v) => !v)} />
      {open && (
        <ChatSession
          key={sessionKey}
          sessionKey={sessionKey}
          binding={binding}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function Launcher({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={open ? "Close assistant" : "Open assistant"}
      className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-white shadow-2xl shadow-primary/40 ring-1 ring-white/20 transition-transform hover:scale-105 active:scale-95"
    >
      <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl -z-10 animate-pulse" />
      {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
    </button>
  );
}

type Attachment = { name: string; mime: string; dataUrl: string };

function ChatSession({
  sessionKey,
  binding,
  onClose,
}: {
  sessionKey: string;
  binding: VinBinding | null;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dbDocType: VinDocType | null = binding?.docType ?? null;
  const dbDocId = binding?.docId ?? null;

  // Seed from local (instant), then hydrate from DB when signed in.
  const initial = useMemo(() => loadLocal(sessionKey), [sessionKey]);

  // Ref so transport reads latest context without recreating the chat.
  const contextRef = useRef<string>(binding?.contextText ?? "");
  useEffect(() => { contextRef.current = binding?.contextText ?? ""; }, [binding?.contextText]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, id, body }) => ({
          body: {
            id,
            messages,
            context: contextRef.current || undefined,
            ...body,
          },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: `vin-${sessionKey}`,
    transport,
    messages: initial,
  });

  // Hydrate from DB once per session; DB history wins over local snapshot.
  const hydratedRef = useRef(false);
  useEffect(() => {
    hydratedRef.current = false;
    if (!dbDocType || !dbDocId) return;
    let cancelled = false;
    (async () => {
      try {
        const remote = await loadVinChat(dbDocType, dbDocId);
        if (cancelled) return;
        if (remote.length > 0) setMessages(remote);
      } finally {
        hydratedRef.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, [dbDocType, dbDocId, setMessages]);

  // Persist to local always; persist to DB (debounced) when we have a bound doc.
  useEffect(() => {
    saveLocal(sessionKey, messages);
    if (!dbDocType || !dbDocId) return;
    if (status === "streaming" || status === "submitted") return;
    const t = setTimeout(() => { saveVinChat(dbDocType, dbDocId, messages); }, 400);
    return () => clearTimeout(t);
  }, [messages, sessionKey, dbDocType, dbDocId, status]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const busy = status === "submitted" || status === "streaming";

  const submit = async (text: string) => {
    const t = text.trim();
    if ((!t && attachments.length === 0) || busy) return;
    if (attachments.length > 0) {
      const parts: UIMessage["parts"] = [
        ...attachments.map((a) => ({
          type: "file" as const,
          mediaType: a.mime,
          url: a.dataUrl,
          filename: a.name,
        })),
        { type: "text" as const, text: t || "Please read this document (OCR any images/PDF) and answer or draft based on it." },
      ];
      await sendMessage({ role: "user", parts });
    } else {
      await sendMessage({ text: t });
    }
    setInput("");
    setAttachments([]);
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked: Attachment[] = [];
    for (const f of Array.from(files).slice(0, 3)) {
      if (f.size > 8 * 1024 * 1024) {
        alert(`${f.name} is over 8MB and was skipped.`);
        continue;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(f);
      });
      picked.push({ name: f.name, mime: f.type || "application/octet-stream", dataUrl });
    }
    setAttachments((a) => [...a, ...picked].slice(0, 5));
  };

  const clearHistory = () => {
    if (!confirm("Clear this chat?")) return;
    setMessages([]);
    if (typeof window !== "undefined") window.localStorage.removeItem(localKey(sessionKey));
    if (dbDocType && dbDocId) clearVinChat(dbDocType, dbDocId).catch(() => {});
  };

  const handleInsert = async (targetLabel: string) => {
    if (!binding?.docType || !binding.docId || !binding.getSnapshot) return;
    try {
      await snapshotVinInsert(binding.docType, binding.docId, binding.getSnapshot(), targetLabel);
    } catch {
      // non-fatal
    }
  };

  const suggestions = !binding
    ? SUGGESTIONS_GENERIC
    : binding.sessionKey.startsWith("invoice:")
      ? SUGGESTIONS_INVOICE
      : SUGGESTIONS_PROPOSAL;

  return (
    <div className="fixed bottom-24 right-5 z-[60] flex h-[600px] max-h-[calc(100vh-8rem)] w-[400px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Vin · Vinshare Assistant</div>
          <div className="text-[11px] text-muted-foreground truncate">
            {binding ? `Context: ${binding.sessionLabel}` : "Proposals, invoices & app help"}
          </div>
        </div>
        <button
          onClick={clearHistory}
          title="Clear chat"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onClose}
          title="Close"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              Hi! I'm <b>Vin</b>.{" "}
              {binding
                ? `I'm looking at your ${binding.sessionLabel.toLowerCase()}. Ask me to draft sections, notes, or reminders — or attach a document to reference.`
                : "I can draft proposal sections, write invoice notes and reminders, explain GST, and walk you through Vinshare. Open an invoice or proposal to give me its context."}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageRow
            key={m.id}
            message={m}
            targets={m.role === "assistant" ? binding?.targets : undefined}
            onInsert={handleInsert}
          />
        ))}

        {status === "submitted" && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
            <span className="ml-2 text-xs">Thinking…</span>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
            {error.message || "Something went wrong. Please try again."}
          </div>
        )}
      </div>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="border-t border-border/60 px-3 py-2 flex flex-wrap gap-1.5">
          {attachments.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-[11px]">
              <FileIcon className="h-3 w-3" />
              <span className="max-w-[140px] truncate">{a.name}</span>
              <button
                onClick={() => setAttachments((arr) => arr.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => { e.preventDefault(); submit(input); }}
        className="border-t border-border/60 bg-background/70 p-2"
      >
        <div className="flex items-end gap-2 rounded-xl border border-border/60 bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/40">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach a document"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,text/plain,.md,.csv"
            multiple
            className="hidden"
            onChange={(e) => { onPickFiles(e.target.files); e.target.value = ""; }}
          />
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder={binding ? `Ask Vin about this ${binding.sessionLabel.split(" ")[0].toLowerCase()}…` : "Ask Vin anything…"}
            className="max-h-32 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={busy || (!input.trim() && attachments.length === 0)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageRow({
  message,
  targets,
  onInsert,
}: {
  message: UIMessage;
  targets?: VinBinding["targets"];
  onInsert?: (targetLabel: string) => void | Promise<void>;
}) {
  const isUser = message.role === "user";
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("").trim();
  const files = message.parts.filter((p) => p.type === "file") as Array<{ type: "file"; filename?: string; url?: string; mediaType?: string }>;
  const [inserted, setInserted] = useState<string | null>(null);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[85%] space-y-1 rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
            : "max-w-[92%] text-sm leading-relaxed text-foreground"
        }
      >
        {files.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 ${isUser ? "" : "mb-1"}`}>
            {files.map((f, i) => (
              <span key={i} className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] ${isUser ? "bg-white/15" : "bg-muted"}`}>
                <FileIcon className="h-3 w-3" /> {f.filename || "attachment"}
              </span>
            ))}
          </div>
        )}
        {isUser ? (
          <span className="whitespace-pre-wrap">{text}</span>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-ol:my-1.5 prose-pre:my-2">
            <ReactMarkdown>{text || "…"}</ReactMarkdown>
          </div>
        )}
        {!isUser && targets && targets.length > 0 && text && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ClipboardPaste className="h-3 w-3" /> Insert into
            </span>
            {targets.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  t.apply(stripMarkdown(text));
                  setInserted(t.id);
                  setTimeout(() => setInserted(null), 1600);
                  // Fire-and-forget: also snapshot a new document version so
                  // this AI-driven edit is reviewable later in Versions.
                  onInsert?.(t.label);
                }}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                  inserted === t.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 bg-background hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {inserted === t.id ? "Inserted ✓" : t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Light markdown->plain conversion for pasting into plain-text fields. */
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?|```/g, ""))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*>\s?/gm, "")
    .trim();
}
