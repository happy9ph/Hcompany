import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../context/LanguageContext.jsx";

let auth = { user: { email: "a@b.io", full_name: "Awa Test", role: "client" }, isAuthenticated: true, isLoading: false };
vi.mock("../lib/api.js", () => ({ api: { partners: { accountStatus: vi.fn() }, auth: { updateMe: vi.fn(), changePassword: vi.fn() } } }));
vi.mock("../context/Usercontext.jsx", () => ({ useUser: () => ({ ...auth, withAuth: (f) => f("tk"), signOut: vi.fn() }) }));
vi.mock("../context/ToastContext.jsx", () => ({ useToast: () => ({ success() {}, error() {} }) }));
vi.mock("../components/layout/NavBar.jsx", () => ({ default: () => null }));
vi.mock("../components/layout/Footer.jsx", () => ({ default: () => null }));
import Account from "../pages/Account.jsx";
import { api } from "../lib/api.js";
const wrap = () => render(<MemoryRouter><LanguageProvider><Account /></LanguageProvider></MemoryRouter>);

describe("Gérer mon compte", () => {
  beforeEach(() => { document.cookie = "hc_lang=fr; Path=/"; vi.clearAllMocks(); auth = { user: { email: "a@b.io", full_name: "Awa Test", role: "client" }, isAuthenticated: true, isLoading: false }; });

  it("compte sans dashboard partenaire : page complète, pas de lien dashboard, invitation à devenir partenaire", async () => {
    api.partners.accountStatus.mockRejectedValue(new Error("403"));
    wrap();
    expect(await screen.findByRole("heading", { name: "Awa Test" })).toBeInTheDocument();
    expect(screen.getByText("Espaces professionnels")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^H-Food/ })).toHaveAttribute("href", "/restaurant/pro");
    await waitFor(() => expect(api.partners.accountStatus).toHaveBeenCalled());
    expect(screen.queryByRole("link", { name: /Dashboard partenaire/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Devenir partenaire/ })).toHaveAttribute("href", "/infos#rejoindre");
  });

  it("partenaire : lien vers le dashboard affiché (facultatif pour les autres)", async () => {
    api.partners.accountStatus.mockResolvedValue({ phone: "0970000000" });
    wrap();
    expect(await screen.findByRole("link", { name: /Dashboard partenaire/ })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByText("0970000000")).toBeInTheDocument();
  });

  it("modifier son nom appelle l'API et met à jour l'en-tête", async () => {
    api.partners.accountStatus.mockRejectedValue(new Error("403"));
    api.auth.updateMe.mockResolvedValue({ full_name: "Awa Nouvelle" });
    wrap();
    fireEvent.click(await screen.findByRole("button", { name: "Modifier mon nom" }));
    fireEvent.change(screen.getByLabelText("Nom complet", { selector: "input" }), { target: { value: "Awa Nouvelle" } });
    fireEvent.click(screen.getByLabelText("Enregistrer"));
    await waitFor(() => expect(api.auth.updateMe).toHaveBeenCalledWith("tk", "Awa Nouvelle"));
    expect(await screen.findByRole("heading", { name: "Awa Nouvelle" })).toBeInTheDocument();
  });

  it("mots de passe différents : refus sans appel API", async () => {
    api.partners.accountStatus.mockRejectedValue(new Error("403"));
    wrap();
    fireEvent.change(await screen.findByLabelText(/actuel/i), { target: { value: "oldpassword" } });
    const [n, c] = screen.getAllByLabelText(/mot de passe/i).filter((el) => el.tagName === "INPUT" && el.id !== "acc-cur");
    fireEvent.change(n, { target: { value: "newpassword1" } });
    fireEvent.change(c, { target: { value: "different123" } });
    fireEvent.submit(n.closest("form"));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(api.auth.changePassword).not.toHaveBeenCalled();
  });
});
