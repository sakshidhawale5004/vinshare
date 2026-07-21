import { useEffect, useRef, useSyncExternalStore } from "react";

export type VinInsertTarget = {
  id: string;
  label: string;
  /** Called with the assistant text the user chose to insert. */
  apply: (text: string) => void;
};

export type VinBinding = {
  /** Stable key that groups the chat history — usually the doc id. */
  sessionKey: string;
  /** Short human label shown in the chat header (e.g. "Invoice INV-2026-042"). */
  sessionLabel: string;
  /** Serialized doc context injected into the system prompt. */
  contextText: string;
  /** Where Vin can insert drafted text on this page. */
  targets: VinInsertTarget[];
  /** For DB-backed chat history + Vin-insert version snapshots. */
  docType?: "invoice" | "proposal";
  docId?: string;
  /** Returns the current doc for version snapshots after Vin insertions. */
  getSnapshot?: () => unknown;
};

type Store = {
  binding: VinBinding | null;
  subs: Set<() => void>;
};

const store: Store = { binding: null, subs: new Set() };

function setBinding(b: VinBinding | null) {
  store.binding = b;
  store.subs.forEach((f) => f());
}

function subscribe(cb: () => void) {
  store.subs.add(cb);
  return () => { store.subs.delete(cb); };
}

/** Chatbot widget reads this to know the current page's doc + insert callbacks. */
export function useVinBinding(): VinBinding | null {
  return useSyncExternalStore(subscribe, () => store.binding, () => null);
}

/** Editor pages call this to register their doc context and insert targets. */
export function useVinBind(binding: VinBinding | null) {
  const ref = useRef(binding);
  ref.current = binding;
  useEffect(() => {
    setBinding(binding);
    return () => {
      // Only clear if we're still the current binding.
      if (store.binding === binding) setBinding(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binding?.sessionKey]);
  // Push updates when contextText or targets change without full re-register churn.
  useEffect(() => {
    if (!binding) return;
    setBinding(binding);
  }, [binding]);
}
