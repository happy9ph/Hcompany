import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, Trash2, Minus, Plus, AlertTriangle } from "lucide-react";
import RestoLayout, { EmptyState, Card, Field, inputCls, useRestoUi } from "../../components/restaurant/Shared.jsx";
import { useShopMoney, errMessage } from "../../data/shop.js";
import { useUser } from "../../context/Usercontext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";
import { foodCart, useFoodCart, groupByVendor, toVendors, cartCount } from "../../lib/foodCart.js";
import { usePageMeta } from "../../components/ui/HeadManager.jsx";

const ISSUE = { item_unavailable: "unavailableItem", item_not_found: "itemNotFound", vendor_unavailable: "vendorUnavailable", delivery_unavailable: "deliveryUnavailable", address_required: "addressRequired", zone_required: "zoneRequired", zone_unsupported: "zoneUnsupported", fulfilment_missing: "fulfilmentMissing" };

const ISSUE_BY_KEY = { fulfilmentMissing: "fulfilmentMissing", addressRequired: "addressRequired", zoneRequired: "zoneRequired" };

function feeText(v, c, money) {
  if (v.fulfilment !== "delivery") return null;
  if (v.fee_pending) return c.feeToArrange;
  return v.fee ? `${c.fee} : ${money(v.fee)}` : c.feeFree;
}

