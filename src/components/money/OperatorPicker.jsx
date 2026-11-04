import { Check } from "lucide-react";

/** Tuiles d'opérateurs (marque de couleur + nom), façon « choisir un moyen de paiement ». Ce sont des repères visuels, pas les logos officiels. */
const BRAND = {
  mtn: { bg: "#FFCB05", fg: "#1A1A1A", text: "MTN", shape: "pill" },
  airtel: { bg: "#FFFFFF", fg: "#E40000", text: "airtel", sub: "money", shape: "word" },
  zamtel: { bg: "#FFFFFF", fg: "#1B9E3E", text: "zamtel", shape: "dot" },
  orange: { bg: "#FF7900", fg: "#FFFFFF", text: "orange", shape: "square" },
  mpesa: { bg: "#FFFFFF", fg: "#2E9B3C", text: "M-PESA", shape: "word" },
  africell: { bg: "#7A2A8C", fg: "#FFFFFF", text: "africell", shape: "word" },
};

export function OperatorLogo({ op, className = "" }) {
  const b = BRAND[op] || { bg: "#EEE", fg: "#333", text: op, shape: "word" };
  return (
    <svg viewBox="0 0 120 64" className={className} role="img" aria-label={b.text}>
      <rect width="120" height="64" fill={b.shape === "square" || b.shape === "pill" ? "#fff" : b.bg} />
      {b.shape === "pill" && <><ellipse cx="60" cy="32" rx="44" ry="22" fill={b.bg} /><text x="60" y="40" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="24" fill={b.fg}>{b.text}</text></>}
      {b.shape === "square" && <><rect x="40" y="6" width="40" height="40" fill={b.bg} /><text x="60" y="35" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="11" fill={b.fg}>{b.text}</text><text x="60" y="58" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="11" fill="#1A1A1A">Orange Money</text></>}
      {b.shape === "dot" && <><circle cx="60" cy="24" r="14" fill={b.fg} /><text x="60" y="28" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="9" fill="#fff">zamtel</text><text x="60" y="56" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="12" fill={b.fg}>Kwacha</text></>}
      {b.shape === "word" && <><text x="60" y={b.sub ? 34 : 38} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize={b.text.length > 6 ? 20 : 24} fill={b.fg}>{b.text}</text>{b.sub && <text x="60" y="52" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="13" fill={b.fg}>{b.sub}</text>}</>}
    </svg>
  );
}

/**
 * ops : [{key,label,pay,receive,cheapest_receive}] d'un pays ; role : "pay" (je paie avec) | "receive" (je reçois chez).
 * hints : { [opKey]: { line: "Reçoit 19,5 USD", sub: "Frais 16,67 ZMW" } } facultatif.
 */
export default function OperatorPicker({ ops = [], role = "pay", value, onChange, hints = {}, fr = true }) {
  const list = ops.filter((o) => (role === "pay" ? o.pay : o.receive));
  if (!list.length) return <p className="text-sm text-ink-soft">{fr ? "Aucun opérateur disponible pour l'instant." : "No operator available right now."}</p>;
  return (
    <div role="radiogroup" aria-label={fr ? "Opérateur" : "Operator"} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {list.map((o) => {
        const on = value === o.key, h = hints[o.key];
        return (
          <button type="button" key={o.key} role="radio" aria-checked={on} onClick={() => onChange(o.key)}
            className={`relative overflow-hidden rounded-xl border text-left transition-all ${on ? "border-ink ring-2 ring-ink/80 shadow-md" : "border-line hover:border-coffee/60"}`}>
            {role === "receive" && o.cheapest_receive && <span className="absolute top-0 right-0 z-10 bg-[#E4402B] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">{fr ? "Frais réduits" : "Lower fees"}</span>}
            <OperatorLogo op={o.key} className="w-full h-16 bg-white block" />
            <span className={`flex items-center justify-between gap-1 px-3 py-2 text-sm font-medium ${on ? "bg-ink text-cream" : "bg-[#4A7DB0] text-white"}`}>
              <span className="truncate">{o.label}</span>{on && <Check size={15} />}
            </span>
            {h && <span className="block px-3 py-1.5 bg-surface text-[11px] text-ink-soft leading-tight"><strong className="block text-ink text-xs">{h.line}</strong>{h.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}
