import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, CircleDashed, Loader2, ShieldCheck, Undo2, X } from "lucide-react";
import { api } from "../../../lib/api.js";
import { useUser } from "../../../context/Usercontext.jsx";
import { msgOf, nf } from "../parts.jsx";
import { Frame, NAVY, Primary } from "./ui.jsx";

/** Étapes affichées (l'état réel vient du serveur — jamais déduit côté navigateur). */
const STEPS = [["pending_network", "Confirmation du réseau"], ["collected", "Collecte confirmée"], ["payout_in_progress", "Versement"], ["success", "Transfert réussi"]];
const ORDER = { pending_network: 0, collected: 1, payout_in_progress: 2, success: 3 };
const FINAL = ["success", "failed", "refunded"];

function headline(t) {
  switch (t.stage) {
    case "pending_network": return ["En attente de confirmation du réseau", "Votre opérateur vous envoie une demande de paiement sur votre téléphone. Validez-la avec votre PIN dans l'interface de votre opérateur."];
    case "collected": return ["Collecte confirmée", t.status === "under_review" ? "Votre paiement est bien reçu. Un contrôle de sécurité rapide est en cours avant le versement." : "Votre paiement est bien reçu. Le versement va démarrer."];
    case "payout_in_progress": return ["Versement en cours", `${t.counterpart_name} va recevoir ${nf(t.receive_amount, t.receive_currency)}. Nous attendons la confirmation de son opérateur.`];
    case "success": return ["Transfert réussi", `${t.counterpart_name} a reçu ${nf(t.receive_amount, t.receive_currency)}.`];
    case "refunding": return ["Remboursement en cours", `${t.failure_reason || "Le transfert n'a pas pu aboutir."} Vous êtes remboursé de ${nf(t.total_paid, t.send_currency)}.`];
    case "refunded": return ["Remboursement effectué", `${t.failure_reason || "Le transfert n'a pas abouti."} ${nf(t.total_paid, t.send_currency)} vous ont été remboursés.`];
    default: return ["Échec", t.failure_reason || "Le paiement n'a pas abouti. Aucun montant n'a été prélevé."];
  }
}

/** Suivi d'une opération : interroge le serveur (qui interroge le fournisseur) jusqu'à un état final. Aucun PIN n'est demandé ici. */
export default function TransferStatus({ initial, onClose, payerView = true }) {
  const { withAuth } = useUser();
  const [t, setT] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  useEffect(() => {
    if (FINAL.includes(t.stage)) return undefined;
    const started = Date.now();
    const id = setTimeout(() => {
      withAuth((tk) => api.money.transfer(tk, t.code, true)).then((x) => alive.current && setT(x)).catch(() => {});
    }, Date.now() - started > 120000 ? 10000 : 3500);
    return () => clearTimeout(id);
  }, [t, withAuth]);

  async function simulate(outcome) {
    setBusy(true); setErr("");
    try { setT(await withAuth((tk) => api.money.simulate(tk, t.code, outcome))); } catch (x) { setErr(msgOf(x)); } finally { setBusy(false); }
  }

  const [title, text] = headline(t);
  const bad = t.stage === "failed", refund = t.stage === "refunding" || t.stage === "refunded", ok = t.stage === "success";
  const cur = ORDER[t.stage] ?? -1;
  const tone = ok ? "#2F8F83" : bad ? "#B91C1C" : refund ? "#0369A1" : NAVY;
  const Icon = ok ? Check : bad ? X : refund ? Undo2 : Loader2;
  const waiting = !FINAL.includes(t.stage);
  return (
    <Frame onBack={onClose} progress={ok ? 1 : 0.8}>
      <div className="text-center" role="status" aria-live="polite">
        <span className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-white" style={{ background: tone }}><Icon size={26} className={waiting && !refund ? "animate-spin" : ""} /></span>
        <h2 className="font-bold text-2xl text-ink mt-4">{title}</h2>
        <p className="text-sm text-ink-soft mt-2 max-w-sm mx-auto">{text}</p>
      </div>

      {!bad && !refund && (
        <ol className="mt-7 space-y-3" aria-label="Étapes du transfert">
          {STEPS.map(([k, label], i) => (
            <li key={k} className={`flex items-center gap-3 text-sm ${i <= cur ? "text-ink" : "text-ink-faint"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 ${i < cur || ok ? "" : i === cur ? "ring-2 ring-offset-2" : "bg-line"}`} style={i <= cur ? { background: tone, "--tw-ring-color": tone } : undefined}>
                {i < cur || ok ? <Check size={14} /> : i === cur ? <Loader2 size={13} className="animate-spin" /> : <CircleDashed size={13} className="text-ink-faint" />}
              </span>
              <span className={i === cur && !ok ? "font-semibold" : ""}>{label}</span>
            </li>
          ))}
        </ol>
      )}

      {t.verify_needed && waiting && (
        <p role="note" className="mt-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 flex gap-2"><AlertTriangle size={15} className="shrink-0 mt-0.5" />Nous vérifions l'état de cette opération auprès de l'opérateur. <strong>Ne la relancez pas</strong> : vous ne serez pas débité deux fois.</p>
      )}

      {t.simulated && waiting && (t.stage === "pending_network" || t.stage === "payout_in_progress") && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-xs text-amber-900">
          <p className="font-bold uppercase tracking-wide">Bac à sable simulé — pas un vrai opérateur</p>
          <p className="mt-1">Aucune demande de paiement réelle n'a été envoyée et aucun argent ne bouge. Ces boutons remplacent l'interface de l'opérateur pour tester le parcours.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={busy} onClick={() => simulate("completed")} className="flex-1 rounded-full bg-amber-600 text-white font-semibold h-10 disabled:opacity-50">Simuler : confirmé</button>
            <button type="button" disabled={busy} onClick={() => simulate("failed")} className="flex-1 rounded-full border border-amber-600 text-amber-800 font-semibold h-10 disabled:opacity-50">Simuler : refusé</button>
          </div>
          {err && <p role="alert" className="mt-2 text-red-700">{err}</p>}
        </div>
      )}

      <div className="mt-6 rounded-xl bg-latte-soft/70 p-4 text-sm space-y-1">
        <p className="flex justify-between"><span>Référence</span><strong className="text-ink">{t.code}</strong></p>
        {payerView && <p className="flex justify-between"><span>Total payé</span><strong className="tabular-nums text-ink">{nf(t.total_paid, t.send_currency)}</strong></p>}
        <p className="flex justify-between"><span>Reçu par le bénéficiaire</span><strong className="tabular-nums text-ink">{nf(t.receive_amount, t.receive_currency)}</strong></p>
      </div>
      <p className="mt-4 text-xs text-ink-faint flex gap-2"><ShieldCheck size={14} className="shrink-0 mt-0.5" />H-Money ne vous demande jamais votre code PIN : il se saisit uniquement dans l'interface officielle de votre opérateur.</p>
      <div className="mt-6"><Primary type="button" onClick={onClose}>{FINAL.includes(t.stage) ? "Terminer" : "Fermer (le suivi continue)"}</Primary></div>
    </Frame>
  );
}
