import { useState } from "react";
import { useUser } from "../../context/Usercontext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useShopMoney, errMessage } from "../../data/shop.js";
import { api } from "../../lib/api.js";
import { inputCls, useRestoUi } from "./Shared.jsx";

const fmtDate = (iso) => { try { return new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleString(); } catch { return iso; } };

export function proposalLines(p, money, pr) {
  return (
    <ul className="text-sm space-y-1">
      {p.lines.map((l) => (
        <li key={l.line_id} className="flex flex-wrap justify-between gap-x-3">
          <span>{l.name}</span>
          <span>{l.qty_after === 0 ? <b className="text-red-700">{pr.removed}</b> : <><span className="line-through text-ink-faint">{l.qty_before}</span> → <b>{l.qty_after}</b></>} · {money(l.unit_price * l.qty_after)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Côté CLIENT : proposition en attente (accepter / refuser) + historique. */
export function ClientProposal({ s, onDone }) {
  const ui = useRestoUi(); const pr = ui.orders.prop;
  const { withAuth } = useUser(); const toast = useToast(); const { money } = useShopMoney();
  const [note, setNote] = useState(""), [busy, setBusy] = useState(false);
  const p = s.open_proposal;
  const past = (s.proposals || []).filter((x) => x.status !== "pending");
  async function decide(action) {
    setBusy(true);
    try { await withAuth((t) => api.resto.decideProposal(t, s.code, p.id, { action, note })); toast?.success?.(action === "accept" ? pr.acceptedOk : pr.declinedOk); } catch (e) { toast?.error?.(errMessage(e, ui.common.error)); } finally { setBusy(false); onDone(); }
  }
  return (
    <>
      {p && (
        <div role="region" aria-label={pr.title} className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
          <div><p className="font-medium text-amber-950">{pr.title}</p><p className="text-xs text-amber-900">{pr.hint}</p></div>
          {p.message && <p className="text-sm text-ink"><span className="text-ink-soft">{pr.sellerMsg} :</span> {p.message}</p>}
          {proposalLines(p, money, pr)}
          <p className="flex justify-between text-sm font-medium border-t border-amber-200 pt-2"><span>{pr.subtotal}</span><span><span className="line-through text-ink-faint mr-2">{money(p.items_total_before)}</span>{money(p.items_total_after)}</span></p>
          <p className="text-xs text-ink-soft">{pr.expires} {fmtDate(p.expires_at)}</p>
          <input aria-label={pr.note} placeholder={pr.note} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => decide("accept")} className="rounded-full bg-ink text-cream text-sm font-medium px-5 py-2.5 disabled:opacity-45">{pr.accept}</button>
            <button disabled={busy} onClick={() => decide("decline")} className="rounded-full border border-line text-sm px-5 py-2.5 disabled:opacity-45">{pr.decline}</button>
          </div>
        </div>
      )}
      {past.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-ink-soft">{pr.history} ({past.length})</summary>
          <ul className="mt-2 space-y-2">{past.map((x) => <li key={x.id} className="rounded-xl bg-latte-soft/50 p-3"><p className="text-xs text-ink-soft">{pr.st[x.status] || x.status} · {fmtDate(x.created_at)}</p>{proposalLines(x, money, pr)}</li>)}</ul>
        </details>
      )}
    </>
  );
}

/** Côté VENDEUR : proposer (réduire / retirer), voir l'attente, retirer la proposition. */
export function SellerProposal({ s, onDone }) {
  const ui = useRestoUi(); const pr = ui.orders.prop;
  const { withAuth } = useUser(); const toast = useToast(); const { money } = useShopMoney();
  const [open, setOpen] = useState(false), [qty, setQty] = useState({}), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const p = s.open_proposal;
  const can = ["pending", "accepted", "preparing"].includes(s.status) && s.payment_status === "unpaid";
  const val = (i) => (qty[i.line_id] ?? i.qty);
  async function send() {
    const changes = s.items.filter((i) => val(i) !== i.qty).map((i) => ({ line_id: i.line_id, qty: val(i) }));
    if (!changes.length) return setErr(pr.nothing);
    if (s.items.every((i) => val(i) === 0)) return setErr(pr.allZero);
    setBusy(true); setErr("");
    try { await withAuth((t) => api.resto.sellerPropose(t, s.code, { message: msg, changes })); toast?.success?.(pr.sent); setOpen(false); setQty({}); setMsg(""); } catch (e) { toast?.error?.(errMessage(e, ui.common.error)); } finally { setBusy(false); onDone(); }
  }
  async function withdraw() {
    setBusy(true);
    try { await withAuth((t) => api.resto.sellerCancelProposal(t, s.code)); toast?.success?.(pr.withdrawn); } catch (e) { toast?.error?.(errMessage(e, ui.common.error)); } finally { setBusy(false); onDone(); }
  }
  if (p) return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 space-y-2">
      <p className="text-sm font-medium text-amber-950">{pr.waiting}</p>
      {proposalLines(p, money, pr)}
      <p className="text-sm">{pr.subtotal} : <b>{money(p.items_total_after)}</b> <span className="text-xs text-ink-soft">({pr.expires} {fmtDate(p.expires_at)})</span></p>
      <button disabled={busy} onClick={withdraw} className="rounded-full border border-line text-sm px-4 py-2 disabled:opacity-45">{pr.withdraw}</button>
    </div>
  );
  if (!can) return null;
  if (!open) return <button onClick={() => setOpen(true)} className="rounded-full border border-line text-sm px-4 py-2">{pr.propose}</button>;
  return (
    <div className="rounded-2xl bg-latte-soft/60 p-3 space-y-3">
      <p className="text-xs text-ink-soft">{pr.proposeHint}</p>
      <ul className="space-y-2">{s.items.map((i) => (
        <li key={i.line_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>{i.name} <span className="text-ink-faint">({money(i.unit_price)})</span></span>
          <label className="flex items-center gap-2">
            <input aria-label={`${pr.qty} ${i.name}`} type="number" inputMode="numeric" min={0} max={i.qty} value={val(i)} onChange={(e) => setQty({ ...qty, [i.line_id]: Math.max(0, Math.min(i.qty, Number(e.target.value) || 0)) })} className="w-20 rounded-xl border border-line bg-surface px-3 py-2 text-ink" />
            <span className="text-xs text-ink-faint">/ {i.qty}</span></label>
        </li>))}</ul>
      <textarea rows={2} maxLength={400} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={pr.message} aria-label={pr.message} className={inputCls} />
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-2"><button disabled={busy} onClick={send} className="rounded-full bg-ink text-cream text-sm px-5 py-2.5 disabled:opacity-45">{pr.send}</button><button onClick={() => { setOpen(false); setErr(""); }} className="rounded-full border border-line text-sm px-5 py-2.5">{ui.common.close}</button></div>
    </div>
  );
}
