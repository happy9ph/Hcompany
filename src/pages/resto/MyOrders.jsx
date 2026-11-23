import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import RestoLayout, { EmptyState, ErrorState, RestoAuthGate, Spinner, Card, inputCls, useRestoUi } from "../../components/restaurant/Shared.jsx";
import { useLoad, useShopMoney, errMessage } from "../../data/shop.js";
import { useUser } from "../../context/Usercontext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";
import { usePageMeta } from "../../components/ui/HeadManager.jsx";

const TONE = { pending: "bg-amber-100 text-amber-900", accepted: "bg-emerald-100 text-emerald-900", preparing: "bg-emerald-100 text-emerald-900", ready: "bg-emerald-100 text-emerald-900", completed: "bg-emerald-100 text-emerald-900", declined: "bg-red-100 text-red-800", cancelled: "bg-stone-200 text-stone-700", partial: "bg-amber-100 text-amber-900" };
export const Pill = ({ s, label }) => <span className={`inline-flex rounded-full text-xs font-medium px-2.5 py-1 ${TONE[s] || "bg-stone-200 text-stone-700"}`}>{label}</span>;

function PayForm({ s, onDone }) {
  const ui = useRestoUi(); const o = ui.orders;
  const { withAuth } = useUser(); const toast = useToast();
  const [open, setOpen] = useState(false), [f, setF] = useState({ method: "", reference: "", note: "" }), [busy, setBusy] = useState(false);
  async function send() {
    setBusy(true);
    try { await withAuth((t) => api.resto.declarePay(t, s.code, f)); toast?.success?.(o.pay.sentOk); setOpen(false); onDone(); } catch (e) { toast?.error?.(errMessage(e, ui.common.error)); onDone(); } finally { setBusy(false); }
  }
  if (!open) return <button onClick={() => setOpen(true)} className="rounded-full bg-ink text-cream text-sm font-medium px-5 py-2.5">{o.pay.declare}</button>;
  return (
    <div className="space-y-2 rounded-2xl bg-latte-soft/60 p-3">
      <input aria-label={o.pay.method} placeholder={o.pay.method} maxLength={60} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })} className={inputCls} />
      <input aria-label={o.pay.reference} placeholder={o.pay.reference} maxLength={120} value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} className={inputCls} />
      <input aria-label={o.pay.note} placeholder={o.pay.note} maxLength={300} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} className={inputCls} />
      <button disabled={busy} onClick={send} className="rounded-full bg-ink text-cream text-sm font-medium px-5 py-2.5 disabled:opacity-45">{o.pay.send}</button>
    </div>
  );
}

function Sub({ s, onCancel, onChanged }) {
  const o = useRestoUi().orders;
  const { money } = useShopMoney();
  return (
    <Card className="space-y-3" data-sub={s.code}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-display text-lg text-ink">{s.restaurant_name}</span>
        <Pill s={s.status} label={o.status[s.status] || s.status} />
      </div>
      <ul className="text-sm text-ink-soft space-y-1">{s.items.map((i, k) => <li key={k} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{money(i.line_total)}</span></li>)}</ul>
      <p className="text-xs text-ink-soft">{s.fulfilment === "delivery" ? `${o.delivery} · ${s.delivery_address}${s.delivery_zone ? ` (${s.delivery_zone})` : ""} · ${s.fee_pending ? o.feeToArrange : s.delivery_fee ? money(s.delivery_fee) : o.feeFree}` : o.pickup}</p>
      {s.status === "declined" && s.decline_reason && <p className="text-sm text-red-700">{o.reason} : {s.decline_reason}</p>}
      <div className="flex justify-between text-sm font-medium text-ink border-t border-line pt-2"><span>{o.total}</span><span>{money(s.total_known)}</span></div>
      <p className="text-xs text-ink-faint">{o.payment[s.payment_status] || s.payment_status} · {o.paymentHint}</p>
      {s.status === "cancelled" && s.status_note && <p className="text-sm text-red-700">{o.statusNote} : {s.status_note}</p>}
      {s.payment_status !== "unpaid" && (s.payment_method || s.payment_ref) && <p className="text-xs text-ink-soft">{o.pay.via} : {s.payment_method || "—"}{s.payment_ref ? ` · ${o.pay.ref} ${s.payment_ref}` : ""}</p>}
      {s.payment_status === "unpaid" && ["accepted", "preparing", "ready", "completed"].includes(s.status) && <PayForm s={s} onDone={onChanged} />}
      {s.status === "pending" && <button onClick={() => onCancel(s.code)} className="text-sm underline text-red-700">{o.cancel}</button>}
    </Card>
  );
}

