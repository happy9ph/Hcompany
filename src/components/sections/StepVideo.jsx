import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bus, BedDouble, UtensilsCrossed, Mountain, ShoppingBag, GraduationCap, Search, Check, ShieldCheck, Box, Bell, Star } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

/**
 * Démonstration animée de 15 s en boucle (pas un fichier vidéo) : le même
 * parcours en quatre étapes, déroulé tour à tour sur les six services du
 * réseau — Transport, Logement, Restaurant, Tourisme, Shopping, Learning.
 * Chaque service dispose de 2,5 s ; tout est piloté par une seule horloge,
 * donc l'image est toujours cohérente (pas de minuteurs concurrents).
 * Les montants et noms sont des exemples illustratifs.
 */
const DURATION = 15;
const SLOT = DURATION / 6;
const GOLD = "#C89A3D";

const SVC = [
  {
    key: "transport", Icon: Bus,
    fr: {
      label: "Transport", q: "Bus Lusaka → Lubumbashi", partner: "Lukondo", role: "Agence de transport",
      results: [["Lukondo · départ 06:00", "Bus climatisé · 28 places", "K 850"], ["Lukondo · départ 14:30", "Bus standard · 12 places", "K 720"], ["Colis Lusaka → Kolwezi", "Suivi par code", "K 95"]],
      ask: ["Départ", "Samedi 06:00"], lines: [["Trajet", "Lusaka → Lubumbashi"], ["Places", "2 adultes"], ["Billet", "QR à l'embarquement"]], total: "K 1 700",
      track: ["Réservation reçue", "Billet QR émis", "Embarquement validé", "Arrivé"],
    },
    en: {
      label: "Transport", q: "Bus Lusaka → Lubumbashi", partner: "Lukondo", role: "Transport agency",
      results: [["Lukondo · departs 06:00", "Air-con bus · 28 seats", "K 850"], ["Lukondo · departs 14:30", "Standard bus · 12 seats", "K 720"], ["Parcel Lusaka → Kolwezi", "Code tracking", "K 95"]],
      ask: ["Departure", "Saturday 06:00"], lines: [["Route", "Lusaka → Lubumbashi"], ["Seats", "2 adults"], ["Ticket", "QR at boarding"]], total: "K 1,700",
      track: ["Booking received", "QR ticket issued", "Boarding validated", "Arrived"],
    },
  },
  {
    key: "logement", Icon: BedDouble, threeD: true,
    fr: {
      label: "Logement", q: "Appartement à Lusaka", partner: "Hôte vérifié", role: "Logement H-Logement",
      results: [["Appartement 2 chambres · Kabulonga", "Visite 3D immersive", "K 640 / nuit"], ["Studio meublé · Woodlands", "Visite 3D immersive", "K 380 / nuit"], ["Maison avec jardin · Roma", "Visite 3D immersive", "K 910 / nuit"]],
      ask: ["Séjour", "3 nuits"], lines: [["Logement", "Appartement · Kabulonga"], ["Dates", "3 nuits"], ["Paiement", "Sous séquestre"]], total: "K 1 920",
      track: ["Demande envoyée", "Hôte confirme", "Séjour en cours", "Avis laissé"],
    },
    en: {
      label: "Lodging", q: "Apartment in Lusaka", partner: "Verified host", role: "H-Lodging host",
      results: [["2-bedroom apartment · Kabulonga", "Immersive 3D tour", "K 640 / night"], ["Furnished studio · Woodlands", "Immersive 3D tour", "K 380 / night"], ["House with garden · Roma", "Immersive 3D tour", "K 910 / night"]],
      ask: ["Stay", "3 nights"], lines: [["Place", "Apartment · Kabulonga"], ["Dates", "3 nights"], ["Payment", "Held in escrow"]], total: "K 1,920",
      track: ["Request sent", "Host confirms", "Stay in progress", "Review left"],
    },
  },
  {
    key: "restaurant", Icon: UtensilsCrossed, threeD: true,
    fr: {
      label: "Restaurant", q: "Table pour 4 ce soir", partner: "Confismila", role: "Restaurant partenaire",
      results: [["Salle principale · Table T3", "6 couverts · plan 3D", "Libre 19:00"], ["Terrasse · Table T5", "4 couverts · plan 3D", "Libre 19:30"], ["Salon privé · Table T8", "8 couverts · plan 3D", "Libre 20:00"]],
      ask: ["Table", "T3 · 19:00"], lines: [["Table", "T3 · salle principale"], ["Couverts", "4 personnes"], ["Pré-commande", "Menu du jour"]], total: "Table réservée",
      track: ["Demande reçue", "Table confirmée", "Client installé", "Merci !"],
    },
    en: {
      label: "Restaurant", q: "Table for 4 tonight", partner: "Confismila", role: "Partner restaurant",
      results: [["Main room · Table T3", "6 covers · 3D floor plan", "Free 19:00"], ["Terrace · Table T5", "4 covers · 3D floor plan", "Free 19:30"], ["Private lounge · Table T8", "8 covers · 3D floor plan", "Free 20:00"]],
      ask: ["Table", "T3 · 19:00"], lines: [["Table", "T3 · main room"], ["Guests", "4 people"], ["Pre-order", "Set menu"]], total: "Table booked",
      track: ["Request received", "Table confirmed", "Guests seated", "Thank you!"],
    },
  },
  {
    key: "tourisme", Icon: Mountain,
    fr: {
      label: "Tourisme", q: "Chutes Victoria", partner: "Opérateur local", role: "Excursion H-Tourisme",
      results: [["Chutes Victoria au lever du soleil", "4 h · guide francophone", "K 300"], ["Croisière au coucher du soleil", "2 h · repas inclus", "K 420"], ["Safari à la journée", "9 h · 6 places", "K 1 150"]],
      ask: ["Départ", "Dim. 08:00"], lines: [["Excursion", "Chutes Victoria"], ["Voyageurs", "2 adultes · 1 enfant"], ["Départ", "Dimanche 08:00"]], total: "K 750",
      track: ["Réservation envoyée", "Opérateur confirme", "Départ au point de RDV", "Avis publié"],
    },
    en: {
      label: "Tourism", q: "Victoria Falls", partner: "Local operator", role: "H-Tourism tour",
      results: [["Victoria Falls at sunrise", "4 h · French-speaking guide", "K 300"], ["Sunset river cruise", "2 h · meal included", "K 420"], ["Full-day safari", "9 h · 6 seats", "K 1,150"]],
      ask: ["Departure", "Sun. 08:00"], lines: [["Tour", "Victoria Falls"], ["Travellers", "2 adults · 1 child"], ["Departure", "Sunday 08:00"]], total: "K 750",
      track: ["Booking sent", "Operator confirms", "Meeting at the point", "Review posted"],
    },
  },
  {
    key: "shopping", Icon: ShoppingBag, threeD: true,
    fr: {
      label: "Shopping", q: "Sac en cuir", partner: "Boutique partenaire", role: "Vendeur H-Shopping",
      results: [["Sac en cuir artisanal", "Aperçu produit en 3D", "K 480"], ["Sac bandoulière noir", "Aperçu produit en 3D", "K 360"], ["Pochette en cuir", "Aperçu produit en 3D", "K 190"]],
      ask: ["Quantité", "1 article"], lines: [["Article", "Sac en cuir artisanal"], ["Livraison", "Retrait en boutique"], ["Paiement", "Portefeuille H"]], total: "K 480",
      track: ["Commande reçue", "Préparée par la boutique", "Prête / expédiée", "Livrée"],
    },
    en: {
      label: "Shopping", q: "Leather bag", partner: "Partner shop", role: "H-Shopping seller",
      results: [["Handmade leather bag", "3D product preview", "K 480"], ["Black shoulder bag", "3D product preview", "K 360"], ["Leather pouch", "3D product preview", "K 190"]],
      ask: ["Quantity", "1 item"], lines: [["Item", "Handmade leather bag"], ["Delivery", "Shop pickup"], ["Payment", "H wallet"]], total: "K 480",
      track: ["Order received", "Prepared by the shop", "Ready / shipped", "Delivered"],
    },
  },
  {
    key: "learning", Icon: GraduationCap,
    fr: {
      label: "Learning", q: "Développement mobile", partner: "H-Learning", role: "Formation en ligne",
      results: [["Développement mobile avec Flutter", "Intermédiaire · vidéos + quiz", "Inclus"], ["Introduction à la cybersécurité", "Débutant · certificat", "Inclus"], ["Bouquet équipe", "Plusieurs membres", "Sur devis"]],
      ask: ["Formule", "Bouquet individuel"], lines: [["Formation", "Flutter · niveau 2"], ["Accès", "Compte personnel"], ["Certificat", "À la réussite"]], total: "Accès ouvert",
      track: ["Inscription validée", "Cours en cours", "Quiz réussi", "Certificat délivré"],
    },
    en: {
      label: "Learning", q: "Mobile development", partner: "H-Learning", role: "Online training",
      results: [["Mobile development with Flutter", "Intermediate · videos + quizzes", "Included"], ["Introduction to cybersecurity", "Beginner · certificate", "Included"], ["Team plan", "Several members", "Quote"]],
      ask: ["Plan", "Individual plan"], lines: [["Course", "Flutter · level 2"], ["Access", "Personal account"], ["Certificate", "On completion"]], total: "Access open",
      track: ["Enrolment confirmed", "Course in progress", "Quiz passed", "Certificate issued"],
    },
  },
];

