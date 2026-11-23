import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../context/LanguageContext.jsx";

const sub = (over = {}) => ({ code: "HS-AAAA1111", restaurant_name: "Chez A", status: "accepted", payment_status: "unpaid", fulfilment: "pickup", items: [{ name: "Poulet", qty: 1, line_total: 10 }], total_known: 10, customer: { name: "Neph", phone: "+260971000111" }, ...over });
let current = { orders: [sub()] };
vi.mock("../lib/api.js", () => ({ api: { resto: { orders: vi.fn(), sellerOrders: vi.fn(), sellerStatus: vi.fn(), sellerPay: vi.fn(), sellerDecide: vi.fn(), declarePay: vi.fn(), order: vi.fn(), cancelSub: vi.fn() } }, default: {} }));
vi.mock("../context/Usercontext.jsx", () => ({ useUser: () => ({ isAuthenticated: true, isLoading: false, withAuth: (f) => f("tk") }) }));
vi.mock("../context/ToastContext.jsx", () => ({ useToast: () => ({ success() {}, error() {} }) }));
vi.mock("../data/shop.js", async () => { const { useEffect, useState } = await import("react"); return { useShopMoney: () => ({ money: (n) => `K${n}` }), errMessage: () => "erreur", useLoad: (fn) => { const [d, setD] = useState(null); const load = () => fn().then(setD); useEffect(() => { load(); }, []); return { data: d, loading: !d, error: null, reload: load }; } }; });
vi.mock("../components/ui/HeadManager.jsx", () => ({ usePageMeta: () => {} }));
vi.mock("../components/restaurant/Shared.jsx", async () => {
  const React = await import("react"); const { RESTO_UI } = await import("../i18n/restoUi.js");
  const Pass = ({ children }) => React.createElement("div", null, children);
  return { default: Pass, RestoAuthGate: Pass, Card: Pass, EmptyState: ({ title }) => React.createElement("p", null, title), ErrorState: () => null, Spinner: () => null, inputCls: "", useRestoUi: () => RESTO_UI.fr };
});
import SellerOrders from "../pages/resto/SellerOrders.jsx";
import MyOrders from "../pages/resto/MyOrders.jsx";
import { api } from "../lib/api.js";
const wrap = (el) => render(<MemoryRouter><LanguageProvider>{el}</LanguageProvider></MemoryRouter>);

describe("commandes D1", () => {
  beforeEach(() => { vi.clearAllMocks(); api.resto.orders.mockImplementation(async () => current); api.resto.sellerOrders.mockImplementation(async () => current); api.resto.sellerStatus.mockResolvedValue({}); api.resto.sellerPay.mockResolvedValue({}); api.resto.declarePay.mockResolvedValue({}); });
  it("liste vendeur : lit { orders } et propose la suite du flux", async () => {
    current = { orders: [sub()] };
    wrap(<SellerOrders />);
    fireEvent.click(await screen.findByRole("button", { name: "En préparation" }));
    await waitFor(() => expect(api.resto.sellerStatus).toHaveBeenCalledWith("tk", "HS-AAAA1111", { status: "preparing", reason: "" }));
  });
  it("annulation vendeur : motif obligatoire", async () => {
    current = { orders: [sub()] };
    wrap(<SellerOrders />);
    fireEvent.click(await screen.findByRole("button", { name: "Annuler" }));
    const go = screen.getAllByRole("button", { name: "Annuler" }).find((b) => b.disabled);
    expect(go).toBeDisabled();
  });
  it("paiement déclaré : le vendeur peut confirmer ou contester", async () => {
    current = { orders: [sub({ payment_status: "declared", payment_method: "Airtel Money", payment_ref: "AB1" })] };
    wrap(<SellerOrders />);
    fireEvent.click(await screen.findByRole("button", { name: "Confirmer le paiement reçu" }));
    await waitFor(() => expect(api.resto.sellerPay).toHaveBeenCalledWith("tk", "HS-AAAA1111", { action: "confirm", note: "" }));
  });
  it("client : liste lit { orders } ; déclare son paiement après acceptation", async () => {
    current = { orders: [{ code: "HF-1", status: "accepted", grand_total: 10, suborders: [sub()] }] };
    wrap(<MyOrders />);
    expect(await screen.findByText("HF-1")).toBeInTheDocument();
  });
});
