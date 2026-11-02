import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BedDouble, Bus, ChevronsLeft, ChevronsRight, GraduationCap, Home, Languages, LogOut, Menu, Mountain, Package, PanelLeft, Settings, ShoppingBag, UtensilsCrossed, Wallet, X } from "lucide-react";
import { useUser } from "../../context/Usercontext.jsx";
import { useRegion } from "../../context/RegionContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import Logo from "../ui/Logo.jsx";
import { homeFor } from "../../lib/home.js";

const RAIL = 72, MIN = 200, MAX = 380, DEF = 264, KEY = "hc_app_sidebar";

const GROUPS = [
  { fr: "Principal", en: "Main", items: [
    { to: "/app", end: true, Icon: Home, fr: "Accueil", en: "Home" },
    { to: "/app/money", Icon: Wallet, fr: "H-Money", en: "H-Money" },
    { to: "/app/transport", Icon: Bus, fr: "Bus sur la carte", en: "Buses on the map" },
    { to: "/app/colis", Icon: Package, fr: "Colis sur la carte", en: "Parcels on the map" },
    { to: "/app/logement", Icon: BedDouble, fr: "Logements sur la carte", en: "Stays on the map" },
  ] },
  { fr: "Services", en: "Services", items: [
    { to: "/shopping", Icon: ShoppingBag, fr: "H-Shopping", en: "H-Shopping" },
    { to: "/restaurant", Icon: UtensilsCrossed, fr: "H-Restaurant", en: "H-Restaurant" },
    { to: "/tourisme", Icon: Mountain, fr: "H-Tourisme", en: "H-Tourism" },
    { to: "/formations", Icon: GraduationCap, fr: "H-Learning", en: "H-Learning" },
    { to: "/interpretation", Icon: Languages, fr: "H-Translate", en: "H-Translate" },
  ] },
];
const MOBILE_TABS = [GROUPS[0].items[0], GROUPS[0].items[1], GROUPS[0].items[2], GROUPS[0].items[4]];

function loadPrefs() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || "{}"); return { width: Math.min(MAX, Math.max(MIN, Number(v.width) || DEF)), rail: !!v.rail, hidden: !!v.hidden }; } catch { return { width: DEF, rail: false, hidden: false }; }
}

