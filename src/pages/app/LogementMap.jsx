import { Suspense, lazy, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BedDouble, Star } from "lucide-react";
import { api } from "../../lib/api.js";
import { useUser } from "../../context/Usercontext.jsx";
import { useLoad, useShopMoney } from "../../data/shop.js";
import { usePageMeta } from "../../components/ui/HeadManager.jsx";
import MapView from "../../components/app/MapView.jsx";
import PromoSlot from "../../components/app/PromoSlot.jsx";
import MapLayout, { Empty, Modal, Skel } from "../../components/app/MapLayout.jsx";

const Interior3D = lazy(() => import("../../components/lodge/Interior3D.jsx"));

export default function LogementMap() {
  usePageMeta({ title: "Logements sur la carte" });
  const { money } = useShopMoney();
  const { token } = useUser();
  const { data, loading } = useLoad(() => api.lodge.search({ per_page: 60 }, token), [token]);
  const items = data?.items || data || [];
  const [sel, setSel] = useState(null);
  const [tour, setTour] = useState(null);
  const located = items.filter((p) => p.latitude != null && p.longitude != null);
  const markers = useMemo(() => located.map((p) => ({ id: String(p.id), lat: p.latitude, lng: p.longitude, label: money(p.price_per_night), emoji: "🏠", active: sel?.id === p.id })), [located.length, sel, money]); // eslint-disable-line react-hooks/exhaustive-deps
  const fit = useMemo(() => (sel && sel.latitude != null ? [[sel.latitude, sel.longitude]] : undefined), [sel]);

  return (
    <MapLayout title="Logements sur la carte" lead="Touchez une maison pour voir le logement, faire la visite 3D de l'intérieur, puis réserver."
      map={<MapView markers={markers} fitTo={fit} onSelect={(id) => setSel(items.find((p) => String(p.id) === id) || null)} center={[-15.4, 28.3]} zoom={11} />}>
      <PromoSlot placement="app_logement" limit={1} variant="banner" />
      {loading ? <Skel /> : !items.length ? <Empty>Aucun logement pour le moment.</Empty> : items.map((p) => (
        <div key={p.id} className={`rounded-2xl border bg-surface overflow-hidden ${sel?.id === p.id ? "border-[#C89A3D]" : "border-line"}`}>
          <button onClick={() => setSel(p)} className="w-full text-left flex gap-3 p-3">
            {p.image ? <img src={p.image} alt="" loading="lazy" className="w-24 h-20 rounded-xl object-cover shrink-0" /> : <span className="w-24 h-20 rounded-xl bg-latte-soft flex items-center justify-center shrink-0"><BedDouble className="text-coffee" /></span>}
            <span className="min-w-0"><span className="block font-medium truncate">{p.title}</span><span className="block text-xs text-ink-soft">{p.city}{p.area ? ` · ${p.area}` : ""} · {p.bedrooms} ch.</span>
              <span className="mt-1 flex items-center gap-2 text-sm"><b>{money(p.price_per_night)}</b><span className="text-xs text-ink-faint">/ nuit</span>{p.rating_count > 0 && <span className="inline-flex items-center gap-0.5 text-xs"><Star size={11} className="text-[#C89A3D]" fill="currentColor" />{p.rating_avg.toFixed(1)}</span>}</span></span>
          </button>
          <div className="flex gap-2 px-3 pb-3">
            <button onClick={() => setTour(p)} className="flex-1 rounded-full border border-line text-xs py-2 hover:bg-latte-soft">Visite 3D</button>
            <Link to={`/logement/s/${p.slug}`} className="flex-1 text-center rounded-full bg-ink text-cream text-xs font-medium py-2">Voir et réserver</Link>
          </div>
        </div>))}
      {tour && (
        <Modal onClose={() => setTour(null)} wide title={tour.title}>
          <Suspense fallback={<Skel />}><Interior3D p={tour} height={420} help="Glissez pour regarder, flèches / ZQSD pour avancer." /></Suspense>
          <div className="mt-4 flex justify-end"><Link to={`/logement/s/${tour.slug}`} className="rounded-full bg-ink text-cream text-sm font-medium px-6 py-3">Voir et réserver</Link></div>
        </Modal>)}
    </MapLayout>
  );
}
