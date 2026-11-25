import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../context/LanguageContext.jsx";
import { foodCart } from "../lib/foodCart.js";

const DATA = { total: 3, truncated: false, categories: ["Chef", "Fast Food"], cities: ["Lusaka"],
  restaurants: [{ id: 1, slug: "mado", name: "Chez Mado", city: "Lusaka", area: "Roma", image: null, rating_avg: 0, rating_count: 0, offers_delivery: true, delivery_fee: 15, lat: -15.4, lng: 28.3, dish_count: 2 }, { id: 2, slug: "bob", name: "Bob Food", city: "Lusaka", area: "", image: null, rating_avg: 0, rating_count: 0, offers_delivery: false, delivery_fee: null, lat: null, lng: null, dish_count: 1 }],
  dishes: [{ id: 10, name: "Poulet mayo", description: "fry chicken, mayo", price: 100, image: null, tags: ["spicy"], category: "Chef", restaurant_id: 1 }, { id: 11, name: "Kimbrekete", description: "", price: 100, image: null, tags: [], category: "Fast Food", restaurant_id: 2 }, { id: 12, name: "Soupe", description: "", price: 30, image: null, tags: [], category: "", restaurant_id: 1 }] };
vi.mock("../lib/api.js", () => ({ api: { resto: { dishes: vi.fn() } }, default: {} }));
vi.mock("../data/shop.js", () => ({ useShopMoney: () => ({ money: (n) => `K${n}` }) }));
vi.mock("../components/ui/HeadManager.jsx", () => ({ usePageMeta: () => {} }));
vi.mock("../components/app/MapView.jsx", () => ({ default: ({ markers, onSelect }) => <div data-testid="map">{markers.map((m) => <button key={m.id} onClick={() => onSelect(m.id)}>pin-{m.label}</button>)}</div> }));
vi.mock("../components/restaurant/Shared.jsx", async () => {
  const React = await import("react"); const { RESTO_UI } = await import("../i18n/restoUi.js");
  const Pass = ({ children }) => React.createElement("div", null, children);
  return { default: Pass, EmptyState: ({ title }) => React.createElement("p", null, title), ErrorState: () => React.createElement("p", null, "err"), Spinner: () => null, RestoImage: () => null, Rating: () => null, inputCls: "", useRestoUi: () => RESTO_UI.fr };
});
import RestoDishes from "../pages/resto/RestoDishes.jsx";
import { api } from "../lib/api.js";
const view = (url = "/restaurant/plats") => render(<MemoryRouter initialEntries={[url]}><LanguageProvider><RestoDishes /></LanguageProvider></MemoryRouter>);

describe("page plats H-Food", () => {
  beforeEach(() => { foodCart._reset(); vi.clearAllMocks(); api.resto.dishes.mockResolvedValue(DATA); });
  it("catalogue groupé par catégorie, avec catégories à gauche et le vendeur sur chaque plat", async () => {
    view();
    expect(await screen.findByText("Poulet mayo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chef" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fast Food" })).toBeInTheDocument();
    expect(screen.getAllByText(/Chez Mado/, { selector: "span" }).length).toBe(2);
    expect(screen.getByRole("navigation", { name: "Catalogue" })).toBeInTheDocument();
  });
  it("clic sur un plat : la fiche s'ouvre, on règle la quantité et on ajoute au panier (total affiché)", async () => {
    view();
    fireEvent.click(await screen.findByText("Poulet mayo"));
    const dlg = await screen.findByRole("dialog", { name: "Poulet mayo" });
    expect(dlg).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Augmenter"));
    expect(screen.getByText("K200")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Ajouter au panier/ }));
    expect(foodCart.getState().lines.find((l) => l.iid === 10).qty).toBe(2);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("Échap ferme la fiche", async () => {
    view();
    fireEvent.click((await screen.findAllByText("Kimbrekete")).at(-1));
    await screen.findByRole("dialog");
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
  it("carte : un clic sur un vendeur ouvre son aperçu et filtre ses plats", async () => {
    view();
    fireEvent.click(await screen.findByText("pin-Bob Food"));
    fireEvent.click(screen.getByText("Voir ses plats"));
    await waitFor(() => expect(screen.queryByText("Poulet mayo")).toBeNull());
    expect(screen.getAllByText("Kimbrekete").length).toBeGreaterThan(0);
  });
  it("lien direct ?plat= ouvre la fiche", async () => {
    view("/restaurant/plats?plat=11");
    expect(await screen.findByRole("dialog", { name: "Kimbrekete" })).toBeInTheDocument();
  });
  it("« Près de moi » : distance affichée sur les plats, position sur la carte ; refus de la localisation expliqué", async () => {
    Object.defineProperty(globalThis.navigator, "geolocation", { configurable: true, value: { getCurrentPosition: (ok) => ok({ coords: { latitude: -15.41, longitude: 28.29, accuracy: 15 } }) } });
    view();
    fireEvent.click(await screen.findByRole("button", { name: "Près de moi" }));
    expect(await screen.findByRole("button", { name: "Triés par distance" })).toBeInTheDocument();
    expect(screen.getAllByText(/· (à|≈) /).length).toBeGreaterThan(0);
    expect(screen.getByText("pin-● Vous êtes ici")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Triés par distance" }));
    await screen.findByRole("button", { name: "Près de moi" });
    Object.defineProperty(globalThis.navigator, "geolocation", { configurable: true, value: { getCurrentPosition: (_, ko) => ko({ code: 1 }) } });
    fireEvent.click(screen.getByRole("button", { name: "Près de moi" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Localisation refusée");
  });
  it("aucun résultat : message et réinitialisation", async () => {
    api.resto.dishes.mockResolvedValue({ ...DATA, dishes: [], restaurants: [], total: 0, categories: [] });
    view("/restaurant/plats?q=zzz");
    expect(await screen.findByText("Aucun plat ne correspond.")).toBeInTheDocument();
  });
});
