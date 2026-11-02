import { Link } from "react-router-dom";
import { Users, ClipboardList, LogOut, ExternalLink, Search, Compass, Layers, GraduationCap, ShieldCheck, PlayCircle, ShoppingBag, BedDouble, Bus, UtensilsCrossed } from "lucide-react";

const NAV_ITEMS = [
  { key: "applications", label: "Candidatures", icon: Users },
  { key: "requests", label: "Toutes les demandes", icon: ClipboardList },
  { key: "serviceRequests", label: "Abonnements clients", icon: Compass },
  { key: "serviceCatalog", label: "Catalogue services", icon: Layers },
  { key: "learning", label: "H-Learning", icon: PlayCircle },
  { key: "shopping", label: "H-Shopping", icon: ShoppingBag },
  { key: "lodging", label: "H-Logement", icon: BedDouble },
  { key: "transport", label: "H-Transport", icon: Bus },
  { key: "restaurant", label: "H-Restaurant", icon: UtensilsCrossed },
  { key: "trainingRequests", label: "Formations d'équipe", icon: GraduationCap },
  { key: "agents", label: "Agents", icon: ShieldCheck },
];

const GOLD = "var(--color-latte)"; // café au lait — suit le thème clair/sombre
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");

/**
 * Sidebar admin sombre aux couleurs H-Company.
 * Props optionnelles :
 *  - counts : { applications: 3, requests: 2 } → pastilles
 *  - onOpenPalette : ouvre la palette de commandes
 */
export default function AdminSidebar({ user, onSignOut, view, onViewChange, counts = {}, onOpenPalette }) {
  const displayName = user?.full_name || user?.email || "Administrateur";
  const initial = displayName ? displayName[0].toUpperCase() : "A";

  return (
    <>
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col bg-ink-fixed text-cream-fixed h-screen sticky top-0">
        <div className="px-6 pt-7 pb-6">
          <Link to="/" className="flex items-center gap-2 font-display text-[22px] leading-none tracking-tight">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GOLD }} />
            H-Company
          </Link>
        </div>

        {onOpenPalette && (
          <div className="px-3 mb-5">
            <button
              onClick={onOpenPalette}
              className="w-full flex items-center gap-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] px-3.5 py-2.5 text-sm text-cream-fixed/50 transition-colors"
            >
              <Search size={15} />
              <span className="flex-1 text-left">Rechercher…</span>
              <kbd className="text-[10px] font-sans border border-white/15 rounded-md px-1.5 py-0.5 text-cream-fixed/60">
                {isMac ? "⌘" : "Ctrl"} K
              </kbd>
            </button>
          </div>
        )}

        <p className="px-6 mb-2 text-[10px] uppercase tracking-[0.18em] text-cream-fixed/30 font-semibold">Gestion</p>
        <nav className="flex-1 px-3 space-y-1" aria-label="Navigation admin">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = view === key;
            const count = counts[key];
            return (
              <button
                key={key}
                onClick={() => onViewChange(key)}
                aria-current={active ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-colors ${
                  active ? "bg-white/[0.08] text-cream-fixed font-medium" : "text-cream-fixed/60 hover:bg-white/[0.04] hover:text-cream-fixed"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${active ? "ring-2 ring-latte ring-offset-2 ring-offset-ink-fixed" : ""}`}
                  style={active ? { color: GOLD } : undefined}
                >
                  <Icon size={17} strokeWidth={1.8} />
                </span>
                <span className="flex-1 text-left truncate">{label}</span>
                {count > 0 && (
                  <span
                    className="min-w-[20px] h-5 px-1.5 rounded-md text-[11px] font-semibold flex items-center justify-center text-ink-fixed"
                    style={{ backgroundColor: GOLD }}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-6 pt-4 space-y-4">
          <div className="flex items-center gap-3 px-1">
            <span className="relative w-11 h-11 rounded-full bg-white/[0.08] flex items-center justify-center font-display text-lg shrink-0">
              {initial}
              <span className="absolute right-2.5 bottom-3 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="flex items-center gap-1.5 text-xs text-cream-fixed/50">
                <span className="w-1.5 h-1.5 rounded-full bg-coffee-light" /> Administrateur
              </p>
            </div>
            <button
              onClick={onSignOut}
              title="Se déconnecter"
              aria-label="Se déconnecter"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-cream-fixed/50 hover:bg-white/[0.06] hover:text-latte transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-coffee hover:bg-coffee-dark text-white text-sm font-medium py-3 transition-colors"
          >
            Voir le site
            <ExternalLink size={14} />
          </Link>
        </div>
      </aside>

      {/* Mobile : barre du bas */}
      <nav
        aria-label="Navigation admin"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-ink-fixed text-cream-fixed flex overflow-x-auto border-t border-white/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = view === key;
          const count = counts[key];
          return (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 py-2.5 px-4 text-[11px] font-medium shrink-0 min-w-[76px] ${active ? "text-cream-fixed" : "text-cream-fixed/50"}`}
            >
              <span
                className={`absolute top-0 h-[2px] w-10 rounded-full ${active ? "opacity-100" : "opacity-0"}`}
                style={{ backgroundColor: GOLD }}
              />
              <span className="relative" style={active ? { color: GOLD } : undefined}>
                <Icon size={20} strokeWidth={1.8} />
                {count > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-ink-fixed text-[10px] font-semibold flex items-center justify-center"
                    style={{ backgroundColor: GOLD }}
                  >
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </span>
              {label}
            </button>
          );
        })}
      </nav>
    </>
  );
}