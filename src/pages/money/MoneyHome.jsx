import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowLeftRight, ArrowRight, Check, Copy, Loader2, MessageCircle, Send, HandCoins, History, ShieldCheck } from "lucide-react";
import { api } from "../../lib/api.js";
import { useUser } from "../../context/Usercontext.jsx";
import { useRegion } from "../../context/RegionContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { usePageMeta } from "../../components/ui/HeadManager.jsx";
import RatesCard from "../../components/money/RatesCard.jsx";
import { COUNTRY, FLAG, Field, SimulationBanner, StatusPill, input, msgOf, nf, useCorridors, useQuote } from "../../components/money/parts.jsx";

const TABS = [{ k: "send", label: "Envoyer", Icon: Send }, { k: "request", label: "Demander", Icon: HandCoins }, { k: "history", label: "Historique", Icon: History }];

function OperatorSelect({ list, value, onChange }) {
  return <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>{(list || []).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select>;
}

function QuoteCard({ q, err, verb }) {
  if (err) return <p role="alert" className="text-sm text-red-600">{err}</p>;
  if (!q) return <div className="rounded-2xl bg-latte-soft/60 border border-dashed border-line p-5 text-sm text-ink-faint text-center">Saisissez un montant pour voir ce que {verb} exactement.</div>;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-ink-fixed text-cream-fixed p-5 sm:p-6">
      <p className="text-[11px] uppercase tracking-[0.18em] text-cream-fixed/50">Le bénéficiaire reçoit</p>
      <p className="font-display text-4xl sm:text-5xl mt-1 tabular-nums" style={{ color: "#C89A3D" }}>{nf(q.receive_amount, q.receive_currency)}</p>
      <dl className="mt-5 grid grid-cols-3 gap-3 text-xs">
        <div><dt className="text-cream-fixed/50">{q.fee_mode === "deducted" ? "Converti" : "Montant"}</dt><dd className="mt-0.5 tabular-nums">{nf(q.send_amount, q.send_currency)}</dd></div>
        <div><dt className="text-cream-fixed/50">{q.fee_mode === "deducted" ? "Frais (retirés)" : "Frais (ajoutés)"}</dt><dd className="mt-0.5 tabular-nums">{nf(q.fee, q.send_currency)}</dd></div>
        <div><dt className="text-cream-fixed/50">Vous payez</dt><dd className="mt-0.5 font-semibold tabular-nums">{nf(q.total_paid, q.send_currency)}</dd></div>
      </dl>
      <p className="text-[11px] text-cream-fixed/45 mt-4">Taux : 1 {q.send_currency} ≈ {q.rate} {q.receive_currency} · affiché avant tout paiement</p>
    </motion.div>
  );
}