const L = {
  fr: { requestSent: "Demande transmise avec tous les détails", matched: "Mis en relation", verified: "Partenaire vérifié", summary: "Récapitulatif", confirm: "Confirmer", confirmed: "Confirmé", secure: "Paiement et données protégés", notif: "Notification envoyée au client", example: "Exemple illustratif", sent: "Demande" },
  en: { requestSent: "Request sent with all details", matched: "Matched", verified: "Verified partner", summary: "Summary", confirm: "Confirm", confirmed: "Confirmed", secure: "Payment and data protected", notif: "Notification sent to the customer", example: "Illustrative example", sent: "Request" },
};

const INK = "#2A1A11", CREAM = "#FAF7F2", SAND = "#E4D2BC", MUTED = "#8A7560", GREEN = "#2E9E6B", DEEP = "#241812";
const FLAME_D = "M256 496C190 452 92 392 92 296C92 224 124 168 178 116C168 148 176 184 204 182C236 180 238 126 258 80C268 54 280 36 288 20C280 78 302 140 346 204C342 152 346 82 362 24C404 84 424 156 420 222C418 262 408 292 396 316C386 340 330 438 256 496Z";
const Flame = ({ h = 24, color = GOLD }) => (
  <svg viewBox="88 16 340 484" height={h} width={h * 0.7} aria-hidden="true"><path d={FLAME_D} fill={color} /></svg>
);

