import { useEffect, useState } from "react";

/** Photo plein cadre du hero : public/images/hero.jpg (paysage, ≥ 1920×1080, < 400 Ko).
 *  Absente → rien n'est affiché et le hero reste tel quel. Un voile crème garde le texte lisible. */
export default function HeroPhoto({ src = "/images/hero.jpg" }) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setOk(true);
    img.src = src;
  }, [src]);
  if (!ok) return null;
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none">
      <img src={src} alt="" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 70% at 50% 45%, color-mix(in srgb, var(--color-cream) 94%, transparent) 0%, color-mix(in srgb, var(--color-cream) 78%, transparent) 55%, color-mix(in srgb, var(--color-cream) 35%, transparent) 100%)" }} />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-cream" />
    </div>
  );
}
