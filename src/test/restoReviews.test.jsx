import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "../context/LanguageContext.jsx";

const sub = (over = {}) => ({ code: "HS-AAAA1111", restaurant_name: "Chez A", status: "accepted", payment_status: "unpaid", fulfilment: "pickup", items: [{ line_id: 1, name: "Poulet", unit_price: 10, qty: 3, line_total: 30 }, { line_id: 2, name: "Frites", unit_price: 5, qty: 2, line_total: 10 }], total_known: 40, proposals: [], open_proposal: null, customer: { name: "Neph", phone: "+260971000111" }, ...over });
let current = { orders: [sub()] };
vi.mock("../lib/api.js", () => ({ api: { resto: { orders: vi.fn(), sellerOrders: vi.fn(), sellerStatus: vi.fn(), sellerPay: vi.fn(), sellerDecide: vi.fn(), sellerPropose: vi.fn(), sellerCancelProposal: vi.fn(), decideProposal: vi.fn(), reviewSub: vi.fn(), sellerReviews: vi.fn(), declarePay: vi.fn(), order: vi.fn(), cancelSub: vi.fn() } }, default: {} }));
vi.mock("../context/Usercontext.jsx", () => ({ useUser: () => ({ isAuthenticated: true, isLoading: false, withAuth: (f) => f("tk") }) }));
vi.mock("../context/ToastContext.jsx", () => ({ useToast: () => ({ success() {}, error() {} }) }));
vi.mock("../data/shop.js", async () => { const { useEffect, useState } = await import("react"); return { useShopMoney: () => ({ money: (n) => `K${n}` }), errMessage: () => "erreur", useLoad: (fn) => { const [d, setD] = useState(null); const load = () => fn().then(setD); useEffect(() => { load(); }, []); return { data: d, loading: !d, error: null, reload: load }; } }; });
vi.mock("../components/ui/HeadManager.jsx", () => ({ usePageMeta: () => {} }));
vi.mock("../components/restaurant/Shared.jsx", async () => {
  const React = await import("react"); const { RESTO_UI } = await import("../i18n/restoUi.js");
  const Pass = ({ children }) => React.createElement("div", null, children);
  return { default: Pass, RestoAuthGate: Pass, Card: Pass, EmptyState: ({ title }) => React.createElement("p", null, title), ErrorState: () => null, Spinner: () => null, inputCls: "", useRestoUi: () => RESTO_UI.fr };
});
import { OrderDetail } from "../pages/resto/MyOrders.jsx";
import SellerReviews from "../pages/resto/SellerReviews.jsx";
import RestaurantAdminPanel from "../components/admin/RestaurantAdminPanel.jsx";
import SellerOrders from "../pages/resto/SellerOrders.jsx";
import MyOrders from "../pages/resto/MyOrders.jsx";
import { api } from "../lib/api.js";
const wrap = (el) => render(<MemoryRouter><LanguageProvider>{el}</LanguageProvider></MemoryRouter>);

const open = (s) => { api.resto.order.mockImplementation(async () => ({ code: "HF-1", status: s.status, grand_total: 40, suborders: [s] })); return render(<MemoryRouter initialEntries={["/restaurant/commandes/HF-1"]}><LanguageProvider><Routes><Route path="/restaurant/commandes/:code" element={<OrderDetail />} /></Routes></LanguageProvider></MemoryRouter>); };

describe("avis E", () => {
  beforeEach(() => { vi.clearAllMocks(); api.resto.reviewSub.mockResolvedValue({}); });

  it("commande terminée : note obligatoire puis envoi (note + commentaire seulement)", async () => {
    open(sub({ status: "completed", review: null }));
    fireEvent.click(await screen.findByRole("button", { name: "Publier mon avis" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Choisissez une note.");
    expect(api.resto.reviewSub).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("radio", { name: "4 étoiles" }));
    fireEvent.change(screen.getByLabelText("Un commentaire (facultatif)"), { target: { value: "Délicieux" } });
    fireEvent.click(screen.getByRole("button", { name: "Publier mon avis" }));
    await waitFor(() => expect(api.resto.reviewSub).toHaveBeenCalledWith("tk", "HS-AAAA1111", { rating: 4, comment: "Délicieux" }));
  });

  it("commande non terminée : aucun formulaire d'avis", async () => {
    open(sub({ status: "accepted" }));
    await screen.findByText("Chez A");
    expect(screen.queryByRole("button", { name: "Publier mon avis" })).toBeNull();
  });

  it("avis déjà donné : affiché, pas de second formulaire ; masqué par la modération = indiqué", async () => {
    open(sub({ status: "completed", review: { rating: 5, comment: "Top", hidden: true } }));
    expect(await screen.findByText("Top")).toBeInTheDocument();
    expect(screen.getByText("Cet avis a été masqué par la modération.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publier mon avis" })).toBeNull();
  });

  it("vendeur : note moyenne par fiche, liste des avis, état vide", async () => {
    api.resto.sellerReviews.mockResolvedValue({ restaurants: [{ id: 1, name: "Chez A", rating_avg: 4.5, rating_count: 2 }, { id: 2, name: "Chez B", rating_avg: 0, rating_count: 0 }], reviews: [{ id: 1, restaurant_name: "Chez A", rating: 5, comment: "Super", author: "Neph" }] });
    wrap(<SellerReviews />);
    expect(await screen.findByText("Super")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("Pas encore noté")).toBeInTheDocument();
    api.resto.sellerReviews.mockResolvedValue({ restaurants: [], reviews: [] });
  });

  it("vendeur : état vide sans avis", async () => {
    api.resto.sellerReviews.mockResolvedValue({ restaurants: [{ id: 1, name: "Chez A", rating_avg: 0, rating_count: 0 }], reviews: [] });
    wrap(<SellerReviews />);
    expect(await screen.findByText(/Aucun avis pour le moment/)).toBeInTheDocument();
  });
});

describe("admin : commandes et modération", () => {
  it("affiche le résumé, les alertes et masque un avis avec motif", async () => {
    const adm = { overview: vi.fn().mockResolvedValue({ restaurants: { active: 1, pending: 0 }, reservations_30d: 0, covers_30d: 0, no_show_30d: 0, preorder_value_30d: 0 }), list: vi.fn().mockResolvedValue([]), ordersSummary: vi.fn().mockResolvedValue({ days: 30, by_status: { pending: 2, completed: 5 }, by_payment: { unpaid: 1, declared: 2, confirmed: 3 }, problems: { pending_over_48h: 1, payment_declared_over_48h: 0 } }), reviews: vi.fn().mockResolvedValue([{ id: 9, restaurant_name: "Chez A", rating: 1, comment: "Insultes", author: "X", hidden: false }]), moderateReview: vi.fn().mockResolvedValue({}) };
    render(<RestaurantAdminPanel withAuth={(f) => f("tk")} api={{ resto: { admin: adm } }} />);
    expect(await screen.findByText("Insultes")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1 commande(s) sans réponse");
    const btn = screen.getByRole("button", { name: "Masquer" });
    expect(btn).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Motif du masquage"), { target: { value: "Insultes" } });
    fireEvent.click(btn);
    await waitFor(() => expect(adm.moderateReview).toHaveBeenCalledWith("tk", 9, "hide", "Insultes"));
  });
});