/** Cadre : fond chocolat, rail des 6 services en haut, progression par service en bas. */
function Chrome({ children }) {
  const { lang } = useLanguage();
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setElapsed(((Date.now() - start) / 1000) % DURATION), 80);
    return () => clearInterval(timer);
  }, []);
  const idx = Math.min(5, Math.floor(elapsed / SLOT));
  const local = (elapsed - idx * SLOT) / SLOT; // 0 → 1 dans le service courant
  const ss = String(Math.floor(elapsed)).padStart(2, "0");
  const lg = lang === "en" ? "en" : "fr";
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "radial-gradient(60% 50% at 72% 16%, rgba(200,154,61,.26), transparent 70%), radial-gradient(50% 50% at 6% 94%, rgba(196,154,108,.2), transparent 70%), linear-gradient(135deg, #2A1A11, #1E1A17)" }}>
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      {children({ idx, local })}
      <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1.5 ring-1 ring-white/10">
          <Flame h={14} />
          <span className="text-[0.62rem] font-semibold tracking-[0.18em] text-white/80 uppercase">H-Company</span>
        </div>
      </div>
      <div className="absolute top-16 inset-x-0 flex justify-center gap-1.5 pointer-events-none" aria-hidden="true">
        {SVC.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1.5 rounded-xl h-8 px-2 transition-all duration-300" style={i === idx ? { background: GOLD, color: INK } : { background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.5)" }}>
            <s.Icon size={15} />{i === idx && <span className="text-[0.7rem] font-semibold pr-1">{s[lg].label}</span>}
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 inset-x-0 px-6 pb-4 pointer-events-none">
        <div className="flex gap-1.5 mb-2" aria-hidden="true">
          {SVC.map((s, i) => (
            <div key={s.key} className="h-1 flex-1 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full" style={{ background: GOLD, width: i < idx ? "100%" : i === idx ? `${local * 100}%` : "0%" }} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[0.68rem] text-white/55 font-mono">
          <span>0:{ss}</span><span className="text-white/40">{L[lg].example}</span><span>0:{DURATION}</span>
        </div>
      </div>
    </div>
  );
}

function Pill({ svc, text }) {
  const { Icon } = svc;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.72rem] font-semibold" style={{ background: INK, color: CREAM }}>
      <Icon size={13} style={{ color: GOLD }} />{text}
    </span>
  );
}

