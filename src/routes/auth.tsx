import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useBrand } from "@/lib/brand";
import { Mail, Lock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Vinshare" },
      { name: "description", content: "Sign in to Vinshare to manage invoices, proposals, and clients across all your devices." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { brand } = useBrand();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("vinshare");
  const [pw, setPw] = useState("vinshare@2026");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      if (email === "vinshare" && pw === "vinshare@2026") {
        window.localStorage.setItem("vinshare_bypass", "true");
        navigate({ to: "/dashboard", replace: true });
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password: pw,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name || undefined } },
        });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setErr(null);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) setErr((result.error as any)?.message ?? "Google sign-in failed");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 -z-10 opacity-60" style={{ background: `radial-gradient(60% 50% at 20% 20%, ${brand.primary}33, transparent), radial-gradient(60% 50% at 80% 80%, ${brand.accent}33, transparent)` }} />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl"
      >
        <Link to="/" className="flex items-center gap-2.5 mb-6">
          <div className="size-10 rounded-xl grid place-items-center shadow-lg" style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>
            <span className="text-white font-black text-lg">V</span>
          </div>
          <div>
            <div className="font-black tracking-tight text-lg">Vinshare</div>
            <div className="text-[10px] font-mono text-muted-foreground -mt-0.5">PROPOSAL · INVOICE · PAID</div>
          </div>
        </Link>
        <h1 className="text-3xl font-black tracking-tight">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          {mode === "signin" ? "Sign in to sync your brand, templates and history." : "Save proposals, invoices and clients across devices."}
        </p>


        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <label className="block">
              <div className="text-xs font-medium text-muted-foreground mb-1.5">Name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </label>
          )}
          <label className="block">
            <div className="text-xs font-medium text-muted-foreground mb-1.5">Username</div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input required type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </label>
          <label className="block">
            <div className="text-xs font-medium text-muted-foreground mb-1.5">Password</div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input required type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </label>
          {err && <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{err}</div>}
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-white rounded-xl py-2.5 font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground mt-6">
          {mode === "signin" ? "New to Vinshare?" : "Already have an account?"}{" "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-foreground hover:underline">
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
