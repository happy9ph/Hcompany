import PayPanel from "../../components/money/r/PayPanel.jsx";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api } from "../../lib/api.js";
import { useUser } from "../../context/Usercontext.jsx";
import { usePageMeta } from "../../components/ui/HeadManager.jsx";
import { FLAG, StatusPill, msgOf, newKey, nf, useCorridors } from "../../components/money/parts.jsx";
import TransferStatus from "../../components/money/r/TransferStatus.jsx";

/** Page ouverte par le lien reçu : « Jean vous demande 250 ZMW » → on paie depuis chez soi. */
export default function MoneyRequestPay() {
  usePageMeta({ title: "Demande H-Money" });
  const { code } = useParams();
  const { isAuthenticated, isLoading, withAuth } = useUser();
  const navigate = useNavigate();
  const cor = useCorridors();
  const [r, setR] = useState(undefined);
  const [op, setOp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const keyRef = useRef(newKey()); // clé d'idempotence de la tentative de paiement
  const [track, setTrack] = useState(null); // opération lancée : suivi d'état

  useEffect(() => { if (!isLoading && !isAuthenticated) navigate("/connexion", { state: { redirectTo: `/money/demande/${code}` } }); }, [isLoading, isAuthenticated, navigate, code]);
  useEffect(() => { if (isAuthenticated) withAuth((t) => api.money.viewRequest(t, code)).then(setR).catch((e) => setR({ error: msgOf(e) })); }, [isAuthenticated, withAuth, code]);

  useEffect(() => {
    if (!isAuthenticated || !op) return;
    withAuth((t) => api.money.viewRequest(t, code, op)).then((x) => setR((prev) => (prev && !prev.error ? { ...prev, quote: x.quote } : prev))).catch(() => {});
  }, [op, isAuthenticated, withAuth, code]);

  if (r === undefined) return <div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="animate-spin text-ink-faint" /></div>;
  if (r.error) return <div className="min-h-screen bg-cream px-5 py-16 text-center text-ink-soft">{r.error}</div>;
  const q = r.quote;
  const payable = (cor?.operators?.[r.from_country] || []).filter((o) => o.pay);
  const opKey = op && payable.some((o) => o.key === op) ? op : payable[0]?.key || "";
  async function pay(phone) {
    setBusy(true); setErr("");
    try {
      const body = { pay_phone: phone, pay_operator: opKey };
      const qr = await withAuth((t) => api.money.requestQuote(t, code, { pay_operator: opKey })); // récapitulatif confirmé, conservé par le serveur
      if (qr.total_paid !== q?.total_paid || qr.receive_amount !== q?.receive_amount) { setR((p) => ({ ...p, quote: qr })); setErr("Le tarif vient d'être mis à jour. Vérifiez le montant puis confirmez à nouveau."); return; }
      const out = await withAuth((t) => api.money.payRequest(t, code, { ...body, quote_id: qr.quote_id }, keyRef.current));
      keyRef.current = newKey();
      setTrack(out);
    } catch (x) { if (x?.status) keyRef.current = newKey(); setErr(msgOf(x)); } finally { setBusy(false); }
  }
  async function decline() {
    try { setR({ ...(await withAuth((t) => api.money.declineRequest(t, code))), quote: q, asker_name: r.asker_name }); } catch (x) { setErr(msgOf(x)); }
  }
  if (track) return <div className="min-h-screen bg-cream px-4 py-8"><div className="max-w-[520px] mx-auto"><TransferStatus initial={track} onClose={() => navigate("/app/money")} /></div></div>;
  const open = r.status === "awaiting_payer";
  return (
    <PayPanel head={<>{FLAG[r.to_country]} {r.asker_name} vous demande</>} amount={r.request_type === "B" ? nf(r.requested_amount, r.requested_currency) : nf(r.receive_amount, r.receive_currency)} sub={[r.request_type === "B" ? "Montant exact que vous payez (hors frais)." : "Montant exact que cette personne doit recevoir. Les frais s'ajoutent à votre paiement.", r.note ? `« ${r.note} »` : ""].filter(Boolean).join(" ")}
      q={open ? q : null} payCountry={r.from_country} ops={payable} opKey={opKey} setOp={setOp} onPay={pay} onDecline={decline} busy={busy} err={err} simulated={cor?.simulated}>
      <div className="mt-3"><StatusPill status={r.status} /></div>
      {!open && <p className="mt-5 text-sm text-ink-soft">{r.status === "completed" ? "Merci, le paiement est effectué." : r.failure_reason || "Cette demande n'est plus en attente."}</p>}
    </PayPanel>
  );
}
