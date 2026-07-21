import { motion } from "framer-motion";

export function SharedDocView({
  brand, kind, title, children,
}: { brand: any; kind: "invoice" | "proposal"; title: string; children: React.ReactNode }) {
  const b = {
    companyName: brand?.companyName ?? "Vinshare",
    primary: brand?.primary ?? "#0ea5e9",
    accent: brand?.accent ?? "#8b5cf6",
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50">
      <div
        className="absolute inset-x-0 top-0 h-64 opacity-20 blur-3xl -z-10"
        style={{ background: `radial-gradient(circle at 30% 30%, ${b.primary}, transparent 60%), radial-gradient(circle at 70% 40%, ${b.accent}, transparent 60%)` }}
      />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Shared {kind}</div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{title}</h1>
          </div>
          <div className="text-xs text-slate-500 text-right">
            <div className="font-semibold text-slate-700">{b.companyName}</div>
            <div>Sent via Vinshare</div>
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {children}
        </motion.div>
        <div className="mt-8 text-center text-[11px] text-slate-400">
          Read-only preview · Contact {b.companyName} with any questions.
        </div>
      </div>
    </div>
  );
}
