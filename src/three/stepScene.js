// Scène 3D « comment ça marche » : client → H-Company (flamme extrudée) → carrousel des 6 services.
// Aucun asset : géométries procédurales + textures canvas. Pilotée de l'extérieur via api.set({...}).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const GOLD = 0xc89a3d, GREEN = 0x34d399;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => x * x * (3 - 2 * x);
const SANS = "Inter, system-ui, sans-serif", SERIF = "Fraunces, Georgia, serif";

// Contour de la flamme (même dessin que le logo), repère 512×512.
const FLAME = [[256, 496], [[190, 452], [92, 392], [92, 296]], [[92, 224], [124, 168], [178, 116]], [[168, 148], [176, 184], [204, 182]],
  [[236, 180], [238, 126], [258, 80]], [[268, 54], [280, 36], [288, 20]], [[280, 78], [302, 140], [346, 204]], [[342, 152], [346, 82], [362, 24]],
  [[404, 84], [424, 156], [420, 222]], [[418, 262], [408, 292], [396, 316]], [[386, 340], [330, 438], [256, 496]]];

const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.35, ...o });
const mesh = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); return o; };
const BOX = (w, h, d) => new THREE.BoxGeometry(w, h, d), CYL = (r, h, n = 28) => new THREE.CylinderGeometry(r, r, h, n);

// Six petites maquettes « services » (Transport, Logement, Restaurant, Tourisme, Shopping, Learning).
const ICONS = [
  (m, a) => { const g = new THREE.Group(); g.add(mesh(BOX(1.3, 0.55, 0.6), m, 0, 0.1), mesh(BOX(1.1, 0.2, 0.62), a, 0, 0.2));
    [-0.4, 0.4].forEach((x) => { const w = mesh(CYL(0.16, 0.66), a, x, -0.22); w.rotation.x = Math.PI / 2; g.add(w); }); return g; },
  (m, a) => { const g = new THREE.Group(); const r = mesh(new THREE.ConeGeometry(0.78, 0.46, 4), a, 0, 0.42); r.rotation.y = Math.PI / 4;
    g.add(mesh(BOX(0.95, 0.62, 0.8), m, 0, -0.1), r, mesh(BOX(0.2, 0.34, 0.04), a, 0, -0.2, 0.41)); return g; },
  (m, a) => { const g = new THREE.Group(); g.add(mesh(CYL(0.62, 0.06, 40), a, 0, -0.3), mesh(new THREE.SphereGeometry(0.5, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, -0.27), mesh(new THREE.SphereGeometry(0.08, 12, 12), a, 0, 0.26)); return g; },
  (m, a) => { const g = new THREE.Group(); g.add(mesh(new THREE.ConeGeometry(0.62, 1, 4), m, -0.25, 0), mesh(new THREE.ConeGeometry(0.46, 0.7, 4), a, 0.4, -0.15), mesh(new THREE.SphereGeometry(0.13, 16, 16), a, 0.5, 0.5)); return g; },
  (m, a) => { const g = new THREE.Group(); const h = mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 24, Math.PI), a, 0, 0.3); g.add(mesh(BOX(0.82, 0.76, 0.36), m, 0, -0.1), h); return g; },
  (m, a) => { const g = new THREE.Group(); const c = mesh(BOX(1.25, 0.07, 1.25), a, 0, 0.18); c.rotation.y = Math.PI / 4;
    g.add(c, mesh(CYL(0.34, 0.36), m, 0, -0.08), mesh(CYL(0.025, 0.4, 8), a, 0.55, -0.02, 0.55)); return g; },
];

