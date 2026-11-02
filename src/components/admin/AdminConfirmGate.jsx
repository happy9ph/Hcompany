import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { api, getAdminConfirm, setAdminConfirm, clearAdminConfirm } from "../../lib/api.js";
import { useUser } from "../../context/Usercontext.jsx";

/** Verrou de l'espace admin : mot de passe à saisir avant de voir chiffres et réglages (valable 10 minutes).
 *  Les panneaux ne sont montés qu'une fois déverrouillé ; si le jeton expire, un 428 du serveur reverrouille. */
export default function AdminConfirmGate({ children }) {
  const { user, withAuth, signOut } = useUser();
  const [unlocked, setUnlocked] = useState(() => Boolean(getAdminConfirm()));
  const [epoch, setEpoch] = useState(0);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const lock = () => setUnlocked(false);
    window.addEventListener("hc:admin-confirm-required", lock);
    // reverrouille à l'expiration du jeton, même sans appel serveur
    const id = setInterval(() => { if (!getAdminConfirm()) setUnlocked(false); }, 15000);
    return () => { window.removeEventListener("hc:admin-confirm-required", lock); clearInterval(id); };
  }, []);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const r = await withAuth((t) => api.adminSecurity.confirm(t, pw));
      setAdminConfirm(r.confirm_token, r.expires_in);
      setPw(""); setUnlocked(true); setEpoch((n) => n + 1);
    } catch (x) { setErr(x?.status === 429 ? "Trop de tentatives. Patientez quelques minutes." : x?.data?.detail || "Mot de passe incorrect."); } finally { setBusy(false); }
  }

  return (
    <>
      {unlocked && <div key={epoch}>{children}</div>}
      {!unlocked && (
        <div className="min-h-screen bg-ink-fixed flex items-center justify-center px-5" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-cream p-7 shadow-2xl">
            <span className="w-12 h-12 rounded-2xl bg-ink text-[#C89A3D] flex items-center justify-center"><Lock size={21} /></span>
            <h1 id="gate-title" className="font-display text-2xl text-ink mt-5">Zone protégée</h1>
            <p className="text-sm text-ink-soft mt-2">Confirmez votre mot de passe{user?.email ? ` (${user.email})` : ""} pour voir les chiffres et réglages. L'accès reste ouvert 10 minutes.</p>
            <input type="password" required autoFocus autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="Mot de passe" className="mt-5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm focus:outline-none focus:border-coffee focus:ring-2 focus:ring-coffee/15" />
            {err && <p role="alert" className="text-sm text-red-600 mt-2">{err}</p>}
            <button disabled={busy} className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-cream text-sm font-medium py-3.5 hover:bg-coffee-dark disabled:opacity-60">{busy && <Loader2 size={15} className="animate-spin" />}Déverrouiller</button>
            <button type="button" onClick={() => { clearAdminConfirm(); signOut(); }} className="mt-3 w-full text-center text-xs text-ink-faint hover:text-ink">Se déconnecter</button>
          </form>
        </div>
      )}
    </>
  );
}
