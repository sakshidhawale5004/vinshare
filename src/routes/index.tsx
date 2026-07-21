import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Nav } from "@/components/nav";
import { Reveal } from "@/components/reveal";
import { HeroScene } from "@/components/hero-scene";
import { useBrand } from "@/lib/brand";
import {
  FileText, Zap, Shield, Palette, Download, Layers,
  ArrowRight, Check, Sparkles, BarChart3, Globe, Users, Send
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function GradientMesh() {
  const { brand } = useBrand();
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-40 blur-[120px]"
        style={{ background: `radial-gradient(circle, ${brand.primary}, transparent 70%)` }}
      />
      <div
        className="absolute top-20 -right-20 w-[500px] h-[500px] rounded-full opacity-30 blur-[100px]"
        style={{ background: `radial-gradient(circle, ${brand.accent}, transparent 70%)` }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

function Hero() {
  const { brand } = useBrand();
  return (
    <section className="relative pt-8 pb-24 md:pb-32">
      <GradientMesh />
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono mb-6"
            style={{ borderColor: `${brand.primary}30`, background: `${brand.primary}08`, color: brand.primary }}
          >
            <Sparkles className="size-3" />
            <span>V3.0 · PROPOSAL + INVOICE + PDF</span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.02] mb-6">
            <span className="block">Proposals to paid,</span>
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}
            >
              in one flow.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-[52ch] mb-10 leading-relaxed">
            <span className="font-semibold text-foreground">Vinshare</span> is proposal & invoice automation for
            modern businesses. Draft beautiful proposals, generate GST-ready invoices, and export
            branded PDFs in one click.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/invoice"
              className="group inline-flex items-center gap-2 text-white px-6 py-3.5 rounded-2xl font-semibold shadow-2xl transition-transform hover:scale-[1.03] active:scale-95"
              style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})`, boxShadow: `0 20px 40px -12px ${brand.primary}80` }}
            >
              Create Invoice <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/proposal"
              className="inline-flex items-center gap-2 bg-card border border-border px-6 py-3.5 rounded-2xl font-semibold hover:bg-muted transition-colors"
            >
              <FileText className="size-4" /> Build a Proposal
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[
              ["10k+", "Docs Generated"],
              ["4.9★", "Rated by Ops"],
              ["<3s", "PDF Export"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="text-2xl font-black tracking-tight">{n}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{l}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative aspect-square lg:aspect-[4/5] w-full"
        >
          <HeroScene primary={brand.primary} accent={brand.accent} />
        </motion.div>
      </div>
    </section>
  );
}

function Marquee() {
  const logos = ["ARCLINE", "NORTHWIND", "OCTAVE", "MERIDIAN", "PARADIGM", "STELLARIS", "VANTAGE", "ZENITH"];
  return (
    <section className="border-y border-border py-8 bg-muted/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest text-center">
          Trusted by 10,000+ studios, agencies, and freelancers
        </p>
      </div>
      <div className="relative">
        <motion.div
          className="flex gap-16 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {[...logos, ...logos, ...logos].map((l, i) => (
            <span key={i} className="text-2xl font-black tracking-tighter text-muted-foreground/50">{l}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  const { brand } = useBrand();
  const features = [
    { icon: FileText, title: "Proposal Builder", desc: "Sections, itemized pricing, terms. Rich, interactive proposals your clients will actually read." },
    { icon: Layers, title: "Invoice Engine", desc: "Line items, taxes, discounts, totals. GST-ready with automatic calculations." },
    { icon: Download, title: "1-Click PDF", desc: "Beautifully branded PDF exports in under 3 seconds. Every time." },
    { icon: Palette, title: "Brand Everything", desc: "Your logo, your colors, your terms. Save reusable templates that ship your identity." },
    { icon: Shield, title: "GST Compliant", desc: "Built for India-first businesses. GSTIN, HSN, and tax split ready out of the box." },
    { icon: Zap, title: "Fast by Default", desc: "Zero setup, no accounts required. Start shipping documents in the next 30 seconds." },
  ];
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="max-w-3xl mb-16">
          <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: brand.primary }}>
            /// Features
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.05]">
            Every part of your paperwork,{" "}
            <span className="italic font-light">redesigned.</span>
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="group relative p-8 rounded-3xl bg-card border border-border h-full overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `radial-gradient(400px circle at 50% 0%, ${brand.primary}10, transparent 60%)` }}
                />
                <div
                  className="relative size-12 rounded-2xl grid place-items-center mb-6"
                  style={{ background: `linear-gradient(135deg, ${brand.primary}20, ${brand.accent}20)`, color: brand.primary }}
                >
                  <f.icon className="size-6" />
                </div>
                <h3 className="relative text-xl font-bold mb-2 tracking-tight">{f.title}</h3>
                <p className="relative text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function LivePreview() {
  const { brand } = useBrand();
  const wrap = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ x: 8, y: -8 });
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      setT({ x: 8 - py * 14, y: -8 - px * 14 });
    };
    const onLeave = () => setT({ x: 8, y: -8 });
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <GradientMesh />
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: brand.primary }}>
            /// Live Preview
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
            Documents that <span className="italic font-light">move.</span>
          </h2>
          <p className="text-lg text-muted-foreground mt-6">
            Move your cursor. Every Vinshare document responds — even in preview.
          </p>
        </Reveal>
        <div ref={wrap} className="perspective-2000 max-w-4xl mx-auto">
          <div
            className="transition-transform duration-300 ease-out"
            style={{ transform: `rotateX(${t.x}deg) rotateY(${t.y}deg)` }}
          >
            <div className="bg-white rounded-3xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
              <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${brand.primary}, ${brand.accent})` }} />
              <div className="p-10 grid md:grid-cols-[1fr_auto] gap-6 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="size-14 rounded-2xl grid place-items-center text-white text-xl font-black shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>
                    {brand.companyName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-slate-900">{brand.companyName}</div>
                    <div className="text-sm text-slate-500">{brand.tagline}</div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">{brand.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black tracking-tight" style={{ color: brand.primary }}>INVOICE</div>
                  <div className="text-xs font-mono text-slate-400 mt-1">#{brand.invoicePrefix}-2026-0341</div>
                </div>
              </div>
              <div className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Billed To</div>
                    <div className="font-semibold text-slate-900">Arcline Ventures Pvt. Ltd.</div>
                    <div className="text-slate-500">Bengaluru, KA · GSTIN 29XXXX1234</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Due</div>
                    <div className="font-semibold text-slate-900">15 Aug 2026</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="grid grid-cols-[1fr_60px_100px_100px] text-xs uppercase tracking-widest text-white p-3"
                    style={{ background: `linear-gradient(90deg, ${brand.primary}, ${brand.accent})` }}>
                    <span>Description</span><span className="text-right">Qty</span><span className="text-right">Rate</span><span className="text-right">Total</span>
                  </div>
                  {[
                    ["Q3 brand refresh", 1, 240000],
                    ["Design system audit", 1, 84000],
                    ["Motion guidelines", 1, 36000],
                  ].map(([d, q, r], i) => (
                    <div key={i} className="grid grid-cols-[1fr_60px_100px_100px] p-3 text-sm border-t border-slate-100 text-slate-700">
                      <span>{d}</span>
                      <span className="text-right">{q}</span>
                      <span className="text-right font-mono">{brand.currency}{r.toLocaleString("en-IN")}</span>
                      <span className="text-right font-mono font-semibold">{brand.currency}{r.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <div className="rounded-2xl px-6 py-4 text-white min-w-[240px]"
                    style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs uppercase tracking-widest opacity-80">Total Due</span>
                      <span className="text-2xl font-black">{brand.currency}4,24,800</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  const { brand } = useBrand();
  const steps = [
    { n: "01", title: "Draft the Proposal", desc: "Sections, pricing, terms. Modular building blocks.", icon: FileText },
    { n: "02", title: "Client Approves", desc: "Share a live URL. Sign-off recorded and timestamped.", icon: Send },
    { n: "03", title: "Convert to Invoice", desc: "One click. All line items carry forward. GST auto-computed.", icon: Zap },
    { n: "04", title: "Get Paid", desc: "Branded PDF, bank details attached. Payment reminders on autopilot.", icon: Check },
  ];
  return (
    <section id="workflow" className="py-24 md:py-32 bg-muted/40">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="max-w-3xl mb-16">
          <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: brand.primary }}>
            /// Workflow
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
            Four steps, <span className="italic font-light">start to paid.</span>
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 100}>
              <div className="relative p-8 rounded-3xl bg-card border border-border h-full">
                <div className="text-5xl font-black tracking-tighter mb-6 opacity-10">{s.n}</div>
                <div className="size-11 rounded-xl grid place-items-center mb-4" style={{ background: brand.primary, color: "white" }}>
                  <s.icon className="size-5" />
                </div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const { brand } = useBrand();
  const plans = [
    { name: "Starter", price: "Free", desc: "For solo operators", features: ["5 invoices / month", "3 proposals / month", "Branded PDF export", "Local template save"] },
    { name: "Studio", price: "₹899", desc: "For growing teams", features: ["Unlimited invoices & proposals", "Custom logo & colors", "Multiple templates", "GST + HSN + TDS", "Priority support"], featured: true },
    { name: "Agency", price: "₹2,499", desc: "For agencies at scale", features: ["Everything in Studio", "Team seats (5)", "Client portal", "API access", "Dedicated manager"] },
  ];
  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: brand.primary }}>/// Pricing</div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
            Pricing that <span className="italic font-light">scales with you.</span>
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 80}>
              <div
                className={`p-8 rounded-3xl border h-full flex flex-col ${p.featured ? "text-white shadow-2xl border-transparent" : "bg-card border-border"}`}
                style={p.featured ? { background: `linear-gradient(160deg, ${brand.primary}, ${brand.accent})`, boxShadow: `0 30px 60px -20px ${brand.primary}80` } : {}}
              >
                <div className={`text-sm font-semibold mb-1 ${p.featured ? "opacity-80" : "text-muted-foreground"}`}>{p.name}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-black tracking-tighter">{p.price}</span>
                  {p.price !== "Free" && <span className={p.featured ? "opacity-70" : "text-muted-foreground"}>/mo</span>}
                </div>
                <div className={`text-sm mb-6 ${p.featured ? "opacity-80" : "text-muted-foreground"}`}>{p.desc}</div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`size-4 mt-0.5 shrink-0 ${p.featured ? "opacity-90" : ""}`} style={!p.featured ? { color: brand.primary } : {}} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/invoice"
                  className={`text-center py-3 rounded-xl font-semibold transition-transform hover:scale-[1.02] ${p.featured ? "bg-white text-slate-900" : "bg-foreground text-background"}`}
                >
                  Get Started
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const { brand } = useBrand();
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <Reveal>
          <div
            className="relative rounded-[2rem] p-12 md:p-20 text-white text-center overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}
          >
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="relative">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
                Ship your first invoice<br/>in the next 60 seconds.
              </h2>
              <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-10">
                No signup, no credit card. Try Vinshare right now and export your first PDF.
              </p>
              <Link to="/invoice"
                className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:scale-[1.03] transition-transform">
                Create Invoice Now <ArrowRight className="size-5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  const { brand } = useBrand();
  return (
    <footer className="border-t border-border py-12 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl grid place-items-center text-white font-black"
            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>V</div>
          <div>
            <div className="font-black tracking-tight">Vinshare</div>
            <div className="text-xs text-muted-foreground">© 2026 — Proposal & Invoice Automation</div>
          </div>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/invoice" className="hover:text-foreground">Invoice</Link>
          <Link to="/proposal" className="hover:text-foreground">Proposal</Link>
          <Link to="/settings" className="hover:text-foreground">Brand</Link>
        </div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Marquee />
      <Features />
      <LivePreview />
      <Workflow />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