/** Feuille crème posée sur le fond chocolat. */
const Sheet = ({ k, children, className = "" }) => (
  <motion.div key={k} initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className={`w-full max-w-[540px] rounded-[26px] p-5 md:p-6 ${className}`}
    style={{ background: CREAM, color: INK, boxShadow: "0 40px 80px -30px rgba(0,0,0,.7), inset 0 0 0 1px rgba(255,255,255,.6)" }}>
    {children}
  </motion.div>
);
const card = (hi) => (hi ? { background: "#F3EBE0", boxShadow: `inset 0 0 0 1.5px ${GOLD}` } : { background: "#fff", boxShadow: `inset 0 0 0 1px ${SAND}` });

function SearchStep({ idx, local, lang }) {
  const s = SVC[idx], d = s[lang];
  const chars = Math.min(d.q.length, Math.floor((local / 0.34) * d.q.length));
  return (
    <Sheet k={idx}>
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-4" style={{ background: "#fff", boxShadow: `inset 0 0 0 1.5px ${SAND}` }}>
        <Search size={18} style={{ color: GOLD }} />
        <span className="text-[1.02rem] font-medium truncate">{d.q.slice(0, chars)}<span className="animate-pulse" style={{ color: GOLD }}>|</span></span>
      </div>
      <div className="space-y-2.5 min-h-[212px]">
        {local > 0.4 && d.results.map(([title, meta, price], i) => (
          <motion.div key={title} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }} className="flex items-center gap-3.5 rounded-2xl p-3" style={card(i === 0)}>
            <span className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: INK }}><s.Icon size={20} style={{ color: GOLD }} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.92rem] font-semibold truncate leading-tight">{title}</p>
              <p className="text-[0.74rem] truncate flex items-center gap-1.5" style={{ color: MUTED }}>
                {s.threeD && <span className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-px text-[0.6rem] font-bold" style={{ background: GOLD, color: INK }}><Box size={9} />3D</span>}{meta}
              </p>
            </div>
            <span className="font-display text-[1.02rem] whitespace-nowrap">{price}</span>
          </motion.div>
        ))}
      </div>
    </Sheet>
  );
}

