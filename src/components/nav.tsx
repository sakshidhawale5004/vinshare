import { Link } from "@tanstack/react-router";
import { useBrand } from "@/lib/brand";
import { useState } from "react";
import { User } from "lucide-react";

export function Nav() {
  const { brand } = useBrand();
  const [open, setOpen] = useState(false);
  const email = "vinshare";

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 bg-background/70 backdrop-blur-xl border-b border-border/60">
      <Link to="/dashboard" className="flex items-center gap-2.5 group">
        <div
          className="size-9 rounded-xl grid place-items-center shadow-lg transition-transform group-hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}
        >
          <span className="text-white font-black text-lg">V</span>
        </div>
        <div className="leading-tight">
          <div className="font-black tracking-tight text-lg">Vinshare</div>
          <div className="text-[10px] font-mono text-muted-foreground -mt-0.5">PROPOSAL · INVOICE · PAID</div>
        </div>
      </Link>
      <div className="hidden md:flex items-center gap-1 text-sm font-medium bg-muted/50 rounded-full px-1.5 py-1.5 border border-border/60">
        <Link to="/" className="px-4 py-1.5 rounded-full hover:bg-background transition-colors" activeProps={{ className: "px-4 py-1.5 rounded-full bg-background shadow-sm" }} activeOptions={{ exact: true }}>Home</Link>
        <Link to="/dashboard" className="px-4 py-1.5 rounded-full hover:bg-background transition-colors" activeProps={{ className: "px-4 py-1.5 rounded-full bg-background shadow-sm" }}>Dashboard</Link>
        <Link to="/history" className="px-4 py-1.5 rounded-full hover:bg-background transition-colors" activeProps={{ className: "px-4 py-1.5 rounded-full bg-background shadow-sm" }}>History</Link>
        <Link to="/clients" className="px-4 py-1.5 rounded-full hover:bg-background transition-colors" activeProps={{ className: "px-4 py-1.5 rounded-full bg-background shadow-sm" }}>Clients</Link>
        <Link to="/invoice" className="px-4 py-1.5 rounded-full hover:bg-background transition-colors" activeProps={{ className: "px-4 py-1.5 rounded-full bg-background shadow-sm" }}>Invoice</Link>
        <Link to="/proposal" className="px-4 py-1.5 rounded-full hover:bg-background transition-colors" activeProps={{ className: "px-4 py-1.5 rounded-full bg-background shadow-sm" }}>Proposal</Link>
        <Link to="/settings" className="px-4 py-1.5 rounded-full hover:bg-background transition-colors" activeProps={{ className: "px-4 py-1.5 rounded-full bg-background shadow-sm" }}>Brand</Link>
      </div>
      <div className="relative">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 bg-card border border-border rounded-full pl-2 pr-3 py-1.5 hover:bg-muted transition-colors">
          <div className="size-7 rounded-full grid place-items-center text-white text-xs font-bold" style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>
            {email.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium hidden sm:inline max-w-[140px] truncate">{email}</span>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl p-1.5" onMouseLeave={() => setOpen(false)}>
            <div className="px-3 py-2 text-xs text-muted-foreground truncate">{email}</div>
            <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted"><User className="size-4" /> Brand settings</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
