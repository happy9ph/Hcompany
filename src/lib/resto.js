export const CUISINES = ["zambian", "african", "congolese", "indian", "italian", "chinese", "grill", "seafood", "fastfood", "vegetarian", "cafe", "bakery", "international"];
export const DISH_TAGS = ["vegetarian", "vegan", "halal", "spicy", "gluten_free", "new", "signature"];
export const TABLE_SHAPES = ["round", "square", "rect"];
export const TABLE_ZONES = ["indoor", "terrace", "vip"];
export const RES_STATUSES = ["pending", "confirmed", "seated", "completed", "cancelled", "declined", "no_show"];
export const DAY_KEYS = [0, 1, 2, 3, 4, 5, 6]; // 0 = lundi

export function resTone(status) {
  if (["confirmed", "seated", "completed"].includes(status)) return "good";
  if (status === "pending") return "warn";
  return "bad";
}
export function restoTone(status) {
  if (status === "active") return "good";
  if (["pending", "paused", "draft"].includes(status)) return "warn";
  return "bad";
}
export const priceSigns = (n) => "$".repeat(Math.max(1, Math.min(3, n || 1)));

/** Date locale (Lusaka) au format AAAA-MM-JJ. */
export function isoToday(offset = 0) {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** 0 = lundi … 6 = dimanche */
export function weekday(iso) { const [y, m, d] = iso.split("-").map(Number); return (new Date(y, m - 1, d).getDay() + 6) % 7; }
export function fmtDay(iso, lang = "fr") {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", { weekday: "short", day: "numeric", month: "short" });
}
/** Heure de départ valide minimale pour aujourd'hui (créneaux déjà passés exclus côté client). */
export function slotPassed(day, time) {
  if (day !== isoToday()) return false;
  const now = new Date(); return time <= `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}
export function preorderTotal(lines, menuIndex) {
  return lines.reduce((s, l) => s + (menuIndex[l.item_id]?.price || 0) * l.qty, 0);
}
export function indexMenu(menu) {
  const out = {};
  (menu || []).forEach((c) => c.items.forEach((i) => { out[i.id] = i; }));
  return out;
}
/** Place la table sur la grille de 0,5 m dans la salle. */
export function snap(v, step = 0.5) { return Math.round(v / step) * step; }
export function nextLabel(tables) {
  const nums = tables.map((t) => parseInt(String(t.label).replace(/\D/g, ""), 10)).filter(Number.isFinite);
  return `T${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

/* ───────────────────────────── A2 : vendeurs individuels, livraison, contact direct ───────────────────────────── */
export const SELLER_TYPES = ["restaurant", "individual"];
export const isIndividual = (r) => (r?.seller_type || "restaurant") === "individual";
/** Onglets de l'espace pro : un vendeur individuel n'a ni réservations ni salle. */
export const proTabs = (r) => (isIndividual(r) ? ["overview", "menu", "info"] : ["overview", "reservations", "menu", "room", "info"]);
/** Chiffres seulement (wa.me n'accepte ni « + » ni espaces). */
export const waDigits = (v) => String(v || "").replace(/\D/g, "");
export const waLink = (number, text) => { const d = waDigits(number); return d ? `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}` : null; };
export const telLink = (v) => { const t = String(v || "").replace(/[^\d+]/g, ""); return t ? `tel:${t}` : null; };
/** Frais de livraison : null = à convenir · 0 = gratuite · n = montant. */
export function feeKind(d) { if (!d?.offers) return "none"; if (d.fee == null) return "tbd"; return Number(d.fee) === 0 ? "free" : "amount"; }
/** Peut-on réserver ? (le serveur reste l'autorité : 409 sinon) */
export const canReserve = (r) => !!r && r.accepts_reservations === true;
/** Catégories (et plats) filtrés par une recherche texte ; une catégorie sans résultat disparaît. */
export function filterMenu(menu, q) {
  const s = String(q || "").trim().toLowerCase();
  if (!s) return menu || [];
  return (menu || []).map((c) => ({ ...c, items: c.items.filter((i) => `${i.name} ${i.description || ""}`.toLowerCase().includes(s)) })).filter((c) => c.items.length);
}
export const menuAnchor = (c, i) => `cat-${c.id ?? `x${i}`}`;
/** Titre / compteur de la recherche selon le filtre de type. */
export const searchKind = (type) => (type === "individual" ? "individual" : type === "restaurant" ? "restaurant" : "mixed");
