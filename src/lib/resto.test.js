import { describe, expect, it } from "vitest";
import { canReserve, feeKind, filterMenu, isIndividual, indexMenu, menuAnchor, nextLabel, proTabs, searchKind, telLink, waDigits, waLink, preorderTotal, priceSigns, resTone, restoTone, snap, weekday } from "./resto.js";
import { tableSize } from "../three/models/dining.js";

describe("resto helpers", () => {
  it("weekday: lundi = 0", () => { expect(weekday("2026-10-26")).toBe(0); expect(weekday("2026-11-01")).toBe(6); });
  it("snap à 0,5 m", () => { expect(snap(3.26)).toBe(3.5); expect(snap(3.2)).toBe(3); });
  it("nextLabel", () => { expect(nextLabel([])).toBe("T1"); expect(nextLabel([{ label: "T3" }, { label: "T9" }])).toBe("T10"); });
  it("pré-commande", () => {
    const idx = indexMenu([{ items: [{ id: 1, price: 50 }, { id: 2, price: 20 }] }]);
    expect(preorderTotal([{ item_id: 1, qty: 2 }, { item_id: 2, qty: 1 }], idx)).toBe(120);
  });
  it("tons et signes", () => { expect(resTone("pending")).toBe("warn"); expect(resTone("declined")).toBe("bad"); expect(restoTone("active")).toBe("good"); expect(priceSigns(9)).toBe("$$$"); });
  it("taille de table croît avec les places", () => {
    expect(tableSize({ shape: "round", seats: 8 }).w).toBeGreaterThan(tableSize({ shape: "round", seats: 2 }).w);
    expect(tableSize({ shape: "rect", seats: 8 }).w).toBeGreaterThan(tableSize({ shape: "rect", seats: 2 }).w);
  });
});

describe("resto A2 : vendeur individuel, livraison, contact", () => {
  it("type de vendeur et onglets", () => {
    expect(isIndividual({ seller_type: "individual" })).toBe(true);
    expect(isIndividual({})).toBe(false);
    expect(proTabs({ seller_type: "individual" })).toEqual(["overview", "menu", "info"]);
    expect(proTabs({ seller_type: "restaurant" })).toContain("room");
  });
  it("WhatsApp : chiffres seulement, message encodé ; appel : tel:", () => {
    expect(waDigits("+260 97-123 4567")).toBe("260971234567");
    expect(waLink("+260 971 234 567", "Bonjour « Chez Mado »")).toBe("https://wa.me/260971234567?text=Bonjour%20%C2%AB%20Chez%20Mado%20%C2%BB");
    expect(waLink("", "x")).toBeNull();
    expect(telLink("+260 971 234 567")).toBe("tel:+260971234567");
    expect(telLink(null)).toBeNull();
  });
  it("frais de livraison : null = à convenir, 0 = gratuite", () => {
    expect(feeKind({ offers: false, fee: 5 })).toBe("none");
    expect(feeKind({ offers: true, fee: null })).toBe("tbd");
    expect(feeKind({ offers: true, fee: 0 })).toBe("free");
    expect(feeKind({ offers: true, fee: 25 })).toBe("amount");
  });
  it("réservable seulement si le serveur le dit", () => {
    expect(canReserve({ accepts_reservations: true })).toBe(true);
    expect(canReserve({ accepts_reservations: false })).toBe(false);
    expect(canReserve({})).toBe(false);
  });
  it("filtre du catalogue : plats indisponibles conservés, catégories vides retirées", () => {
    const menu = [{ id: 1, name: "A", items: [{ id: 1, name: "Pizza", is_available: false }, { id: 2, name: "Salade", description: "fraîche" }] }, { id: 2, name: "B", items: [{ id: 3, name: "Jus" }] }];
    expect(filterMenu(menu, "")).toBe(menu);
    expect(filterMenu(menu, "pizz")[0].items[0].is_available).toBe(false);
    expect(filterMenu(menu, "FRAÎCHE").map((c) => c.id)).toEqual([1]);
    expect(filterMenu(menu, "zzz")).toEqual([]);
    expect(menuAnchor({ id: null }, 2)).toBe("cat-x2");
  });
  it("type de recherche", () => { expect(searchKind("individual")).toBe("individual"); expect(searchKind("")).toBe("mixed"); expect(searchKind("restaurant")).toBe("restaurant"); });
});

