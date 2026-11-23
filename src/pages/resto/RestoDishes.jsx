import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Truck, UtensilsCrossed, X } from "lucide-react";
import RestoLayout, { EmptyState, ErrorState, Spinner, RestoImage, Rating, inputCls, useRestoUi } from "../../components/restaurant/Shared.jsx";
import DishModal from "../../components/restaurant/DishModal.jsx";
import MapView from "../../components/app/MapView.jsx";
import { useShopMoney } from "../../data/shop.js";
import { usePageMeta } from "../../components/ui/HeadManager.jsx";
import { api } from "../../lib/api.js";
import { coordOf } from "../../lib/cities.js";
import { feeKind } from "../../lib/resto.js";

const slug = (s) => String(s || "other").toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Position d'un vendeur : coordonnées exactes si connues, sinon centre de sa ville (décalé de façon stable pour ne pas empiler les pastilles). */
function place(r) {
  if (r.lat != null && r.lng != null) return { lat: r.lat, lng: r.lng, approx: false };
  const c = coordOf(r.city);
  if (!c) return null;
  const a = (r.id * 2.399963) % (2 * Math.PI), d = 0.012 + ((r.id * 7) % 5) * 0.004;
  return { lat: c[0] + Math.sin(a) * d, lng: c[1] + Math.cos(a) * d, approx: true };
}

function feeText(r, d, money) {
  const k = feeKind({ offers: r.offers_delivery, fee: r.delivery_fee });
  return k === "none" ? d.noDelivery : k === "free" ? d.feeFree : k === "tbd" ? d.feeTbd : d.feeAmount(money(r.delivery_fee));
}

function Tile({ dish, vendor, money, ui, onOpen }) {
  return (
    <li>
      <button type="button" onClick={() => onOpen(dish)} data-dish={dish.id} className="w-full text-left flex rounded-xl border border-line bg-surface overflow-hidden min-h-[120px] hover:border-coffee-light transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink">
        <span className="flex-1 min-w-0 p-4 flex flex-col">
          <span className="font-medium text-ink leading-snug">{dish.name}</span>
          <span className="text-sm text-ink mt-1">{money(dish.price)}</span>
          {dish.description && <span className="text-sm text-ink-soft mt-1 line-clamp-2">{dish.description}</span>}
          <span className="mt-auto pt-2 text-xs text-ink-faint truncate">{ui.dishes.from} {vendor?.name}{vendor?.city ? ` · ${vendor.city}` : ""}</span>
        </span>
        <span className="relative w-28 sm:w-36 shrink-0 self-stretch bg-latte-soft">
          {dish.image ? <RestoImage path={dish.image} alt="" ratio="h-full" className="absolute inset-0 w-full h-full" /> : <span className="absolute inset-0 flex items-center justify-center text-coffee/40 font-display text-3xl" aria-hidden="true">{dish.name?.[0]}</span>}
        </span>
      </button>
    </li>
  );
}

