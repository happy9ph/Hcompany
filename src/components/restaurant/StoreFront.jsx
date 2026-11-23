import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, MapPin, Minus, Plus, Search, Store, Truck, Zap } from "lucide-react";
import { RestoImage, Rating, useRestoUi } from "./Shared.jsx";
import { ContactActions, feeLabel } from "./SellerInfo.jsx";
import { foodCart, useFoodCart } from "../../lib/foodCart.js";
import { filterMenu, isIndividual, menuAnchor, priceSigns } from "../../lib/resto.js";

/** Carte de plat façon Uber Eats : texte à gauche, image à droite, « + » seulement si la pré-commande est possible. */
function DishCard({ i, r, money, ui }) {
  const p = ui.page;
  const off = i.is_available === false;
  const cart = useFoodCart();
  const q = cart.lines.find((l) => l.iid === i.id)?.qty || 0;
  const canOrder = !off;
  const setQty = (id, n) => (n <= 0 ? foodCart.setQty(id, 0) : q ? foodCart.setQty(id, n) : foodCart.add({ rid: r.id, iid: id, name: i.name, price: i.price, vname: r.name, vslug: r.slug, image: i.image }, 1));
  return (
    <li data-dish={i.id} data-available={off ? "no" : "yes"} className={`relative flex rounded-xl border border-line bg-surface overflow-hidden min-h-[120px] ${off ? "bg-cream/60" : ""}`}>
      <div className="flex-1 min-w-0 p-4 flex flex-col">
        <p className={`font-medium leading-snug ${off ? "text-ink-soft" : "text-ink"}`}>{i.name}</p>
        <p className={`text-sm mt-1 ${off ? "text-ink-faint" : "text-ink"}`}>{money(i.price)}</p>
        {i.description && <p className="text-sm text-ink-soft mt-1 line-clamp-2">{i.description}</p>}
        {i.tags?.length > 0 && <p className="flex flex-wrap gap-1.5 mt-2">{i.tags.map((t) => <span key={t} className="rounded-full bg-latte-soft text-coffee text-[11px] px-2 py-0.5">{ui.tags[t] || t}</span>)}</p>}
        {off && <p className="mt-auto pt-2"><span className="inline-flex items-center rounded-full bg-ink/90 text-cream text-[11px] font-medium px-2.5 py-1">{p.unavailable}</span></p>}
      </div>
      {(i.image || canOrder) && (
        <div className="relative w-28 sm:w-36 shrink-0 self-stretch">
          {i.image ? <RestoImage path={i.image} alt="" ratio="h-full" className={`absolute inset-0 w-full h-full ${off ? "opacity-40 grayscale" : ""}`} /> : <div className="absolute inset-0 bg-latte-soft/60" />}
          {off && <span className="absolute inset-0 flex items-center justify-center"><span className="rounded-full bg-ink/90 text-cream text-[11px] font-medium px-2.5 py-1">{p.unavailable}</span></span>}
          {canOrder && !off && (
            <div className="absolute bottom-2 right-2">
              {q > 0 ? (
                <div className="inline-flex items-center gap-1 rounded-full bg-surface border border-line shadow px-1 py-1">
                  <button type="button" aria-label={ui.cart.dec} onClick={() => setQty(i.id, q - 1)} className="w-8 h-8 rounded-full hover:bg-latte-soft flex items-center justify-center"><Minus size={14} /></button>
                  <span className="text-sm w-5 text-center" aria-live="polite">{q}</span>
                  <button type="button" aria-label={ui.cart.inc} onClick={() => setQty(i.id, q + 1)} className="w-8 h-8 rounded-full hover:bg-latte-soft flex items-center justify-center"><Plus size={14} /></button>
                </div>
              ) : <button type="button" aria-label={`${ui.cart.add} · ${i.name}`} onClick={() => setQty(i.id, 1)} className="w-10 h-10 rounded-full bg-surface border border-line shadow flex items-center justify-center hover:bg-latte-soft"><Plus size={18} /></button>}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/** Navigation de catégories : colonne collante (desktop) / puces horizontales collantes (mobile), avec suivi du défilement. */
function CategoryNav({ cats, active, title, hours }) {
  const ui = useRestoUi();
  const go = (id) => (e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const chipsRef = useRef(null);
  useEffect(() => { // garde la puce active visible dans la barre horizontale
    const el = chipsRef.current?.querySelector('[aria-current="true"]');
    if (el && chipsRef.current) { const left = el.offsetLeft - 16; if (chipsRef.current.scrollTo) chipsRef.current.scrollTo({ left, behavior: "smooth" }); else chipsRef.current.scrollLeft = left; }
  }, [active]);
  if (!cats.length) return null;
  return (
    <>
      <nav aria-label={ui.page.categories} className="hidden lg:block sticky top-[148px] self-start">
        <p className="font-medium text-ink">{title}</p>
        {hours && <p className="text-xs text-ink-soft mt-0.5">{hours}</p>}
        <ul className="mt-4 space-y-0.5">
          {cats.map((c, k) => { const id = menuAnchor(c, k); const on = active === id; return (
            <li key={id}><a href={`#${id}`} onClick={go(id)} aria-current={on ? "true" : undefined} className={`block px-4 py-3 text-[15px] border-l-4 transition-colors ${on ? "border-ink bg-latte-soft/70 text-ink font-medium" : "border-transparent text-ink-soft hover:text-ink hover:bg-latte-soft/40"}`}>{c.name || ui.pro.menuTab.noCategory}</a></li>); })}
        </ul>
      </nav>
      <nav aria-label={ui.page.categories} className="lg:hidden sticky top-[132px] z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-cream/95 backdrop-blur border-b border-line">
        <ul ref={chipsRef} className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cats.map((c, k) => { const id = menuAnchor(c, k); const on = active === id; return (
            <li key={id} className="shrink-0"><a href={`#${id}`} onClick={go(id)} aria-current={on ? "true" : undefined} className={`inline-block rounded-full px-4 py-2 text-sm whitespace-nowrap ${on ? "bg-ink text-cream" : "bg-latte-soft/70 text-ink-soft"}`}>{c.name || ui.pro.menuTab.noCategory}</a></li>); })}
        </ul>
      </nav>
    </>
  );
}

/**
 * Vitrine publique façon Uber Eats (identité H-Company) : bannière, nom + recherche dans la boutique, barre d'infos,
 * navigation de catégories collante, plats en cartes sur 2 colonnes. Pas de panier : le « + » n'existe que pour la
 * pré-commande d'un restaurant ; un vendeur individuel se contacte directement.
 */
export default function StoreFront({ r, money, showReserve, onReserve }) {
  const ui = useRestoUi();
  const p = ui.page;
  const ind = isIndividual(r);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(null);
  const menu = useMemo(() => filterMenu(r.menu, q), [r.menu, q]);
  const cuisine = (r.cuisines || []).map((c) => ui.cuisines[c] || c).join(" · ");
  const hours = ind ? null : `${r.open_time} – ${r.close_time}`;
  const d = r.delivery;

  useEffect(() => { // scroll-spy : la catégorie la plus proche du haut devient active
    if (!menu.length || typeof IntersectionObserver === "undefined") { setActive(menu.length ? menuAnchor(menu[0], 0) : null); return undefined; }
    const els = menu.map((c, k) => document.getElementById(menuAnchor(c, k))).filter(Boolean);
    const seen = new Map();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => seen.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null));
      const vis = [...seen.entries()].filter(([, t]) => t != null).sort((a, b) => a[1] - b[1]);
      if (vis.length) setActive(vis[0][0]);
    }, { rootMargin: "-190px 0px -55% 0px", threshold: [0, 1] });
    els.forEach((el) => io.observe(el));
    setActive((a) => (a && els.some((el) => el.id === a) ? a : els[0]?.id || null));
    return () => io.disconnect();
  }, [menu]);

  return (
    <div>
      <div className="relative">
        <RestoImage path={r.images?.[0]} alt={r.name} ratio="aspect-[16/7] sm:aspect-[16/6]" className="rounded-3xl" />
        {r.images?.length > 1 && <span className="absolute bottom-3 right-3 rounded-full bg-black/55 text-white text-xs px-3 py-1.5">{r.images.length} photos</span>}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl sm:text-4xl text-ink leading-tight break-words">{r.name}</h1>
        </div>
        <label className="relative w-full sm:w-[340px]">
          <span className="sr-only">{p.searchIn(r.name)}</span>
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={p.searchIn(r.name)} className="w-full rounded-full bg-latte-soft/70 border border-transparent pl-10 pr-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-coffee focus:bg-surface" />
        </label>
      </div>

      <div className="mt-3 text-sm text-ink-soft space-y-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {ind ? <span className="inline-flex items-center gap-1 rounded-full bg-latte-soft text-coffee text-xs px-2.5 py-1"><Store size={12} aria-hidden="true" />{p.sellerIndividual}</span> : <Rating value={r.rating_avg} count={r.rating_count} />}
          {[cuisine, !ind && priceSigns(r.price_level)].filter(Boolean).length > 0 && <span>· {[cuisine, !ind && priceSigns(r.price_level)].filter(Boolean).join(" · ")}</span>}
        </p>
        {(r.address || r.area || r.city) && <p className="flex gap-1.5"><MapPin size={14} className="mt-0.5 shrink-0 text-coffee" aria-hidden="true" />{[r.address, r.area, r.city].filter(Boolean).join(", ")}</p>}
        {!ind && (r.instant_confirm || r.has_terrace) && <p className="flex flex-wrap gap-2 pt-1">
          {r.instant_confirm && <span className="inline-flex items-center gap-1 rounded-full bg-latte-soft text-coffee text-xs px-2.5 py-1"><Zap size={11} aria-hidden="true" />{p.instant}</span>}
          {r.has_terrace && <span className="rounded-full bg-latte-soft text-coffee text-xs px-2.5 py-1">{p.terrace}</span>}
        </p>}
      </div>

      <div data-store-bar className="mt-5 rounded-2xl border border-line bg-surface p-3 sm:p-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-2 text-ink font-medium"><Truck size={16} className="text-coffee" aria-hidden="true" />{d ? feeLabel(d, money, p, true) : p.delivery.fee.short.none}</span>
          {hours && <span className="inline-flex items-center gap-2 text-ink-soft"><Clock size={15} aria-hidden="true" />{hours}</span>}
        </div>
        <ContactActions r={r} showReserve={showReserve} onReserve={onReserve} className="hidden lg:flex" />
      </div>

      {r.description && <p className="text-ink-soft leading-relaxed mt-5 whitespace-pre-line max-w-3xl">{r.description}</p>}

      <section aria-labelledby="menu" className="mt-8 grid lg:grid-cols-[260px_1fr] gap-x-8 gap-y-2 items-start">
        <h2 id="menu" className="sr-only">{ind ? p.catalog : p.menu}</h2>
        <CategoryNav cats={menu} active={active} title={ind ? p.catalog : p.menu} hours={hours} />
        <div className="min-w-0 space-y-10 pt-4 lg:pt-0">
          {!r.menu?.length ? <p className="text-sm text-ink-soft">{p.empty}</p> : !menu.length ? <p className="text-sm text-ink-soft" role="status">{p.noMatch}</p> : menu.map((c, k) => (
            <div key={menuAnchor(c, k)} id={menuAnchor(c, k)} className="scroll-mt-48">
              {c.name && <h3 className="font-display text-2xl text-ink mb-4">{c.name}</h3>}
              <ul className="grid sm:grid-cols-2 gap-4">
                {c.items.map((i) => <DishCard key={i.id} i={i} r={r} money={money} ui={ui} />)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
