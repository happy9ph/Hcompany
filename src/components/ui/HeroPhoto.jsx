import { useEffect, useState } from "react";

/** Photo plein cadre du hero : public/images/hero.jpg (paysage, ≥ 1920×1080, < 400 Ko).
 *  Absente → rien n'est affiché et le hero reste tel quel. Un voile crème garde le texte lisible. */
function useExists(src) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setOk(true);
    img.src = src;
  }, [src]);
  return ok;
}

/** Mobile : la photo reste lisible en pleine couleur, dans un cadre arrondi sous les boutons. */
export function HeroPhotoCard({ src = "/images/hero.jpg" }) {
  if (!useExists(src)) return null;
  return (
    <div className="lg:hidden mt-10 mx-auto max-w-md overflow-hidden rounded-3xl border border-line shadow-[0_24px_50px_-28px_rgba(23,20,15,0.45)]">
      <img src={src} alt="" decoding="async" className="w-full aspect-[4/3] object-cover object-[30%_center]" />
    </div>
  );
}

export default function HeroPhoto({ src = "/images/hero.jpg" }) {
  const ok = useExists(src);
  if (!ok) return null;
  return (
    <div aria-hidden="true" className="hidden lg:block absolute inset-0 -z-10 pointer-events-none">
      <img src={src} alt="" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 42% 68% at 50% 48%, color-mix(in srgb, var(--color-cream) 94%, transparent) 0%, color-mix(in srgb, var(--color-cream) 70%, transparent) 55%, color-mix(in srgb, var(--color-cream) 8%, transparent) 100%)" }} />
      <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-cream/85 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-cream" />
    </div>
  );
}
