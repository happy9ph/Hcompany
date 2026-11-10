import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/** Fenêtre modale (popup) qui accueille les parcours Send Money / Request Money. Échap et la croix ferment, sauf pendant qu'une opération est en cours (`locked`).
 *  Le fond défile pas ; le focus est rendu au bouton d'origine à la fermeture. */
export default function TransferModal({ title, onClose, locked = false, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (e) => { if (e.key === "Escape" && !locked) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [locked, onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" role="presentation">
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        className="relative w-full sm:max-w-[600px] max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-surface shadow-2xl outline-none [&>div]:!border-0 [&>div]:!rounded-none [&>div]:!min-h-0">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-surface/95 backdrop-blur px-5 pt-4 pb-1">
          <p className="font-display text-lg text-ink">{title}</p>
          <button type="button" onClick={onClose} disabled={locked} aria-label="Fermer" className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-black/5 disabled:opacity-30"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