function Result({ t, onAgain }) {
  const review = t.status === "under_review", ok = t.status === "completed";
  const title = review ? "Envoi enregistré" : ok ? "Envoi effectué" : t.status === "rejected" ? "Envoi refusé" : "Envoi non abouti";
  const text = review ? `Votre paiement est bien reçu. Un contrôle rapide est en cours : ${t.counterpart_name} recevra ${nf(t.receive_amount, t.receive_currency)} dès la confirmation. En cas de refus, vous êtes remboursé.`
    : ok ? `${t.counterpart_name} reçoit ${nf(t.receive_amount, t.receive_currency)}.` : t.failure_reason;
  const tone = review ? "bg-violet-100 text-violet-700" : ok ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700";
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-line bg-surface p-8 text-center">
      <span className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${tone}`}>{review ? <ShieldCheck size={30} /> : <Check size={30} />}</span>
      <h2 className="font-display text-2xl text-ink mt-5">{title}</h2>
      <p className="text-sm text-ink-soft mt-2 max-w-sm mx-auto">{text}</p>
      <p className="text-xs text-ink-faint mt-3">Référence <strong className="text-ink">{t.code}</strong>{t.simulated && " · démonstration"}</p>
      <button onClick={onAgain} className="mt-6 rounded-full bg-ink text-cream text-sm font-medium px-6 py-3">Nouvelle opération</button>
    </motion.div>
  );
}

function SendForm({ cor, onDone }) {
  const { country } = useRegion();
  const { withAuth } = useUser();
  const [from, setFrom] = useState(country === "CD" ? "CD" : "ZM");
  const to = from === "ZM" ? "CD" : "ZM";
  const [f, setF] = useState({ amount: "", name: "", phone: "", benOp: "", payPhone: "", payOp: "", note: "" });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [withFee, setWithFee] = useState(true);
  const { q, err: qErr } = useQuote({ amount: f.amount, from, to, withFee });
  const ops = cor?.operators || {};
  const benOp = f.benOp && ops[to]?.some((o) => o.key === f.benOp) ? f.benOp : ops[to]?.[0]?.key || "";
  const payOp = f.payOp && ops[from]?.some((o) => o.key === f.payOp) ? f.payOp : ops[from]?.[0]?.key || "";

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      onDone(await withAuth((t) => api.money.send(t, { from_country: from, to_country: to, amount: Number(f.amount), with_fee: withFee, beneficiary_name: f.name, beneficiary_phone: f.phone, beneficiary_operator: benOp, pay_phone: f.payPhone, pay_operator: payOp, note: f.note })));
    } catch (x) { setErr(msgOf(x)); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-2xl border border-line bg-surface p-4"><p className="text-[11px] uppercase tracking-wider text-ink-faint">De</p><p className="font-medium text-ink mt-0.5">{FLAG[from]} {COUNTRY[from].fr}</p></div>
        <button type="button" onClick={() => setFrom(to)} aria-label="Inverser le sens" className="w-11 h-11 rounded-full bg-ink text-cream flex items-center justify-center hover:bg-coffee-dark transition-transform hover:rotate-180 duration-300"><ArrowLeftRight size={17} /></button>
        <div className="flex-1 rounded-2xl border border-line bg-surface p-4"><p className="text-[11px] uppercase tracking-wider text-ink-faint">Vers</p><p className="font-medium text-ink mt-0.5">{FLAG[to]} {COUNTRY[to].fr}</p></div>
      </div>
      <Field label={`Montant à envoyer (${cor?.currencies?.[from] || ""})`}>
        <input required inputMode="decimal" type="number" min="0" step="0.01" className={`${input} text-2xl font-display py-4`} value={f.amount} onChange={set("amount")} placeholder="0" />
      </Field>
      <label className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 cursor-pointer">
        <input type="checkbox" checked={withFee} onChange={(e) => setWithFee(e.target.checked)} className="mt-1 w-4 h-4 accent-[#3B2417]" />
        <span className="text-sm"><span className="font-medium text-ink block">Ajouter les frais d'envoi à mon montant</span>
          <span className="text-ink-soft">{withFee ? "Coché : vous payez le montant + les frais, le bénéficiaire reçoit le montant saisi (converti)." : "Décoché : les frais sont retirés du montant saisi. Vous payez exactement ce montant, le bénéficiaire reçoit un peu moins."}</span></span>
      </label>
      <QuoteCard q={q} err={qErr} verb="recevra le bénéficiaire" />
      <fieldset className="space-y-4"><legend className="font-display text-lg text-ink mb-1">Qui reçoit ? ({COUNTRY[to].fr})</legend>
        <Field label="Nom complet"><input required className={input} value={f.name} onChange={set("name")} autoComplete="off" /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Numéro mobile money" hint="Format international, ex. +243 81 234 5678"><input required type="tel" className={input} value={f.phone} onChange={set("phone")} /></Field>
          <Field label="Opérateur"><OperatorSelect list={ops[to]} value={benOp} onChange={(v) => setF((p) => ({ ...p, benOp: v }))} /></Field>
        </div>
      </fieldset>
      <fieldset className="space-y-4"><legend className="font-display text-lg text-ink mb-1">Vous payez avec ({COUNTRY[from].fr})</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Votre numéro mobile money"><input required type="tel" className={input} value={f.payPhone} onChange={set("payPhone")} /></Field>
          <Field label="Opérateur"><OperatorSelect list={ops[from]} value={payOp} onChange={(v) => setF((p) => ({ ...p, payOp: v }))} /></Field>
        </div>
        <Field label="Message (facultatif)"><input maxLength={200} className={input} value={f.note} onChange={set("note")} /></Field>
      </fieldset>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <button disabled={busy || !q} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-ink text-cream font-medium py-4 hover:bg-coffee-dark transition-colors disabled:opacity-50">
        {busy ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}{q ? `Payer ${nf(q.total_paid, q.send_currency)}` : "Envoyer"}
      </button>
    </form>
  );
}

function RequestForm({ cor }) {
  const { country } = useRegion();
  const { withAuth } = useUser();
  const toast = useToast();
  const [mine, setMine] = useState(country === "CD" ? "CD" : "ZM"); // pays où JE reçois
  const payer = mine === "ZM" ? "CD" : "ZM";
  const [f, setF] = useState({ amount: "", phone: "", op: "", payer: "", note: "" });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const { q } = useQuote({ amount: f.amount, from: payer, to: mine, mode: "receive" });
  const ops = cor?.operators || {};
  const op = f.op && ops[mine]?.some((o) => o.key === f.op) ? f.op : ops[mine]?.[0]?.key || "";
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null);
  const link = done ? `${window.location.origin}/money/demande/${done.code}` : "";

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try { setDone(await withAuth((t) => api.money.request(t, { payer_country: payer, receiver_country: mine, amount: Number(f.amount), receive_phone: f.phone, receive_operator: op, payer_name: f.payer, note: f.note }))); }
    catch (x) { setErr(msgOf(x)); } finally { setBusy(false); }
  }
  if (done) return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-line bg-surface p-8 text-center">
      <span className="mx-auto w-16 h-16 rounded-full bg-latte-soft text-coffee-dark flex items-center justify-center"><HandCoins size={28} /></span>
      <h2 className="font-display text-2xl text-ink mt-5">Demande créée</h2>
      <p className="text-sm text-ink-soft mt-2">Envoyez ce lien à {done.counterpart_name}. Il paiera depuis chez lui, en {q?.send_currency}, et vous recevrez {nf(done.receive_amount, done.receive_currency)}.</p>
      <p className="mt-4 rounded-xl bg-cream border border-line px-4 py-3 text-xs break-all text-ink-soft">{link}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button onClick={() => { navigator.clipboard?.writeText(link); toast?.success?.("Lien copié"); }} className="inline-flex items-center gap-2 rounded-full border border-line text-ink text-sm font-medium px-5 py-3"><Copy size={15} />Copier</button>
        <a href={`https://wa.me/?text=${encodeURIComponent(`Bonjour, voici ma demande H-Money : ${link}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-ink text-cream text-sm font-medium px-5 py-3"><MessageCircle size={15} />WhatsApp</a>
      </div>
      <p className="text-xs text-ink-faint mt-5">Valable 7 jours · référence {done.code}</p>
    </motion.div>
  );
  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-2xl border border-line bg-surface p-4"><p className="text-[11px] uppercase tracking-wider text-ink-faint">Je reçois en</p><p className="font-medium text-ink mt-0.5">{FLAG[mine]} {COUNTRY[mine].fr}</p></div>
        <button type="button" onClick={() => setMine(payer)} aria-label="Inverser le sens" className="w-11 h-11 rounded-full bg-ink text-cream flex items-center justify-center hover:bg-coffee-dark transition-transform hover:rotate-180 duration-300"><ArrowLeftRight size={17} /></button>
        <div className="flex-1 rounded-2xl border border-line bg-surface p-4"><p className="text-[11px] uppercase tracking-wider text-ink-faint">Il paie depuis</p><p className="font-medium text-ink mt-0.5">{FLAG[payer]} {COUNTRY[payer].fr}</p></div>
      </div>
      <Field label={`Montant que je veux recevoir (${cor?.currencies?.[mine] || ""})`}><input required type="number" min="0" step="0.01" inputMode="decimal" className={`${input} text-2xl font-display py-4`} value={f.amount} onChange={set("amount")} placeholder="0" /></Field>
      {q && <p className="rounded-xl bg-latte-soft px-4 py-3 text-sm text-coffee-dark">Votre proche paiera environ <strong>{nf(q.total_paid, q.send_currency)}</strong> (frais inclus) pour que vous receviez exactement {nf(q.receive_amount, q.receive_currency)}.</p>}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Votre numéro de réception"><input required type="tel" className={input} value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Opérateur"><OperatorSelect list={ops[mine]} value={op} onChange={(v) => setF((p) => ({ ...p, op: v }))} /></Field>
      </div>
      <Field label="Nom de la personne sollicitée"><input required className={input} value={f.payer} onChange={set("payer")} /></Field>
      <Field label="Motif (facultatif)"><input maxLength={200} className={input} value={f.note} onChange={set("note")} placeholder="Loyer, frais de scolarité…" /></Field>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <button disabled={busy} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-ink text-cream font-medium py-4 hover:bg-coffee-dark disabled:opacity-50">{busy ? <Loader2 size={17} className="animate-spin" /> : <HandCoins size={17} />}Créer la demande</button>
    </form>
  );
}

