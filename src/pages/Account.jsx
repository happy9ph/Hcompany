import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Check, Globe2, Handshake, LayoutDashboard, LogOut, Pencil, ShieldCheck, Wallet } from "lucide-react";
import NavBar from "../components/layout/NavBar.jsx";
import Footer from "../components/layout/Footer.jsx";
import { displayName, initials } from "../components/app/AccountMenu.jsx";
import { MODULES } from "../components/dashboard/modules.js";
import { useUser } from "../context/Usercontext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { api } from "../lib/api.js";

const ROLE = { admin: ["Administrateur", "Admin"], agent: ["Agent", "Agent"], partner: ["Partenaire", "Partner"] };

/** « Gérer mon compte » : page autonome (hors dashboard partenaire), pour TOUT compte connecté.
 *  Profil, sécurité, mes activités, espaces professionnels, langue, déconnexion. */
export default function Account() {
  const { user, isAuthenticated, isLoading, withAuth, signOut } = useUser();
  const { lang, setLang, t } = useLanguage();
  const toast = useToast();
  const fr = lang !== "en";
  const L = (a, b) => (fr ? a : b);

  const [name, setName] = useState("");
  const [shownName, setShownName] = useState(null);
  const [editing, setEditing] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [partner, setPartner] = useState(null); // dossier partenaire s'il existe, sinon null
  const [pw, setPw] = useState({ cur: "", next: "", conf: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    // Un compte sans espace partenaire reçoit une erreur ici : c'est normal, on n'affiche simplement pas le bloc partenaire.
    withAuth((token) => api.partners.accountStatus(token)).then(setPartner).catch(() => setPartner(null));
  }, [isLoading, isAuthenticated, withAuth]);

  if (isLoading) return <div className="min-h-screen bg-cream" />;
  if (!isAuthenticated) return <Navigate to="/connexion" state={{ redirectTo: "/compte" }} replace />;

  const shown = { ...user, full_name: shownName ?? user?.full_name };
  const role = ROLE[user?.role];
  const isPartner = Boolean(partner) || user?.role === "partner";

  async function saveName(e) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setSavingName(true);
    try {
      const u = await withAuth((tk) => api.auth.updateMe(tk, name.trim()));
      setShownName(u.full_name);
      setEditing(false);
      toast.success(L("Nom mis à jour", "Name updated"));
    } catch {
      toast.error(L("Impossible de modifier le nom", "Could not update your name"));
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwError(null);
    if (pw.next !== pw.conf) return setPwError(t("settings.passwordMismatch"));
    setPwBusy(true);
    try {
      await withAuth((tk) => api.auth.changePassword(tk, pw.cur, pw.next));
      toast.success(t("settings.passwordUpdated"));
      setPw({ cur: "", next: "", conf: "" });
    } catch (err) {
      setPwError(err?.data?.detail || t("settings.passwordMismatch"));
    } finally {
      setPwBusy(false);
    }
  }

  const activity = [
    [L("Commandes H-Food", "H-Food orders"), "/restaurant/commandes"],
    [L("Réservations restaurant", "Restaurant bookings"), "/restaurant/mes-reservations"],
    [L("Commandes boutique", "Shop orders"), "/shopping/mes-commandes"],
    [L("Billets de transport", "Transport tickets"), "/transport/mes-billets"],
    [L("Mes colis", "My parcels"), "/transport/mes-colis"],
    [L("Mes séjours", "My stays"), "/logement/mes-sejours"],
    [L("Réservations tourisme", "Tourism bookings"), "/tourisme/mes-reservations"],
    [L("Mon bouquet H-Learning", "My H-Learning plan"), "/formations/mon-bouquet"],
  ];
  const field = "w-full border border-line rounded-xl px-3.5 py-2.5 text-sm bg-surface outline-none focus:border-coffee-light";
  const label = "block text-xs text-ink-faint uppercase tracking-wide mb-1.5";
  const card = "bg-surface border border-line rounded-2xl p-6";

  return (
    <div className="min-h-screen bg-cream">
      <NavBar />
      <main className="max-w-4xl mx-auto px-5 sm:px-6 pt-28 pb-20">
        <header className="flex items-center gap-4 mb-8">
          <span className="w-16 h-16 rounded-full bg-[#F4C9C0] text-[#7A2E22] text-lg font-semibold flex items-center justify-center shrink-0">{initials(shown)}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coffee mb-1">{L("Gérer mon compte", "Manage my account")}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl sm:text-3xl text-ink truncate">{displayName(shown) || L("Mon compte", "My account")}</h1>
              {role && <span className="rounded-full bg-[#F6E2A8] text-[#6B4E0C] text-[10px] font-semibold px-2 py-0.5">{fr ? role[0] : role[1]}</span>}
            </div>
            <p className="text-sm text-ink-soft truncate">{user?.email}</p>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-5">
          <section className={card} aria-labelledby="acc-profile">
            <h2 id="acc-profile" className="font-medium text-ink mb-4">{L("Mon profil", "My profile")}</h2>
            <p className={label}>{L("Nom complet", "Full name")}</p>
            {editing ? (
              <form onSubmit={saveName} className="flex gap-2">
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-label={L("Nom complet", "Full name")} className={field} />
                <button disabled={savingName || name.trim().length < 2} aria-label={L("Enregistrer", "Save")} className="w-11 shrink-0 rounded-xl bg-ink text-cream flex items-center justify-center disabled:opacity-40"><Check size={16} /></button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm text-ink">{displayName(shown) || "—"}</p>
                <button onClick={() => { setName(displayName(shown)); setEditing(true); }} aria-label={L("Modifier mon nom", "Edit my name")} className="w-8 h-8 rounded-lg hover:bg-latte-soft flex items-center justify-center text-ink-soft"><Pencil size={14} /></button>
              </div>
            )}
            <p className={`${label} mt-4`}>E-mail</p>
            <p className="text-sm text-ink break-all">{user?.email}</p>
            {partner?.phone && (<><p className={`${label} mt-4`}>{L("Téléphone", "Phone")}</p><p className="text-sm text-ink">{partner.phone}</p></>)}
            <div className="mt-6 pt-4 border-t border-line flex flex-wrap gap-2">
              <button onClick={() => setLang(fr ? "en" : "fr")} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-latte-soft/60"><Globe2 size={15} />{fr ? "English" : "Français"}</button>
              <button onClick={() => signOut()} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-[#9B2C2C] hover:bg-[#9B2C2C]/8"><LogOut size={15} />{L("Se déconnecter", "Sign out")}</button>
            </div>
          </section>

          <section className={card} aria-labelledby="acc-security">
            <h2 id="acc-security" className="font-medium text-ink mb-4 flex items-center gap-2"><ShieldCheck size={17} className="text-coffee" />{t("settings.passwordSection")}</h2>
            <form onSubmit={changePassword} className="space-y-3">
              <div><label htmlFor="acc-cur" className={label}>{t("settings.currentPassword")}</label><input id="acc-cur" type="password" required autoComplete="current-password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} className={field} /></div>
              <div><label htmlFor="acc-new" className={label}>{t("settings.newPassword")}</label><input id="acc-new" type="password" required minLength={8} autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className={field} /></div>
              <div><label htmlFor="acc-conf" className={label}>{t("settings.confirmPassword")}</label><input id="acc-conf" type="password" required minLength={8} autoComplete="new-password" value={pw.conf} onChange={(e) => setPw({ ...pw, conf: e.target.value })} className={field} /></div>
              {pwError && <p role="alert" className="text-sm text-red-600">{pwError}</p>}
              <button disabled={pwBusy} className="rounded-full bg-ink text-cream text-sm font-medium px-6 py-2.5 hover:bg-coffee-dark transition-colors disabled:opacity-60">{pwBusy ? t("settings.saving") : t("settings.save")}</button>
            </form>
          </section>
        </div>

        <section className={`${card} mt-5`} aria-labelledby="acc-activity">
          <h2 id="acc-activity" className="font-medium text-ink mb-4">{L("Mes activités", "My activity")}</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {activity.map(([l, to]) => (
              <li key={to}><Link to={to} className="flex items-center justify-between gap-2 rounded-xl border border-line px-4 py-3 text-sm text-ink hover:bg-latte-soft/60">{l}<ArrowRight size={14} className="text-ink-faint shrink-0" /></Link></li>
            ))}
            <li><Link to="/app/money" className="flex items-center justify-between gap-2 rounded-xl border border-line px-4 py-3 text-sm text-ink hover:bg-latte-soft/60"><span className="inline-flex items-center gap-2"><Wallet size={15} />H-Money</span><ArrowRight size={14} className="text-ink-faint shrink-0" /></Link></li>
          </ul>
        </section>

        <section className={`${card} mt-5`} aria-labelledby="acc-pro">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <h2 id="acc-pro" className="font-medium text-ink">{L("Espaces professionnels", "Professional spaces")}</h2>
              <p className="text-sm text-ink-soft mt-1 max-w-xl">{L("Gérez votre activité directement dans chaque service. Aucun dashboard partenaire n'est nécessaire.", "Manage your business directly inside each service. No partner dashboard required.")}</p>
            </div>
            {isPartner && (
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-latte-soft/60"><LayoutDashboard size={15} />{L("Dashboard partenaire", "Partner dashboard")}</Link>
            )}
          </div>
          <ul className="grid sm:grid-cols-2 gap-3">
            {MODULES.map((m) => {
              const c = fr ? m.fr : m.en;
              const Icon = m.icon;
              return (
                <li key={m.key}>
                  <Link to={m.route} className="group flex gap-3 h-full rounded-xl border border-line p-4 hover:bg-latte-soft/60">
                    <span className="w-10 h-10 rounded-xl bg-latte-soft text-coffee-dark flex items-center justify-center shrink-0"><Icon size={18} /></span>
                    <span className="min-w-0"><strong className="block text-sm font-semibold text-ink">{c.name}</strong><span className="block text-xs text-ink-soft leading-relaxed mt-0.5">{c.desc}</span></span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {!isPartner && !role && (
            <Link to="/infos#rejoindre" className="mt-4 flex items-center gap-3 rounded-xl bg-[#E3F0E5] text-[#1F4D2E] px-4 py-3 text-sm hover:bg-[#d7e9da]">
              <Handshake size={18} />
              <span><strong className="block font-semibold">{L("Devenir partenaire", "Become a partner")}</strong><span className="text-xs opacity-80">{L("Pour proposer vos services sur H-Company.", "To offer your services on H-Company.")}</span></span>
            </Link>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
