import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../context/LanguageContext.jsx";
import { RESTO_UI } from "../i18n/restoUi.js";
import { foodCart } from "../lib/foodCart.js";

vi.mock("../lib/api.js", () => ({ api: { resto: { quote: vi.fn(), checkout: vi.fn() } }, default: {} }));
vi.mock("../context/Usercontext.jsx", () => ({ useUser: () => ({ isAuthenticated: true, isLoading: false, withAuth: (f) => f("tk"), user: { name: "Neph", phone: "+260971000111" } }) }));
vi.mock("../context/ToastContext.jsx", () => ({ useToast: () => ({ success() {}, error() {} }) }));
vi.mock("../data/shop.js", () => ({ useShopMoney: () => ({ money: (n) => `K${n}` }), useLoad: () => ({}), errMessage: () => "erreur" }));
vi.mock("../components/ui/HeadManager.jsx", () => ({ usePageMeta: () => {} }));
vi.mock("../components/restaurant/Shared.jsx", async () => {
  const React = await import("react");
  const { RESTO_UI } = await import("../i18n/restoUi.js");
  const Pass = ({ children }) => React.createElement("div", null, children);
  return { default: Pass, EmptyState: ({ title }) => React.createElement("p", null, title), Card: Pass, Field: ({ children, label }) => React.createElement("label", null, label, children), inputCls: "", useRestoUi: () => RESTO_UI.fr };
});
import RestoCart from "../pages/resto/RestoCart.jsx";
import { api } from "../lib/api.js";

const Q = (over = {}) => ({ ok: true, items_total: 10, fees_known_total: 0, fees_pending: false, grand_total: 10, vendors: [{ restaurant_id: 1, name: "Chez A", slug: "a", ok: true, issues: [], lines: [{ item_id: 5, name: "Poulet", qty: 1, unit_price: 10, line_total: 10, available: true }], items_total: 10, fulfilment: "pickup", fee: 0, fee_pending: false, offers_delivery: false, zones: [], total_known: 10, ...over }] });
const view = () => render(<MemoryRouter><LanguageProvider><RestoCart /></LanguageProvider></MemoryRouter>);

describe("panier multi-vendeurs", () => {
  beforeEach(() => { foodCart._reset(); vi.clearAllMocks(); });
  it("panier vide", () => { view(); expect(screen.getByText("Votre panier est vide.")).toBeInTheDocument(); });
  it("affiche le vendeur, le plat revalidé par le serveur et le total", async () => {
    foodCart.add({ rid: 1, iid: 5, price: 10 }, 1); foodCart.setOpt(1, { fulfilment: "pickup" });
    api.resto.quote.mockResolvedValue(Q());
    view();
    await waitFor(() => expect(screen.getByText("Poulet")).toBeInTheDocument());
    expect(screen.getByText("Chez A")).toBeInTheDocument();
    expect(api.resto.quote.mock.calls[0][0][0].lines[0]).toEqual({ item_id: 5, qty: 1, price: 10 });
  });
  it("plat indisponible : à retirer, commande bloquée", async () => {
    foodCart.add({ rid: 1, iid: 5 }, 1); foodCart.setOpt(1, { fulfilment: "pickup" });
    const q = Q({ ok: false, issues: [{ code: "item_unavailable", item_id: 5 }] }); q.vendors[0].lines[0].available = false;
    api.resto.quote.mockResolvedValue(q);
    view();
    await waitFor(() => expect(screen.getAllByText("Retirer").length).toBeGreaterThan(0));
    expect(await screen.findByRole("button", { name: /Passer la commande/ })).toBeDisabled();
  });
  it("changement de prix : bannière, commande bloquée jusqu'à acceptation", async () => {
    foodCart.add({ rid: 1, iid: 5, price: 8 }, 1); foodCart.setOpt(1, { fulfilment: "pickup" });
    api.resto.quote.mockResolvedValue(Q({ issues: [{ code: "price_changed", item_id: 5, name: "Poulet", old: 8, new: 10 }] }));
    view();
    await waitFor(() => expect(screen.getByText("Des prix ont changé")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Passer la commande/ })).toBeDisabled();
    fireEvent.click(screen.getByText("Accepter les nouveaux prix"));
    await waitFor(() => expect(screen.getByRole("button", { name: /Passer la commande/ })).not.toBeDisabled());
  });
  it("checkout : clé d'idempotence, panier vidé au succès", async () => {
    foodCart.add({ rid: 1, iid: 5, price: 10 }, 1); foodCart.setOpt(1, { fulfilment: "pickup" });
    api.resto.quote.mockResolvedValue(Q()); api.resto.checkout.mockResolvedValue({ code: "HF-ABC" });
    view();
    const btn = await screen.findByRole("button", { name: /Passer la commande/ });
    await waitFor(() => expect(btn).not.toBeDisabled());
    fireEvent.click(btn);
    await waitFor(() => expect(api.resto.checkout).toHaveBeenCalled());
    const [tk, body, key] = api.resto.checkout.mock.calls[0];
    expect(tk).toBe("tk"); expect(key).toMatch(/^[A-Za-z0-9_-]{8,64}$/); expect(body.vendors[0].lines[0]).toEqual({ item_id: 5, qty: 1, price: 10 }); expect(body).not.toHaveProperty("grand_total");
    await waitFor(() => expect(foodCart.getState().lines.length).toBe(0));
  });
});
