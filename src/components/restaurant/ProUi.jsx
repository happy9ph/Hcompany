import { Store, Utensils } from "lucide-react";
import { useRestoUi } from "./Shared.jsx";

/** Textes de l'espace pro selon le type de fiche (restaurant / vendeur individuel). */
export function useProT(type) {
  const t = useRestoUi().pro;
  const ind = type === "individual";
  const by = t.by[ind ? "individual" : "restaurant"];
  return { ...t, ...by, tabs: ind ? { ...t.tabs, ...t.tabsBy.individual } : t.tabs, statusHint: ind ? t.statusHintBy.individual : t.statusHint, checklist: ind ? t.checklistBy.individual : t.checklist, info: ind ? { ...t.info, ...t.infoBy.individual } : t.info };
}

export function TypePicker({ value, onChange, disabled = {}, name = "seller_type" }) {
  const t = useRestoUi().pro;
  const opts = [["restaurant", Utensils, t.type.restaurant, t.type.restaurantHint], ["individual", Store, t.type.individual, t.type.individualHint]];
  return (
    <fieldset className="grid sm:grid-cols-2 gap-3">
      <legend className="text-sm font-medium text-ink mb-2">{t.type.label}</legend>
      {opts.map(([v, Icon, label, hint]) => (
        <label key={v} className={`flex gap-3 rounded-2xl border p-4 cursor-pointer ${value === v ? "border-coffee bg-latte-soft/70" : "border-line bg-surface hover:border-coffee-light"} ${disabled[v] ? "opacity-50 cursor-not-allowed" : ""}`}>
          <input type="radio" name={name} value={v} checked={value === v} disabled={!!disabled[v]} onChange={() => onChange(v)} className="mt-1" />
          <span className="min-w-0"><span className="flex items-center gap-2 font-medium text-ink"><Icon size={16} className="text-coffee" aria-hidden="true" />{label}</span><span className="block text-sm text-ink-soft mt-1">{hint}</span>{disabled[v] && <span className="block text-xs text-red-600 mt-1">{disabled[v]}</span>}</span>
        </label>
      ))}
    </fieldset>
  );
}

