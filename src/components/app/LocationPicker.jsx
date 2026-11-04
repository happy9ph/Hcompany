import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, MapPin } from "lucide-react";
import { coordOf } from "../../lib/cities.js";

const PIN = `<div style="transform:translate(-50%,-100%);font-size:34px;line-height:1;filter:drop-shadow(0 4px 6px rgba(0,0,0,.4))">📍</div>`;

/** Carte pour placer un logement : toucher la carte ou glisser l'épingle ; « Ma position » utilise le GPS. */
export default function LocationPicker({ lat, lng, city, onChange, height = 320 }) {
  const el = useRef(null), map = useRef(null), pin = useRef(null), cb = useRef(onChange);
  const [msg, setMsg] = useState("");
  cb.current = onChange;
  const valid = (v) => v !== "" && v != null && Number.isFinite(Number(v));

  useEffect(() => {
    const start = valid(lat) && valid(lng) ? [Number(lat), Number(lng)] : coordOf(city) || [-15.4167, 28.2833];
    const m = L.map(el.current, { center: start, zoom: valid(lat) ? 16 : 12, scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
    const put = (ll) => {
      const p = [Number(ll.lat ?? ll[0]).toFixed(6), Number(ll.lng ?? ll[1]).toFixed(6)];
      if (!pin.current) {
        pin.current = L.marker(ll, { draggable: true, icon: L.divIcon({ className: "", iconSize: [0, 0], html: PIN }) }).addTo(m);
        pin.current.on("dragend", () => { const q = pin.current.getLatLng(); cb.current(Number(q.lat.toFixed(6)), Number(q.lng.toFixed(6))); });
      } else pin.current.setLatLng(ll);
      cb.current(Number(p[0]), Number(p[1]));
    };
    m.on("click", (e) => put(e.latlng));
    if (valid(lat) && valid(lng)) { pin.current = L.marker(start, { draggable: true, icon: L.divIcon({ className: "", iconSize: [0, 0], html: PIN }) }).addTo(m); pin.current.on("dragend", () => { const q = pin.current.getLatLng(); cb.current(Number(q.lat.toFixed(6)), Number(q.lng.toFixed(6))); }); }
    map.current = m; m._put = put;
    const ro = new ResizeObserver(() => m.invalidateSize()); ro.observe(el.current);
    return () => { ro.disconnect(); m.remove(); map.current = null; pin.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Les champs numériques déplacent l'épingle ; changer de ville recentre la carte tant qu'aucune épingle n'est posée.
  useEffect(() => {
    const m = map.current; if (!m) return;
    if (valid(lat) && valid(lng)) { const ll = [Number(lat), Number(lng)]; if (pin.current) pin.current.setLatLng(ll); else m._put?.(ll); }
  }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const m = map.current, c = coordOf(city); if (m && c && !pin.current) m.setView(c, 12); }, [city]);

  const locate = () => {
    setMsg("");
    if (!navigator.geolocation) { setMsg("Position indisponible sur cet appareil."); return; }
    navigator.geolocation.getCurrentPosition((p) => { const ll = [p.coords.latitude, p.coords.longitude]; map.current?.setView(ll, 17); map.current?._put?.(ll); }, () => setMsg("Autorisez la localisation ou touchez la carte."), { enableHighAccuracy: true, timeout: 10000 });
  };

  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden border border-line" style={{ height }}>
        <div ref={el} className="absolute inset-0 z-0" role="application" aria-label="Carte pour placer le logement" />
        <button type="button" onClick={locate} className="absolute z-[400] top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-surface border border-line shadow text-xs font-medium px-3.5 py-2 hover:bg-latte-soft"><Crosshair size={14} />Ma position</button>
        {!valid(lat) && <p className="absolute z-[400] bottom-3 left-3 right-3 sm:right-auto rounded-full bg-ink-fixed/90 text-cream-fixed text-xs px-4 py-2 inline-flex items-center gap-2"><MapPin size={13} />Touchez la carte pour poser l'épingle sur votre logement</p>}
      </div>
      {msg && <p role="alert" className="text-xs text-red-600 mt-2">{msg}</p>}
    </div>
  );
}
