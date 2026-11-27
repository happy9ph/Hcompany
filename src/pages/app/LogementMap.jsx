import { Suspense, lazy, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Star, X, HelpCircle, MapPin, Box, CalendarCheck } from "lucide-react";
import { api } from "../../lib/api.js";
import { coordOf } from "../../lib/cities.js";
import { nearCity } from "../../lib/cityAreas.js";
import { useUser } from "../../context/Usercontext.jsx";
import { useLoad, useShopMoney } from "../../data/shop.js";
import { usePageMeta } from "../../components/ui/HeadManager.jsx";
import CityMap from "../../components/app/CityMap.jsx";
import { Empty, Modal, Skel } from "../../components/app/MapLayout.jsx";
import { LodgeImage } from "../../components/lodge/Shared.jsx";

const Interior3D = lazy(() => import("../../components/lodge/Interior3D.jsx"));

// Le tutoriel s'affiche à l'entrée sur la page, une seule fois par visite (aucun stockage navigateur).
let tutorialSeen = false;

const STEPS = [
  { Icon: MapPin, title: "1. Touchez un prix sur la carte", text: "Chaque étiquette de prix est un logement. Zoomez avec + / − ou changez de ville en haut." },
  { Icon: Box, title: "2. Découvrez le logement", text: "Sa fiche s'affiche sur la carte : photo, quartier, chambres. Lancez la visite 3D pour voir l'intérieur." },
  { Icon: CalendarCheck, title: "3. Réservez", text: "Touchez « Voir et réserver » pour choisir vos dates. Le prix est affiché avant de payer." },
];

