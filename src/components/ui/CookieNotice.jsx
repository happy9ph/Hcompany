import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Lock, MapPin, ShieldCheck } from "lucide-react";
import { consent } from "../../lib/memStore.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { REGION_LIST, useRegion } from "../../context/RegionContext.jsx";

const COPY = {
  fr: {
    title: "Confidentialité et préférences",
    text: "H-Company utilise un cookie de session indispensable et, si vous l'acceptez, des cookies de préférence (langue, thème, pays). Aucun cookie publicitaire, aucun suivi.",
    short: "Un cookie de session indispensable et, si vous acceptez, vos préférences. Aucun suivi publicitaire.",
    more: "En savoir plus", accept: "Tout accepter", essential: "Essentiels seulement", customize: "Personnaliser", save: "Enregistrer mes choix", hide: "Masquer",
    region: "Votre région", regionHelp: "Estimée d'après votre réseau ou votre fuseau horaire. Aucune position précise n'est demandée.", country: "Pays", currency: "Devise",
    essTitle: "Essentiels", essText: "Session sécurisée, protection de votre compte et panier (identifiants des plats et quantités, 7 jours).", always: "Toujours actifs",
    prefTitle: "Préférences", prefText: "Mémorise la langue, le thème, le pays et la devise pour votre prochaine visite.",
  },
  en: {
    title: "Privacy and preferences",
    text: "H-Company uses one essential session cookie and, if you accept, preference cookies (language, theme, country). No advertising cookies, no tracking.",
    short: "One essential session cookie and, if you accept, your preferences. No ad tracking.",
    more: "Learn more", accept: "Accept all", essential: "Essential only", customize: "Customize", save: "Save my choices", hide: "Hide",
    region: "Your region", regionHelp: "Estimated from your network or time zone. We never ask for your precise location.", country: "Country", currency: "Currency",
    essTitle: "Essential", essText: "Secure session, account protection and your cart (dish ids and quantities, 7 days).", always: "Always on",
    prefTitle: "Preferences", prefText: "Remembers your language, theme, country and currency for your next visit.",
  },
};

