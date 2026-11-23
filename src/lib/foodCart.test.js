import { beforeEach, describe, expect, it } from "vitest";
import { CART_COOKIE, MAX_QTY, cartCount, decode, encode, foodCart, groupByVendor, toVendors } from "./foodCart.js";

const dish = (rid, iid, extra = {}) => ({ rid, iid, name: `P${iid}`, price: 10, vname: `V${rid}`, vslug: `v${rid}`, ...extra });
beforeEach(() => { document.cookie = `${CART_COOKIE}=; Max-Age=0; Path=/`; foodCart._reset(); });

describe("panier H-Restaurant", () => {
  it("ajoute, cumule et plafonne les quantités", () => {
    foodCart.add(dish(1, 11)); foodCart.add(dish(1, 11), 2);
    expect(foodCart.getState().lines).toHaveLength(1);
    expect(foodCart.getState().lines[0].qty).toBe(3);
    foodCart.add(dish(1, 11), 999);
    expect(foodCart.getState().lines[0].qty).toBe(MAX_QTY);
    expect(foodCart.add(dish(1, 12), 0)).toBe(false);
  });
  it("modifie, retire (quantité 0) et vide", () => {
    foodCart.add(dish(1, 11)); foodCart.add(dish(2, 21), 2);
    foodCart.setQty(21, 5); expect(cartCount(foodCart.getState())).toBe(6);
    foodCart.setQty(11, 0); expect(foodCart.getState().lines.map((l) => l.iid)).toEqual([21]);
    foodCart.clear(); expect(foodCart.getState().lines).toEqual([]);
  });
  it("groupe par vendeur sans mélanger les options de livraison", () => {
    foodCart.add(dish(1, 11)); foodCart.add(dish(2, 21)); foodCart.add(dish(1, 12));
    foodCart.setOpt(1, { fulfilment: "delivery", address: "12 Rue A", zone: "Roma" }); foodCart.setOpt(2, { fulfilment: "pickup" });
    expect(groupByVendor(foodCart.getState()).map((g) => [g.rid, g.lines.length])).toEqual([[1, 2], [2, 1]]);
    const v = toVendors(foodCart.getState());
    expect(v[0]).toMatchObject({ restaurant_id: 1, fulfilment: "delivery", address: "12 Rue A", zone: "Roma" });
    expect(v[1]).toMatchObject({ restaurant_id: 2, fulfilment: "pickup", address: "" });
    expect(JSON.stringify(v)).not.toMatch(/total/); // aucun total envoyé au serveur
    foodCart.clearVendor(1); expect(foodCart.getState().lines.map((l) => l.rid)).toEqual([2]); expect(foodCart.getState().opts[1]).toBeUndefined();
  });
  it("se retrouve via le cookie (ids et quantités seulement)", () => {
    foodCart.add(dish(3, 31, { image: "x.jpg" }), 2); foodCart.add(dish(4, 41));
    const raw = document.cookie.split("; ").find((c) => c.startsWith(`${CART_COOKIE}=`));
    expect(decodeURIComponent(raw.split("=")[1])).toBe("3.31.2~4.41.1");
    expect(raw).not.toMatch(/P31|x\.jpg|price/);
    foodCart._reset(); // simule un rechargement : mémoire vide, cookie conservé ? _reset ne touche pas le cookie
    document.cookie = `${CART_COOKIE}=${encodeURIComponent("3.31.2~4.41.1")}; Path=/`;
    foodCart.restore();
    expect(foodCart.getState().lines.map((l) => [l.rid, l.iid, l.qty])).toEqual([[3, 31, 2], [4, 41, 1]]);
  });
  it("décode défensivement un cookie altéré", () => {
    expect(decode("1.2.3~abc~..~9.9.0~1.2.4~5.6.999999999")).toEqual([{ rid: 1, iid: 2, qty: 3 }]);
    expect(decode("")).toEqual([]); expect(decode(null)).toEqual([]);
    expect(encode([{ rid: 1, iid: 2, qty: 3 }])).toBe("1.2.3");
  });
  it("enrichit noms et prix depuis le devis ; n'adopte les nouveaux prix que sur demande", () => {
    foodCart.add({ rid: 1, iid: 11 }, 2);
    const quote = { vendors: [{ restaurant_id: 1, name: "Chez A", slug: "chez-a", lines: [{ item_id: 11, name: "Poulet", unit_price: 30 }] }] };
    foodCart.enrich(quote);
    expect(foodCart.getState().lines[0]).toMatchObject({ name: "Poulet", vname: "Chez A", price: 30, qty: 2 });
    foodCart.enrich({ vendors: [{ ...quote.vendors[0], lines: [{ item_id: 11, name: "Poulet", unit_price: 35 }] }] });
    expect(foodCart.getState().lines[0].price).toBe(30); // prix vu conservé : le changement reste détectable
    foodCart.enrich({ vendors: [{ ...quote.vendors[0], lines: [{ item_id: 11, name: "Poulet", unit_price: 35 }] }] }, { acceptPrices: true });
    expect(foodCart.getState().lines[0].price).toBe(35);
  });
  it("clé d'idempotence stable tant que le panier ne change pas", () => {
    foodCart.add(dish(1, 11));
    const k1 = foodCart.checkoutKey();
    expect(k1).toMatch(/^[A-Za-z0-9_-]{8,64}$/); expect(foodCart.checkoutKey()).toBe(k1);
    foodCart.enrich({ vendors: [{ restaurant_id: 1, name: "V", slug: "v", lines: [{ item_id: 11, name: "N", unit_price: 10 }] }] });
    expect(foodCart.checkoutKey()).toBe(k1); // l'enrichissement n'est pas une modification du panier
    foodCart.setQty(11, 2);
    expect(foodCart.checkoutKey()).not.toBe(k1);
  });
});
