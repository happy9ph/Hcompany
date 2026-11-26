import { useState } from "react";

/** Photo d'arrière-plan d'une section (public/images/<nom>.jpg). Fichier absent → rien n'est affiché.
 *  `side="right"` : la photo occupe la moitié droite, fondue vers la couleur de la section (texte lisible). */
export default function SectionPhoto({ src, side = "right", className = "" }) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  return (
    <div aria-hidden="true" className={`absolute inset-0 -z-10 pointer-events-none ${className}`}>
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setMissing(true)}
        className={`absolute inset-y-0 h-full object-cover ${side === "right" ? "right-0 w-full md:w-[62%] object-[30%_center]" : "inset-x-0 w-full"}`}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            side === "right"
              ? "linear-gradient(90deg, var(--color-cream) 0%, color-mix(in srgb, var(--color-cream) 96%, transparent) 42%, color-mix(in srgb, var(--color-cream) 80%, transparent) 72%, color-mix(in srgb, var(--color-cream) 62%, transparent) 100%)"
              : "color-mix(in srgb, var(--color-cream) 80%, transparent)",
        }}
      />
    </div>
  );
}
