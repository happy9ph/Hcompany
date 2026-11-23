import { foodCart } from "../lib/foodCart.js";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../context/LanguageContext.jsx";
import StoreFront from "../components/restaurant/StoreFront.jsx";
import { ContactBar, DeliveryBlock, feeLabel } from "../components/restaurant/SellerInfo.jsx";
import { RESTO_UI } from "../i18n/restoUi.js";

beforeAll(() => {
  document.cookie = "hc_lang=fr; Path=/";
  globalThis.IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
  Element.prototype.scrollIntoView = vi.fn();
});

const money = (n) => `K${n}`;
const base = {
  id: 1, name: "Chez Mado", summary: "s", description: "", cuisines: ["grill"], city: "Lusaka", area: "Kabulonga", address: "", phone: "+260 971 000 111", whatsapp: "+260 971 000 222",
  images: [], rating_avg: 0, rating_count: 0, price_level: 2, open_time: "11:00", close_time: "22:00", closed_days: [], instant_confirm: false, has_terrace: false, accepts_preorder: false,
  delivery: { offers: true, zones: ["Roma", "Woodlands"], fee: 0, fee_note: "Selon la distance", terms: "Le jour même", sale_notes: "Commande 24 h avant", payment: "manual" },
  menu: [
    { id: 10, name: "Grillades", items: [{ id: 1, name: "Poulet braisé", price: 80, description: "Au charbon", tags: [], is_available: true }, { id: 2, name: "Capitaine", price: 120, description: "", tags: [], is_available: false }] },
    { id: 11, name: "Épuisé", items: [{ id: 3, name: "Mandazi", price: 10, description: "", tags: [], is_available: false }] },
  ],
};
const wrap = (ui) => render(<MemoryRouter><LanguageProvider>{ui}</LanguageProvider></MemoryRouter>);

