// Panier H-Restaurant (multi-vendeurs). Aucun localStorage : l'état vit en mémoire et un cookie fonctionnel `hc_cart`
// (identifiants + quantités uniquement, 7 jours, SameSite=Lax) permet de retrouver le panier au retour. Noms et prix ne
// sont jamais persistés : ils sont revalidés par le serveur (/cart/quote), qui reste l'autorité sur tous les montants.
import { useSyncExternalStore } from "react";
import { cookie } from "./memStore.js";

export const CART_COOKIE = "hc_cart";
export const MAX_LINES = 60;
export const MAX_QTY = 50;
const DAYS = 7;

const empty = () => ({ lines: [], opts: {} });
let state = empty();
let checkoutKey = null;
const listeners = new Set();

const clampQty = (q) => Math.max(0, Math.min(MAX_QTY, Math.floor(Number(q) || 0)));

export function encode(lines) { return lines.map((l) => `${l.rid}.${l.iid}.${l.qty}`).join("~"); }
export function decode(raw) {
  if (!raw) return [];
  const out = [], seen = new Set();
  for (const part of String(raw).split("~")) {
    const m = /^(\d{1,9})\.(\d{1,9})\.(\d{1,3})$/.exec(part);
    if (!m) continue;
    const [rid, iid, qty] = [Number(m[1]), Number(m[2]), clampQty(m[3])];
    if (qty < 1 || seen.has(iid)) continue;
    seen.add(iid);
    out.push({ rid, iid, qty });
    if (out.length >= MAX_LINES) break;
  }
  return out;
}

function persist() { cookie.set(CART_COOKIE, encode(state.lines), DAYS); }
function commit(next, { resetKey = true } = {}) {
  state = next;
  if (resetKey) checkoutKey = null; // tout changement du panier invalide la clé d'idempotence en cours
  persist();
  listeners.forEach((l) => l());
}

export const foodCart = {
  getState: () => state,
  subscribe: (l) => { listeners.add(l); return () => listeners.delete(l); },
  /** Recharge depuis le cookie (retour sur le site). N'écrase pas un panier déjà en mémoire. */
  restore() {
    if (state.lines.length) return;
    const lines = decode(cookie.get(CART_COOKIE));
    if (lines.length) { state = { ...state, lines }; listeners.forEach((l) => l()); }
  },
  add(item, qty = 1) { // item : {rid, iid, name?, price?, vname?, vslug?, image?}
    const q = clampQty(qty);
    if (!q || !item?.iid || !item?.rid) return false;
    const i = state.lines.findIndex((l) => l.iid === item.iid);
    if (i < 0 && state.lines.length >= MAX_LINES) return false;
    const lines = state.lines.slice();
    if (i >= 0) lines[i] = { ...lines[i], ...item, qty: clampQty(lines[i].qty + q) };
    else lines.push({ ...item, qty: q });
    commit({ ...state, lines });
    return true;
  },
  setQty(iid, qty) {
    const q = clampQty(qty);
    commit({ ...state, lines: q ? state.lines.map((l) => (l.iid === iid ? { ...l, qty: q } : l)) : state.lines.filter((l) => l.iid !== iid) });
  },
  remove(iid) { commit({ ...state, lines: state.lines.filter((l) => l.iid !== iid) }); },
  clearVendor(rid) { const { [rid]: _o, ...opts } = state.opts; commit({ lines: state.lines.filter((l) => l.rid !== rid), opts }); },
  clear() { commit(empty()); },
  setOpt(rid, patch) { commit({ ...state, opts: { ...state.opts, [rid]: { ...(state.opts[rid] || {}), ...patch } } }); },
  /** Complète noms/prix/vendeurs depuis le devis serveur (sans toucher aux quantités ; `acceptPrices` = adopter les nouveaux prix). */
  enrich(quote, { acceptPrices = false } = {}) {
    let changed = false;
    const lines = state.lines.map((l) => {
      const v = (quote?.vendors || []).find((x) => x.restaurant_id === l.rid);
      const q = v?.lines?.find((x) => x.item_id === l.iid);
      if (!v || !q || !q.name) return l;
      const patch = { name: q.name, vname: v.name, vslug: v.slug, image: q.image || l.image };
      if (l.price == null || acceptPrices) patch.price = q.unit_price;
      if (Object.keys(patch).some((k) => l[k] !== patch[k])) { changed = true; return { ...l, ...patch }; }
      return l;
    });
    if (changed) commit({ ...state, lines }, { resetKey: false });
  },
  /** Clé d'idempotence du checkout en cours : stable tant que le panier ne change pas (un nouvel essai réutilise la même clé). */
  checkoutKey() {
    if (!checkoutKey) checkoutKey = (globalThis.crypto?.randomUUID?.() || `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`).replace(/[^A-Za-z0-9_-]/g, "");
    return checkoutKey;
  },
  _reset() { state = empty(); checkoutKey = null; listeners.forEach((l) => l()); },
};

export const cartCount = (s) => s.lines.reduce((n, l) => n + l.qty, 0);
export const groupByVendor = (s) => {
  const order = [], by = {};
  for (const l of s.lines) { if (!by[l.rid]) { by[l.rid] = { rid: l.rid, name: l.vname || "", slug: l.vslug || "", lines: [] }; order.push(l.rid); } by[l.rid].lines.push(l); }
  return order.map((r) => by[r]);
};
/** Corps de /cart/quote et /orders/checkout : identifiants, quantités et prix vus ; jamais de total. */
export const toVendors = (s) => groupByVendor(s).map((g) => {
  const o = s.opts[g.rid] || {};
  return { restaurant_id: g.rid, fulfilment: o.fulfilment || null, address: o.address || "", zone: o.zone || "", note: o.note || "", lines: g.lines.map((l) => ({ item_id: l.iid, qty: l.qty, ...(l.price != null ? { price: l.price } : {}) })) };
});

export function useFoodCart() {
  return useSyncExternalStore(foodCart.subscribe, foodCart.getState, foodCart.getState);
}
