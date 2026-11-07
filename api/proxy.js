// Fonction Vercel : relais same-origin vers l'API (Render). Active seulement si API_ORIGIN est défini côté Vercel.
// Avantage : le cookie de session devient « first-party » → la session survit au rechargement même sur Safari/Firefox/mode privé.
// Limite Vercel : corps de requête ≤ 4,5 Mo (au-delà, utiliser la réécriture vercel.proxy.example.json).
export const config = { api: { bodyParser: false } };

const HOP = new Set(["host", "connection", "content-length", "transfer-encoding", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto", "x-vercel-id", "x-vercel-forwarded-for"]);

export default async function handler(req, res) {
  const origin = (process.env.API_ORIGIN || "").replace(/\/+$/, "");
  if (!/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(origin)) { res.status(503).json({ detail: "API_ORIGIN non configuré." }); return; }
  const url = new URL(req.url, "http://x");
  const path = url.searchParams.get("__p") || "";
  if (!/^\/(api\/v1|uploads)\//.test(path)) { res.status(400).json({ detail: "Chemin invalide." }); return; }
  url.searchParams.delete("__p");
  const qs = url.searchParams.toString();
  const target = `${origin}${path}${qs ? `?${qs}` : ""}`;
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) if (!HOP.has(k.toLowerCase())) headers[k] = Array.isArray(v) ? v.join(", ") : v;
  let body;
  if (!["GET", "HEAD"].includes(req.method)) { const chunks = []; for await (const c of req) chunks.push(c); body = Buffer.concat(chunks); }
  let r;
  try { r = await fetch(target, { method: req.method, headers, body, redirect: "manual" }); }
  catch { res.status(502).json({ detail: "API injoignable." }); return; }
  res.status(r.status);
  r.headers.forEach((v, k) => { if (!["content-encoding", "content-length", "transfer-encoding", "connection", "set-cookie"].includes(k.toLowerCase())) res.setHeader(k, v); });
  const cookies = r.headers.getSetCookie?.() || [];
  if (cookies.length) res.setHeader("Set-Cookie", cookies);
  res.send(Buffer.from(await r.arrayBuffer()));
}