function HistoryList({ items }) {
  if (items === null) return <Loader2 className="animate-spin text-ink-faint mx-auto" />;
  if (!items.length) return <p className="text-center text-sm text-ink-soft py-10">Aucune opération pour l'instant.</p>;
  return (
    <ul className="space-y-3">
      {items.map((t) => (
        <li key={t.code} className="rounded-2xl border border-line bg-surface p-4 flex items-center gap-4">
          <span className="w-10 h-10 rounded-xl bg-latte-soft text-coffee-dark flex items-center justify-center shrink-0">{t.kind === "send" ? <Send size={17} /> : <HandCoins size={17} />}</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink truncate">{t.kind === "send" ? `Envoi à ${t.counterpart_name}` : t.role === "requester" ? `Demande à ${t.counterpart_name}` : "Demande payée"}</p>
            <p className="text-xs text-ink-faint">{FLAG[t.from_country]}→{FLAG[t.to_country]} · {new Date(t.created_at).toLocaleDateString("fr-FR")} · {t.code}</p>
          </div>
          <div className="text-right"><p className="text-sm font-semibold tabular-nums text-ink">{nf(t.receive_amount, t.receive_currency)}</p><StatusPill status={t.status} /></div>
        </li>
      ))}
    </ul>
  );
}

export default function MoneyHome({ embedded = false }) {
  usePageMeta({ title: "H-Money" });
  const { isAuthenticated, isLoading, withAuth } = useUser();
  const navigate = useNavigate();
  const cor = useCorridors();
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || "send");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(null);
  const load = useCallback(() => withAuth((t) => api.money.mine(t)).then(setHistory).catch(() => setHistory([])), [withAuth]);
  useEffect(() => { if (!isLoading && !isAuthenticated) navigate("/connexion", { state: { redirectTo: embedded ? "/app/money" : "/money" } }); }, [isLoading, isAuthenticated, navigate]);
  useEffect(() => { if (isAuthenticated) load(); }, [isAuthenticated, load, result]);
  const body = useMemo(() => {
    if (tab === "history") return <HistoryList items={history} />;
    if (tab === "request") return <RequestForm cor={cor} />;
    return result ? <Result t={result} onAgain={() => setResult(null)} /> : <SendForm cor={cor} onDone={setResult} />;
  }, [tab, history, result, cor]);

  return (
    <div className={embedded ? "pb-6" : "min-h-screen bg-cream pb-16"}>
      {!embedded && <header className="border-b border-line bg-surface/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/app" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"><ArrowLeft size={15} />Accueil</Link>
          <p className="font-display text-lg text-ink">H-Money</p>
          <span className="w-16" />
        </div>
      </header>}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8"><div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start"><div className="min-w-0">
        <h1 className="font-display text-3xl sm:text-4xl text-ink">Zambie <ArrowRight className="inline -mt-1 text-coffee" size={26} /> RD Congo</h1>
        <p className="text-sm text-ink-soft mt-2 mb-6">Envoyez ou demandez de l'argent. Chacun paie et reçoit dans son pays, en mobile money, au taux affiché avant de payer.</p>
        <SimulationBanner show={cor?.simulated} />
        <div role="tablist" className="mt-5 mb-7 grid grid-cols-3 rounded-2xl bg-latte-soft p-1">
          {TABS.map(({ k, label, Icon }) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors ${tab === k ? "bg-ink text-cream shadow-sm" : "text-coffee-dark hover:text-ink"}`}><Icon size={15} />{label}</button>
          ))}
        </div>
        <AnimatePresence mode="wait"><motion.div key={tab + (result ? "r" : "")} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{body}</motion.div></AnimatePresence>
      </div><RatesCard rates={cor?.rates} /></div></main>
    </div>
  );
}