describe("vitrine boutique (façon Uber Eats)", () => {
  it("vendeur individuel : contact direct, panier disponible, jamais de réservation", () => {
    wrap(<StoreFront r={{ ...base, seller_type: "individual" }} money={money} showReserve={false} onReserve={() => {}} />);
    expect(screen.getByText("Vendeur individuel")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /WhatsApp/ }).getAttribute("href")).toMatch(/^https:\/\/wa\.me\/260971000222\?text=/);
    expect(screen.getByRole("link", { name: /Appeler/ }).getAttribute("href")).toBe("tel:+260971000111");
    expect(screen.queryByText(/Réserver une table/)).toBeNull();
    expect(screen.getAllByRole("button", { name: /Ajouter au panier/ }).length).toBeGreaterThan(0);
    expect(screen.getByText("Livraison gratuite")).toBeInTheDocument();
  });

  it("plats indisponibles : badge « Indisponible », image atténuée, pas de « + » ; catégorie 100 % indisponible conservée", () => {
    wrap(<StoreFront r={{ ...base, seller_type: "restaurant", accepts_preorder: true }} money={money} showReserve onReserve={() => {}} />);
    const off = document.querySelector('[data-dish="2"]');
    expect(off.getAttribute("data-available")).toBe("no");
    expect(within(off).getAllByText("Indisponible").length).toBeGreaterThan(0);
    expect(within(off).queryByRole("button")).toBeNull();
    const on = document.querySelector('[data-dish="1"]');
    expect(on.getAttribute("data-available")).toBe("yes");
    expect(within(on).queryByText("Indisponible")).toBeNull();
    expect(within(on).getByRole("button", { name: /Ajouter au panier · Poulet braisé/ })).toBeInTheDocument();
    const allOff = document.querySelector('[data-dish="3"]');
    expect(allOff).not.toBeNull();
    expect(within(allOff).queryByRole("button")).toBeNull();
    expect(screen.getAllByRole("link", { name: "Épuisé" }).length).toBeGreaterThan(0); // reste consultable dans la navigation
    expect(screen.getByRole("button", { name: /Réserver une table/ })).toBeInTheDocument();
  });

  it("stepper à la place du « + » quand la quantité > 0 ; recherche dans la boutique", () => {
    foodCart._reset(); foodCart.add({ rid: base.id, iid: 1, name: "Poulet braisé", price: 1 }, 2);
    wrap(<StoreFront r={{ ...base, seller_type: "restaurant", accepts_preorder: true }} money={money} showReserve={false} onReserve={() => {}} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Augmenter" })[0]);
    expect(foodCart.getState().lines.find((l) => l.iid === 1).qty).toBe(3);
    foodCart._reset();
    fireEvent.change(screen.getByPlaceholderText("Rechercher dans Chez Mado"), { target: { value: "zzz" } });
    expect(screen.getByRole("status")).toHaveTextContent("Aucun plat ne correspond");
    fireEvent.change(screen.getByPlaceholderText("Rechercher dans Chez Mado"), { target: { value: "capit" } });
    expect(document.querySelector('[data-dish="2"]')).not.toBeNull();
    expect(document.querySelector('[data-dish="1"]')).toBeNull();
  });

  it("barre de contact mobile : WhatsApp et Appeler ; « Réserver » seulement si réservable", () => {
    const { rerender } = wrap(<ContactBar r={{ ...base, seller_type: "individual" }} showReserve={false} onReserve={() => {}} />);
    const bar = document.querySelector("[data-contact-bar]");
    expect(within(bar).getByText("WhatsApp")).toBeInTheDocument();
    expect(within(bar).getByText("Appeler")).toBeInTheDocument();
    expect(within(bar).queryByText(/Réserver/)).toBeNull();
    rerender(<MemoryRouter><LanguageProvider><ContactBar r={base} showReserve onReserve={() => {}} /></LanguageProvider></MemoryRouter>);
    expect(within(document.querySelector("[data-contact-bar]")).getByText(/Réserver une table/)).toBeInTheDocument();
  });

  it("livraison : texte « HFood ne livre pas et n'encaisse pas », frais à convenir / gratuits", () => {
    wrap(<DeliveryBlock r={base} money={money} />);
    expect(screen.getByText(/HFood ne livre pas et n'encaisse pas/)).toBeInTheDocument();
    expect(screen.getByText("Roma, Woodlands")).toBeInTheDocument();
    const t = RESTO_UI.fr.page;
    expect(feeLabel({ offers: true, fee: null }, money, t)).toBe("Frais de livraison à convenir");
    expect(feeLabel({ offers: true, fee: 0 }, money, t)).toBe("Livraison gratuite");
    expect(feeLabel({ offers: true, fee: 25 }, money, t)).toBe("K25 de frais de livraison");
    expect(feeLabel({ offers: false }, money, t, true)).toBe("Pas de livraison");
  });
});

describe("textes H-Restaurant FR/EN", () => {
  const keys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (typeof v === "function" ? [p + k + "()"] : v && typeof v === "object" && !Array.isArray(v) ? keys(v, p + k + ".") : [p + k]));
  it("mêmes clés en français et en anglais", () => {
    const fr = keys(RESTO_UI.fr), en = new Set(keys(RESTO_UI.en));
    expect(fr.filter((k) => !en.has(k))).toEqual([]);
    expect([...en].filter((k) => !new Set(fr).has(k))).toEqual([]);
  });
  it("vendeur individuel : jamais « restaurant » ni « réserver » dans ses textes de statut et de création", () => {
    const p = RESTO_UI.fr.pro;
    const blob = JSON.stringify([p.by.individual, p.statusHintBy.individual, p.tabsBy.individual, p.checklistBy.individual]).toLowerCase();
    expect(blob).not.toMatch(/restaurant|réserv/);
    const en = JSON.stringify([RESTO_UI.en.pro.by.individual, RESTO_UI.en.pro.statusHintBy.individual]).toLowerCase();
    expect(en).not.toMatch(/restaurant|booking|bookable/);
  });
});
