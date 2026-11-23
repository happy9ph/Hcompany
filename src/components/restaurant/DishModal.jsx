import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Minus, Plus, Truck, X } from "lucide-react";
import { RestoImage, useRestoUi } from "./Shared.jsx";
import { foodCart, useFoodCart } from "../../lib/foodCart.js";

/**
 * Fiche d'un plat façon Uber Eats : grande image, nom, prix, description, étiquettes, quantité et bouton « Ajouter · total ».
 *  dish : { id, name, price, description, image, tags } · vendor : { id, name, slug, city?, area?, offers_delivery? }
 * Échap, clic hors fiche ou ✕ ferment ; la page derrière ne défile plus ; le focus va sur ✕ puis revient au déclencheur.
 */
export default function DishModal({ dish, vendor, money, onClose }) {
  const ui = useRestoUi();
  const m = ui.dishModal;
  const cart = useFoodCart();
  const inCart = cart.lines.find((l) => l.iid === dish.id)?.qty || 0;
  const [qty, setQty] = useState(inCart || 1);
  const closeRef = useRef(null);

  useEffect(() => {
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; prevFocus?.focus?.(); };
  }, [onClose]);

  const total = (Number(dish.price) || 0) * qty;
  function save() {
    if (inCart) foodCart.setQty(dish.id, qty);
    else foodCart.add({ rid: vendor.id, iid: dish.id, name: dish.name, price: dish.price, vname: vendor.name, vslug: vendor.slug, image: dish.image }, qty);
    onClose();
  }
  const stepper = "w-10 h-10 rounded-full border border-line flex items-center justify-center hover:bg-latte-soft disabled:opacity-40";
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={dish.name} data-dish-modal={dish.id}>
      <button type="button" tabIndex={-1} className="absolute inset-0 bg-black/55" aria-label={m.close} onClick={onClose} />
      <div className="relative w-full sm:max-w-xl max-h-[92vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-cream shadow-2xl">
        <div className="relative shrink-0 bg-latte-soft">
          {dish.image ? <RestoImage path={dish.image} alt={dish.name} ratio="aspect-[16/10]" /> : <div className="aspect-[16/7] flex items-center justify-center text-coffee/40 font-display text-5xl" aria-hidden="true">{dish.name?.[0] || "·"}</div>}
          <button ref={closeRef} type="button" onClick={onClose} aria-label={m.close} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-cream text-ink shadow flex items-center justify-center"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl text-ink leading-tight">{dish.name}</h2>
            <p className="text-lg text-ink mt-1">{money(dish.price)}</p>
          </div>
          {dish.description && <p className="text-ink-soft whitespace-pre-line leading-relaxed">{dish.description}</p>}
          {dish.tags?.length > 0 && <p className="flex flex-wrap gap-1.5">{dish.tags.map((t) => <span key={t} className="rounded-full bg-latte-soft text-coffee text-xs px-2.5 py-1">{ui.tags[t] || t}</span>)}</p>}
          {vendor && (
            <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
              <p className="text-xs uppercase tracking-wide text-ink-faint">{m.soldBy}</p>
              {vendor.slug ? <Link to={`/restaurant/r/${vendor.slug}`} onClick={onClose} className="font-medium text-ink underline-offset-2 hover:underline">{vendor.name}</Link> : <p className="font-medium text-ink">{vendor.name}</p>}
              <p className="mt-1 text-ink-soft flex flex-wrap gap-x-4 gap-y-1">
                {(vendor.area || vendor.city) && <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden="true" />{[vendor.area, vendor.city].filter(Boolean).join(", ")}</span>}
                {vendor.offers_delivery != null && <span className="inline-flex items-center gap-1"><Truck size={13} aria-hidden="true" />{vendor.offers_delivery ? m.delivers : m.pickupOnly}</span>}
              </p>
            </div>
          )}
        </div>
        <div className="shrink-0 border-t border-line bg-cream p-4 sm:p-5 flex items-center gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="inline-flex items-center gap-1" role="group" aria-label={m.qty}>
            <button type="button" className={stepper} aria-label={m.dec} disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={16} /></button>
            <span className="w-8 text-center font-medium" aria-live="polite">{qty}</span>
            <button type="button" className={stepper} aria-label={m.inc} disabled={qty >= 50} onClick={() => setQty((q) => Math.min(50, q + 1))}><Plus size={16} /></button>
          </div>
          <button type="button" onClick={save} className="flex-1 rounded-full bg-ink text-cream font-medium py-3.5 flex items-center justify-between px-5">
            <span>{inCart ? m.update : m.add}</span><span>{money(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