function Tutorial({ onClose }) {
  const [i, setI] = useState(0);
  const { Icon, title, text } = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <div className="absolute inset-x-3 top-3 sm:left-4 sm:right-auto sm:max-w-sm z-20 rounded-2xl bg-cream/95 backdrop-blur border border-line shadow-xl p-4" role="dialog" aria-label="Comment ça marche">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-10 h-10 rounded-full bg-coffee text-cream flex items-center justify-center"><Icon size={18} /></span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-ink-soft mt-1 leading-relaxed">{text}</p>
        </div>
        <button onClick={onClose} aria-label="Fermer le tutoriel" className="shrink-0 -mt-1 -mr-1 w-8 h-8 rounded-full hover:bg-latte-soft flex items-center justify-center"><X size={15} /></button>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1.5" aria-hidden="true">{STEPS.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-coffee" : "w-1.5 bg-line"}`} />)}</div>
        <div className="flex gap-2">
          {!last && <button onClick={onClose} className="text-xs text-ink-soft px-2 py-1.5">Passer</button>}
          <button onClick={() => (last ? onClose() : setI(i + 1))} className="rounded-full bg-ink text-cream text-xs font-medium px-4 py-2">{last ? "J'ai compris" : "Suivant"}</button>
        </div>
      </div>
    </div>
  );
}

export default function LogementMap() {
  usePageMeta({ title: "Logements sur la carte" });
  const { money } = useShopMoney();
  const { token } = useUser();
  const { data, loading } = useLoad(() => api.lodge.search({ per_page: 48 }, token), [token]);
  const all = data?.items || data || [];
  const cities = useMemo(() => Object.entries(all.reduce((a, p) => ({ ...a, [p.city]: (a[p.city] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).map(([c]) => c), [all]);
  const [cityPick, setCityPick] = useState(null);
  const city = cityPick || cities[0] || "Lusaka";
  const items = all.filter((p) => p.city === city);
  const [sel, setSel] = useState(null);
  const [tour, setTour] = useState(null);
  const [help, setHelp] = useState(() => !tutorialSeen);
  const closeHelp = () => { tutorialSeen = true; setHelp(false); };
  const price = (p) => (p.price_per_night > 0 ? money(p.price_per_night) : "Sur demande");
  // Position exacte si l'hôte l'a donnée ; sinon le centre de la ville, décalé de façon stable pour que les annonces ne se superposent pas.
  const spot = (p) => {
    if (p.latitude != null && p.longitude != null && nearCity(p.city, p.latitude, p.longitude)) return [p.latitude, p.longitude]; // un point hors de la ville est ignoré
    const c = coordOf(p.city); if (!c) return null;
    const a = (p.id * 2654435761) % 360, r = 0.012 + ((p.id * 40503) % 100) / 100 * 0.03;
    return [c[0] + Math.sin((a * Math.PI) / 180) * r, c[1] + Math.cos((a * Math.PI) / 180) * r];
  };
  const located = items.map((p) => ({ p, pos: spot(p) })).filter((x) => x.pos).map((x) => ({ ...x.p, latitude: x.pos[0], longitude: x.pos[1] }));
  const markers = useMemo(() => located.map((p) => ({ id: String(p.id), lat: p.latitude, lng: p.longitude, label: price(p), emoji: "🏠", active: sel?.id === p.id })), [located.length, sel, money]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 pt-5">
      <div className="mb-3">
        <h1 className="font-display text-2xl sm:text-3xl">Logements sur la carte</h1>
        <p className="text-sm text-ink-soft mt-1">Touchez un prix sur la carte pour voir le logement, faire la visite 3D de l'intérieur, puis réserver.</p>
      </div>
      {cities.length > 1 && <div className="flex flex-wrap gap-1.5 mb-3" role="tablist">{cities.map((c) => <button key={c} role="tab" aria-selected={c === city} onClick={() => { setCityPick(c); setSel(null); }} className={`rounded-full border text-xs px-3 py-1.5 ${c === city ? "bg-ink text-cream border-ink" : "border-line text-ink-soft"}`}>{c}</button>)}</div>}

      <div className="relative rounded-3xl overflow-hidden border border-line h-[calc(100vh-230px)] min-h-[420px]" onClick={() => sel && setSel(null)}>
        <CityMap city={city} className="w-full h-full" markers={markers} onSelect={(id) => setSel(items.find((p) => String(p.id) === id) || null)} />

        {loading && <div className="absolute inset-x-4 top-4"><Skel /></div>}
        {!loading && !items.length && <div className="absolute inset-x-4 top-4"><Empty>Aucun logement pour le moment.</Empty></div>}

        {!help && (
          <button onClick={(e) => { e.stopPropagation(); setHelp(true); }} className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/95 text-ink text-xs font-medium px-3 py-2 shadow-md hover:bg-white">
            <HelpCircle size={14} /> Comment ça marche ?
          </button>
        )}
        {help && <div onClick={(e) => e.stopPropagation()}><Tutorial onClose={closeHelp} /></div>}

        {sel && (
          <div onClick={(e) => e.stopPropagation()} className="absolute z-20 inset-x-3 bottom-3 sm:inset-x-auto sm:left-4 sm:bottom-4 sm:w-[380px] rounded-2xl bg-surface border border-line shadow-2xl overflow-hidden">
            <button onClick={() => setSel(null)} aria-label="Fermer la fiche" className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/75"><X size={15} /></button>
            <LodgeImage path={sel.image} alt={sel.title} ratio="aspect-[16/6] sm:aspect-[16/8]" />
            <div className="p-4">
              <p className="font-medium leading-snug">{sel.title}{sel.is_featured && <span className="ml-2 align-middle rounded-full bg-[#C89A3D]/20 text-[#8a6a1f] text-[0.65rem] font-semibold px-2 py-0.5">Recommandé</span>}</p>
              <p className="text-xs text-ink-soft mt-0.5">{sel.city}{sel.area ? ` · ${sel.area}` : ""} · {sel.bedrooms} ch.</p>
              <p className="mt-2 flex items-center gap-2 text-sm"><b>{price(sel)}</b>{sel.price_per_night > 0 && <span className="text-xs text-ink-faint">/ nuit</span>}{sel.rating_count > 0 && <span className="inline-flex items-center gap-0.5 text-xs"><Star size={11} className="text-[#C89A3D]" fill="currentColor" />{sel.rating_avg.toFixed(1)}</span>}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setTour(sel)} className="flex-1 rounded-full border border-line text-sm py-2.5 hover:bg-latte-soft">Visite 3D</button>
                <Link to={`/logement/s/${sel.slug}`} className="flex-1 text-center rounded-full bg-ink text-cream text-sm font-medium py-2.5">Voir et réserver</Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {tour && (
        <Modal onClose={() => setTour(null)} wide title={tour.title}>
          <Suspense fallback={<Skel />}><Interior3D p={tour} height={420} help="Glissez pour regarder, flèches / ZQSD pour avancer." /></Suspense>
          <div className="mt-4 flex justify-end"><Link to={`/logement/s/${tour.slug}`} className="rounded-full bg-ink text-cream text-sm font-medium px-6 py-3">Voir et réserver</Link></div>
        </Modal>)}
    </div>
  );
}
