import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { api } from "../../lib/api.js";
import { useUser } from "../../context/Usercontext.jsx";
import { usePageMeta } from "../../components/ui/HeadManager.jsx";
import { COUNTRY, FLAG, Field, SimulationBanner, StatusPill, input, msgOf, nf, useCorridors } from "../../components/money/parts.jsx";

/** Page ouverte par le lien reçu : « Jean vous demande 250 ZMW » → on paie depuis chez soi. */
export default function MoneyRequestPay() {
  usePageMeta({ title: "Demande H-Money" });
  const { code } = useParams();
  const { isAuthenticated, isLoading, withAuth } = useUser();
  const navigate = useNavigate();
  const cor = useCorridors();
  const [r, setR] = useState(undefined);
  const [phone, setPhone] = useState("");
  const [op, setOp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { if (!isLoading && !isAuthenticated) navigate("/connexion", { state: { redirectTo: `/money/demande/${code}` } }); }, [isLoading, isAuthenticated, navigate, code]);
  useEffect(() => { if (isAuthenticated) withAuth((t) => api.money.viewRequest(t, code)).then(setR).catch((e) => setR({ error: msgOf(e) })); }, [isAuthenticated, withAuth, code]);

  if (r === undefined) return <div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="animate-spin text-ink-faint" /></div>;
  const q = r.quote;
  const ops = cor?.operators?.[r.from_country] || [];
  const opKey = op || ops[0]?.key || "";
  async function pay(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try { setR({ ...(await withAuth((t) => api.money.payRequest(t, code, { pay_phone: phone, pay_operator: opKey }))), quote: q, asker_name: r.asker_name }); } catch (x) { setErr(msgOf(x)); } finally { setBusy(false); }
  }
  async function decline() {
    try { setR({ ...(await withAuth((t) => api.money.declineRequest(t, code))), quote: q, asker_name: r.asker_name }); } catch (x) { setErr(msgOf(x)); }
  }
  return (
    <div className="min-h-screen bg-cream px-5 py-10">
      <div className="max-w-md mx-auto">
        <Link to="/app" className="font-display text-xl text-ink">H-Money</Link>
        {r.error ? <p className="mt-10 text-center text-ink-soft">{r.error}</p> : (
          <div className="mt-8 rounded-3xl border border-line bg-surface p-7">
            <p className="text-sm text-ink-soft">{FLAG[r.to_country]} {r.asker_name} vous demande</p>
            <p className="font-display text-5xl mt-2 tabular-nums" style={{ color: "#7B4B2A" }}>{nf(r.receive_amount, r.receive_currency)}</p>
            {r.note && <p className="text-sm text-ink-soft mt-3">« {r.note} »</p>}
            <div className="mt-4"><StatusPill status={r.status} /></div>
            {r.status === "awaiting_payer" ? (
              <form onSubmit={pay} className="mt-6 space-y-4">
                <div className="rounded-2xl bg-ink-fixed text-cream-fixed p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-cream-fixed/50">Vous payez ({FLAG[r.from_country]} {COUNTRY[r.from_country]?.fr})</p>
                  <p className="font-display text-3xl mt-1 tabular-nums" style={{ color: "#C89A3D" }}>{nf(q.total_paid, q.send_currency)}</p>
                  <p className="text-xs text-cream-fixed/55 mt-2">dont frais {nf(q.fee, q.send_currency)} · taux affiché avant paiement</p>
                </div>
                <Field label="Votre numéro mobile money"><input required type="tel" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
                <Field label="Opérateur"><select className={input} value={opKey} onChange={(e) => setOp(e.target.value)}>{ops.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select></Field>
                {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
                <button disabled={busy} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-ink text-cream font-medium py-4 hover:bg-coffee-dark disabled:opacity-50">{busy ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}Payer</button>
                <button type="button" onClick={decline} className="w-full text-center text-xs text-ink-faint hover:text-ink">Refuser cette demande</button>
                <SimulationBanner show={cor?.simulated} />
              </form>
            ) : <p className="mt-6 text-sm text-ink-soft">{r.status === "completed" ? "Merci, le paiement est effectué." : r.failure_reason || "Cette demande n'est plus en attente."}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
