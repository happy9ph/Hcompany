import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, UtensilsCrossed } from "lucide-react";
import { api } from "../../lib/api.js";
import { LodgeImage } from "../lodge/Shared.jsx";

const T = {
  fr: { kicker: "H-Food", title: "Une petite faim ?", text: "Plats, livraison ou retrait chez des restaurants et vendeurs près de vous.", cta: "Voir les plats", aria: "Découvrir H-Food" },
  en: { kicker: "H-Food", title: "Feeling hungry?", text: "Dishes, delivery or pick-up from restaurants and sellers near you.", cta: "Browse dishes", aria: "Discover H-Food" },
};

/** Petit bandeau d'appétit sur la page d'accueil : vrais vendeurs en vedette si l'API répond, texte seul sinon. */
export default function HFoodTeaser({ fr = true }) {
  const t = fr ? T.fr : T.en;
  const [picks, setPicks] = useState([]);
  useEffect(() => {
    let on = true;
    api.resto.home().then((d) => on && setPicks((d?.featured || []).filter((r) => r.image).slice(0, 3))).catch(() => {});
    return () => { on = false; };
  }, []);
  return (
    <Link to="/restaurant" aria-label={t.aria} className="group mt-8 flex items-center gap-4 sm:gap-6 rounded-2xl border border-line bg-latte-soft/60 hover:bg-latte-soft transition-colors p-4 sm:p-5">
      <span className="hidden sm:flex w-12 h-12 shrink-0 rounded-full bg-ink text-[#C89A3D] items-center justify-center"><UtensilsCrossed size={20} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-widest text-coffee">{t.kicker}</span>
        <span className="block font-display text-xl text-ink leading-tight">{t.title}</span>
        <span className="block text-sm text-ink-soft mt-0.5 line-clamp-2">{t.text}</span>
        <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">{t.cta}<ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" /></span>
      </span>
      {picks.length > 0 && (
        <span className="flex -space-x-3 shrink-0" aria-hidden="true">
          {picks.map((r) => <span key={r.id} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-cream bg-surface"><LodgeImage path={r.image} alt="" ratio="aspect-square" /></span>)}
        </span>
      )}
    </Link>
  );
}
