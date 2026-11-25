import { useSearchParams } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import RestoLayout, { EmptyState, ErrorState, Pagination, RestoCard, Spinner, useRestoUi, inputCls } from "../../components/restaurant/Shared.jsx";
import SearchForm from "../../components/restaurant/SearchForm.jsx";
import { useLoad } from "../../data/shop.js";
import { api } from "../../lib/api.js";
import { CUISINES, searchKind } from "../../lib/resto.js";
import { usePageMeta } from "../../components/ui/HeadManager.jsx";

const KEYS = ["q", "city", "cuisine", "price", "day", "time", "party", "sort", "seller_type", "delivery"];

export default function RestoSearch() {
  const ui = useRestoUi();
  const s = ui.search;
  const [params, setParams] = useSearchParams();
  const type = params.get("seller_type") || "";
  const kind = searchKind(type);
  usePageMeta({ title: `${s.titles[kind]} · H-Food` });
  const page = Number(params.get("page") || 1);
  const query = {}; KEYS.forEach((k) => { if (params.get(k)) query[k] = params.get(k); });
  const { data, error, loading, reload } = useLoad(() => api.resto.search({ ...query, page, per_page: 12 }), [params.toString()]);
  const home = useLoad(() => api.resto.home(), []);
  const set = (k, v) => { const n = new URLSearchParams(params); v ? n.set(k, v) : n.delete(k); n.delete("page"); setParams(n, { replace: true }); };
  const carry = ["day", "time", "party"].filter((k) => params.get(k)).map((k) => `${k}=${params.get(k)}`).join("&");
  const chip = (on) => `rounded-full border px-4 py-2 text-sm whitespace-nowrap ${on ? "border-coffee bg-latte-soft text-ink" : "border-line text-ink-soft hover:border-coffee-light"}`;
  return (
    <RestoLayout>
      {type === "individual" ? <p role="note" className="rounded-2xl bg-latte-soft/60 text-sm text-ink-soft p-4">{s.noBookingForSellers}</p> : (
        <SearchForm cities={home.data?.cities || []} initial={{ day: params.get("day"), time: params.get("time"), party: params.get("party"), city: params.get("city") }} key={params.get("day") + params.get("time") + params.get("party") + params.get("city")} />
      )}
      <div className="flex flex-wrap items-center gap-2 mt-5" role="group" aria-label={s.type}>
        {[["", s.typeAll], ["restaurant", s.typeRestaurant], ["individual", s.typeIndividual]].map(([v, l]) => <button key={v || "all"} type="button" aria-pressed={type === v} onClick={() => set("seller_type", v)} className={chip(type === v)}>{l}</button>)}
        <button type="button" aria-pressed={params.get("delivery") === "true"} onClick={() => set("delivery", params.get("delivery") === "true" ? "" : "true")} className={chip(params.get("delivery") === "true")}>{s.withDelivery}</button>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 my-6">
        <div><h1 className="font-display text-3xl text-ink">{s.titles[kind]}</h1>{data && <p className="text-sm text-ink-soft mt-1">{s.counts[kind](data.total)}</p>}{data?.excluded_individuals > 0 && <p className="text-xs text-ink-faint mt-1">{s.excluded(data.excluded_individuals)}</p>}</div>
        <div className="flex flex-wrap gap-3">
          <select aria-label={s.cuisine} value={params.get("cuisine") || ""} onChange={(e) => set("cuisine", e.target.value)} className={`${inputCls} !w-auto`}><option value="">{s.cuisine} : {s.all}</option>{CUISINES.map((c) => <option key={c} value={c}>{ui.cuisines[c]}</option>)}</select>
          <select aria-label={s.budget} value={params.get("price") || ""} onChange={(e) => set("price", e.target.value)} className={`${inputCls} !w-auto`}><option value="">{s.budget}</option>{[1, 2, 3].map((n) => <option key={n} value={n}>{"$".repeat(n)}</option>)}</select>
          <select aria-label={s.sort} value={params.get("sort") || "recommended"} onChange={(e) => set("sort", e.target.value)} className={`${inputCls} !w-auto`}>{Object.entries(s.sorts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </div>
      </div>
      {loading && !data ? <Spinner label={ui.common.loading} /> : error && !data ? <ErrorState onRetry={reload} /> : data.items.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title={s.none} hint={s.noneHint} action={<button onClick={() => setParams({}, { replace: true })} className="rounded-full border border-line px-5 py-2.5 text-sm">{s.reset}</button>} />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{data.items.map((r, i) => <RestoCard key={r.id} r={r} index={i} query={carry ? `?${carry}` : ""} />)}</div>
          <Pagination page={data.page} pages={data.pages} onChange={(p) => { const n = new URLSearchParams(params); n.set("page", p); setParams(n); window.scrollTo({ top: 0 }); }} />
        </>
      )}
    </RestoLayout>
  );
}
