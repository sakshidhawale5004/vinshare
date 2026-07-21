import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Nav } from "@/components/nav";
import { useBrand, defaultBrand, type BrandSettings } from "@/lib/brand";
import { Input, Textarea } from "./invoice";
import { Upload, RotateCcw, Palette, Save, Check } from "lucide-react";
import { useRef, useState } from "react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

const PRESETS: { name: string; primary: string; accent: string }[] = [
  { name: "Indigo Mint", primary: "#5B5BF7", accent: "#12E29A" },
  { name: "Sunset", primary: "#F43F5E", accent: "#F59E0B" },
  { name: "Deep Ocean", primary: "#0EA5E9", accent: "#8B5CF6" },
  { name: "Forest", primary: "#059669", accent: "#84CC16" },
  { name: "Noir", primary: "#111827", accent: "#F59E0B" },
  { name: "Royal", primary: "#7C3AED", accent: "#EC4899" },
];

const TEMPLATES: { id: BrandSettings["templateStyle"]; name: string; desc: string }[] = [
  { id: "minimal", name: "Minimal", desc: "Clean, no dividers, generous whitespace" },
  { id: "modern", name: "Modern", desc: "Gradient accents, structured, default" },
  { id: "bold", name: "Bold", desc: "Full-bleed color, editorial typography" },
];

function SettingsPage() {
  const { brand, update, reset } = useBrand();
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onLogo = (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => update({ logoDataUrl: reader.result as string });
    reader.readAsDataURL(f);
  };

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Nav />
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">/// Brand & Templates</div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Customize Your Brand</h1>
            <p className="text-muted-foreground mt-2">All changes save automatically to this device and are used in every invoice and proposal PDF.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { reset(); flash(); }}
              className="inline-flex items-center gap-2 bg-card border border-border px-4 py-2.5 rounded-xl font-semibold hover:bg-muted transition-colors">
              <RotateCcw className="size-4" /> Reset
            </button>
            <button onClick={flash}
              className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg"
              style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>
              {saved ? <Check className="size-4" /> : <Save className="size-4" />} {saved ? "Saved" : "Saved automatically"}
            </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card title="Logo">
              <div className="flex items-center gap-4">
                <div className="size-20 rounded-2xl bg-background border border-border grid place-items-center overflow-hidden">
                  {brand.logoDataUrl
                    ? <img src={brand.logoDataUrl} alt="logo" className="w-full h-full object-contain" />
                    : <div className="text-white text-2xl font-black size-full grid place-items-center" style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>{brand.companyName.charAt(0)}</div>
                  }
                </div>
                <div className="flex flex-col gap-2">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0] || null)} />
                  <button onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg font-semibold text-sm">
                    <Upload className="size-4" /> Upload Logo
                  </button>
                  {brand.logoDataUrl && (
                    <button onClick={() => update({ logoDataUrl: null })}
                      className="text-xs text-muted-foreground hover:text-destructive">Remove logo</button>
                  )}
                </div>
              </div>
            </Card>

            <Card title="Colors">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <ColorField label="Primary" value={brand.primary} onChange={(v) => update({ primary: v })} />
                <ColorField label="Accent" value={brand.accent} onChange={(v) => update({ accent: v })} />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Presets</div>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button key={p.name} onClick={() => update({ primary: p.primary, accent: p.accent })}
                      className="group rounded-xl border border-border p-3 hover:border-foreground/30 transition-colors text-left">
                      <div className="h-10 rounded-lg mb-2" style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.accent})` }} />
                      <div className="text-xs font-semibold">{p.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="Template Layout">
              <div className="grid gap-2">
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => update({ templateStyle: t.id })}
                    className={`text-left rounded-xl border p-4 transition-all ${brand.templateStyle === t.id ? "border-foreground shadow-md" : "border-border hover:border-foreground/30"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.desc}</div>
                      </div>
                      {brand.templateStyle === t.id && <Check className="size-5" style={{ color: brand.primary }} />}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card title="Company">
              <Field label="Company Name"><Input value={brand.companyName} onChange={(v) => update({ companyName: v })} /></Field>
              <Field label="Tagline"><Input value={brand.tagline} onChange={(v) => update({ tagline: v })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email"><Input value={brand.email} onChange={(v) => update({ email: v })} /></Field>
                <Field label="Phone"><Input value={brand.phone} onChange={(v) => update({ phone: v })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Website"><Input value={brand.website} onChange={(v) => update({ website: v })} /></Field>
                <Field label="GSTIN"><Input value={brand.gstin} onChange={(v) => update({ gstin: v })} /></Field>
              </div>
              <Field label="Address"><Textarea rows={2} value={brand.address} onChange={(v) => update({ address: v })} /></Field>
            </Card>

            <Card title="Document Defaults">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Currency"><Input value={brand.currency} onChange={(v) => update({ currency: v })} /></Field>
                <Field label="Invoice #"><Input value={brand.invoicePrefix} onChange={(v) => update({ invoicePrefix: v })} /></Field>
                <Field label="Proposal #"><Input value={brand.proposalPrefix} onChange={(v) => update({ proposalPrefix: v })} /></Field>
              </div>
              <Field label="Bank Details"><Textarea rows={3} value={brand.bankDetails} onChange={(v) => update({ bankDetails: v })} /></Field>
              <Field label="Default Terms"><Textarea rows={4} value={brand.defaultTerms} onChange={(v) => update({ defaultTerms: v })} /></Field>
              <Field label="Default Notes"><Textarea rows={2} value={brand.defaultNotes} onChange={(v) => update({ defaultNotes: v })} /></Field>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-bold tracking-tight mb-4 flex items-center gap-2"><Palette className="size-4 text-muted-foreground" />{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>
      <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="size-10 rounded-md border-0 cursor-pointer bg-transparent" />
        <input value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent px-2 py-1.5 text-sm font-mono focus:outline-none" />
      </div>
    </label>
  );
}
