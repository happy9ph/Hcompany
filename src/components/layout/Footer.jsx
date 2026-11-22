import { Link } from "react-router-dom";
import { ArrowUp, Languages, Moon, Sun } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import Logo from "../ui/Logo.jsx";
import { REGION_LIST, useRegion } from "../../context/RegionContext.jsx";

// Icônes de marques (SVG 24×24, une seule couleur héritée du texte).
const ICONS = {
  facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
};

const SOCIALS = [
  { label: "Facebook", icon: "facebook", href: "https://facebook.com" },
  { label: "X", icon: "x", href: "https://x.com" },
  { label: "Instagram", icon: "instagram", href: "https://instagram.com" },
  { label: "LinkedIn", icon: "linkedin", href: "https://linkedin.com" },
  { label: "WhatsApp", icon: "whatsapp", href: "https://wa.me/260770381780" },
];

const COPY = {
  fr: {
    help: "Aide et contact", join: "Devenir partenaire", host: "Devenir hôte", sell: "Vendre en ligne", resto: "Ajouter mon restaurant", signup: "Créer un compte",
    bus: "Transport · Bus", parcel: "Transport · Colis", lodge: "Logement", food: "Restaurants", learn: "Formations", shop: "Shopping", about: "À propos",
    privacy: "Confidentialité", terms: "Conditions d'utilisation", rights: "Tous droits réservés.", top: "Haut de page",
    language: "Langue", theme: "Thème", light: "Clair", dark: "Sombre", country: "Pays", currency: "Devise", social: "Réseaux sociaux", links: "Liens du pied de page",
  },
  en: {
    help: "Help and contact", join: "Become a partner", host: "Become a host", sell: "Sell online", resto: "Add your restaurant", signup: "Create an account",
    bus: "Transport · Bus", parcel: "Transport · Parcels", lodge: "Lodging", food: "Restaurants", learn: "Courses", shop: "Shopping", about: "About",
    privacy: "Privacy", terms: "Terms of service", rights: "All rights reserved.", top: "Back to top",
    language: "Language", theme: "Theme", light: "Light", dark: "Dark", country: "Country", currency: "Currency", social: "Social media", links: "Footer links",
  },
};