export default function RestoDishes() {
  const ui = useRestoUi(); const d = ui.dishes;
  usePageMeta({ title: `${d.title} · H-Restaurant`, description: d.sub });
  const { money } = useShopMoney();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get("q") || "");
  const city = sp.get("city") || "", deliv = sp.get("delivery") === "1", cat = sp.get("cat") || "", rid = Number(sp.get("rid")) || 0, platId = Number(sp.get("plat")) || 0;
  const [state, setState] = useState({ loading: true, error: false, data: null });
  const [picked, setPicked] = useState(null);       // vendeur sélectionné sur la carte
  const [tick, setTick] = useState(0);
  const set = (patch) => setSp((cur) => { const n = new URLSearchParams(cur); Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k))); return n; }, { replace: true });

  useEffect(() => { const t = setTimeout(() => set({ q: q.trim() }), 300); return () => clearTimeout(t); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  const qs = sp.get("q") || "";
  useEffect(() => {
    let on = true;
    setState((s) => ({ ...s, loading: true, error: false }));
    api.resto.dishes({ q: qs, city, delivery: deliv ? "true" : "" }).then((data) => on && setState({ loading: false, error: false, data })).catch(() => on && setState({ loading: false, error: true, data: null }));
    return () => { on = false; };
  }, [qs, city, deliv, tick]);

  const data = state.data;
  const vById = useMemo(() => Object.fromEntries((data?.restaurants || []).map((r) => [r.id, r])), [data]);
  const shown = useMemo(() => (data?.dishes || []).filter((x) => (!rid || x.restaurant_id === rid) && (!cat || (x.category || "") === (cat === "__other" ? "" : cat))), [data, rid, cat]);
  const groups = useMemo(() => {
    const m = new Map();
    shown.forEach((x) => { const k = x.category || ""; if (!m.has(k)) m.set(k, []); m.get(k).push(x); });
    return [...m.entries()];
  }, [shown]);
  const catNames = useMemo(() => [...(data?.categories || []), ...((data?.dishes || []).some((x) => !x.category) ? ["__other"] : [])], [data]);
  const markers = useMemo(() => (data?.restaurants || []).map((r) => { const p = place(r); return p ? { id: r.id, lat: p.lat, lng: p.lng, label: r.name, active: r.id === picked || r.id === rid } : null; }).filter(Boolean), [data, picked, rid]);
  const approx = (data?.restaurants || []).some((r) => r.lat == null || r.lng == null);
  const pickedR = picked ? vById[picked] : null;

  const [open, setOpen] = useState(null);
  useEffect(() => { // lien direct ?plat=ID
    if (platId && data && !open) { const x = data.dishes.find((z) => z.id === platId); if (x) setOpen(x); }
  }, [platId, data]); // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => { setOpen(null); if (platId) set({ plat: "" }); };

  // scroll-spy des catégories
  const [active, setActive] = useState("");
  const refs = useRef({});
  useEffect(() => {
    if (!groups.length || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver((es) => { const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]; if (v) setActive(v.target.dataset.cat); }, { rootMargin: "-120px 0px -65% 0px" });
    Object.values(refs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [groups]);
  const goTo = (k) => { setActive(k); refs.current[k]?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const label = (k) => (k === "" || k === "__other" ? d.other : k);
  const filtered = q || city || deliv || cat || rid;
  const reset = () => { setQ(""); setSp({}, { replace: true }); setPicked(null); };

  return (
    <RestoLayout>
      <section className="rounded-3xl bg-gradient-to-br from-[#4A3020] to-[#2A1A10] text-cream p-5 sm:p-8">
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-6 lg:gap-10 items-stretch">
          <div className="flex flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#C89A3D]">H-Food</p>
            <h1 className="font-display text-3xl sm:text-5xl leading-tight mt-1">{d.title}</h1>
            <p className="text-cream/80 mt-3 max-w-md">{d.sub}</p>
            <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-5 flex flex-col sm:flex-row gap-2">
              <label className="relative flex-1">
                <span className="sr-only">{d.search}</span>
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.search} className={`${inputCls} !pl-10 !bg-cream !text-ink w-full`} />
              </label>
              <label className="sm:w-44"><span className="sr-only">{d.city}</span>
                <select value={city} onChange={(e) => set({ city: e.target.value })} className={`${inputCls} !bg-cream !text-ink w-full`}>
                  <option value="">{d.allCities}</option>{(data?.cities || (city ? [city] : [])).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" aria-pressed={deliv} onClick={() => set({ delivery: deliv ? "" : "1" })} className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm ${deliv ? "bg-cream text-ink border-cream" : "border-cream/40 text-cream"}`}><Truck size={14} aria-hidden="true" />{d.delivery}</button>
              {data && <span className="inline-flex items-center text-sm text-cream/70 px-1">{d.vendors(data.restaurants.length)} · {d.count(data.total)}</span>}
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-cream/15 min-h-[240px] sm:min-h-[300px] bg-latte-soft" aria-label={d.mapLabel}>
            {markers.length > 0 ? <MapView markers={markers} onSelect={(id) => setPicked(id)} height="100%" className="absolute inset-0" /> : <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-soft p-4 text-center">{state.loading ? "…" : d.mapLabel}</div>}
            {pickedR && (
              <div className="absolute z-[500] left-3 right-3 bottom-3 sm:right-auto sm:w-80 rounded-2xl bg-cream text-ink shadow-xl border border-line p-3 flex gap-3" role="group" aria-label={pickedR.name}>
                <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-latte-soft">{pickedR.image && <RestoImage path={pickedR.image} alt="" ratio="aspect-square" />}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{pickedR.name}</p>
                  <p className="text-xs text-ink-soft truncate">{[pickedR.area, pickedR.city].filter(Boolean).join(", ")} · {feeText(pickedR, d, money)}</p>
                  {pickedR.rating_count > 0 && <Rating value={pickedR.rating_avg} count={pickedR.rating_count} className="text-xs" />}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs font-medium">
                    <button type="button" onClick={() => { set({ rid: String(pickedR.id) }); setPicked(null); }} className="underline">{d.only}</button>
                    <Link to={`/restaurant/r/${pickedR.slug}`} className="underline">{d.open}</Link>
                  </div>
                </div>
                <button type="button" onClick={() => setPicked(null)} aria-label={ui.dishModal.close} className="self-start p-1 text-ink-soft"><X size={16} /></button>
              </div>
            )}
          </div>
        </div>
        {approx && markers.length > 0 && <p className="mt-3 text-xs text-cream/60">{d.mapNote}</p>}
      </section>

      {rid > 0 && vById[rid] && <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-latte-soft text-coffee text-sm pl-4 pr-2 py-1.5">{d.filteredBy} : <b>{vById[rid].name}</b><button type="button" onClick={() => set({ rid: "" })} aria-label={d.clear} className="w-6 h-6 rounded-full hover:bg-cream flex items-center justify-center"><X size={13} /></button></p>}

      {state.loading && !data ? <Spinner label="…" /> : state.error ? <div className="mt-8"><ErrorState message={d.error} onRetry={() => setTick((n) => n + 1)} /></div> : data && shown.length === 0 ? (
        <div className="mt-8"><EmptyState icon={UtensilsCrossed} title={d.none} hint={d.noneHint} action={filtered ? <button onClick={reset} className="rounded-full bg-ink text-cream text-sm font-medium px-6 py-3.5">{d.reset}</button> : null} /></div>
      ) : data && (
        <div className="mt-8 grid lg:grid-cols-[220px_1fr] gap-8">
          <nav aria-label={d.catalogue} className="lg:sticky lg:top-[132px] lg:self-start min-w-0">
            <h2 className="hidden lg:block font-display text-xl text-ink mb-3">{d.catalogue}</h2>
            <ul className="flex lg:flex-col gap-2 lg:gap-0 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 [scrollbar-width:none] sticky top-[116px] lg:static z-10 bg-cream/95 backdrop-blur py-2 lg:py-0">
              <li className="shrink-0"><button type="button" onClick={() => set({ cat: "" })} aria-current={!cat} className={`w-full text-left whitespace-nowrap rounded-full lg:rounded-none px-4 py-2 lg:py-3 text-sm border lg:border-0 lg:border-l-2 ${!cat ? "bg-latte-soft text-ink font-medium lg:border-ink" : "border-line text-ink-soft lg:border-transparent"}`}>{d.all}</button></li>
              {catNames.map((k) => (
                <li key={k} className="shrink-0"><button type="button" onClick={() => (cat === k ? goTo(k) : set({ cat: k }))} aria-current={cat === k || (!cat && active === (k === "__other" ? "" : k))} className={`w-full text-left whitespace-nowrap rounded-full lg:rounded-none px-4 py-2 lg:py-3 text-sm border lg:border-0 lg:border-l-2 ${(cat === k) || (!cat && active === (k === "__other" ? "" : k)) ? "bg-latte-soft text-ink font-medium lg:border-ink" : "border-line text-ink-soft lg:border-transparent"}`}>{label(k)}</button></li>
              ))}
            </ul>
          </nav>
          <div className="min-w-0 space-y-10">
            {groups.map(([k, items]) => (
              <section key={slug(k)} data-cat={k} ref={(el) => { refs.current[k] = el; }} aria-labelledby={`c-${slug(k)}`} className="scroll-mt-40">
                <h2 id={`c-${slug(k)}`} className="font-display text-2xl text-ink mb-4">{label(k)}</h2>
                <ul className="grid sm:grid-cols-2 gap-4">{items.map((x) => <Tile key={x.id} dish={x} vendor={vById[x.restaurant_id]} money={money} ui={ui} onOpen={setOpen} />)}</ul>
              </section>
            ))}
            {data.truncated && <p className="text-sm text-ink-soft text-center">{d.truncated}</p>}
          </div>
        </div>
      )}
      {open && <DishModal dish={open} vendor={vById[open.restaurant_id]} money={money} onClose={close} />}
    </RestoLayout>
  );
}
