import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Megaphone, Minus } from "lucide-react";
import { api } from "../../lib/api.js";
import { consent } from "../../lib/memStore.js";

const THEME = { coffee: "linear-gradient(135deg,#4A3020,#2A1A10)", gold: "linear-gradient(135deg,#D9B05A,#B8862C)", ink: "linear-gradient(135deg,#2A1A10,#120A05)", cream: "linear-gradient(135deg,#F3E9D6,#E4D3B3)" };
const SHOW_ON = ["/app", "/shopping", "/transport", "/logement", "/restaurant", "/tourisme", "/formations", "/interpretation", "/money"];
const REAPPEAR_MS = 45000; // une pub réduite revient d'elle-même, avec l'annonce suivante
const FIRST_MS = 1200;
const MOBILE_OPEN_MS = 6000; // mobile (V8) : l'annonce se réduit seule après quelques secondes pour ne pas masquer formulaires et boutons
const HOUSE = [
  { id: "h1", theme: "gold", title: "Votre pub ici", body: "Touchez des clients à Lusaka et Kinshasa.", cta_label: "Devenir partenaire", link: "/infos#rejoindre" },
  { id: "h2", theme: "coffee", title: "Facturez et soyez payé", body: "Générez une facture, payez en mobile money.", cta_label: "H-Money", link: "/app/factures" },
];

function placementFor(path) {
  if (path.startsWith("/app/transport") || path.startsWith("/transport")) return path.includes("colis") ? "app_colis" : "app_transport";
  if (path.startsWith("/app/colis")) return "app_colis";
  if (path.startsWith("/app/logement") || path.startsWith("/logement")) return "app_logement";
  if (path.startsWith("/app/money") || path.startsWith("/money")) return "app_money";
  return "app_home";
}

/** Pub flottante, toujours là : on peut la réduire (petite pastille), elle réapparaît seule et passe à l'annonce suivante. */
export default function FloatingPromo() {
  const { pathname } = useLocation();
  const eligible = SHOW_ON.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const placement = placementFor(pathname);
  const [ads, setAds] = useState([]), [idx, setIdx] = useState(0), [open, setOpen] = useState(false), [ready, setReady] = useState(false);
  const counted = useRef(new Set());
  // la pub attend la réponse au bandeau cookies : jamais deux fenêtres l'une sur l'autre
  const [answered, setAnswered] = useState(() => !!consent.get());
  useEffect(() => { const on = () => setAnswered(true); window.addEventListener("hc:consent", on); return () => window.removeEventListener("hc:consent", on); }, []);

  useEffect(() => {
    setOpen(false); setReady(false); setIdx(0);
    if (!eligible || !answered) return undefined;
    let on = true, t;
    api.promos.serve(placement, 6).then((rows) => on && setAds(rows.length ? rows : HOUSE)).catch(() => on && setAds(HOUSE)).finally(() => { t = setTimeout(() => on && (setReady(true), setOpen(true)), FIRST_MS); });
    return () => { on = false; clearTimeout(t); };
  }, [eligible, placement, answered]);

  // mobile : réduction automatique (la pastille reste là, la pub revient plus tard) — on ne retire rien
  useEffect(() => {
    if (!open || typeof window === "undefined" || !window.matchMedia?.("(max-width: 639px)").matches) return undefined;
    const t = setTimeout(() => setOpen(false), MOBILE_OPEN_MS);
    return () => clearTimeout(t);
  }, [open, idx]);

  // réduite → revient après un moment, avec la pub suivante
  useEffect(() => {
    if (!ready || open || !ads.length) return undefined;
    const t = setTimeout(() => { setIdx((i) => (i + 1) % ads.length); setOpen(true); }, REAPPEAR_MS);
    return () => clearTimeout(t);
  }, [ready, open, ads.length]);

  const ad = ads[idx % (ads.length || 1)];
  useEffect(() => { if (open && ad && !String(ad.id).startsWith("h") && !counted.current.has(ad.id)) { counted.current.add(ad.id); api.promos.seen(ad.id); } }, [open, ad]);
  if (!eligible || !ad || !ready) return null;

  const accent = THEME[ad.theme] || THEME.coffee;
  const ext = /^https?:/.test(ad.link);
  const real = !String(ad.id).startsWith("h");
  const click = () => real && api.promos.clicked(ad.id);
  const body = (
    <>
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 rounded-l-2xl" style={{ background: accent }} />
      <span className="flex items-start gap-3 pl-2">
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-snug text-ink pr-7">{ad.title}</span>
          {ad.body && <span className="hidden sm:block text-xs text-ink-soft mt-1 line-clamp-2">{ad.body}</span>}
          <span className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink text-cream text-xs font-semibold px-4 py-2">{ad.cta_label}<ArrowUpRight size={12} /></span>
        </span>
        {ad.image_url && <span aria-hidden="true" className="hidden sm:block h-16 w-16 shrink-0 rounded-xl bg-latte-soft" style={{ background: `url(${ad.image_url}) center/cover` }} />}
      </span>
    </>
  );
  const cls = "relative block rounded-2xl border border-line bg-surface p-3.5 sm:p-4 shadow-[0_8px_30px_rgba(0,0,0,.14)] hover:shadow-[0_10px_34px_rgba(0,0,0,.18)] transition-shadow";
  const pos = "fixed z-[45] bottom-[calc(var(--hc-bar,0px)+76px)] sm:bottom-[calc(var(--hc-bar,0px)+96px)]"; // au-dessus de la bulle de chat et de la barre de contact (--hc-bar) ; sm+ : au-dessus des notifications
  if (!open) return (
    <button onClick={() => setOpen(true)} aria-label="Afficher la publicité" className={`${pos} right-3 sm:right-24 inline-flex items-center gap-2 rounded-full bg-surface border border-line shadow-lg px-3.5 py-2 text-xs text-ink-soft hover:text-ink`}><Megaphone size={14} className="text-[#C89A3D]" />{ad.sponsored ? "Sponsorisé" : "H-Company"}</button>
  );
  return (
    <aside aria-label="Publicité" role="complementary" className={`${pos} right-3 left-3 sm:left-auto sm:right-24 sm:w-80 animate-[hcfloat_.35s_ease-out]`}>
      <style>{"@keyframes hcfloat{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}"}</style>
      <div className="relative">
        <p className="absolute -top-2 left-3 z-10 rounded-full bg-surface border border-line text-[9px] uppercase tracking-widest text-ink-faint px-2 py-0.5">{ad.sponsored ? "Sponsorisé" : "H-Company"}</p>
        {ext
          ? <a href={ad.link} target="_blank" rel="noopener noreferrer sponsored" onClick={click} className={cls}>{body}</a>
          : <Link to={ad.link} onClick={click} className={cls}>{body}</Link>}
        <button onClick={() => setOpen(false)} aria-label="Réduire la publicité" className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/35 text-white flex items-center justify-center hover:bg-black/55"><Minus size={14} /></button>
      </div>
    </aside>
  );
}
