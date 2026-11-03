import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, X } from "lucide-react";
import { api } from "../../lib/api.js";

const THEME = { coffee: "linear-gradient(135deg,#4A3020,#2A1A10)", gold: "linear-gradient(135deg,#D9B05A,#B8862C)", ink: "linear-gradient(135deg,#2A1A10,#120A05)", cream: "linear-gradient(135deg,#F3E9D6,#E4D3B3)" };
const KEY = "hc_promo_closed";
const SHOW_ON = ["/app", "/shopping", "/transport", "/logement", "/restaurant", "/tourisme", "/formations", "/interpretation", "/money"];
const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch { return []; } };
const write = (a) => { try { sessionStorage.setItem(KEY, JSON.stringify(a)); } catch { /* ignoré */ } };

function placementFor(path) {
  if (path.startsWith("/app/transport") || path.startsWith("/transport")) return path.includes("colis") ? "app_colis" : "app_transport";
  if (path.startsWith("/app/colis")) return "app_colis";
  if (path.startsWith("/app/logement") || path.startsWith("/logement")) return "app_logement";
  if (path.startsWith("/app/money") || path.startsWith("/money")) return "app_money";
  return "app_home";
}

/** Pub flottante façon AdSense : apparaît après quelques secondes en bas à droite, fermable (mémorisé pour la session). */
export default function FloatingPromo() {
  const { pathname } = useLocation();
  const eligible = SHOW_ON.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const placement = placementFor(pathname);
  const [ad, setAd] = useState(null), [open, setOpen] = useState(false);
  const counted = useRef(new Set());

  useEffect(() => {
    setOpen(false); setAd(null);
    if (!eligible) return undefined;
    let on = true, timer;
    api.promos.serve(placement, 4).then((rows) => {
      if (!on) return;
      const closed = read();
      const pick = rows.find((r) => !closed.includes(r.id));
      if (pick) { setAd(pick); timer = setTimeout(() => on && setOpen(true), 4000); }
    }).catch(() => {});
    return () => { on = false; clearTimeout(timer); };
  }, [eligible, placement]);

  useEffect(() => { if (open && ad && !counted.current.has(ad.id)) { counted.current.add(ad.id); api.promos.seen(ad.id); } }, [open, ad]);
  if (!eligible || !ad || !open) return null;

  const close = () => { write([...read(), ad.id]); setOpen(false); };
  const light = (ad.theme === "cream" || ad.theme === "gold") && !ad.image_url;
  const style = { background: ad.image_url ? `linear-gradient(0deg,rgba(18,10,5,.85),rgba(18,10,5,.3)), url(${ad.image_url}) center/cover` : THEME[ad.theme] || THEME.coffee };
  const ext = /^https?:/.test(ad.link);
  const cta = `inline-flex items-center gap-1.5 rounded-full text-xs font-semibold px-4 py-2 ${light ? "bg-[#2A1A10] text-[#FBF6EC]" : "bg-[#C89A3D] text-[#2A1A10]"}`;
  const body = (<><span className="block font-display text-base leading-snug pr-6">{ad.title}</span>{ad.body && <span className="block text-xs opacity-80 mt-1 line-clamp-2">{ad.body}</span>}<span className={`${cta} mt-3`}>{ad.cta_label}<ArrowUpRight size={12} /></span></>);
  const cls = `block rounded-2xl p-4 shadow-2xl ${light ? "text-[#2A1A10]" : "text-[#FBF6EC]"}`;
  return (
    <aside aria-label="Publicité" role="complementary" className="fixed z-[45] right-3 left-3 sm:left-auto sm:right-24 sm:w-80 bottom-[76px] md:bottom-5 animate-[hcfloat_.35s_ease-out]">
      <style>{"@keyframes hcfloat{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}"}</style>
      <div className="relative">
        <p className="absolute -top-2 left-3 z-10 rounded-full bg-surface border border-line text-[9px] uppercase tracking-widest text-ink-faint px-2 py-0.5">{ad.sponsored ? "Sponsorisé" : "H-Company"}</p>
        {ext
          ? <a href={ad.link} target="_blank" rel="noopener noreferrer sponsored" onClick={() => api.promos.clicked(ad.id)} className={cls} style={style}>{body}</a>
          : <Link to={ad.link} onClick={() => api.promos.clicked(ad.id)} className={cls} style={style}>{body}</Link>}
        <button onClick={close} aria-label="Masquer la publicité" className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/35 text-white flex items-center justify-center hover:bg-black/55"><X size={14} /></button>
      </div>
    </aside>
  );
}
