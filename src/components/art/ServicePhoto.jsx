import { useState } from "react";
import { HServiceArt } from "./ServiceArt.jsx";

/** Vraie photo du service (public/images/services/<clé>.jpg) si elle existe ; sinon l'illustration de marque. */
export default function ServicePhoto({ name, className = "" }) {
  const [missing, setMissing] = useState(false);
  if (missing) return <HServiceArt name={name} className={className} />;
  return <img src={`/images/services/${name}.jpg`} alt="" loading="lazy" decoding="async" onError={() => setMissing(true)} className={`${className} object-cover`} />;
}