function NavItems({ lang, rail, onNavigate }) {
  return (
    <>
      {GROUPS.map((g) => (
        <div key={g.fr} className="mb-5">
          {!rail && <p className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.18em] text-cream-fixed/40">{g[lang] || g.fr}</p>}
          <ul className="space-y-0.5">
            {g.items.map(({ to, end, Icon, ...t }) => (
              <li key={to}>
                <NavLink to={to} end={end} onClick={onNavigate} title={rail ? t[lang] || t.fr : undefined}
                  className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${rail ? "justify-center" : ""} ${isActive ? "bg-[#C89A3D] text-ink-fixed font-semibold" : "text-cream-fixed/75 hover:bg-white/8 hover:text-cream-fixed"}`}>
                  <Icon size={18} strokeWidth={1.8} className="shrink-0" />
                  {!rail && <span className="truncate">{t[lang] || t.fr}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

/** Espace utilisateur façon PayPal : barre latérale étirable / réductible / masquable, barre du haut, navigation mobile. */
export default function AppShell() {
  const { user, isAuthenticated, isLoading, signOut } = useUser();
  const { lang } = useLanguage();
  const region = useRegion();
  const navigate = useNavigate();
  const location = useLocation();
  const [prefs, setPrefs] = useState(loadPrefs);
  const [drawer, setDrawer] = useState(false);
  const [dragging, setDragging] = useState(false);
  const aside = useRef(null);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* ignoré */ } }, [prefs]);
  useEffect(() => { setDrawer(false); }, [location.pathname]);
  useEffect(() => { if (!isLoading && !isAuthenticated) navigate("/connexion", { replace: true, state: { redirectTo: location.pathname } }); }, [isLoading, isAuthenticated, navigate, location.pathname]);
  // Partenaires, agents et admins ont leur propre espace.
  useEffect(() => { if (user && homeFor(user) !== "/app") navigate(homeFor(user), { replace: true }); }, [user, navigate]);
  useEffect(() => { if (!drawer) return; const k = (e) => e.key === "Escape" && setDrawer(false); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [drawer]);

  const set = useCallback((p) => setPrefs((s) => ({ ...s, ...p })), []);
  const startDrag = (e) => {
    e.preventDefault(); setDragging(true);
    const move = (ev) => {
      const x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - (aside.current?.getBoundingClientRect().left || 0);
      if (x < 130) set({ rail: true }); else set({ rail: false, width: Math.min(MAX, Math.max(MIN, Math.round(x))) });
    };
    const up = () => { setDragging(false); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const keyResize = (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); prefs.rail ? null : prefs.width <= MIN + 16 ? set({ rail: true }) : set({ width: prefs.width - 16 }); }
    if (e.key === "ArrowRight") { e.preventDefault(); prefs.rail ? set({ rail: false }) : set({ width: Math.min(MAX, prefs.width + 16) }); }
  };

  const first = (user?.full_name || user?.email || "").split(/[ @]/)[0];
  const w = prefs.hidden ? 0 : prefs.rail ? RAIL : prefs.width;
  const fr = lang !== "en";

  return (
    <div className="min-h-screen bg-cream text-ink flex" style={{ "--sbw": `${w}px` }}>
      {/* Barre latérale — bureau */}
      <aside ref={aside} aria-label={fr ? "Navigation" : "Navigation"} data-testid="sidebar"
        className={`hidden md:flex fixed inset-y-0 left-0 z-30 flex-col bg-ink-fixed text-cream-fixed overflow-hidden ${dragging ? "" : "transition-[width] duration-200"}`} style={{ width: w }}>
        <div className={`h-16 shrink-0 flex items-center ${prefs.rail ? "justify-center" : "justify-between px-4"} border-b border-white/10`}>
          <Link to="/" className="flex items-center gap-2.5 min-w-0"><Logo size={30} />{!prefs.rail && <span className="font-display text-lg truncate">H-Company</span>}</Link>
          {!prefs.rail && <button onClick={() => set({ rail: true })} aria-label={fr ? "Réduire la barre latérale" : "Collapse sidebar"} className="w-8 h-8 rounded-lg text-cream-fixed/60 hover:bg-white/10 flex items-center justify-center"><ChevronsLeft size={16} /></button>}
        </div>
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-5"><NavItems lang={lang} rail={prefs.rail} /></nav>
        <div className="p-3 border-t border-white/10 space-y-0.5">
          {prefs.rail && <button onClick={() => set({ rail: false })} aria-label={fr ? "Agrandir la barre latérale" : "Expand sidebar"} className="w-full flex justify-center rounded-xl py-2.5 text-cream-fixed/60 hover:bg-white/10"><ChevronsRight size={18} /></button>}
          <Link to="/settings" title={fr ? "Paramètres" : "Settings"} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-fixed/75 hover:bg-white/10 ${prefs.rail ? "justify-center" : ""}`}><Settings size={18} />{!prefs.rail && (fr ? "Paramètres" : "Settings")}</Link>
          <button onClick={() => { signOut(); navigate("/"); }} title={fr ? "Se déconnecter" : "Sign out"} className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-fixed/75 hover:bg-white/10 ${prefs.rail ? "justify-center" : ""}`}><LogOut size={18} />{!prefs.rail && (fr ? "Se déconnecter" : "Sign out")}</button>
        </div>
        {/* Poignée d'étirement */}
        <div role="separator" aria-orientation="vertical" aria-label={fr ? "Redimensionner la barre latérale" : "Resize sidebar"} aria-valuenow={w} aria-valuemin={RAIL} aria-valuemax={MAX} tabIndex={0}
          onPointerDown={startDrag} onKeyDown={keyResize} onDoubleClick={() => set({ rail: false, width: DEF })}
          className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-[#C89A3D]/60 focus:bg-[#C89A3D]/60 focus:outline-none touch-none" />
      </aside>

      {/* Tiroir — mobile */}
      {drawer && (
        <div className="md:hidden fixed inset-0 z-50">
          <button aria-label="Fermer" className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
          <div role="dialog" aria-modal="true" className="absolute inset-y-0 left-0 w-[82%] max-w-xs bg-ink-fixed text-cream-fixed flex flex-col">
            <div className="h-16 px-4 flex items-center justify-between border-b border-white/10"><span className="flex items-center gap-2.5"><Logo size={28} /><span className="font-display text-lg">H-Company</span></span><button onClick={() => setDrawer(false)} aria-label="Fermer" className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center"><X size={18} /></button></div>
            <nav className="flex-1 overflow-y-auto px-3 py-5"><NavItems lang={lang} rail={false} onNavigate={() => setDrawer(false)} /></nav>
            <div className="p-3 border-t border-white/10"><button onClick={() => { signOut(); navigate("/"); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-fixed/75 hover:bg-white/10"><LogOut size={18} />{fr ? "Se déconnecter" : "Sign out"}</button></div>
          </div>
        </div>
      )}

      {/* Contenu */}
      <div className={`flex-1 min-w-0 flex flex-col md:ml-[var(--sbw)] ${dragging ? "" : "md:transition-[margin] md:duration-200"}`}>
        <header className="sticky top-0 z-20 h-16 bg-cream/90 backdrop-blur border-b border-line flex items-center gap-2 px-3 sm:px-5">
          <button onClick={() => setDrawer(true)} aria-label="Menu" className="md:hidden w-10 h-10 rounded-xl hover:bg-latte-soft flex items-center justify-center"><Menu size={20} /></button>
          <button onClick={() => set({ hidden: !prefs.hidden })} aria-pressed={prefs.hidden} aria-label={prefs.hidden ? (fr ? "Afficher la barre latérale" : "Show sidebar") : (fr ? "Masquer la barre latérale" : "Hide sidebar")} className="hidden md:flex w-10 h-10 rounded-xl hover:bg-latte-soft items-center justify-center text-ink-soft"><PanelLeft size={19} /></button>
          <Link to="/app" className="md:hidden flex items-center gap-2"><Logo size={26} /></Link>
          <div className="flex-1" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft" title={fr ? "Modifiable en bas du site" : "Change it in the site footer"}>{region.info.flag} {region.currency}</span>
          <Link to="/settings" aria-label={fr ? "Mon profil" : "My profile"} className="w-9 h-9 rounded-full bg-ink text-[#C89A3D] flex items-center justify-center font-display">{(first[0] || "H").toUpperCase()}</Link>
        </header>
        <main id="app-main" className="flex-1 min-w-0 pb-24 md:pb-10"><Outlet context={{ first }} /></main>
      </div>

      {/* Barre du bas — mobile */}
      <nav aria-label={fr ? "Navigation rapide" : "Quick navigation"} className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 text-[11px]">
          {MOBILE_TABS.map(({ to, end, Icon, ...t }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 ${isActive ? "text-coffee-dark font-semibold" : "text-ink-soft"}`}><Icon size={19} strokeWidth={1.7} />{(t[lang] || t.fr).replace(" sur la carte", "").replace(" on the map", "")}</NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
