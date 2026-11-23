import { describe, it, expect, afterEach } from "vitest";
import { locate, km, fmtKm } from "./locate.js";

const setGeo = (g) => Object.defineProperty(globalThis.navigator, "geolocation", { value: g, configurable: true });
afterEach(() => setGeo(undefined));

describe("locate", () => {
  it("renvoie la position", async () => {
    setGeo({ getCurrentPosition: (ok) => ok({ coords: { latitude: -15.4, longitude: 28.3, accuracy: 20 } }) });
    expect(await locate()).toEqual({ lat: -15.4, lng: 28.3, accuracy: 20 });
  });
  it("distingue refus, délai dépassé et indisponible", async () => {
    for (const [code, want] of [[1, "denied"], [3, "timeout"], [2, "unavailable"]]) {
      setGeo({ getCurrentPosition: (_, ko) => ko({ code }) });
      await expect(locate()).rejects.toEqual({ code: want });
    }
  });
  it("appareil sans géolocalisation", async () => { setGeo(undefined); await expect(locate()).rejects.toEqual({ code: "unsupported" }); });
  it("distance Lusaka–Ndola ≈ 270 km ; formats lisibles", () => {
    const d = km([-15.4167, 28.2833], [-12.9587, 28.6366]);
    expect(d).toBeGreaterThan(260); expect(d).toBeLessThan(290);
    expect(fmtKm(0.42)).toBe("400 m"); expect(fmtKm(2.34)).toBe("2.3 km"); expect(fmtKm(37.6)).toBe("38 km");
  });
});
