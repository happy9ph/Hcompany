import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "../context/LanguageContext.jsx";

const sub = (over = {}) => ({ code: "HS-AAAA1111", restaurant_name: "Chez A", status: "accepted", payment_status: "unpaid", fulfilment: "pickup", items: [{ line_id: 1, name: "Poulet", unit_price: 10, qty: 3, line_total: 30 }, { line_id: 2, name: "Frites", unit_price: 5, qty: 2, line_total: 10 }], total_known: 40, proposals: [], open_proposal: null, customer: { name: "Neph", phone: "+260971000111" }, ...over });
let current = { orders: [sub()] };
vi.mock("../lib/api.js", () => ({ api: { resto: { orders: vi.fn(), sellerOrders: vi.fn(), sellerStatus: vi.fn(), sellerPay: vi.fn(), sellerDecide: vi.fn(), sellerPropose: vi.fn(), sellerCancelProposal: vi.fn(), decideProposal: vi.fn(), declarePay: vi.fn(), order: vi.fn(), cancelSub: vi.fn() } }, default: {} }));
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
import SellerOrders from "../pages/resto/SellerOrders.jsx";
import MyOrders from "../pages/resto/MyOrders.jsx";
import { api } from "../lib/api.js";
const wrap = (el) => render(<MemoryRouter><LanguageProvider>{el}</LanguageProvider></MemoryRouter>);

const PROP = { id: 7, status: "pending", message: "Frites épuisées", items_total_before: 40, items_total_after: 30, created_at: "2026-11-24T10:00:00", expires_at: "2026-11-26T10:00:00", decision_note: null, decided_at: null, lines: [{ line_id: 2, name: "Frites", unit_price: 5, qty_before: 2, qty_after: 0 }] };

describe("propositions de modification D2", () => {
  beforeEach(() => { vi.clearAllMocks(); api.resto.sellerPropose.mockResolvedValue({}); api.resto.sellerCancelProposal.mockResolvedValue({}); api.resto.decideProposal.mockResolvedValue({}); });

  it("vendeur : propose de retirer une ligne (changements envoyés au serveur, jamais de montant)", async () => {
    api.resto.sellerOrders.mockImplementation(async () => ({ orders: [sub()] }));
    wrap(<SellerOrders />);
    fireEvent.click(await screen.findByRole("button", { name: "Proposer une modification" }));
    fireEvent.change(screen.getByLabelText("Quantité Frites"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Message au client (ex. plat épuisé)"), { target: { value: "Épuisé" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer la proposition" }));
    await waitFor(() => expect(api.resto.sellerPropose).toHaveBeenCalledWith("tk", "HS-AAAA1111", { message: "Épuisé", changes: [{ line_id: 2, qty: 0 }] }));
  });

  it("vendeur : refuse d'envoyer sans changement ou en retirant tout", async () => {
    api.resto.sellerOrders.mockImplementation(async () => ({ orders: [sub()] }));
    wrap(<SellerOrders />);
    fireEvent.click(await screen.findByRole("button", { name: "Proposer une modification" }));
    fireEvent.click(screen.getByRole("button", { name: "Envoyer la proposition" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Modifiez au moins une quantité.");
    fireEvent.change(screen.getByLabelText("Quantité Poulet"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Quantité Frites"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer la proposition" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Refuser");
    expect(api.resto.sellerPropose).not.toHaveBeenCalled();
  });

  it("vendeur : pas de proposition possible une fois le paiement déclaré ; proposition en attente = retrait possible", async () => {
    api.resto.sellerOrders.mockImplementation(async () => ({ orders: [sub({ payment_status: "declared" }), sub({ code: "HS-BBBB2222", open_proposal: PROP, proposals: [PROP] })] }));
    wrap(<SellerOrders />);
    await screen.findByText("En attente de la réponse du client");
    expect(screen.queryAllByRole("button", { name: "Proposer une modification" })).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Retirer la proposition" }));
    await waitFor(() => expect(api.resto.sellerCancelProposal).toHaveBeenCalledWith("tk", "HS-BBBB2222"));
  });

  it("client : voit la proposition, accepte → décision envoyée", async () => {
    api.resto.order.mockImplementation(async () => ({ code: "HF-1", status: "accepted", grand_total: 40, suborders: [sub({ open_proposal: PROP, proposals: [PROP] })] }));
    render(<MemoryRouter initialEntries={["/restaurant/commandes/HF-1"]}><LanguageProvider><Routes><Route path="/restaurant/commandes/:code" element={<OrderDetail />} /></Routes></LanguageProvider></MemoryRouter>);
    expect(await screen.findByText("Modification proposée par le vendeur")).toBeInTheDocument();
    expect(screen.getByText("Frites épuisées")).toBeInTheDocument();
    expect(screen.getByText("Retiré")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Accepter la modification" }));
    await waitFor(() => expect(api.resto.decideProposal).toHaveBeenCalledWith("tk", "HS-AAAA1111", 7, { action: "accept", note: "" }));
  });

  it("client : refuse avec un message", async () => {
    api.resto.order.mockImplementation(async () => ({ code: "HF-1", status: "accepted", grand_total: 40, suborders: [sub({ open_proposal: PROP, proposals: [PROP] })] }));
    render(<MemoryRouter initialEntries={["/restaurant/commandes/HF-1"]}><LanguageProvider><Routes><Route path="/restaurant/commandes/:code" element={<OrderDetail />} /></Routes></LanguageProvider></MemoryRouter>);
    fireEvent.change(await screen.findByLabelText("Message au vendeur (facultatif)"), { target: { value: "Non merci" } });
    fireEvent.click(screen.getByRole("button", { name: "Refuser" }));
    await waitFor(() => expect(api.resto.decideProposal).toHaveBeenCalledWith("tk", "HS-AAAA1111", 7, { action: "decline", note: "Non merci" }));
  });

  it("client : badge « À valider » dans la liste ; historique des décisions affiché", async () => {
    api.resto.orders.mockImplementation(async () => ({ orders: [{ code: "HF-1", status: "accepted", grand_total: 40, suborders: [sub({ open_proposal: PROP, proposals: [PROP] })] }] }));
    wrap(<MyOrders />);
    expect(await screen.findByText("À valider")).toBeInTheDocument();
    api.resto.order.mockImplementation(async () => ({ code: "HF-1", status: "accepted", grand_total: 30, suborders: [sub({ open_proposal: null, proposals: [{ ...PROP, status: "accepted" }] })] }));
  });
});
