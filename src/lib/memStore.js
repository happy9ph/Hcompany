// Aucun localStorage / sessionStorage dans H-Company : rien de sensible ne reste dans le navigateur.
// - mem : mémoire de l'onglet (perdue au rechargement) — jeton de session, confirmation admin, préférences d'interface, panier.
// - cookie : uniquement pour des préférences non sensibles (langue, thème, pays), SameSite=Lax, 1 an.
const m = new Map();
export const mem = {
  get: (k, d = null) => (m.has(k) ? m.get(k) : d),
  set: (k, v) => { m.set(k, v); },
  del: (k) => { m.delete(k); },
  clear: () => m.clear(),
};

export const cookie = {
  get(name) {
    if (typeof document === "undefined") return null;
    const hit = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
    if (!hit) return null;
    try { return decodeURIComponent(hit.slice(name.length + 1)); } catch { return null; }
  },
  set(name, value, days = 365) {
    if (typeof document === "undefined") return;
    const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${days * 86400}; Path=/; SameSite=Lax${secure}`;
  },
};
