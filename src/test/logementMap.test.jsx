import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../context/LanguageContext.jsx";

const items = [
  { id: 1, slug: "kamwala-side", title: "Kamwala side", city: "Lusaka", area: "Kamwala", bedrooms: 2, price_per_night: 134, image: "x/broken.jpg", rating_count: 0 },
  { id: 2, slug: "sans-prix", title: "Sans prix", city: "Lusaka", area: "Roma", bedrooms: 1, price_per_night: 0, image: null, rating_count: 0 },
];
vi.mock("../lib/api.js", () => ({ api: { lodge: { search: vi.fn() } }, uploadUrl: (p) => (p ? `http://x/uploads/${p}` : null) }));
vi.mock("../context/Usercontext.jsx", () => ({ useUser: () => ({ token: "tk" }) }));
vi.mock("../data/shop.js", () => ({ useLoad: () => ({ data: { items }, loading: false }), useShopMoney: () => ({ money: (n) => `K ${n}` }) }));
vi.mock("../components/ui/HeadManager.jsx", () => ({ usePageMeta: () => {} }));
vi.mock("../components/app/CityMap.jsx", () => ({ default: ({ markers, onSelect }) => <div>{markers.map((m) => <button key={m.id} onClick={() => onSelect(m.id)}>{`pin ${m.label}`}</button>)}</div> }));
vi.mock("../components/lodge/Interior3D.jsx", () => ({ default: () => null }));
import LogementMap from "../pages/app/LogementMap.jsx";

const wrap = () => render(<MemoryRouter><LanguageProvider><LogementMap /></LanguageProvider></MemoryRouter>);

describe("Logements sur la carte", () => {
  it("tutoriel à l'entrée, carte seule (pas de liste à droite), fiche au clic sur un prix", () => {
    document.cookie = "hc_lang=fr; Path=/";
    wrap();
    expect(screen.getByRole("dialog", { name: "Comment ça marche" })).toBeInTheDocument();
    expect(screen.getByText("1. Touchez un prix sur la carte")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(screen.getByText("2. Découvrez le logement")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Passer" }));
    expect(screen.queryByRole("dialog", { name: "Comment ça marche" })).toBeNull();
    // aucune liste : ni titre de logement ni bouton de réservation avant le clic
    expect(screen.queryByText("Kamwala side")).toBeNull();
    expect(screen.queryByRole("link", { name: "Voir et réserver" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "pin K 134" }));
    expect(screen.getByText("Kamwala side")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voir et réserver" })).toHaveAttribute("href", "/logement/s/kamwala-side");
    expect(screen.getByRole("button", { name: "Visite 3D" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fermer la fiche" }));
    expect(screen.queryByText("Kamwala side")).toBeNull();
  });

  it("un logement sans prix s'affiche « Sur demande », jamais « K 0 »", () => {
    wrap();
    expect(screen.queryByText(/K 0/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "pin Sur demande" }));
    expect(screen.getByText("Sur demande")).toBeInTheDocument();
  });

  it("le tutoriel se rouvre avec « Comment ça marche ? »", () => {
    wrap();
    fireEvent.click(screen.getByRole("button", { name: /Comment ça marche \?/ }));
    expect(screen.getByRole("dialog", { name: "Comment ça marche" })).toBeInTheDocument();
  });
});