function FootLink({ to, children }) {
  const cls = "inline-block py-2 text-[15px] text-ink hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-coffee focus-visible:outline-offset-2 rounded";
  if (to.startsWith("mailto:") || to.startsWith("https://")) return <a href={to} className={cls} {...(to.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{children}</a>;
  return <Link to={to} className={cls}>{children}</Link>;
}

function Segmented({ label, children }) {
  return <div role="group" aria-label={label} className="inline-flex rounded-full bg-latte-soft p-0.5 gap-0.5">{children}</div>;
}

function SegBtn({ active, onClick, label, children }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} aria-label={label} title={label}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors inline-flex items-center focus-visible:outline-2 focus-visible:outline-coffee ${active ? "bg-ink text-surface" : "text-ink/70 hover:text-ink"}`}>
      {children}
    </button>
  );
}

export default function Footer() {
  const { lang, switchLanguage } = useLanguage();
  const region = useRegion();
  const { mode, setMode } = useTheme();
  const c = COPY[lang] || COPY.fr;
  const selectCls = "bg-transparent text-ink text-[13px] outline-none cursor-pointer";
  return (
    <footer className="bg-surface text-ink border-t border-line" aria-label="H-Company">
      <div className="max-w-content mx-auto px-6 pt-12 md:pt-16 pb-24 md:pb-8">
        {/* Haut : logo à gauche, deux colonnes de liens à droite (sans titres) */}
        <div className="grid gap-10 lg:grid-cols-2">
          <Link to="/" className="inline-flex items-center gap-2.5 self-start" aria-label="H-Company">
            <Logo size={30} />
            <span className="font-display italic text-3xl">H-Company</span>
          </Link>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 lg:pl-8" role="navigation" aria-label={c.links}>
            <ul>
              <li><FootLink to="mailto:contact@h-company.com">{c.help}</FootLink></li>
              <li><FootLink to="/infos#rejoindre">{c.join}</FootLink></li>
              <li><FootLink to="/logement/hote">{c.host}</FootLink></li>
              <li><FootLink to="/shopping/vendre">{c.sell}</FootLink></li>
              <li><FootLink to="/restaurant/pro">{c.resto}</FootLink></li>
              <li><FootLink to="/creer-un-compte">{c.signup}</FootLink></li>
            </ul>
            <ul>
              <li><FootLink to="/h/restaurant">{c.food}</FootLink></li>
              <li><FootLink to="/logement">{c.lodge}</FootLink></li>
              <li><FootLink to="/shopping">{c.shop}</FootLink></li>
              <li><FootLink to="/h/transport-bus">{c.bus}</FootLink></li>
              <li><FootLink to="/h/transport-colis">{c.parcel}</FootLink></li>
              <li><FootLink to="/formations">{c.learn}</FootLink></li>
              <li><FootLink to="/infos#about">{c.about}</FootLink></li>
            </ul>
          </div>
        </div>

        {/* Préférences : langue, pays/devise, thème */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Segmented label={c.language}>
            <SegBtn active={lang === "fr"} onClick={() => switchLanguage("fr")} label="Français"><Languages size={13} className="mr-1.5" aria-hidden="true" />FR</SegBtn>
            <SegBtn active={lang === "en"} onClick={() => switchLanguage("en")} label="English">EN</SegBtn>
          </Segmented>
          <label className="inline-flex items-center gap-2 rounded-full bg-latte-soft pl-3.5 pr-2.5 py-1.5">
            <span aria-hidden="true">{region.info.flag}</span>
            <span className="sr-only">{c.country}</span>
            <select value={region.country} onChange={(e) => region.setCountry(e.target.value)} className={`${selectCls} max-w-[9rem]`}>
              {REGION_LIST.map((r) => <option key={r.code} value={r.code}>{r.name[lang] || r.name.fr}</option>)}
            </select>
            <span className="text-ink/40" aria-hidden="true">·</span>
            <select value={region.currency} onChange={(e) => region.setCurrency(e.target.value)} aria-label={c.currency} className={selectCls}>
              {["ZMW", "USD", "CDF", "EUR", "ZAR", "GBP"].map((cu) => <option key={cu} value={cu}>{cu}</option>)}
            </select>
          </label>
          <Segmented label={c.theme}>
            <SegBtn active={mode === "light"} onClick={() => setMode("light")} label={c.light}><Sun size={13} /></SegBtn>
            <SegBtn active={mode === "dark"} onClick={() => setMode("dark")} label={c.dark}><Moon size={13} /></SegBtn>
          </Segmented>
        </div>

        {/* Bas : réseaux à gauche, mentions à droite */}
        <div className="mt-8 border-t border-line pt-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <ul className="flex items-center gap-4" aria-label={c.social}>
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}
                  className="block p-1 text-ink hover:text-coffee transition-colors focus-visible:outline-2 focus-visible:outline-coffee rounded">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d={ICONS[s.icon]} /></svg>
                </a>
              </li>
            ))}
          </ul>
          <div className="md:text-right text-[13px] text-ink/75">
            <div className="flex flex-wrap md:justify-end gap-x-6 gap-y-1">
              <Link to="/confidentialite" className="hover:underline underline-offset-4">{c.privacy}</Link>
              <Link to="/conditions" className="hover:underline underline-offset-4">{c.terms}</Link>
              <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex items-center gap-1 hover:underline underline-offset-4">
                <ArrowUp size={13} aria-hidden="true" /> {c.top}
              </button>
            </div>
            <p className="mt-3">© {new Date().getFullYear()} H-Company. {c.rights}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
