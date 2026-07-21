import { createContext, useContext, useEffect, useRef, useState, type ReactNode, createElement } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BrandSettings = {
  companyName: string;
  tagline: string;
  logoDataUrl: string | null;
  primary: string;
  accent: string;
  textDark: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  gstin: string;
  currency: string;
  invoicePrefix: string;
  proposalPrefix: string;
  bankDetails: string;
  defaultTerms: string;
  defaultNotes: string;
  templateStyle: "minimal" | "modern" | "bold";
};

export const defaultBrand: BrandSettings = {
  companyName: "Vinshare Studio",
  tagline: "Design that ships.",
  logoDataUrl: null,
  primary: "#5B5BF7",
  accent: "#12E29A",
  textDark: "#0B0B1A",
  address: "42 MG Road, Bengaluru, KA 560001",
  email: "hello@vinshare.co",
  phone: "+91 98765 43210",
  website: "vinshare.co",
  gstin: "29ABCDE1234F1Z5",
  currency: "₹",
  invoicePrefix: "INV",
  proposalPrefix: "PRP",
  bankDetails: "Vinshare Studio Pvt Ltd\nHDFC Bank • A/C 5011 2233 4455\nIFSC HDFC0000123",
  defaultTerms:
    "1. Payment due within 15 days of invoice date.\n2. Late payments incur 1.5% monthly interest.\n3. All disputes subject to Bengaluru jurisdiction.",
  defaultNotes: "Thank you for your business. We appreciate the partnership.",
  templateStyle: "modern",
};

const KEY = "vinshare.brand.v1";

const Ctx = createContext<{
  brand: BrandSettings;
  update: (patch: Partial<BrandSettings>) => void;
  reset: () => void;
} | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandSettings>(defaultBrand);
  const userIdRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from local storage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setBrand({ ...defaultBrand, ...JSON.parse(raw) });
    } catch {}
  }, []);

  // Sync with cloud when signed in
  useEffect(() => {
    const load = async (uid: string) => {
      const { data } = await supabase.from("brand_settings").select("settings").eq("user_id", uid).maybeSingle();
      if (data?.settings) {
        setBrand({ ...defaultBrand, ...(data.settings as Partial<BrandSettings>) });
      }
    };
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { userIdRef.current = data.user.id; load(data.user.id); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        userIdRef.current = session.user.id;
        load(session.user.id);
      } else if (event === "SIGNED_OUT") {
        userIdRef.current = null;
      }
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const persist = (next: BrandSettings) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    if (userIdRef.current) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const uid = userIdRef.current;
      saveTimer.current = setTimeout(() => {
        supabase.from("brand_settings").upsert({ user_id: uid, settings: next as any, updated_at: new Date().toISOString() });
      }, 600);
    }
  };

  const update = (patch: Partial<BrandSettings>) => {
    setBrand((b) => {
      const next = { ...b, ...patch };
      persist(next);
      return next;
    });
  };
  const reset = () => {
    setBrand(defaultBrand);
    persist(defaultBrand);
    try { localStorage.removeItem(KEY); } catch {}
  };
  return createElement(Ctx.Provider, { value: { brand, update, reset } }, children);
}

export function useBrand() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBrand must be used inside BrandProvider");
  return v;
}
