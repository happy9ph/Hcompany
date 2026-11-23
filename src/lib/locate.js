// Localisation de l'appareil : une seule implémentation, avec des erreurs lisibles.
// Rejette { code: "unsupported" | "insecure" | "denied" | "unavailable" | "timeout" }.
export function locate({ timeout = 10000, highAccuracy = false } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return reject({ code: "unsupported" });
    if (typeof window !== "undefined" && window.isSecureContext === false) return reject({ code: "insecure" }); // le GPS exige HTTPS
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) => reject({ code: e?.code === 1 ? "denied" : e?.code === 3 ? "timeout" : "unavailable" }),
      { enableHighAccuracy: highAccuracy, timeout, maximumAge: 120000 },
    );
  });
}

/** Distance à vol d'oiseau en km. */
export function km(a, b) {
  const R = 6371, rad = (x) => (x * Math.PI) / 180;
  const dLa = rad(b[0] - a[0]), dLo = rad(b[1] - a[1]);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const fmtKm = (d) => (d < 1 ? `${Math.max(100, Math.round(d * 10) * 100)} m` : d < 10 ? `${d.toFixed(1)} km` : `${Math.round(d)} km`);