function Switch({ on, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange?.(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coffee ${on ? "bg-ink" : "bg-line"} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

/** Information et choix cookies : essentiels (toujours actifs) + préférences (langue, thème, pays/devise). Aucun traceur publicitaire. */
export default function CookieNotice() {
  const { lang } = useLanguage();
  const c = COPY[lang === "en" ? "en" : "fr"];
  const region = useRegion();
  const [open, setOpen] = useState(() => !consent.get());
  const [panel, setPanel] = useState(false);
  const [prefs, setPrefs] = useState(true);
  const ref = useRef(null);
  const panelId = useId();

  // Mobile (V8) : barre compacte collée en bas ; la page reçoit une marge égale à sa hauteur pour que formulaires et boutons restent atteignables.
  useEffect(() => {
    if (!open || typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(max-width: 639px)");
    const root = document.documentElement;
    // --hc-cookie : hauteur du bandeau (mobile) ; la bulle de chat se place au-dessus.
    const apply = () => {
      const h = mq.matches && ref.current ? `${ref.current.offsetHeight}px` : "";
      document.body.style.paddingBottom = h;
      if (h) root.style.setProperty("--hc-cookie", h); else root.style.removeProperty("--hc-cookie");
    };
    apply();
    const ro = typeof ResizeObserver !== "undefined" && ref.current ? new ResizeObserver(apply) : null;
    ro?.observe(ref.current);
    mq.addEventListener?.("change", apply);
    return () => { ro?.disconnect(); mq.removeEventListener?.("change", apply); document.body.style.paddingBottom = ""; root.style.removeProperty("--hc-cookie"); };
  }, [open]);

  if (!open) return null;
  const choose = (v) => { consent.set(v); setOpen(false); window.dispatchEvent(new Event("hc:consent")); };
  const selectCls = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-coffee";

  return (
    <div ref={ref} role="dialog" aria-modal="false" aria-labelledby={`${panelId}-t`}
      className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:left-5 sm:bottom-5 sm:w-[440px] z-[60] max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-line bg-surface shadow-[0_12px_40px_rgba(0,0,0,.18)] px-4 pt-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-start gap-3">
        <span className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-latte-soft text-coffee"><ShieldCheck size={18} aria-hidden="true" /></span>
        <div className="min-w-0">
          <h2 id={`${panelId}-t`} className="text-[15px] sm:text-base font-semibold text-ink">{c.title}</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
            <span className="sm:hidden">{c.short} </span><span className="hidden sm:inline">{c.text} </span>
            <Link to="/confidentialite" className="underline underline-offset-2 text-ink">{c.more}</Link>
          </p>
        </div>
      </div>

      {/* Région détectée (desktop) : visible d'emblée, modifiable */}
      <div className="hidden sm:flex mt-4 items-center gap-2 rounded-xl bg-latte-soft px-3.5 py-2.5 text-[13px] text-ink">
        <MapPin size={15} className="text-coffee shrink-0" aria-hidden="true" />
        <span className="text-ink-soft">{c.region} :</span>
        <span className="font-medium">{region.info.flag} {region.info.name[lang === "en" ? "en" : "fr"]} · {region.currency}</span>
        <button type="button" onClick={() => setPanel(true)} className="ml-auto text-xs underline underline-offset-2">{c.customize}</button>
      </div>

      {panel && (
        <div id={panelId} className="mt-4 space-y-4 border-t border-line pt-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1"><p className="flex items-center gap-1.5 text-sm font-medium text-ink"><Lock size={13} aria-hidden="true" />{c.essTitle}</p><p className="text-xs text-ink-soft mt-0.5">{c.essText}</p></div>
            <span className="text-[11px] text-ink-soft mt-0.5">{c.always}</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1"><p className="text-sm font-medium text-ink">{c.prefTitle}</p><p className="text-xs text-ink-soft mt-0.5">{c.prefText}</p></div>
            <Switch on={prefs} onChange={setPrefs} label={c.prefTitle} />
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink"><MapPin size={13} aria-hidden="true" />{c.region}</p>
            <p className="text-xs text-ink-soft mt-0.5">{c.regionHelp}</p>
            <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
              <label className="block"><span className="sr-only">{c.country}</span>
                <select value={region.country} onChange={(e) => region.setCountry(e.target.value)} className={selectCls}>
                  {REGION_LIST.map((r) => <option key={r.code} value={r.code}>{r.flag} {r.name[lang === "en" ? "en" : "fr"]}</option>)}
                </select></label>
              <label className="block"><span className="sr-only">{c.currency}</span>
                <select value={region.currency} onChange={(e) => region.setCurrency(e.target.value)} className={selectCls}>
                  {["ZMW", "USD", "CDF", "EUR", "ZAR", "GBP"].map((cu) => <option key={cu} value={cu}>{cu}</option>)}
                </select></label>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {panel ? (
          <>
            <button type="button" onClick={() => choose(prefs ? "all" : "essential")} className="flex-1 min-w-[9rem] inline-flex items-center justify-center gap-1.5 rounded-full bg-ink text-cream text-sm font-medium px-4 py-2.5"><Check size={15} aria-hidden="true" />{c.save}</button>
            <button type="button" onClick={() => setPanel(false)} aria-expanded="true" aria-controls={panelId} className="inline-flex items-center gap-1 rounded-full border border-line text-ink text-sm font-medium px-4 py-2.5">{c.hide}<ChevronDown size={14} className="rotate-180" aria-hidden="true" /></button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => choose("all")} className="flex-1 min-w-0 rounded-full bg-ink text-cream text-sm font-medium px-3 sm:px-4 py-2.5">{c.accept}</button>
            <button type="button" onClick={() => choose("essential")} className="flex-1 min-w-0 rounded-full border border-line text-ink text-sm font-medium px-3 sm:px-4 py-2.5">{c.essential}</button>
            <button type="button" onClick={() => setPanel(true)} aria-expanded="false" className="w-full text-center text-[13px] text-ink underline underline-offset-2 py-1">{c.customize}</button>
          </>
        )}
      </div>
    </div>
  );
}