export default function RestoCart() {
  const ui = useRestoUi();
  const c = ui.cart;
  usePageMeta({ title: `${c.title} · H-Food` });
  const { money } = useShopMoney();
  const { isAuthenticated, withAuth, user } = useUser();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const cart = useFoodCart();
  const [quote, setQuote] = useState(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [acceptPrices, setAcceptPrices] = useState(false);
  const [contact, setContact] = useState({ name: user?.full_name || user?.name || "", phone: user?.phone || "", note: "" });
  const sig = useMemo(() => JSON.stringify(toVendors(cart)), [cart]);
  const seq = useRef(0);

  useEffect(() => { // revalidation serveur (prix, disponibilité, livraison), avec un léger délai
    if (!cart.lines.length) { setQuote(null); return undefined; }
    const n = ++seq.current;
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const q = await api.resto.quote(toVendors(foodCart.getState()));
        if (n !== seq.current) return;
        setQuote(q); foodCart.enrich(q); setErr("");
      } catch (e) { if (n === seq.current) setErr(errMessage(e, c.error)); } finally { if (n === seq.current) setChecking(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { // un vendeur qui ne livre pas : le retrait est le seul choix possible
    for (const v of quote?.vendors || []) if (!v.offers_delivery && !(foodCart.getState().opts[v.restaurant_id] || {}).fulfilment) foodCart.setOpt(v.restaurant_id, { fulfilment: "pickup" });
  }, [quote]);

  if (!cart.lines.length) return (
    <RestoLayout width="max-w-3xl"><EmptyState icon={ShoppingBag} title={c.empty} hint={c.emptyHint} action={<Link to="/restaurant" className="rounded-full bg-ink text-cream text-sm font-medium px-6 py-3.5">{c.browse}</Link>} /></RestoLayout>
  );

  const groups = groupByVendor(cart);
  const qv = (rid) => quote?.vendors?.find((v) => v.restaurant_id === rid);
  const qline = (rid, iid) => qv(rid)?.lines?.find((l) => l.item_id === iid);
  const changes = (quote?.vendors || []).flatMap((v) => (v.issues || []).filter((i) => i.code === "price_changed"));
  // le devis ne signale pas ces points (ils ne bloquent qu'à l'envoi) : on les contrôle ici pour ne jamais laisser cliquer pour rien
  const missing = (g) => {
    const o = cart.opts[g.rid] || {}, v = qv(g.rid), out = [];
    if (!o.fulfilment) out.push("fulfilmentMissing");
    else if (o.fulfilment === "delivery") {
      if ((o.address || "").trim().length < 5) out.push("addressRequired");
      if (v?.zones?.length && !o.zone) out.push("zoneRequired");
    }
    return out;
  };
  const incomplete = groups.some((g) => missing(g).length > 0);
  const blocking = !quote || quote.vendors.some((v) => (v.issues || []).some((i) => ISSUE[i.code]));
  const needsPrices = changes.length > 0 && !acceptPrices;
  const canSend = quote && !checking && !blocking && !incomplete && !needsPrices && contact.name.trim().length > 1 && contact.phone.trim().length >= 6;

  // pourquoi le bouton est grisé : toujours dit clairement, vendeur par vendeur
  const todo = [
    ...groups.flatMap((g) => missing(g).map((k) => `${g.name || qv(g.rid)?.name || ""} : ${c[ISSUE_BY_KEY[k]]}`)),
    ...(blocking && quote ? [c.needFix] : []),
    ...(needsPrices ? [c.needPrices] : []),
    ...(contact.name.trim().length > 1 ? [] : [c.needName]),
    ...(contact.phone.trim().length >= 6 ? [] : [c.needPhone]),
  ];

  function accept() { foodCart.enrich(quote, { acceptPrices: true }); setAcceptPrices(true); }

  async function place() {
    if (!isAuthenticated) { nav("/connexion", { state: { redirectTo: loc.pathname } }); return; }
    setBusy(true); setErr("");
    try {
      const body = { contact_name: contact.name, phone: contact.phone, note: contact.note, accept_price_changes: acceptPrices, vendors: toVendors(foodCart.getState()) };
      const res = await withAuth((tk) => api.resto.checkout(tk, body, foodCart.checkoutKey()));
      foodCart.clear(); toast?.success?.(c.sent);
      nav(`/restaurant/commandes/${res.code}`, { state: { placed: true } });
    } catch (e) {
      const d = e?.data?.detail;
      if (e?.status === 409 && d?.code === "cart_changed") { setQuote(d.cart); foodCart.enrich(d.cart); setErr([...new Set((d.cart?.vendors || []).flatMap((v) => (v.issues || []).map((i) => ISSUE[i.code]).filter(Boolean)))].map((k) => c[k]).join(" ") || c.changed); setAcceptPrices(false); } else setErr(errMessage(e, c.error));
    } finally { setBusy(false); }
  }

  return (
    <RestoLayout width="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-ink">{c.title} <span className="text-base text-ink-faint">({cartCount(cart)})</span></h1>
        <button onClick={() => window.confirm(c.clearConfirm) && foodCart.clear()} className="text-sm text-ink-soft underline">{c.clear}</button>
      </div>

      {changes.length > 0 && !acceptPrices && (
        <div role="alert" className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium inline-flex items-center gap-2"><AlertTriangle size={16} />{c.priceChanged}</p>
          <ul className="mt-2 list-disc pl-5">{changes.map((i) => <li key={i.item_id}>{c.priceChangedLine(i.name, money(i.old), money(i.new))}</li>)}</ul>
          <button onClick={accept} className="mt-3 rounded-full bg-ink text-cream text-sm font-medium px-5 py-2.5">{c.acceptPrices}</button>
        </div>
      )}
      {err && <p role="alert" className="mb-4 text-sm text-red-600">{err}</p>}

      <div className="space-y-6">
        {groups.map((g) => {
          const v = qv(g.rid), o = cart.opts[g.rid] || {};
          const canDeliver = v ? v.offers_delivery : true;
          return (
            <Card key={g.rid} data-vendor={g.rid}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0"><p className="text-xs uppercase tracking-wide text-ink-faint">{c.vendor}</p>
                  {g.slug ? <Link to={`/restaurant/r/${g.slug}`} className="font-display text-xl text-ink">{g.name || v?.name}</Link> : <p className="font-display text-xl text-ink">{g.name || v?.name}</p>}</div>
                <button onClick={() => foodCart.clearVendor(g.rid)} aria-label={c.clearVendor} className="text-ink-soft hover:text-red-600 p-2"><Trash2 size={16} /></button>
              </div>
              {(v?.issues || []).filter((i) => ISSUE[i.code] && !["address_required", "zone_required", "zone_unsupported", "fulfilment_missing", "delivery_unavailable"].includes(i.code)).length > 0 && null}
              <ul className="divide-y divide-line">
                {g.lines.map((l) => {
                  const q = qline(g.rid, l.iid); const bad = q && (!q.available || !q.name);
                  return (
                    <li key={l.iid} className="py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-ink ${bad ? "line-through opacity-60" : ""}`}>{q?.name || l.name || `#${l.iid}`}</p>
                        <p className="text-sm text-ink-soft">{money(q?.unit_price ?? l.price ?? 0)}</p>
                        {bad && <p className="text-xs text-red-600 mt-0.5">{q?.name ? c.unavailableItem : c.itemNotFound}</p>}
                      </div>
                      {bad ? <button onClick={() => foodCart.remove(l.iid)} className="text-sm underline text-red-600">{c.remove}</button> : (
                        <div className="inline-flex items-center gap-1 rounded-full border border-line px-1 py-1">
                          <button aria-label={c.dec} onClick={() => foodCart.setQty(l.iid, l.qty - 1)} className="w-8 h-8 rounded-full hover:bg-latte-soft flex items-center justify-center"><Minus size={14} /></button>
                          <span className="w-6 text-center text-sm" aria-live="polite">{l.qty}</span>
                          <button aria-label={c.inc} onClick={() => foodCart.setQty(l.iid, l.qty + 1)} className="w-8 h-8 rounded-full hover:bg-latte-soft flex items-center justify-center"><Plus size={14} /></button>
                        </div>
                      )}
                      <p className="w-20 text-right text-sm text-ink">{money(q?.line_total ?? 0)}</p>
                    </li>
                  );
                })}
              </ul>

              <fieldset className="mt-4 space-y-2">
                <legend className="text-sm font-medium text-ink mb-1">{c.fulfilment}</legend>
                <label className={`flex items-center gap-2 text-sm ${canDeliver ? "" : "opacity-50"}`}><input type="radio" name={`f${g.rid}`} disabled={!canDeliver} checked={o.fulfilment === "delivery"} onChange={() => foodCart.setOpt(g.rid, { fulfilment: "delivery" })} />{c.delivery}{!canDeliver && ` — ${c.noDelivery}`}</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name={`f${g.rid}`} checked={o.fulfilment === "pickup"} onChange={() => foodCart.setOpt(g.rid, { fulfilment: "pickup" })} />{c.pickup}</label>
              </fieldset>
              {o.fulfilment === "delivery" && (
                <div className="mt-3 space-y-3">
                  {v?.zones?.length > 0 && <Field label={c.zone} htmlFor={`z${g.rid}`}><select id={`z${g.rid}`} value={o.zone || ""} onChange={(e) => foodCart.setOpt(g.rid, { zone: e.target.value })} className={inputCls}><option value="">{c.zoneChoose}</option>{v.zones.map((z) => <option key={z} value={z}>{z}</option>)}</select></Field>}
                  <Field label={c.address} htmlFor={`a${g.rid}`}><input id={`a${g.rid}`} value={o.address || ""} maxLength={200} placeholder={c.addressHint} onChange={(e) => foodCart.setOpt(g.rid, { address: e.target.value })} className={inputCls} /></Field>
                  {v && <p className="text-xs text-ink-soft">{feeText(v, c, money)}{v.fee_note ? ` · ${v.fee_note}` : ""}{v.terms ? ` · ${c.terms} : ${v.terms}` : ""}</p>}
                </div>
              )}
              {(v?.issues || []).filter((i) => ["address_required", "zone_required", "zone_unsupported", "fulfilment_missing", "delivery_unavailable"].includes(i.code)).map((i) => <p key={i.code} className="mt-2 text-xs text-red-600">{c[ISSUE[i.code]]}</p>)}
              {missing(g).map((k) => <p key={k} className="mt-2 text-xs text-amber-800">{c[ISSUE_BY_KEY[k]]}</p>)}
              {(v?.issues || []).some((i) => i.code === "vendor_unavailable") && <p className="mt-2 text-xs text-red-600">{c.vendorUnavailable}</p>}
              <Field label={c.note} htmlFor={`n${g.rid}`} className="mt-3"><input id={`n${g.rid}`} value={o.note || ""} maxLength={300} onChange={(e) => foodCart.setOpt(g.rid, { note: e.target.value })} className={inputCls} /></Field>

              {v && <dl className="mt-4 border-t border-line pt-3 text-sm space-y-1">
                <div className="flex justify-between text-ink-soft"><dt>{c.subtotal}</dt><dd>{money(v.items_total)}</dd></div>
                {v.fulfilment === "delivery" && <div className="flex justify-between text-ink-soft"><dt>{c.delivery}</dt><dd>{feeText(v, c, money)}</dd></div>}
                <div className="flex justify-between font-medium text-ink"><dt>{c.totalAll}</dt><dd>{money(v.total_known)}</dd></div>
              </dl>}
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 space-y-4">
        <h2 className="font-display text-xl text-ink">{c.contact}</h2>
        <Field label={c.name} htmlFor="cn"><input id="cn" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className={inputCls} autoComplete="name" /></Field>
        <Field label={c.phone} htmlFor="cp"><input id="cp" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={inputCls} inputMode="tel" autoComplete="tel" /></Field>
        <Field label={c.orderNote} htmlFor="co"><textarea id="co" rows={2} maxLength={500} value={contact.note} onChange={(e) => setContact({ ...contact, note: e.target.value })} className={inputCls} /></Field>
        {quote && <dl className="border-t border-line pt-3 text-sm space-y-1">
          <div className="flex justify-between text-ink-soft"><dt>{c.itemsTotal}</dt><dd>{money(quote.items_total)}</dd></div>
          {quote.fees_known_total > 0 && <div className="flex justify-between text-ink-soft"><dt>{c.fees}</dt><dd>{money(quote.fees_known_total)}</dd></div>}
          <div className="flex justify-between font-medium text-ink text-base"><dt>{quote.fees_pending ? c.total : c.totalAll}</dt><dd>{money(quote.grand_total)}</dd></div>
          {quote.fees_pending && <p className="text-xs text-ink-soft pt-1">{c.feesPending}</p>}
        </dl>}
        <p className="text-xs text-ink-faint">{c.pay}</p>
        {!isAuthenticated && <p className="text-xs text-ink-soft">{c.needSignin}</p>}
        {isAuthenticated && !checking && todo.length > 0 && <div role="status" className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900"><p className="font-medium">{c.todo}</p><ul className="list-disc pl-5 mt-1">{todo.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        <button onClick={place} disabled={busy || (isAuthenticated && !canSend)} className="w-full rounded-full bg-ink text-cream text-sm font-medium py-3.5 disabled:opacity-45">{busy ? c.placing : checking ? c.checking : isAuthenticated ? c.place : c.signin}</button>
      </Card>
    </RestoLayout>
  );
}