const Node = ({ children, label, style, ring }) => (
  <div className="flex flex-col items-center gap-2 w-[84px]">
    <div className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center" style={style}>
      {ring && <motion.span className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 2px ${GOLD}` }} animate={{ scale: [1, 1.35], opacity: [0.7, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />}
      {children}
    </div>
    <span className="text-[0.68rem] font-medium text-center truncate max-w-full" style={{ color: "#6B5440" }}>{label}</span>
  </div>
);
const Wire = ({ p }) => (
  <div className="relative flex-1 h-[3px] rounded-full mt-[34px]" style={{ background: SAND }}>
    <div className="absolute inset-y-0 left-0 rounded-full" style={{ background: GOLD, width: `${p * 100}%` }} />
    <span className="absolute -top-[5px] w-[13px] h-[13px] rounded-full" style={{ background: GOLD, left: `${p * 100}%`, transform: "translateX(-50%)", boxShadow: `0 0 14px ${GOLD}`, opacity: p > 0 && p < 1 ? 1 : 0 }} />
  </div>
);

function MatchStep({ idx, local, lang }) {
  const s = SVC[idx], d = s[lang], t = L[lang];
  const ok = local > 0.7;
  return (
    <Sheet k={idx}>
      <div className="flex justify-center mb-5"><Pill svc={s} text={d.label} /></div>
      <div className="flex items-start gap-1 mb-5">
        <Node label={lang === "fr" ? "Client" : "Customer"} style={{ background: "#EFE4D2" }}><span className="font-display text-2xl">C</span></Node>
        <Wire p={Math.min(local / 0.45, 1)} />
        <Node ring label="H-Company" style={{ background: INK }}><Flame h={34} /></Node>
        <Wire p={local > 0.45 ? Math.min((local - 0.45) / 0.35, 1) : 0} />
        <Node label={d.partner} style={{ background: `${GOLD}33`, boxShadow: `inset 0 0 0 2px ${GOLD}` }}><s.Icon size={28} style={{ color: INK }} /></Node>
      </div>
      <div className="rounded-2xl p-4" style={card(false)}>
        <div className="flex items-center justify-between mb-0.5">
          <p className="font-display text-[1.15rem]">{d.partner}</p>
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold transition-opacity" style={{ background: "#DDF3E8", color: GREEN, opacity: local > 0.55 ? 1 : 0 }}><ShieldCheck size={13} />{t.verified}</span>
        </div>
        <p className="text-[0.76rem] mb-3" style={{ color: MUTED }}>{d.role}</p>
        <p className="text-[0.8rem] flex items-center gap-2"><Check size={14} style={{ color: ok ? GREEN : SAND }} />{ok ? t.matched : t.requestSent}</p>
      </div>
    </Sheet>
  );
}

function ContractStep({ idx, local, lang }) {
  const s = SVC[idx], d = s[lang], t = L[lang];
  const done = local > 0.72;
  const notch = { background: DEEP, width: 24, height: 24 };
  return (
    <Sheet k={idx} className="relative">
      <div className="flex items-center justify-between mb-3">
        <Pill svc={s} text={d.label} />
        <span className="text-[0.72rem] font-semibold" style={{ color: MUTED }}>{t.summary}</span>
      </div>
      {d.lines.map(([k, v], i) => (
        <motion.div key={k} animate={{ opacity: local > 0.08 + i * 0.1 ? 1 : 0, x: local > 0.08 + i * 0.1 ? 0 : -8 }} className="flex items-baseline gap-2 py-2 text-[0.88rem]">
          <span style={{ color: MUTED }}>{k}</span>
          <span className="flex-1 border-b border-dotted mb-1" style={{ borderColor: SAND }} />
          <span className="font-semibold text-right">{v}</span>
        </motion.div>
      ))}
      <div className="relative my-4 border-t-2 border-dashed" style={{ borderColor: SAND }}>
        <span className="absolute -left-8 md:-left-9 -top-3 rounded-full" style={notch} />
        <span className="absolute -right-8 md:-right-9 -top-3 rounded-full" style={notch} />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-[0.76rem]" style={{ color: MUTED }}>Total</span>
        <span className="font-display text-[1.9rem] leading-none">{d.total}</span>
      </div>
      <p className="mt-3 text-[0.7rem] flex items-center gap-1.5" style={{ color: MUTED }}><ShieldCheck size={13} />{t.secure}</p>
      <motion.div animate={{ opacity: done ? 1 : 0, scale: done ? 1 : 1.7, rotate: -10 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="absolute right-5 top-[46%] rounded-xl px-3 py-1 border-[3px] font-display text-lg uppercase tracking-wider pointer-events-none" style={{ color: GREEN, borderColor: GREEN, background: "rgba(250,247,242,.85)" }}>
        {t.confirmed}
      </motion.div>
    </Sheet>
  );
}

function TrackStep({ idx, local, lang }) {
  const s = SVC[idx], d = s[lang], t = L[lang];
  const reached = Math.min(d.track.length, Math.floor(local / 0.22) + 1);
  return (
    <Sheet k={idx}>
      <div className="flex items-center justify-between mb-4">
        <Pill svc={s} text={d.partner} />
        <span className="text-[0.72rem] font-semibold" style={{ color: MUTED }}>{t.sent}</span>
      </div>
      <div className="relative">
        <div className="absolute left-[11px] top-3 bottom-3 w-[3px] rounded-full" style={{ background: SAND }}>
          <div className="w-full rounded-full transition-all duration-500" style={{ background: GOLD, height: `${((reached - 1) / (d.track.length - 1)) * 100}%` }} />
        </div>
        <div className="space-y-4">
          {d.track.map((label, i) => {
            const on = i < reached;
            return (
              <div key={label} className="relative flex items-center gap-4">
                <span className="relative z-10 w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0" style={{ background: on ? GOLD : CREAM, boxShadow: on ? `0 0 0 4px ${GOLD}33` : `inset 0 0 0 2px ${SAND}` }}>
                  {on && <Check size={14} color={INK} strokeWidth={3} />}
                </span>
                <span className="text-[0.95rem]" style={{ fontWeight: on ? 600 : 400, opacity: on ? 1 : 0.4 }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <AnimatePresence>
        {local > 0.5 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[0.78rem]" style={{ background: INK, color: CREAM }}>
            <Bell size={14} style={{ color: GOLD }} />{t.notif}<Star size={12} className="ml-auto" style={{ color: GOLD }} />
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

const VARIANTS = [SearchStep, MatchStep, ContractStep, TrackStep];

export default function StepVideo({ step }) {
  const { lang } = useLanguage();
  const Content = VARIANTS[step] || SearchStep;
  return (
    <Chrome>
      {({ idx, local }) => (
        <div className="absolute inset-0 flex items-center justify-center px-5 pt-[6.5rem] pb-14">
          <Content idx={idx} local={local} lang={lang === "en" ? "en" : "fr"} />
        </div>
      )}
    </Chrome>
  );
}
