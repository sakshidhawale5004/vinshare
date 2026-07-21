import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Nav } from "@/components/nav";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/lib/brand";
import { useState } from "react";
import { Plus, Search, Trash2, Save, Users, Mail, Phone, MapPin } from "lucide-react";
import { Field, Input, Textarea } from "@/lib/form-inputs";

export const Route = createFileRoute("/_authenticated/clients")({
  head: () => ({ meta: [{ title: "Clients — Vinshare" }] }),
  component: ClientsPage,
});

type Client = {
  id: string; user_id: string; name: string; email: string | null; phone: string | null; address: string | null; gstin: string | null; notes: string | null;
};

async function listClients() {
  const { data, error } = await supabase.from("clients").select("*").order("name");
  if (error) throw error;
  return (data || []) as Client[];
}

function ClientsPage() {
  const { brand } = useBrand();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Client> | null>(null);
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: listClients });

  const filtered = clients.filter((c) => !q || [c.name, c.email, c.phone].some((v) => (v || "").toLowerCase().includes(q.toLowerCase())));

  const save = async () => {
    if (!editing?.name) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const row = {
      id: editing.id || undefined,
      user_id: u.user.id,
      name: editing.name,
      email: editing.email || null,
      phone: editing.phone || null,
      address: editing.address || null,
      gstin: editing.gstin || null,
      notes: editing.notes || null,
    };
    await supabase.from("clients").upsert(row);
    qc.invalidateQueries({ queryKey: ["clients"] });
    setEditing(null);
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    await supabase.from("clients").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["clients"] });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">/// Customers</div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Clients</h1>
            <p className="text-muted-foreground mt-2">Everyone you've ever billed, in one place.</p>
          </div>
          <button onClick={() => setEditing({ name: "" })}
            className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg"
            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>
            <Plus className="size-4" /> Add client
          </button>
        </motion.div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…"
            className="w-full bg-card border border-border rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
            <Users className="size-10 mx-auto mb-3 opacity-50" />
            <div className="text-sm">No clients yet.</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-5 hover:border-foreground/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => setEditing(c)} className="text-left flex-1 min-w-0">
                    <div className="font-bold truncate">{c.name}</div>
                    {c.email && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate"><Mail className="size-3" />{c.email}</div>}
                    {c.phone && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Phone className="size-3" />{c.phone}</div>}
                    {c.address && <div className="text-xs text-muted-foreground flex items-start gap-1 mt-1 line-clamp-2"><MapPin className="size-3 mt-0.5 shrink-0" />{c.address}</div>}
                  </button>
                  <button onClick={() => remove(c.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 shrink-0"><Trash2 className="size-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {editing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm grid place-items-center z-50 p-4"
              onClick={() => setEditing(null)}>
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl">
                <h2 className="font-black text-xl mb-4">{editing.id ? "Edit client" : "New client"}</h2>
                <div className="space-y-3">
                  <Field label="Name"><Input value={editing.name || ""} onChange={(v) => setEditing({ ...editing, name: v })} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Email"><Input value={editing.email || ""} onChange={(v) => setEditing({ ...editing, email: v })} /></Field>
                    <Field label="Phone"><Input value={editing.phone || ""} onChange={(v) => setEditing({ ...editing, phone: v })} /></Field>
                  </div>
                  <Field label="GSTIN"><Input value={editing.gstin || ""} onChange={(v) => setEditing({ ...editing, gstin: v })} /></Field>
                  <Field label="Address"><Textarea rows={2} value={editing.address || ""} onChange={(v) => setEditing({ ...editing, address: v })} /></Field>
                  <Field label="Notes"><Textarea rows={2} value={editing.notes || ""} onChange={(v) => setEditing({ ...editing, notes: v })} /></Field>
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl font-semibold hover:bg-muted">Cancel</button>
                  <button onClick={save}
                    className="inline-flex items-center gap-2 text-white px-5 py-2 rounded-xl font-semibold shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>
                    <Save className="size-4" /> Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
