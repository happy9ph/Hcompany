import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import { consent } from "../../lib/memStore.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

/** Information cookies : H-Company n'utilise que des cookies essentiels (session) et de préférence (langue, thème, pays). Aucun traceur publicitaire. */
export default function CookieNotice() {
  const { lang } = useLanguage();
  const fr = lang !== "en";
  const [open, setOpen] = useState(() => !consent.get());
  const ref = useRef(null);
  // Mobile (V8) : le bandeau est une barre compacte collée en bas ; la page reçoit une marge égale à sa hauteur, de sorte que
  // formulaires, filtres et boutons restent atteignables au défilement. Le consentement n'est ni retiré ni contourné.
  useEffect(() => {
    if (!open || typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => { document.body.style.paddingBottom = mq.matches && ref.current ? `${ref.current.offsetHeight}px` : ""; };
    apply();
    const ro = typeof ResizeObserver !== "undefined" && ref.current ? new ResizeObserver(apply) : null;
    ro?.observe(ref.current);
    mq.addEventListener?.("change", apply);
    return () => { ro?.disconnect(); mq.removeEventListener?.("change", apply); document.body.style.paddingBottom = ""; };
  }, [open]);
  if (!open) return null;
  const choose = (v) => { consent.set(v); setOpen(false); window.dispatchEvent(new Event("hc:consent")); };
  return (
    <div ref={ref} role="dialog" aria-label={fr ? "Cookies" : "Cookies"} className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:left-5 sm:bottom-5 sm:max-w-[420px] z-[60] rounded-t-2xl sm:rounded-2xl border border-line bg-surface shadow-2xl px-4 py-3 sm:p-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <p className="flex items-center gap-2 font-semibold text-ink text-sm sm:text-base"><Cookie size={18} />{fr ? "Vos cookies, votre choix" : "Your cookies, your choice"}</p>
      <p className="text-xs sm:text-sm text-ink-soft mt-1 sm:mt-2 leading-relaxed">
        <span className="sm:hidden">{fr ? "Un cookie de session indispensable et, si vous acceptez, des préférences (langue, thème). Aucun suivi publicitaire. " : "One essential session cookie and, if you accept, preferences (language, theme). No ad tracking. "}</span>
        <span className="hidden sm:inline">{fr ? "Nous utilisons un cookie de session indispensable (sécurisé, illisible par les scripts) et, si vous le permettez, des cookies de préférence (langue, thème, pays). Aucun cookie publicitaire ni de suivi. "
            : "We use one essential session cookie (secure, unreadable by scripts) and, if you allow it, preference cookies (language, theme, country). No advertising or tracking cookies. "}</span>
        <Link to="/confidentialite" className="underline text-coffee-dark">{fr ? "En savoir plus" : "Learn more"}</Link>
      </p>
      <div className="mt-3 sm:mt-4 flex gap-2">
        <button onClick={() => choose("all")} className="flex-1 min-w-0 rounded-full bg-ink text-cream text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5">{fr ? "Accepter" : "Accept"}</button>
        <button onClick={() => choose("essential")} className="flex-1 min-w-0 rounded-full border border-line text-ink text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5">{fr ? "Essentiels seulement" : "Essential only"}</button>
      </div>
    </div>
  );
}
