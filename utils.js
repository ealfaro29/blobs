/* ---------- utilities ---------- */
export function mulberry32(a) { return function() { let t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function seedFromString(s) { if (!isFinite(s)) { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return (h >>> 0) || 1; } return Math.max(1, Math.floor(Number(s))); }
export function randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }
export function randFloat(min, max) { return min + Math.random() * (max - min); }

/* ---------- blob generator ---------- */
export function closedCRtoBezier(points, tension) {
  const n = points.length; let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
    const c1x = p1.x + (p2.x - p0.x) * (tension / 6), c1y = p1.y + (p2.y - p0.y) * (tension / 6);
    const c2x = p2.x - (p3.x - p1.x) * (tension / 6), c2y = p2.y - (p3.y - p1.y) * (tension / 6);
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d + ' Z';
}
export function generatePoints({ seed, points, radius, variance, jitter }) {
  const rand = mulberry32(seed); const pts = [];
  for (let i = 0; i < points; i++) {
    const a = i * (Math.PI * 2 / points);
    const r = radius * (1 + (rand() * 2 - 1) * variance);
    const aj = a + (rand() * 2 - 1) * jitter;
    pts.push({ x: Math.cos(aj) * r, y: Math.sin(aj) * r });
  }
  return pts;
}
