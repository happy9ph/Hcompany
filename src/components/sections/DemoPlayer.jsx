import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

/**
 * Lecteur de la démo de 15 s (captures réelles du site).
 * - Lecture muette en boucle dès que le bloc est visible ; poster + bouton si
 *   l'utilisateur préfère moins d'animations ou si la lecture est refusée.
 * - Aucun son, aucune dépendance : un <video> natif.
 */
export default function DemoPlayer() {
  const { lang } = useLanguage();
  const ref = useRef(null);
  const wrap = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const en = lang === "en";

  useEffect(() => {
    const v = ref.current;
    const box = wrap.current;
    if (!v || !box || typeof IntersectionObserver === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!reduce) v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(box);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  return (
    <div
      ref={wrap}
      className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-cream border border-line shadow-[0_30px_60px_-35px_rgba(30,26,23,0.35)]"
    >
      <video
        ref={ref}
        src="/videos/h-company-demo.mp4"
        poster="/videos/h-company-demo.jpg"
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.duration) setProgress(v.currentTime / v.duration);
        }}
        onClick={toggle}
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        aria-label={
          en
            ? "H-Company demo, 15 seconds, screen capture of the real site (payments in demo mode)"
            : "Démo H-Company, 15 secondes, capture du vrai site (paiements en mode démonstration)"
        }
      />

      {!playing && !failed && (
        <button
          type="button"
          onClick={toggle}
          aria-label={en ? "Play the demo" : "Lancer la démo"}
          className="absolute inset-0 flex items-center justify-center bg-ink-fixed/10 hover:bg-ink-fixed/20 transition-colors"
        >
          <span className="w-16 h-16 rounded-full bg-white/95 text-ink flex items-center justify-center shadow-xl">
            <Play size={22} fill="currentColor" className="ml-0.5" />
          </span>
        </button>
      )}

      {playing && (
        <button
          type="button"
          onClick={toggle}
          aria-label={en ? "Pause the demo" : "Mettre la démo en pause"}
          className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white/90 text-ink flex items-center justify-center shadow-md hover:bg-white"
        >
          <Pause size={14} fill="currentColor" />
        </button>
      )}

      <div className="absolute left-0 right-0 bottom-0 h-1 bg-black/10" aria-hidden="true">
        <div className="h-full bg-coffee" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