function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,238,200,1)"); r.addColorStop(0.35, "rgba(255,200,110,.45)"); r.addColorStop(1, "rgba(255,190,90,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
function label(width, px = 46, color = "rgba(255,255,255,.75)") {
  const c = document.createElement("canvas"); c.width = 512; c.height = 128;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(width, width / 4, 1);
  s.userData.set = (text) => { const g = c.getContext("2d"); g.clearRect(0, 0, 512, 128); g.font = `500 ${px}px ${SANS}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = color; g.fillText(text, 256, 64); tex.needsUpdate = true; };
  return s;
}
function drawDoc(c, d, okText) {
  const g = c.getContext("2d"), W = c.width, H = c.height; g.clearRect(0, 0, W, H);
  rr(g, 6, 6, W - 12, H - 12, 36); g.fillStyle = "rgba(28,22,17,.95)"; g.fill(); g.strokeStyle = "rgba(200,154,61,.6)"; g.lineWidth = 3; g.stroke();
  g.textAlign = "left"; g.font = `600 34px ${SANS}`; g.fillStyle = "#C89A3D"; g.fillText(d.label, 40, 68);
  d.lines.forEach(([k, v], i) => { const y = 140 + i * 56; g.font = `400 30px ${SANS}`; g.fillStyle = "rgba(255,255,255,.5)"; g.textAlign = "left"; g.fillText(k, 40, y); g.fillStyle = "rgba(255,255,255,.92)"; g.textAlign = "right"; g.fillText(v, W - 40, y); });
  g.fillStyle = "rgba(255,255,255,.15)"; g.fillRect(40, 312, W - 80, 2);
  g.font = `400 28px ${SANS}`; g.fillStyle = "rgba(255,255,255,.5)"; g.textAlign = "left"; g.fillText("Total", 40, 374);
  g.font = `600 46px ${SERIF}`; g.fillStyle = "#fff"; g.textAlign = "right"; g.fillText(d.total, W - 40, 376);
  if (okText) { rr(g, W - 270, 28, 230, 58, 29); g.fillStyle = "#34D399"; g.fill(); g.fillStyle = "#08261b"; g.font = `700 28px ${SANS}`; g.textAlign = "center"; g.fillText("✓ " + okText, W - 155, 66); }
}

export function createStepScene(container, onError) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  const glow = glowTexture();
  const S = { step: 0, idx: 0, local: 0, lang: "fr", d: null, t: { customer: "Client", ok: "OK" } };

  // lumières
  const key = new THREE.DirectionalLight(0xffe2b8, 2.4); key.position.set(4, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc49a6c, 1.6); rim.position.set(-5, 3, -5); scene.add(rim);
  const hubLight = new THREE.PointLight(GOLD, 24, 10); scene.add(hubLight);

  // sol + anneaux
  const floor = mesh(new THREE.CircleGeometry(8.5, 96), mat(0x1a120d, { roughness: 0.5, metalness: 0.7, envMapIntensity: 0.4 }), 0.3, -1.15, 0);
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  [2.6, 4.6, 6.6].forEach((r) => { const m = mesh(new THREE.RingGeometry(r, r + 0.025, 96), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.12 }), 0.3, -1.13, 0); m.rotation.x = -Math.PI / 2; scene.add(m); });

  // client
  const C = V(-4.4, 0, 0);
  const cust = new THREE.Group(); cust.position.copy(C);
  const podMat = mat(0x4a3426, { roughness: 0.3, metalness: 0.2, clearcoat: 1, emissive: GOLD, emissiveIntensity: 0.05 });
  cust.add(mesh(new RoundedBoxGeometry(1.15, 1.15, 1.15, 6, 0.3), podMat), mesh(new THREE.SphereGeometry(0.2, 20, 20), mat(0xefe4d2), 0, 0.05, 0.56));
  const cring = mesh(new THREE.TorusGeometry(0.95, 0.025, 10, 64), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.5 }), 0, -0.55, 0); cring.rotation.x = Math.PI / 2; cust.add(cring);
  scene.add(cust);

  // hub : flamme extrudée
  const H = V(0, 0.4, 0);
  const shape = new THREE.Shape(); const P = (p) => [p[0] - 255, 259 - p[1]];
  shape.moveTo(...P(FLAME[0])); FLAME.slice(1).forEach(([a, b, c]) => shape.bezierCurveTo(...P(a), ...P(b), ...P(c)));
  const fgeo = new THREE.ExtrudeGeometry(shape, { depth: 36, bevelEnabled: true, bevelThickness: 10, bevelSize: 8, bevelSegments: 5, curveSegments: 28 });
  fgeo.translate(0, 0, -18);
  const hub = new THREE.Group(); hub.position.copy(H);
  const flame = mesh(fgeo, new THREE.MeshPhysicalMaterial({ color: 0xc49a6c, metalness: 0.9, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 1.4 }));
  flame.scale.setScalar(0.0052); hub.add(flame);
  const hl = label(1, 150, "#2A1A11"); hl.scale.set(1.1, 1.1, 1); hl.position.set(0, -0.25, 0.17);
  { const c = hl.material.map.image; c.width = c.height = 256; const g = c.getContext("2d"); g.font = `700 200px ${SERIF}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#2A1A11"; g.fillText("h", 128, 118); hl.material.map.needsUpdate = true; }
  hub.add(hl);
  const halo = [1.9, 2.3].map((r, i) => { const t = mesh(new THREE.TorusGeometry(r, 0.012, 8, 128), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.4 })); t.rotation.x = 1.2 + i * 0.4; hub.add(t); return t; });
  const hubGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: GOLD, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); hubGlow.scale.setScalar(6); hubGlow.position.z = -0.6; hub.add(hubGlow);
  scene.add(hub); hubLight.position.set(0, 1.6, 2);

  // carrousel de partenaires
  const cream = mat(0xefe4d2, { metalness: 0.15 }), gold = mat(GOLD, { metalness: 0.85, roughness: 0.3 });
  const nodes = ICONS.map((build) => {
    const g = new THREE.Group(), icon = build(cream, gold);
    const ringM = mat(0x2a1a11, { emissive: GOLD, emissiveIntensity: 0.2 });
    g.add(mesh(CYL(0.78, 0.18, 48), mat(0x2a1a11, { roughness: 0.3, metalness: 0.6 }), 0, -0.78), mesh(new THREE.TorusGeometry(0.78, 0.035, 10, 64), ringM, 0, -0.68));
    g.children[1].rotation.x = Math.PI / 2; icon.position.y = 0.1; g.add(icon); g.userData = { icon, ringM }; scene.add(g); return g;
  });
  const verified = mesh(new THREE.TorusGeometry(0.98, 0.045, 12, 64), new THREE.MeshBasicMaterial({ color: GREEN }), 0, 0, 0); verified.rotation.x = Math.PI / 2; verified.visible = false; scene.add(verified);

  // labels, lignes, orbes, ondes, poussière
  const labC = label(2.2), labH = label(2.4), labP = label(2.8, 46, "rgba(255,226,170,.95)");
  labC.position.set(C.x, -1.0, 0.9); labH.position.set(0, -1.2, 0.9); scene.add(labC, labH, labP);
  const mkLine = () => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 41 }, () => V())), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.3 })); scene.add(l); return l; };
  const lines = [mkLine(), mkLine(), mkLine()];
  const orbs = Array.from({ length: 48 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffd58a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.visible = false; scene.add(s); return s; });
  let oi = 0; const orb = (p, size = 0.5, a = 1, col = 0xffd58a) => { const s = orbs[oi++ % orbs.length]; s.visible = true; s.position.copy(p); s.scale.setScalar(size); s.material.opacity = a; s.material.color.set(col); };
  const waves = [0, 1, 2].map(() => { const m = mesh(new THREE.RingGeometry(0.95, 1, 64), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); return m; });
  const dust = (() => { const a = new Float32Array(260 * 3); for (let i = 0; i < a.length; i += 3) { a[i] = (Math.random() - 0.5) * 16; a[i + 1] = Math.random() * 6 - 1; a[i + 2] = (Math.random() - 0.5) * 9; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ map: glow, size: 0.2, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(p); return p; })();

  // fiche récapitulative (étape 3)
  const docA = document.createElement("canvas"), docB = document.createElement("canvas"); docA.width = docB.width = 640; docA.height = docB.height = 420;
  const tA = new THREE.CanvasTexture(docA), tB = new THREE.CanvasTexture(docB); tA.colorSpace = tB.colorSpace = THREE.SRGBColorSpace;
  const doc = mesh(new THREE.PlaneGeometry(3.1, 2.03), new THREE.MeshBasicMaterial({ map: tA, transparent: true, depthWrite: false })); doc.visible = false; scene.add(doc);

  // courbes de Bézier quadratiques
  const tmp = V(); const bez = (a, c, b, u) => { const v = 1 - u; return tmp.set(v * v * a.x + 2 * v * u * c.x + u * u * b.x, v * v * a.y + 2 * v * u * c.y + u * u * b.y, v * v * a.z + 2 * v * u * c.z + u * u * b.z); };
  const setLine = (l, a, c, b) => { const p = l.geometry.attributes.position; for (let i = 0; i <= 40; i++) { const q = bez(a, c, b, i / 40); p.setXYZ(i, q.x, q.y, q.z); } p.needsUpdate = true; };
  const cc = V(-2.2, 1.7, 0.6), cStart = V(C.x + 0.7, 0.5, 0), hIn = V(H.x - 0.9, H.y, 0);
  setLine(lines[0], cStart, cc, hIn);
  const pPos = Array.from({ length: 6 }, () => V()); let idxF = 0, lastKey = "";

  // cadrage + parallaxe
  let px = 0, py = 0, spx = 0, spy = 0, baseZ = 12;
  const resize = () => { const w = container.clientWidth || 1, h = container.clientHeight || 1; renderer.setSize(w, h, false); cam.aspect = w / h; baseZ = clamp(6.9 / (Math.tan((cam.fov * Math.PI) / 360) * cam.aspect), 10.5, 19); cam.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(container); resize();
  const onMove = (e) => { const r = container.getBoundingClientRect(); px = ((e.clientX - r.left) / r.width - 0.5) * 2; py = ((e.clientY - r.top) / r.height - 0.5) * 2; };
  container.addEventListener("pointermove", onMove);
  let visible = true; const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(container);
  const clock = new THREE.Clock();

  const frame = () => {
    if (!visible || document.hidden || !S.d) return;
    const t = clock.getElapsedTime(), { step, idx, local, d } = S;
    orbs.forEach((o) => { o.visible = false; }); oi = 0;
    const key2 = idx + S.lang;
    if (key2 !== lastKey) { lastKey = key2; labC.userData.set(S.t.customer); labH.userData.set("H-Company"); labP.userData.set(d.partner); drawDoc(docA, d, ""); drawDoc(docB, d, S.t.ok); tA.needsUpdate = tB.needsUpdate = true; }

    // carrousel (rotation continue vers le service actif)
    const diff = ((idx - idxF + 9) % 6) - 3; idxF += diff * 0.07; if (idxF < 0) idxF += 6; if (idxF >= 6) idxF -= 6;
    nodes.forEach((n, i) => {
      const a = ((i - idxF) / 6) * Math.PI * 2, front = (Math.cos(a) + 1) / 2;
      n.position.set(4.7 + Math.sin(a) * 2.3, 0.15 + (1 - front) * 0.7, -0.6 + Math.cos(a) * 1.7); n.scale.setScalar(0.62 + front * 0.78);
      n.userData.icon.rotation.y = t * 0.6 + i; n.userData.icon.position.y = 0.1 + Math.sin(t * 1.4 + i) * 0.06;
      n.userData.ringM.emissiveIntensity = 0.12 + 0.9 * Math.pow(front, 4); pPos[i].copy(n.position).y += 0.2;
    });
    const A = pPos[idx], act = nodes[idx];
    labP.position.set(A.x, A.y - 1.05 * act.scale.y, A.z + 0.5);

    // moyeu
    hub.rotation.y = Math.sin(t * 0.5) * 0.4; hub.position.y = H.y + Math.sin(t * 1.2) * 0.07; halo[0].rotation.z = t * 0.4; halo[1].rotation.z = -t * 0.3;
    hubGlow.material.opacity = 0.45 + Math.sin(t * 2) * 0.08;
    const hMid = V(H.x + 0.9, H.y, 0), pc = V((H.x + A.x) / 2, 2.1, (H.z + A.z) / 2 + 0.6);
    setLine(lines[1], hMid, pc, A); const pc3 = V((A.x + C.x) / 2, 3.5, 1.5); setLine(lines[2], A, pc3, cStart);
    lines[1].visible = step < 3; lines[2].visible = step === 3; lines[0].material.opacity = lines[1].material.opacity = lines[2].material.opacity = 0.18 + 0.2 * Math.sin(t * 2) ** 2;

    const run = (a, c, b, u, size = 0.6, col) => { if (u <= 0 || u >= 1) return; for (let j = 0; j < 4; j++) { const uu = u - j * 0.035; if (uu > 0) orb(bez(a, c, b, uu), size * (1 - j * 0.2), 1 - j * 0.22, col); } };
    let wave = null, hubPop = 0, vPop = 1;
    if (step === 0) { // recherche : ondes + orbes vers tout le réseau
      wave = C;
      for (let i = 0; i < 6; i++) { const u = clamp(local * 1.7 - i * 0.07, 0, 1);
        if (u < 0.5) run(cStart, cc, hIn, u * 2, 0.55); else { const T = pPos[i], m2 = V((H.x + T.x) / 2, 2, (H.z + T.z) / 2 + 0.5); run(hMid, m2, T, (u - 0.5) * 2, 0.5); if (u > 0.97) orb(T, 1.1, 0.8); } }
    } else if (step === 1) { // mise en relation
      run(cStart, cc, hIn, clamp(local / 0.45), 0.8); if (local > 0.4) run(hMid, pc, A, clamp((local - 0.45) / 0.35), 0.8);
      hubPop = local > 0.4 && local < 0.6 ? 1 : 0;
      verified.visible = local > 0.7; vPop = 0.6 + 0.4 * ease(clamp((local - 0.7) / 0.2));
    } else if (step === 2) { // formalisation
      run(hMid, pc, A, (t * 0.7) % 1, 0.45); verified.visible = local > 0.72;
    } else { // livraison + suivi
      verified.visible = true; run(A, pc3, cStart, clamp(local * 1.05), 0.9, GREEN);
      for (let k = 0; k < 4; k++) { const on = local >= (k + 1) * 0.2; orb(bez(A, pc3, cStart, 0.2 + k * 0.2), on ? 0.55 : 0.2, on ? 1 : 0.35, on ? GREEN : 0xffffff); }
      if (local > 0.85) { wave = C; orb(V(C.x, 0.9, 0.3), 1.6 + Math.sin(t * 10) * 0.2, 0.9, GREEN); }
    }
    hub.scale.setScalar(1 + hubPop * 0.06 * Math.sin(t * 14));
    verified.position.set(A.x, A.y - 0.5 * act.scale.y, A.z); verified.scale.setScalar(vPop * act.scale.x);
    waves.forEach((w, k) => { w.visible = !!wave; if (!wave) return; const ph = (t * 0.7 + k / 3) % 1; w.position.set(wave.x, -1.1, wave.z); w.scale.setScalar(1 + ph * 3.6); w.material.opacity = (1 - ph) * 0.5; w.material.color.set(step === 3 ? GREEN : GOLD); });
    podMat.emissiveIntensity = 0.05 + (step === 0 ? 0.25 + 0.2 * Math.sin(t * 5) : 0) + (step === 3 && local > 0.85 ? 0.5 : 0);

    // fiche
    const dk = step === 2 ? ease(clamp((local - 0.05) / 0.2)) : 0; doc.visible = dk > 0.01;
    if (doc.visible) { doc.position.set((H.x + A.x) / 2 + 0.3, 2.3 + Math.sin(t) * 0.05, 1.2); doc.lookAt(cam.position); doc.scale.setScalar(0.8 + 0.2 * dk); doc.material.opacity = dk; doc.material.map = local > 0.72 ? tB : tA; }

    dust.rotation.y = t * 0.02; dust.position.y = Math.sin(t * 0.3) * 0.15;
    spx += (px - spx) * 0.05; spy += (py - spy) * 0.05;
    cam.position.set(Math.sin(t * 0.2) * 0.7 + spx * 1.1, 2.7 - spy * 0.5, baseZ); cam.lookAt(0.35, 0.1, 0);
    renderer.render(scene, cam);
  };
  renderer.setAnimationLoop(() => { try { frame(); } catch (e) { renderer.setAnimationLoop(null); onError?.(e); } });

  return {
    set(s) { Object.assign(S, s); },
    dispose() {
      renderer.setAnimationLoop(null); ro.disconnect(); io.disconnect(); container.removeEventListener("pointermove", onMove);
      scene.traverse((o) => { o.geometry?.dispose(); const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; ms.forEach((m) => { m.map?.dispose(); m.dispose(); }); });
      scene.environment?.dispose(); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
