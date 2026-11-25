import { useState } from "react";
import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";
import RestoLayout, { EmptyState, ErrorState, RestoAuthGate, Spinner, Card, inputCls, useRestoUi } from "../../components/restaurant/Shared.jsx";
import { useLoad, useShopMoney, errMessage } from "../../data/shop.js";
import { useUser } from "../../context/Usercontext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";
import { usePageMeta } from "../../components/ui/HeadManager.jsx";
import { Pill } from "./MyOrders.jsx";
import { SellerProposal } from "../../components/restaurant/Proposals.jsx";

export default function SellerOrders() {
  const ui = useRestoUi(); const t = ui.sellerOrders; const o = ui.orders;
  const { withAuth } = useUser(); const toast = useToast(); const { money } = useShopMoney();
  const [f, setF] = useState("");
  const [declining, setDeclining] = useState(null), [reason, setReason] = useState(""), [busy, setBusy] = useState(false);
  usePageMeta({ title: `${t.title} · H-Food` });
  const { data, error, loading, reload } = useLoad(() => withAuth((tk) => api.resto.sellerOrders(tk, f)), [f]);
  const rows = data?.orders || [];
  const [cancelling, setCancelling] = useState(null), [rej, setRej] = useState(null);
  const NEXT = { accepted: ["preparing", "ready", "completed"], preparing: ["ready", "completed"], ready: ["completed"] };
  async function run(fn) {
    setBusy(true);
    try { await withAuth(fn); toast?.success?.(t.updated); setCancelling(null); setRej(null); setReason(""); reload(); }
    catch (e) { toast?.error?.(errMessage(e, ui.common.error)); reload(); } finally { setBusy(false); }
  }
  const setStatus = (code, status) => run((tk) => api.resto.sellerStatus(tk, code, { status, reason: status === "cancelled" ? reason : "" }));
  const payAct = (code, action) => run((tk) => api.resto.sellerPay(tk, code, { action, note: action === "reject" ? reason : "" }));
  async function decide(code, action) {
    setBusy(true);
    try { await withAuth((tk) => api.resto.sellerDecide(tk, code, { action, reason: action === "decline" ? reason : "" })); toast?.success?.(action === "accept" ? t.accepted : t.declined); setDeclining(null); setReason(""); reload(); }
    catch (e) { toast?.error?.(errMessage(e, ui.common.error)); reload(); } finally { setBusy(false); }
  }
  return (
    <RestoAuthGate>
      <RestoLayout width="max-w-3xl">
        <Link to="/restaurant/pro" className="text-sm text-ink-soft underline">{t.back}</Link>
        <h1 className="font-display text-3xl text-ink my-4">{t.title}</h1>
        <div className="flex flex-wrap gap-2 mb-5">{["", "pending", "accepted", "declined", "cancelled"].map((k) => <button key={k} onClick={() => setF(k)} aria-pressed={f === k} className={`rounded-full px-4 py-2 text-sm border ${f === k ? "bg-ink text-cream border-ink" : "border-line text-ink-soft"}`}>{t.filter[k || "all"]}</button>)}</div>
        {loading ? <Spinner label={ui.common.loading} /> : error ? <ErrorState onRetry={reload} /> : !rows.length ? <EmptyState icon={Inbox} title={t.empty} /> : (
          <ul className="space-y-4">{rows.map((s) => (
            <li key={s.code}><Card className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-ink">{s.code}</span><Pill s={s.status} label={o.status[s.status] || s.status} /></div>
              {s.customer && <p className="text-sm text-ink-soft">{t.customer} : {s.customer.name} · <a href={`tel:${s.customer.phone}`} className="underline">{s.customer.phone}</a></p>}
              <ul className="text-sm text-ink-soft space-y-1">{s.items.map((i, k) => <li key={k} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{money(i.line_total)}</span></li>)}</ul>
              <p className="text-xs text-ink-soft">{s.fulfilment === "delivery" ? `${o.delivery} · ${s.delivery_address}${s.delivery_zone ? ` (${s.delivery_zone})` : ""} · ${s.fee_pending ? o.feeToArrange : s.delivery_fee ? money(s.delivery_fee) : o.feeFree}` : o.pickup}</p>
              {s.note && <p className="text-sm text-ink-soft">{o.note} : {s.note}</p>}
              <SellerProposal s={s} onDone={reload} />
              <p className="flex justify-between text-sm font-medium text-ink border-t border-line pt-2"><span>{o.total}</span><span>{money(s.total_known)}</span></p>
              <p className="text-xs text-ink-faint">{t.noPayment} · {o.payment[s.payment_status]}{s.payment_method || s.payment_ref ? ` (${s.payment_method || ""}${s.payment_ref ? ` ${o.pay.ref} ${s.payment_ref}` : ""})` : ""}</p>
              {["accepted", "preparing", "ready", "completed"].includes(s.status) && s.payment_status !== "confirmed" && (
                <div className="flex flex-wrap gap-2">
                  {s.payment_status === "declared" && <p className="w-full text-xs text-ink-soft">{t.payDeclared}</p>}
                  <button disabled={busy} onClick={() => payAct(s.code, "confirm")} className="rounded-full bg-emerald-700 text-white text-sm px-4 py-2 disabled:opacity-45">{t.confirmPay}</button>
                  {s.payment_status === "declared" && (rej === s.code
                    ? <div className="w-full space-y-2"><textarea rows={2} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.rejectReason} className={inputCls} /><button disabled={busy || reason.trim().length < 2} onClick={() => payAct(s.code, "reject")} className="rounded-full bg-red-700 text-white text-sm px-4 py-2 disabled:opacity-45">{t.rejectPay}</button></div>
                    : <button onClick={() => { setRej(s.code); setReason(""); }} className="rounded-full border border-line text-sm px-4 py-2">{t.rejectPay}</button>)}
                </div>
              )}
              {NEXT[s.status] && (
                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                  {NEXT[s.status].map((n) => <button key={n} disabled={busy || (!!s.open_proposal && n !== "preparing")} title={s.open_proposal && n !== "preparing" ? ui.orders.prop.waiting : undefined} onClick={() => setStatus(s.code, n)} className="rounded-full bg-ink text-cream text-sm px-4 py-2 disabled:opacity-45">{t.next[n]}</button>)}
                  {cancelling === s.code
                    ? <div className="w-full space-y-2"><textarea rows={2} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.cancelReason} className={inputCls} /><button disabled={busy || reason.trim().length < 2} onClick={() => setStatus(s.code, "cancelled")} className="rounded-full bg-red-700 text-white text-sm px-4 py-2 disabled:opacity-45">{t.cancelOrder}</button></div>
                    : <button onClick={() => { setCancelling(s.code); setReason(""); }} className="rounded-full border border-line text-sm px-4 py-2">{t.cancelOrder}</button>}
                </div>
              )}
              {s.status === "pending" && (declining === s.code ? (
                <div className="space-y-2"><textarea rows={2} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.reasonPrompt} className={inputCls} />
                  <div className="flex gap-2"><button disabled={busy || reason.trim().length < 2} onClick={() => decide(s.code, "decline")} className="rounded-full bg-red-700 text-white text-sm px-5 py-2.5 disabled:opacity-45">{t.decline}</button><button onClick={() => setDeclining(null)} className="rounded-full border border-line text-sm px-5 py-2.5">{ui.common.close}</button></div></div>
              ) : <div className="flex gap-2"><button disabled={busy} onClick={() => decide(s.code, "accept")} className="rounded-full bg-ink text-cream text-sm px-5 py-2.5 disabled:opacity-45">{t.accept}</button><button onClick={() => setDeclining(s.code)} className="rounded-full border border-line text-sm px-5 py-2.5">{t.decline}</button></div>)}
            </Card></li>))}</ul>
        )}
      </RestoLayout>
    </RestoAuthGate>
  );
}
