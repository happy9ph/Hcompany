import { useEffect, useRef } from "react";
import { CalendarCheck, Clock, MapPin, MessageCircle, Phone, Truck } from "lucide-react";
import { Card, useRestoUi } from "./Shared.jsx";
import { feeKind, isIndividual, telLink, waLink } from "../../lib/resto.js";

/** Libellé des frais de livraison : null = à convenir · 0 = gratuite. */
export function feeLabel(d, money, t, short = false) {
  const k = feeKind(d);
  const src = short ? t.delivery.fee.short : t.delivery.fee;
  if (k === "none") return short ? src.none : t.delivery.none;
  if (k === "free") return src.free;
  if (k === "tbd") return src.tbd;
  return src.amount(money(d.fee));
}

const BTN = "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium px-4 py-2.5 whitespace-nowrap";

/** WhatsApp / Appeler / Réserver une table — contact direct, aucun panier ni paiement. */
export function ContactActions({ r, showReserve, onReserve, className = "" }) {
  const t = useRestoUi().page;
  const wa = waLink(r.whatsapp, t.contact.message(r.name));
  const tel = telLink(r.phone);
  if (!wa && !tel && !showReserve) return null;
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {wa && <a href={wa} target="_blank" rel="noreferrer" className={`${BTN} bg-ink text-cream`}><MessageCircle size={16} />{t.contact.whatsapp}</a>}
      {tel && <a href={tel} className={`${BTN} border border-line text-ink hover:border-coffee-light`}><Phone size={16} />{t.contact.call}</a>}
      {showReserve && <button type="button" onClick={onReserve} className={`${BTN} bg-latte-soft text-coffee hover:bg-latte-soft/70`}><CalendarCheck size={16} />{t.contact.reserveTable}</button>}
    </div>
  );
}

/** Barre fixe en bas sur mobile : le contact reste à portée de pouce près du catalogue (V3). */
export function ContactBar({ r, showReserve, onReserve }) {
  const t = useRestoUi().page;
  const ref = useRef(null);
  const wa = waLink(r.whatsapp, t.contact.message(r.name));
  const tel = telLink(r.phone);
  const has = !!(wa || tel || showReserve);
  // Publie la hauteur de la barre (--hc-bar) pour que la bulle de chat et la pub se placent au-dessus, sans la masquer.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const root = document.documentElement;
    const sync = () => root.style.setProperty("--hc-bar", `${el.offsetHeight}px`);
    sync();
    let ro;
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(sync); ro.observe(el); }
    window.addEventListener("resize", sync);
    return () => { ro?.disconnect(); window.removeEventListener("resize", sync); root.style.removeProperty("--hc-bar"); };
  }, [has]);
  if (!has) return null;
  const cell = "flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium py-3";
  return (
    <div ref={ref} role="region" aria-label={t.contact.bar} data-contact-bar className="lg:hidden fixed inset-x-0 bottom-0 z-[46] border-t border-line bg-cream/95 backdrop-blur px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
      <div className="flex gap-2 max-w-lg mx-auto">
        {wa && <a href={wa} target="_blank" rel="noreferrer" className={`${cell} bg-ink text-cream`}><MessageCircle size={16} />{t.contact.whatsapp}</a>}
        {tel && <a href={tel} className={`${cell} border border-line text-ink bg-surface`}><Phone size={16} />{t.contact.call}</a>}
        {showReserve && <button type="button" onClick={onReserve} className={`${cell} bg-latte-soft text-coffee`}><CalendarCheck size={16} />{t.contact.reserveTable}</button>}
      </div>
    </div>
  );
}

/** Livraison et conditions de vente — après le catalogue. HFood ne livre pas et n'encaisse pas. */
export function DeliveryBlock({ r, money }) {
  const t = useRestoUi().page;
  const d = r.delivery;
  if (!d) return null;
  const zones = d.zones || [];
  const rows = [];
  if (d.offers && zones.length) rows.push([t.delivery.zones, zones.join(", ")]);
  if (d.offers && d.fee_note) rows.push([feeLabel(d, money, t), d.fee_note]);
  if (d.offers && d.terms) rows.push([t.delivery.terms, d.terms]);
  if (d.sale_notes) rows.push([t.delivery.sale, d.sale_notes]);
  return (
    <section aria-labelledby="delivery" className="scroll-mt-40">
      <h2 id="delivery" className="font-display text-2xl text-ink mb-4">{t.delivery.title}</h2>
      <Card className="space-y-4">
        <p className="inline-flex items-center gap-2 text-ink font-medium"><Truck size={18} className="text-coffee" aria-hidden="true" />{d.offers ? `${t.delivery.offers} · ${feeLabel(d, money, t)}` : t.delivery.none}</p>
        {rows.length > 0 && <dl className="space-y-3 text-sm">{rows.map(([k, v]) => <div key={k}><dt className="text-ink-faint text-xs uppercase tracking-wide">{k}</dt><dd className="text-ink-soft whitespace-pre-line mt-0.5">{v}</dd></div>)}</dl>}
        <p className="text-xs text-ink-faint border-t border-line pt-3">{t.delivery.manual}</p>
      </Card>
    </section>
  );
}

/** Infos pratiques : jamais de doublon avec la barre de contact — ici les coordonnées lisibles, pas de bouton. */
export function PracticalInfo({ r, days }) {
  const t = useRestoUi().page;
  const ind = isIndividual(r);
  const place = [r.address, [r.area, r.city].filter(Boolean).join(", ")].filter(Boolean);
  const rows = [];
  if (place.length) rows.push([MapPin, ind ? t.place : t.address, place.join(" — ")]);
  if (r.phone) rows.push([Phone, t.phone, <a key="p" href={telLink(r.phone)} className="hover:text-ink underline-offset-2 hover:underline">{r.phone}</a>]);
  if (r.whatsapp && r.whatsapp !== r.phone) rows.push([MessageCircle, t.whatsapp, <a key="w" href={waLink(r.whatsapp, t.contact.message(r.name))} target="_blank" rel="noreferrer" className="hover:text-ink underline-offset-2 hover:underline">{r.whatsapp}</a>]);
  if (!rows.length && ind) return null;
  return (
    <Card>
      <h2 id="info" className="font-display text-xl text-ink mb-4">{t.info}</h2>
      <ul className="space-y-3 text-sm text-ink-soft">
        {rows.map(([Icon, label, value]) => <li key={label} className="flex gap-3"><Icon size={16} className="shrink-0 mt-0.5 text-coffee" aria-hidden="true" /><span><span className="block text-xs text-ink-faint">{label}</span>{value}</span></li>)}
      </ul>
      {!ind && days && (
        <>
          <h3 className="text-sm font-medium text-ink mt-5 mb-2 inline-flex items-center gap-2"><Clock size={14} className="text-coffee" aria-hidden="true" />{t.hours}</h3>
          <ul className="text-sm text-ink-soft grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">{days.map((d, i) => <li key={d} className="contents"><span>{d}</span><span className={r.closed_days.includes(i) ? "text-red-600" : ""}>{r.closed_days.includes(i) ? t.closed : `${r.open_time}–${r.close_time}`}</span></li>)}</ul>
        </>
      )}
    </Card>
  );
}