export function OrderDetail() {
  const ui = useRestoUi(); const o = ui.orders;
  const { code } = useParams(); const loc = useLocation();
  const { withAuth } = useUser(); const toast = useToast(); const { money } = useShopMoney();
  const { data, error, loading, reload } = useLoad(() => withAuth((t) => api.resto.order(t, code)), [code]);
  usePageMeta({ title: `${o.code} ${code} · H-Restaurant` });
  async function cancel(sc) {
    if (!window.confirm(o.cancelConfirm)) return;
    try { await withAuth((t) => api.resto.cancelSub(t, sc)); toast?.success?.(o.cancelled); reload(); } catch (e) { toast?.error?.(errMessage(e, ui.common.error)); }
  }
  return (
    <RestoAuthGate>
      <RestoLayout width="max-w-3xl">
        <Link to="/restaurant/commandes" className="text-sm text-ink-soft underline">{o.back}</Link>
        {loading ? <Spinner label={ui.common.loading} /> : error ? <ErrorState onRetry={reload} /> : data && (
          <div className="mt-4 space-y-4">
            {loc.state?.placed && <div role="status" className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-900"><b>{o.placed}</b><p className="mt-1">{o.placedHint}</p></div>}
            <div className="flex flex-wrap items-center gap-3"><h1 className="font-display text-3xl text-ink">{o.code} <span className="font-mono text-2xl">{data.code}</span></h1><Pill s={data.status} label={o.status[data.status] || data.status} /></div>
            {data.suborders.map((s) => <Sub key={s.code} s={s} onCancel={cancel} onChanged={reload} />)}
            <p className="flex justify-between font-medium text-ink"><span>{o.grand}</span><span>{money(data.grand_total)}</span></p>
          </div>
        )}
      </RestoLayout>
    </RestoAuthGate>
  );
}

export default function MyOrders() {
  const ui = useRestoUi(); const o = ui.orders;
  const { withAuth } = useUser(); const { money } = useShopMoney();
  usePageMeta({ title: `${o.title} · H-Restaurant` });
  const { data, error, loading, reload } = useLoad(() => withAuth((t) => api.resto.orders(t)), []);
  const rows = data?.orders || [];
  return (
    <RestoAuthGate>
      <RestoLayout width="max-w-3xl">
        <h1 className="font-display text-3xl text-ink mb-6">{o.title}</h1>
        {loading ? <Spinner label={ui.common.loading} /> : error ? <ErrorState onRetry={reload} /> : !rows.length ? (
          <EmptyState icon={ShoppingBag} title={o.empty} hint={o.emptyHint} action={<Link to="/restaurant" className="rounded-full bg-ink text-cream text-sm font-medium px-6 py-3.5">{o.find}</Link>} />
        ) : (
          <ul className="space-y-3">{rows.map((x) => (
            <li key={x.code}><Link to={`/restaurant/commandes/${x.code}`} className="block rounded-2xl border border-line bg-surface p-4 hover:border-coffee-light">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-ink">{x.code}</span><Pill s={x.status} label={o.status[x.status] || x.status} /></div>
              <p className="text-sm text-ink-soft mt-1">{x.suborders.map((s) => s.restaurant_name).join(" · ")}</p>
              <p className="text-sm text-ink mt-1">{money(x.grand_total)}</p>
            </Link></li>))}</ul>
        )}
      </RestoLayout>
    </RestoAuthGate>
  );
}
