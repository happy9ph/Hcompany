import { useState } from "react";
import { Star } from "lucide-react";
import { useUser } from "../../context/Usercontext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { errMessage } from "../../data/shop.js";
import { api } from "../../lib/api.js";
import { inputCls, useRestoUi } from "./Shared.jsx";

export function Stars({ value, label }) {
  return <span role="img" aria-label={`${value}/5 ${label || ""}`.trim()} className="inline-flex text-amber-500">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={15} fill={n <= value ? "currentColor" : "none"} />)}</span>;
}

/** Côté client : avis sur une sous-commande TERMINÉE (un seul, non modifiable). L'éligibilité réelle est vérifiée par le serveur. */
export default function ClientReview({ s, onDone }) {
  const ui = useRestoUi(); const rv = ui.orders.rev;
  const { withAuth } = useUser(); const toast = useToast();
  const [rating, setRating] = useState(0), [comment, setComment] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  if (s.status !== "completed") return null;
  if (s.review) return (
    <div className="rounded-2xl bg-latte-soft/60 p-3 space-y-1">
      <p className="text-sm font-medium text-ink">{rv.yours} <Stars value={s.review.rating} label={rv.stars} /></p>
      {s.review.comment && <p className="text-sm text-ink-soft">{s.review.comment}</p>}
      {s.review.hidden && <p className="text-xs text-ink-faint">{rv.hiddenNote}</p>}
    </div>
  );
  async function send() {
    if (!rating) return setErr(rv.pick);
    setBusy(true); setErr("");
    try { await withAuth((t) => api.resto.reviewSub(t, s.code, { rating, comment })); toast?.success?.(rv.sent); } catch (e) { toast?.error?.(errMessage(e, ui.common.error)); } finally { setBusy(false); onDone(); }
  }
  return (
    <div className="rounded-2xl bg-latte-soft/60 p-3 space-y-3">
      <div><p className="text-sm font-medium text-ink">{rv.title}</p><p className="text-xs text-ink-soft">{rv.hint}</p></div>
      <div role="radiogroup" aria-label={rv.rate} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} ${rv.stars}`} onClick={() => setRating(n)} className="p-1.5 rounded-lg text-amber-500 focus-visible:outline focus-visible:outline-2">
            <Star size={26} fill={n <= rating ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
      <textarea rows={2} maxLength={600} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={rv.placeholder} aria-label={rv.placeholder} className={inputCls} />
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <button disabled={busy} onClick={send} className="rounded-full bg-ink text-cream text-sm font-medium px-5 py-2.5 disabled:opacity-45">{rv.send}</button>
    </div>
  );
}
