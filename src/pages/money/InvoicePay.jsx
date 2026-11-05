import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { api } from "../../lib/api.js";
import { useUser } from "../../context/Usercontext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { usePageMeta } from "../../components/ui/HeadManager.jsx";
import { FLAG, COUNTRY, input, msgOf, nf, useCorridors } from "../../components/money/parts.jsx";
import { InvoicePill } from "./Invoices.jsx";

/** Lien reçu par le client : détail de la facture et paiement en mobile money. */
export default function InvoicePay() {
  usePageMeta({ title: "Facture H-Money" });
  const { code } = useParams();
  const { isAuthenticated, isLoading, withAuth } = useUser();
  const { lang } = useLanguage();
  const fr = lang !== "en";
  const navigate = useNavigate();
  const cor = useCorridors();
  const [inv, setInv] = useState(undefined);
  const [phone, setPhone] = useState(""), [op, setOp] = useState("");
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");

  useEffect(() => { if (!isLoading && !isAuthenticated) navigate("/connexion", { state: { redirectTo: `/money/facture/${code}` } }); }, [isLoading, isAuthenticated, navigate, code]);
  useEffect(() => { if (isAuthenticated) withAuth((t) => api.money.invoices.view(t, code)).then(setInv).catch((e) => setInv({ error: msgOf(e) })); }, [isAuthenticated, withAuth, code]);
  useEffect(() => {
    if (!isAuthenticated || !op) return;
    withAuth((t) => api.money.invoices.view(t, code, op)).then((x) => setInv((p) => (p && !p.error ? { ...p, quote: x.quote } : p))).catch(() => {});
  }, [op, isAuthenticated, withAuth, code]);

  if (inv === undefined) return <div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="animate-spin text-ink-faint" /></div>;
  if (inv.error) return <div className="min-h-screen bg-cream px-5 py-16 text-center text-ink-soft">{inv.error}<div className="mt-6"><Link to="/app/factures" className="text-coffee-dark">{fr ? "Mes factures" : "My invoices"}</Link></div></div>;
  const q = inv.quote;
  const payable = (cor?.operators?.[inv.client_country] || []).filter((o) => o.pay);
  const opKey = op && payable.some((o) => o.key === op) ? op : payable[0]?.key || "";
  async function pay(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try { const out = await withAuth((t) => api.money.invoices.pay(t, code, { pay_phone: phone, pay_operator: opKey })); setInv({ ...inv, ...out, quote: undefined }); }
    catch (x) { setErr(msgOf(x)); } finally { setBusy(false); }
  }
  return (
    <div className="min-h-screen bg-cream px-5 py-10">
      <div className="max-w-md mx-auto">
        <Link to="/app" className="font-display text-xl text-ink">H-Money</Link>
        <div className="mt-8 rounded-3xl border border-line bg-surface p-7">
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-ink-soft">{fr ? "Facture de" : "Invoice from"} {inv.issuer_name || "—"}</p><p className="text-xs text-ink-faint mt-0.5">{inv.code}</p></div><InvoicePill status={inv.status} fr={fr} /></div>
          <ul className="mt-5 divide-y divide-line text-sm">
            {inv.items.map((i, k) => <li key={k} className="py-2.5 flex justify-between gap-3"><span>{i.label}{i.qty !== 1 && <span className="text-ink-faint"> × {i.qty}</span>}</span><span className="tabular-nums">{nf(i.qty * i.unit_price, inv.currency)}</span></li>)}
          </ul>
          <div className="flex justify-between items-baseline border-t border-line pt-3 mt-1"><span className="font-medium">Total</span><span className="font-display text-3xl tabular-nums" style={{ color: "#7B4B2A" }}>{nf(inv.total, inv.currency)}</span></div>
          {inv.note && <p className="text-sm text-ink-soft mt-3">« {inv.note} »</p>}
          {inv.status === "open" && inv.role === "client" && q ? (
            <form onSubmit={pay} className="mt-6 space-y-4">
              <div className="rounded-2xl bg-ink-fixed text-cream-fixed p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-cream-fixed/50">{fr ? "Vous payez" : "You pay"} ({FLAG[inv.client_country]} {COUNTRY[inv.client_country]?.fr})</p>
                <p className="font-display text-3xl mt-1 tabular-nums" style={{ color: "#C89A3D" }}>{nf(q.total_paid, q.send_currency)}</p>
                <p className="text-xs text-cream-fixed/55 mt-2">{fr ? "dont frais" : "incl. fees"} {nf(q.fee, q.send_currency)}</p>
              </div>
              <label className="block"><span className="text-xs text-ink-soft">{fr ? "Payer avec" : "Pay with"}</span><select className={input} value={opKey} onChange={(e) => setOp(e.target.value)}>{payable.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select></label>
              <label className="block"><span className="text-xs text-ink-soft">{fr ? "Votre numéro mobile money" : "Your mobile money number"}</span><input required className={input} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
              {err && <p role="alert" className="rounded-xl bg-red-500/10 text-red-700 text-sm p-3">{err}</p>}
              <button disabled={busy} className="w-full rounded-full bg-ink text-cream text-sm font-medium py-4 hover:bg-coffee-dark disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin inline" /> : (fr ? "Payer la facture" : "Pay invoice")}</button>
              <p className="text-xs text-ink-faint flex gap-2"><ShieldCheck size={14} className="shrink-0 mt-0.5" />{fr ? "L'argent est gardé jusqu'au contrôle, puis versé à l'émetteur." : "Money is held until review, then paid to the issuer."}</p>
            </form>
          ) : inv.status === "paid" ? <p className="mt-5 rounded-xl bg-emerald-500/10 text-emerald-700 text-sm p-3">{fr ? "Cette facture est payée. Merci !" : "This invoice is paid. Thank you!"}</p> : inv.role === "issuer" && inv.status === "open" ? <p className="mt-5 text-sm text-ink-soft">{fr ? "En attente du paiement du client." : "Waiting for the client's payment."}</p> : null}
        </div>
      </div>
    </div>
  );
}
