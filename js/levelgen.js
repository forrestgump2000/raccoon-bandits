import { RNG, TS, clamp } from './util.js';

export const FLOOR = 0, WALL = 1, PROP = 2, DOOR = 3, LOCK = 4;

export function difficulty(L) {
  const d = (L - 1) / 99;
  return {
    d,
    guardSpeed: 1.55 + 0.85 * d,          // tiles / sec
    chaseSpeed: 3.0 + 0.75 * d,
    visionRange: 5.2 + 2.6 * d,           // tiles
    visionHalf: 0.5 + 0.06 * d,           // radians
    detectTime: 1.25 - 0.62 * d,          // seconds to full suspicion at mid range
    hearing: 1 + 0.35 * d,
    camRange: 5.5 + 2 * d,
  };
}

function solidT(t) { return t === WALL || t === PROP || t === LOCK; }

export function generateLevel(L, theme) {
  const rng = new RNG(L * 7919 + 1337);
  const d = (L - 1) / 99;
  let w = Math.round(40 + d * 36 + rng.i(-2, 3));
  let h = Math.round(32 + d * 26 + rng.i(-2, 2));
  if (theme.gen === 'ship') { w = Math.min(78, w + 12); h = Math.max(26, h - 6); }
  w = clamp(w, 36, 78); h = clamp(h, 26, 60);
  const lvl = {
    w, h, grid: new Uint8Array(w * h).fill(WALL), props: new Map(), doors: new Map(), rooms: [],
    deco: [], rugs: [], guards: [], cameras: [], lasers: [], switches: [], noise: new Set(), plates: new Set(),
    vases: [], hides: [], vents: [], coins: [], loot: [], eggs: [], notes: [], lamps: [],
  };
  const G = lvl.grid;
  const idx = (x, y) => y * w + x;
  const get = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? WALL : G[idx(x, y)]);
  const set = (x, y, v) => { if (x > 0 && y > 0 && x < w - 1 && y < h - 1) G[idx(x, y)] = v; };
  lvl.get = get; lvl.idx = idx;
  const doorSpots = [];

  const carveRect = (x0, y0, x1, y1, v = FLOOR) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, v); };

  // ---------------------------------------------------- layouts
  const gens = {
    bsp() {
      const MIN = 6, MAXR = 15 - Math.round(d * 2);
      const splits = [];
      const split = (x0, y0, x1, y1) => {
        const W = x1 - x0, H = y1 - y0;
        const canV = W >= 2 * MIN, canH = H >= 2 * MIN;
        let doSplit = (W > MAXR || H > MAXR) || (rng.f() < 0.3 && (canV || canH));
        if (!(canV || canH)) doSplit = false;
        if (!doSplit) {
          carveRect(x0 + 1, y0 + 1, x1 - 1, y1 - 1);
          lvl.rooms.push({ x: x0 + 1, y: y0 + 1, w: W - 1, h: H - 1 });
          return;
        }
        const vert = canV && (!canH || (W > H ? rng.f() < 0.85 : rng.f() < 0.15));
        if (vert) { const s = rng.i(x0 + MIN, x1 - MIN); split(x0, y0, s, y1); split(s, y0, x1, y1); splits.push({ v: 1, at: s, a: y0 + 1, b: y1 - 1 }); }
        else { const s = rng.i(y0 + MIN, y1 - MIN); split(x0, y0, x1, s); split(x0, s, x1, y1); splits.push({ v: 0, at: s, a: x0 + 1, b: x1 - 1 }); }
      };
      split(0, 0, w - 1, h - 1);
      for (const s of splits) {
        const cands = [];
        for (let t = s.a; t < s.b; t++) {
          const ok = s.v
            ? get(s.at - 1, t) === FLOOR && get(s.at + 1, t) === FLOOR && get(s.at - 1, t + 1) === FLOOR && get(s.at + 1, t + 1) === FLOOR
            : get(t, s.at - 1) === FLOOR && get(t, s.at + 1) === FLOOR && get(t + 1, s.at - 1) === FLOOR && get(t + 1, s.at + 1) === FLOOR;
          if (ok) cands.push(t);
        }
        if (!cands.length) continue;
        const n = Math.min(cands.length, 1 + (rng.f() < 0.55 ? 1 : 0) + (cands.length > 14 && rng.f() < 0.4 ? 1 : 0));
        rng.shuffle(cands);
        const used = [];
        for (const t of cands) {
          if (used.length >= n) break;
          if (used.some((u) => Math.abs(u - t) < 5)) continue;
          used.push(t);
          const tiles = s.v ? [[s.at, t], [s.at, t + 1]] : [[t, s.at], [t + 1, s.at]];
          const isDoor = rng.f() < 0.55;
          for (const [x, y] of tiles) { set(x, y, isDoor ? DOOR : FLOOR); if (isDoor) doorSpots.push({ x, y, horiz: !s.v }); }
        }
      }
    },
    cave() {
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) G[idx(x, y)] = rng.f() < 0.43 ? WALL : FLOOR;
      for (let it = 0; it < 5; it++) {
        const copy = G.slice();
        for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
          let n = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && copy[idx(x + dx, y + dy)] === WALL) n++;
          G[idx(x, y)] = n >= 5 || (it < 2 && n <= 1 && rng.f() < 0.2) ? WALL : FLOOR;
        }
      }
      // carve a few chambers to guarantee open areas
      for (let i = 0; i < 6 + Math.round(d * 4); i++) {
        const rw = rng.i(5, 9), rh = rng.i(4, 7), rx = rng.i(2, w - rw - 3), ry = rng.i(2, h - rh - 3);
        carveRect(rx, ry, rx + rw, ry + rh);
        lvl.rooms.push({ x: rx, y: ry, w: rw + 1, h: rh + 1 });
      }
      // remove 1-wide wall specks
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        if (G[idx(x, y)] === WALL) {
          let n = 0;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (get(x + dx, y + dy) === WALL) n++;
          if (n === 0) G[idx(x, y)] = FLOOR;
        }
      }
    },
    maze() {
      const cw = Math.floor((w - 1) / 3), ch = Math.floor((h - 1) / 3);
      const vis = new Uint8Array(cw * ch);
      const stack = [[rng.i(0, cw - 1), rng.i(0, ch - 1)]];
      vis[stack[0][1] * cw + stack[0][0]] = 1;
      const cellCarve = (cx, cy) => carveRect(1 + cx * 3, 1 + cy * 3, 2 + cx * 3, 2 + cy * 3);
      cellCarve(...stack[0]);
      while (stack.length) {
        const [cx, cy] = stack[stack.length - 1];
        const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy, dx, dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < cw && ny < ch && !vis[ny * cw + nx]);
        if (!nb.length) { stack.pop(); continue; }
        const [nx, ny, dx, dy] = rng.pick(nb);
        vis[ny * cw + nx] = 1;
        cellCarve(nx, ny);
        // carve wall between
        if (dx) { const wx = dx > 0 ? 3 + cx * 3 : cx * 3; carveRect(wx, 1 + cy * 3, wx, 2 + cy * 3); }
        else { const wy = dy > 0 ? 3 + cy * 3 : cy * 3; carveRect(1 + cx * 3, wy, 2 + cx * 3, wy); }
        stack.push([nx, ny]);
      }
      // braid: open extra walls for loops
      for (let i = 0; i < cw * ch * 0.22; i++) {
        const cx = rng.i(0, cw - 2), cy = rng.i(0, ch - 2);
        if (rng.f() < 0.5) carveRect(3 + cx * 3, 1 + cy * 3, 3 + cx * 3, 2 + cy * 3);
        else carveRect(1 + cx * 3, 3 + cy * 3, 2 + cx * 3, 3 + cy * 3);
      }
      // open chambers
      for (let i = 0; i < 5 + Math.round(d * 3); i++) {
        const rw = rng.i(4, 7), rh = rng.i(4, 6), rx = rng.i(2, w - rw - 3), ry = rng.i(2, h - rh - 3);
        carveRect(rx, ry, rx + rw, ry + rh);
        lvl.rooms.push({ x: rx, y: ry, w: rw + 1, h: rh + 1 });
      }
    },
    open() {
      carveRect(1, 1, w - 2, h - 2);
      // sub-rooms
      const n = 4 + Math.round(d * 4);
      for (let i = 0; i < n; i++) {
        const rw = rng.i(7, 11), rh = rng.i(6, 9);
        const rx = rng.i(2, w - rw - 3), ry = rng.i(2, h - rh - 3);
        let clash = false;
        for (let y = ry - 2; y <= ry + rh + 2 && !clash; y++) for (let x = rx - 2; x <= rx + rw + 2; x++) if (get(x, y) === WALL && x > 0 && y > 0 && x < w - 1 && y < h - 1) { clash = true; break; }
        if (clash) continue;
        for (let x = rx; x <= rx + rw; x++) { set(x, ry, WALL); set(x, ry + rh, WALL); }
        for (let y = ry; y <= ry + rh; y++) { set(rx, y, WALL); set(rx + rw, y, WALL); }
        lvl.rooms.push({ x: rx + 1, y: ry + 1, w: rw - 1, h: rh - 1, sub: true });
        const sides = rng.shuffle([0, 1, 2, 3]).slice(0, rng.i(1, 2));
        for (const s of sides) {
          if (s < 2) { const dx = rng.i(rx + 2, rx + rw - 3), y = s ? ry : ry + rh; const isDoor = rng.f() < 0.6; for (const x of [dx, dx + 1]) { set(x, y, isDoor ? DOOR : FLOOR); if (isDoor) doorSpots.push({ x, y, horiz: true }); } }
          else { const dy = rng.i(ry + 2, ry + rh - 3), x = s === 2 ? rx : rx + rw; const isDoor = rng.f() < 0.6; for (const y of [dy, dy + 1]) { set(x, y, isDoor ? DOOR : FLOOR); if (isDoor) doorSpots.push({ x, y, horiz: false }); } }
        }
      }
      // pillars / cover blocks
      for (let y = 4; y < h - 4; y += 5) for (let x = 4; x < w - 4; x += 6) {
        if (rng.f() < 0.45) continue;
        const px = x + rng.i(-1, 1), py = y + rng.i(-1, 1);
        let ok = true;
        for (let yy = py - 2; yy <= py + 3 && ok; yy++) for (let xx = px - 2; xx <= px + 3; xx++) if (get(xx, yy) !== FLOOR) { ok = false; break; }
        if (!ok) continue;
        const bw = rng.i(1, 2), bh = rng.i(1, 2);
        for (let yy = py; yy < py + bh; yy++) for (let xx = px; xx < px + bw; xx++) set(xx, yy, WALL);
      }
      lvl.rooms.push({ x: 2, y: 2, w: w - 4, h: h - 4, hall: true });
    },
    streets() {
      // everything floor, then place building blocks separated by streets
      carveRect(1, 1, w - 2, h - 2);
      let y = 2;
      while (y < h - 6) {
        const bh = rng.i(5, 8);
        if (y + bh > h - 3) break;
        let x = 2;
        while (x < w - 6) {
          const bw = rng.i(6, 10);
          if (x + bw > w - 3) break;
          const kind = rng.f();
          if (kind < 0.5) {
            // hollow building with doors
            for (let xx = x; xx < x + bw; xx++) { set(xx, y, WALL); set(xx, y + bh - 1, WALL); }
            for (let yy = y; yy < y + bh; yy++) { set(x, yy, WALL); set(x + bw - 1, yy, WALL); }
            lvl.rooms.push({ x: x + 1, y: y + 1, w: bw - 2, h: bh - 2, sub: true });
            const nd = rng.i(1, 2);
            for (let k = 0; k < nd; k++) {
              const s = rng.i(0, 3);
              const isDoor = rng.f() < 0.6;
              if (s < 2) { const dx = rng.i(x + 1, x + bw - 3), yy = s ? y : y + bh - 1; for (const xx of [dx, dx + 1]) { set(xx, yy, isDoor ? DOOR : FLOOR); if (isDoor) doorSpots.push({ x: xx, y: yy, horiz: true }); } }
              else { const dy = rng.i(y + 1, y + bh - 3), xx = s === 2 ? x : x + bw - 1; for (const yy of [dy, dy + 1]) { set(xx, yy, isDoor ? DOOR : FLOOR); if (isDoor) doorSpots.push({ x: xx, y: yy, horiz: false }); } }
            }
          } else if (kind < 0.78) {
            carveRect(x, y, x + bw - 1, y + bh - 1, WALL); // solid block
          } else {
            lvl.rooms.push({ x, y, w: bw, h: bh, plaza: true });
          }
          x += bw + rng.i(2, 3);
        }
        y += bh + rng.i(2, 3);
      }
      lvl.rooms.push({ x: 1, y: 1, w: w - 2, h: h - 2, hall: true });
    },
    ship() {
      const corridors = [];
      const nC = Math.max(1, Math.floor((h - 4) / 11));
      const gap = (h - 2) / nC;
      for (let i = 0; i < nC; i++) {
        const cy = Math.round(1 + gap * (i + 0.5)) - 1;
        carveRect(1, cy, w - 2, cy + 2);
        corridors.push(cy);
      }
      // cabins between corridors and borders
      const bands = [];
      let prev = 1;
      for (const cy of corridors) { bands.push([prev, cy - 1]); prev = cy + 3; }
      bands.push([prev, h - 2]);
      for (const [y0, y1] of bands) {
        if (y1 - y0 < 2) continue;
        let x = 1;
        while (x < w - 4) {
          const cw = rng.i(5, 9);
          const x1 = Math.min(w - 2, x + cw - 1);
          carveRect(x, y0, x1, y1);
          lvl.rooms.push({ x, y: y0, w: x1 - x + 1, h: y1 - y0 + 1 });
          // wall to the right
          if (x1 + 1 < w - 1) for (let yy = y0; yy <= y1; yy++) set(x1 + 1, yy, WALL);
          // doors into adjacent corridors
          const above = corridors.includes(y0 - 3) || corridors.some((c) => c + 3 === y0);
          const below = corridors.includes(y1 + 1);
          const dxs = rng.i(x + 1, Math.max(x + 1, x1 - 2));
          const isDoor = rng.f() < 0.6;
          const makeDoor = (yy) => { for (const xx of [dxs, dxs + 1]) { if (xx > x1) continue; set(xx, yy, isDoor ? DOOR : FLOOR); if (isDoor) doorSpots.push({ x: xx, y: yy, horiz: true }); } };
          // walls between cabin band and corridors
          if (below) { for (let xx = x; xx <= x1; xx++) set(xx, y1, WALL); makeDoor(y1); }
          if (above) { for (let xx = x; xx <= x1; xx++) set(xx, y0, WALL); if (!below || rng.f() < 0.5) makeDoor(y0); }
          x = x1 + 2;
        }
      }
      // vertical connectors
      for (let x = 6; x < w - 6; x += rng.i(10, 16)) carveRect(x, 1, x + 1, h - 2);
    },
    rings() {
      carveRect(1, 1, w - 2, h - 2);
      const step = 5;
      let k = 1;
      while (true) {
        const x0 = k * step, y0 = k * step, x1 = w - 1 - k * step, y1 = h - 1 - k * step;
        if (x1 - x0 < 8 || y1 - y0 < 6) break;
        for (let x = x0; x <= x1; x++) { set(x, y0, WALL); set(x, y1, WALL); }
        for (let y = y0; y <= y1; y++) { set(x0, y, WALL); set(x1, y, WALL); }
        // gates
        const gates = rng.i(2, 4);
        for (let gI = 0; gI < gates; gI++) {
          const side = rng.i(0, 3), isDoor = rng.f() < 0.5;
          if (side < 2) { const gx = rng.i(x0 + 2, x1 - 3), gy = side ? y0 : y1; for (const xx of [gx, gx + 1]) { set(xx, gy, isDoor ? DOOR : FLOOR); if (isDoor) doorSpots.push({ x: xx, y: gy, horiz: true }); } }
          else { const gy = rng.i(y0 + 2, y1 - 3), gx = side === 2 ? x0 : x1; for (const yy of [gy, gy + 1]) { set(gx, yy, isDoor ? DOOR : FLOOR); if (isDoor) doorSpots.push({ x: gx, y: yy, horiz: false }); } }
        }
        // radial partitions inside this ring's corridor (between previous ring and this)
        const pk = k - 1;
        const px0 = pk * step + 1, py0 = pk * step + 1;
        for (let r = 0; r < 2; r++) {
          if (rng.f() < 0.5) { const rx = rng.i(x0 + 3, x1 - 3); for (let y = py0; y < y0; y++) set(rx, y, WALL); }
          else { const ry = rng.i(y0 + 3, y1 - 3); for (let x = px0; x < x0; x++) set(x, ry, WALL); }
        }
        lvl.rooms.push({ x: x0 + 1, y: y0 + 1, w: x1 - x0 - 1, h: y1 - y0 - 1, ring: k });
        k++;
      }
      lvl.rooms.push({ x: 1, y: 1, w: w - 2, h: h - 2, hall: true });
    },
  };
  (gens[theme.gen] || gens.bsp)();

  // border
  for (let x = 0; x < w; x++) { G[idx(x, 0)] = WALL; G[idx(x, h - 1)] = WALL; }
  for (let y = 0; y < h; y++) { G[idx(0, y)] = WALL; G[idx(w - 1, y)] = WALL; }

  const passable = (t) => t === FLOOR || t === DOOR || t === LOCK;

  // ---------------------------------------------------- choose start (bottom-ish, open area)
  let start = null;
  const startCands = [];
  for (let y = h - 2; y > h * 0.55; y--) for (let x = 2; x < w - 2; x++) {
    let ok = true;
    for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (get(x + dx, y + dy) !== FLOOR) { ok = false; break; }
    if (ok) startCands.push([x, y]);
  }
  if (startCands.length) {
    const midX = w / 2;
    startCands.sort((a, b) => (b[1] * 3 - Math.abs(b[0] - midX) * 0.6) - (a[1] * 3 - Math.abs(a[0] - midX) * 0.6));
    start = startCands[Math.min(startCands.length - 1, rng.i(0, 6))];
  } else {
    for (let i = 0; i < 5000 && !start; i++) { const x = rng.i(1, w - 2), y = rng.i(1, h - 2); if (get(x, y) === FLOOR) start = [x, y]; }
  }

  // ---------------------------------------------------- connectivity: flood from start, connect or remove islands
  const flood = () => {
    const seen = new Uint8Array(w * h);
    const q = [idx(start[0], start[1])];
    seen[q[0]] = 1;
    while (q.length) {
      const i = q.pop();
      const x = i % w, y = (i / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = idx(x + dx, y + dy);
        if (!seen[ni] && passable(G[ni])) { seen[ni] = 1; q.push(ni); }
      }
    }
    return seen;
  };
  for (let pass = 0; pass < 60; pass++) {
    const seen = flood();
    let found = null;
    for (let i = 0; i < w * h && !found; i++) if (passable(G[i]) && !seen[i]) found = i;
    if (found === null) break;
    // island: gather it
    const island = [];
    const q = [found]; const inI = new Uint8Array(w * h); inI[found] = 1;
    while (q.length) { const i = q.pop(); island.push(i); const x = i % w, y = (i / w) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = idx(x + dx, y + dy); if (!inI[ni] && passable(G[ni])) { inI[ni] = 1; q.push(ni); } } }
    // find shortest straight tunnel (<=4 walls) to the main region
    let best = null;
    for (const i of island) {
      const x = i % w, y = (i / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        for (let len = 1; len <= 5; len++) {
          const tx = x + dx * len, ty = y + dy * len;
          if (tx < 1 || ty < 1 || tx >= w - 1 || ty >= h - 1) break;
          const ti = idx(tx, ty);
          if (seen[ti]) { if (!best || len < best.len) best = { x, y, dx, dy, len }; break; }
          if (passable(G[ti])) break;
        }
      }
    }
    if (best) {
      for (let k = 1; k < best.len; k++) {
        const tx = best.x + best.dx * k, ty = best.y + best.dy * k;
        set(tx, ty, FLOOR);
        // widen to 2 for comfort
        if (best.dx) set(tx, ty + 1, get(tx, ty + 1) === WALL && passable(get(tx - best.dx, ty + 1)) ? FLOOR : get(tx, ty + 1));
      }
    } else {
      for (const i of island) G[i] = WALL;
    }
  }

  // ---------------------------------------------------- BFS distance helpers
  const bfs = (sx, sy) => {
    const dist = new Int32Array(w * h).fill(-1);
    const q = new Int32Array(w * h);
    let qh = 0, qt = 0;
    const s = idx(sx, sy); dist[s] = 0; q[qt++] = s;
    while (qh < qt) {
      const i = q[qh++]; const x = i % w, y = (i / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = ny * w + nx;
        if (dist[ni] < 0 && passable(G[ni])) { dist[ni] = dist[i] + 1; q[qt++] = ni; }
      }
    }
    return dist;
  };
  let dist = bfs(start[0], start[1]);
  const floorCount = () => { let c = 0; for (let i = 0; i < w * h; i++) if (passable(G[i])) c++; return c; };

  // door bookkeeping (only keep doors still valid)
  for (const ds of doorSpots) if (get(ds.x, ds.y) === DOOR) lvl.doors.set(idx(ds.x, ds.y), { x: ds.x, y: ds.y, horiz: ds.horiz, open: 0, locked: false });
  // sanitize door orientation: if walls left/right it is a horizontal-wall door
  for (const dr of lvl.doors.values()) {
    const lr = solidT(get(dr.x - 1, dr.y)) || get(dr.x - 1, dr.y) === DOOR;
    const ud = solidT(get(dr.x, dr.y - 1)) || get(dr.x, dr.y - 1) === DOOR;
    if (lr && !ud) dr.horiz = true; else if (ud && !lr) dr.horiz = false;
  }

  const occupied = new Set();
  const nearDoor = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = get(x + dx, y + dy); if (t === DOOR || t === LOCK) return true; } return false; };
  const isFree = (x, y) => get(x, y) === FLOOR && !occupied.has(idx(x, y));
  const wallAdj = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => get(x + dx, y + dy) === WALL).length;
  const nearStart = (x, y, r) => Math.abs(x - start[0]) <= r && Math.abs(y - start[1]) <= r;
  const allFloor = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (G[idx(x, y)] === FLOOR) allFloor.push([x, y]);
  rng.shuffle(allFloor);

  // ---------------------------------------------------- props (solid furniture)
  {
    let total = floorCount();
    const target = Math.round(total * (0.045 + rng.f() * 0.02));
    let placed = 0;
    for (const [x, y] of allFloor) {
      if (placed >= target) break;
      if (get(x, y) !== FLOOR || nearStart(x, y, 3) || nearDoor(x, y)) continue;
      const wa = wallAdj(x, y);
      if (wa === 0 && rng.f() < 0.8) continue;
      // avoid narrow corridors: need at least 2 floor neighbours open in each axis after placing
      set(x, y, PROP);
      const nd = bfs(start[0], start[1]);
      let reach = 0; for (let i = 0; i < w * h; i++) if (nd[i] >= 0) reach++;
      if (reach !== total - 1) { set(x, y, FLOOR); continue; }
      // reject if creates 1-wide gap between prop and wall (tight squeeze)
      let squeeze = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (get(x + dx, y + dy) === FLOOR && solidT(get(x + dx * 2, y + dy * 2)) && wa < 2) squeeze = true;
      }
      if (squeeze && rng.f() < 0.85) { set(x, y, FLOOR); continue; }
      total--; placed++;
      lvl.props.set(idx(x, y), { e: rng.pick(theme.p), r: rng.range(-0.15, 0.15), s: rng.range(0.85, 1.1) });
    }
    dist = bfs(start[0], start[1]);
  }

  // rugs and floor deco
  for (const r of lvl.rooms) {
    if (r.hall || r.ring || r.w < 5 || r.h < 4 || r.w * r.h > 150) continue;
    if (rng.f() < 0.5) lvl.rugs.push({ x: r.x + 1, y: r.y + 1, w: r.w - 2, h: r.h - 2 });
  }
  for (let i = 0; i < allFloor.length * 0.03; i++) {
    const [x, y] = allFloor[i];
    if (get(x, y) !== FLOOR) continue;
    lvl.deco.push({ x: x + rng.range(0.2, 0.8), y: y + rng.range(0.2, 0.8), e: rng.pick(theme.dc), r: rng.range(-0.6, 0.6), s: rng.range(0.35, 0.5) });
  }

  const freeList = () => allFloor.filter(([x, y]) => isFree(x, y));
  const occ = (x, y) => occupied.add(idx(x, y));

  // ---------------------------------------------------- loot
  const lootCount = 3 + Math.floor(L / 30);
  {
    const cands = freeList().filter(([x, y]) => dist[idx(x, y)] > 0).sort((a, b) => dist[idx(b[0], b[1])] - dist[idx(a[0], a[1])]);
    const maxD = dist[idx(cands[0][0], cands[0][1])];
    const picks = [];
    let minSep = 12;
    while (picks.length < lootCount && minSep > 2) {
      for (const c of cands) {
        if (picks.length >= lootCount) break;
        const dd = dist[idx(c[0], c[1])];
        if (dd < maxD * 0.4) continue;
        if (picks.some((p) => Math.abs(p[0] - c[0]) + Math.abs(p[1] - c[1]) < minSep)) continue;
        if (rng.f() < 0.5) continue;
        picks.push(c);
      }
      minSep -= 2;
    }
    picks.forEach(([x, y], i) => {
      occ(x, y);
      let kind = 'free';
      const r = rng.f();
      if (L >= 2 && r < 0.45) kind = 'case';
      else if (L >= 4 && r < 0.75) kind = 'safe';
      lvl.loot.push({ x, y, kind, e: theme.l[0][i % theme.l[0].length], taken: false, opened: kind === 'free', prog: 0 });
    });
  }

  // locked doors guarding loot rooms
  if (L >= 4) {
    for (const lt of lvl.loot) {
      for (const r of lvl.rooms) {
        if (r.hall || r.ring) continue;
        if (lt.x >= r.x && lt.x < r.x + r.w && lt.y >= r.y && lt.y < r.y + r.h && rng.f() < 0.35 + d * 0.4) {
          for (const dr of lvl.doors.values()) {
            const adj = (dr.x >= r.x - 1 && dr.x <= r.x + r.w && dr.y >= r.y - 1 && dr.y <= r.y + r.h);
            if (adj) { dr.locked = true; G[idx(dr.x, dr.y)] = LOCK; }
          }
        }
      }
    }
  }

  // ---------------------------------------------------- guards
  const pathBetween = (a, b) => findPath(lvl, a[0], a[1], b[0], b[1], true);
  const area = floorCount();
  const nGuards = clamp(Math.round(2 + L * 0.11 + area * (0.0019 + 0.0012 * d)), 3, 24);
  {
    const far = freeList().filter(([x, y]) => dist[idx(x, y)] > 14);
    rng.shuffle(far);
    const spawned = [];
    // put some guards near loot
    const anchors = lvl.loot.map((l) => [l.x, l.y]);
    for (let gi = 0; gi < nGuards && far.length; gi++) {
      let sp = null;
      if (gi < anchors.length && rng.f() < 0.8) {
        const a = anchors[gi];
        const near = far.filter(([x, y]) => Math.abs(x - a[0]) + Math.abs(y - a[1]) < 8 && Math.abs(x - a[0]) + Math.abs(y - a[1]) > 2);
        if (near.length) sp = rng.pick(near);
      }
      if (!sp) sp = far.find(([x, y]) => !spawned.some((s) => Math.abs(s[0] - x) + Math.abs(s[1] - y) < 9)) || far[gi % far.length];
      spawned.push(sp);
      const wps = [sp];
      const nW = rng.i(2, 4);
      for (let k = 0; k < nW; k++) {
        const last = wps[wps.length - 1];
        const options = far.filter(([x, y]) => { const m = Math.abs(x - last[0]) + Math.abs(y - last[1]); return m > 5 && m < 18; });
        if (options.length) wps.push(rng.pick(options));
      }
      const sentry = L > 8 && rng.f() < 0.15;
      const routes = [];
      let valid = true;
      if (!sentry && wps.length > 1) {
        for (let k = 0; k < wps.length; k++) {
          const a = wps[k], b = wps[(k + 1) % wps.length];
          const p = pathBetween(a, b);
          if (!p) { valid = false; break; }
          routes.push(p);
        }
      }
      if (!valid) { routes.length = 0; }
      const isHound = theme.k && L >= 12 && gi % 5 === 4;
      lvl.guards.push({
        x: (sp[0] + 0.5) * TS, y: (sp[1] + 0.5) * TS, wps, routes, sentry: sentry || !routes.length,
        spec: isHound ? { e: theme.k[0], n: theme.k[1], c: '#000', hound: true } : (() => { const g = theme.g[gi % theme.g.length]; return { e: g[0], n: g[1], c: g[2], hat: g[3] }; })(),
        hound: !!isHound, ang: rng.range(0, Math.PI * 2),
      });
    }
  }

  // ---------------------------------------------------- cameras
  if (L >= 3) {
    const n = Math.round(1 + L * 0.07 + area / 1800);
    const cands = [];
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      if (get(x, y) !== WALL) continue;
      for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
        const fx = x + dx, fy = y + dy;
        if (get(fx, fy) === FLOOR && dist[idx(fx, fy)] > 10 && get(fx + dx, fy + dy) === FLOOR) { cands.push({ x, y, dx, dy }); break; }
      }
    }
    rng.shuffle(cands);
    for (const c of cands) {
      if (lvl.cameras.length >= n) break;
      if (lvl.cameras.some((o) => Math.abs(o.tx - c.x) + Math.abs(o.ty - c.y) < 10)) continue;
      lvl.cameras.push({ tx: c.x, ty: c.y, x: (c.x + 0.5 + c.dx * 0.5) * TS, y: (c.y + 0.5 + c.dy * 0.5) * TS, base: Math.atan2(c.dy, c.dx), sweep: rng.range(0.5, 0.9), speed: rng.range(0.5, 0.9), phase: rng.range(0, 6) });
    }
  }

  // ---------------------------------------------------- lasers & switches
  if (L >= 5) {
    const n = Math.round(1 + L * 0.085);
    let group = 0;
    for (const [x, y] of rng.shuffle(freeList())) {
      if (lvl.lasers.length >= n) break;
      if (dist[idx(x, y)] < 9) continue;
      const tryDir = (dx, dy) => {
        let ax = x, ay = y, bx = x, by = y;
        while (get(ax - dx, ay - dy) === FLOOR) { ax -= dx; ay -= dy; }
        while (get(bx + dx, by + dy) === FLOOR) { bx += dx; by += dy; }
        const len = Math.abs(bx - ax) + Math.abs(by - ay) + 1;
        if (len < 2 || len > 6) return null;
        if (get(ax - dx, ay - dy) !== WALL || get(bx + dx, by + dy) !== WALL) return null;
        const tiles = [];
        for (let k = 0; k < len; k++) { const tx = ax + dx * k, ty = ay + dy * k; if (occupied.has(idx(tx, ty)) || nearDoor(tx, ty)) return null; tiles.push(idx(tx, ty)); }
        return { ax, ay, bx, by, dx, dy, tiles };
      };
      const r = rng.f() < 0.5 ? (tryDir(1, 0) || tryDir(0, 1)) : (tryDir(0, 1) || tryDir(1, 0));
      if (!r) continue;
      if (lvl.lasers.some((o) => Math.abs(o.cx - x) + Math.abs(o.cy - y) < 6)) continue;
      const horiz = r.dx === 1;
      const L1 = horiz ? { x: r.ax * TS, y: (r.ay + 0.5) * TS } : { x: (r.ax + 0.5) * TS, y: r.ay * TS };
      const L2 = horiz ? { x: (r.bx + 1) * TS, y: (r.by + 0.5) * TS } : { x: (r.bx + 0.5) * TS, y: (r.by + 1) * TS };
      const blink = L > 10 && rng.f() < 0.45;
      const hidden = L >= 25 && rng.f() < 0.15 + d * 0.25;
      r.tiles.forEach((t) => occupied.add(t));
      lvl.lasers.push({ x1: L1.x, y1: L1.y, x2: L2.x, y2: L2.y, cx: x, cy: y, blink, period: rng.range(2.4, 4), phase: rng.range(0, 4), hidden, group, off: false });
      // switch near the laser on start side
      if (rng.f() < 0.7) {
        const sc = freeList().filter(([sx, sy]) => wallAdj(sx, sy) > 0 && Math.abs(sx - x) + Math.abs(sy - y) < 12 && Math.abs(sx - x) + Math.abs(sy - y) > 3 && dist[idx(sx, sy)] < dist[idx(x, y)] && !nearDoor(sx, sy));
        if (sc.length) { const s = rng.pick(sc); occ(s[0], s[1]); lvl.switches.push({ x: s[0], y: s[1], group, used: false, prog: 0 }); }
      }
      group++;
    }
  }

  // ---------------------------------------------------- noisy floor patches
  if (L >= 2) {
    const n = Math.round(3 + L * 0.12);
    for (let k = 0; k < n; k++) {
      const s = rng.pick(allFloor);
      if (!s || dist[idx(s[0], s[1])] < 6) continue;
      let [x, y] = s;
      const len = rng.i(3, 9);
      for (let j = 0; j < len; j++) {
        if (get(x, y) === FLOOR) lvl.noise.add(idx(x, y));
        const [dx, dy] = rng.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
        if (get(x + dx, y + dy) === FLOOR) { x += dx; y += dy; }
      }
    }
  }
  // pressure plates near loot
  if (L >= 12) {
    for (const lt of lvl.loot) {
      const n = rng.i(1, 2 + Math.floor(d * 3));
      for (let k = 0; k < n; k++) {
        const x = lt.x + rng.i(-3, 3), y = lt.y + rng.i(-3, 3);
        if (isFree(x, y) && !(x === lt.x && y === lt.y) && !nearDoor(x, y)) { lvl.plates.add(idx(x, y)); occ(x, y); }
      }
    }
  }

  // ---------------------------------------------------- vases (knockable)
  {
    const n = Math.round(area * 0.012 + 3);
    let c = 0;
    for (const [x, y] of rng.shuffle(freeList())) {
      if (c >= n) break;
      if (wallAdj(x, y) === 0 || nearDoor(x, y) || nearStart(x, y, 3)) continue;
      occ(x, y); c++;
      lvl.vases.push({ x: (x + 0.5) * TS, y: (y + 0.5) * TS, broken: false, wob: 0, e: ['🏺', '🪴', '⚱️', '🍶', '🥛', '🫙'][rng.i(0, 5)] });
    }
  }

  // ---------------------------------------------------- hiding spots
  {
    const n = Math.round(4 + area / 300);
    for (const [x, y] of rng.shuffle(freeList())) {
      if (lvl.hides.length >= n) break;
      if (wallAdj(x, y) === 0 || nearDoor(x, y)) continue;
      if (lvl.hides.some((o) => Math.abs(o.tx - x) + Math.abs(o.ty - y) < 7)) continue;
      occ(x, y);
      lvl.hides.push({ tx: x, ty: y, x: (x + 0.5) * TS, y: (y + 0.5) * TS });
    }
  }

  // ---------------------------------------------------- vents
  if (L >= 6) {
    const pairs = 1 + Math.floor(L / 25);
    const fl = rng.shuffle(freeList().filter(([x, y]) => wallAdj(x, y) > 0 && !nearDoor(x, y)));
    for (let p = 0; p < pairs; p++) {
      const a = fl.find(([x, y]) => isFree(x, y) && dist[idx(x, y)] > 5);
      if (!a) break;
      occ(a[0], a[1]);
      const b = fl.find(([x, y]) => isFree(x, y) && Math.abs(dist[idx(x, y)] - dist[idx(a[0], a[1])]) > 14 && Math.abs(x - a[0]) + Math.abs(y - a[1]) > 12);
      if (!b) break;
      occ(b[0], b[1]);
      const va = { x: (a[0] + 0.5) * TS, y: (a[1] + 0.5) * TS }, vb = { x: (b[0] + 0.5) * TS, y: (b[1] + 0.5) * TS };
      va.to = vb; vb.to = va;
      lvl.vents.push(va, vb);
    }
  }

  // ---------------------------------------------------- coins
  {
    const n = Math.round(area * 0.03 + 12);
    let c = 0;
    const fl = rng.shuffle(freeList());
    for (const [x, y] of fl) {
      if (c >= n) break;
      if (nearStart(x, y, 2)) continue;
      // trail of coins
      const [dx, dy] = rng.pick([[1, 0], [0, 1], [-1, 0], [0, -1]]);
      const len = rng.i(1, 4);
      for (let k = 0; k < len; k++) {
        const tx = x + dx * k, ty = y + dy * k;
        if (!isFree(tx, ty)) break;
        occ(tx, ty);
        const big = rng.f() < 0.08;
        lvl.coins.push({ x: (tx + 0.5) * TS, y: (ty + 0.5) * TS, v: big ? 5 : 1, big, taken: false, ph: rng.range(0, 6) });
        c++;
      }
    }
  }

  // ---------------------------------------------------- easter eggs: dead ends / corners
  {
    const cands = freeList().filter(([x, y]) => wallAdj(x, y) >= 2 && dist[idx(x, y)] > 8).sort((a, b) => wallAdj(b[0], b[1]) - wallAdj(a[0], a[1]) || rng.f() - 0.5);
    const eggs = theme.eg.slice();
    for (let k = 0; k < eggs.length && cands.length; k++) {
      const c = cands.find(([x, y]) => isFree(x, y) && !lvl.eggs.some((e) => Math.abs(e.tx - x) + Math.abs(e.ty - y) < 10)) || cands[k];
      if (!c) break;
      occ(c[0], c[1]);
      lvl.eggs.push({ tx: c[0], ty: c[1], x: (c[0] + 0.5) * TS, y: (c[1] + 0.5) * TS, e: eggs[k][0], text: eggs[k][1], id: k, taken: false });
    }
  }

  // ---------------------------------------------------- notes
  {
    const fl = rng.shuffle(freeList().filter(([x, y]) => dist[idx(x, y)] > 6));
    for (let k = 0; k < 2 && fl[k]; k++) { occ(fl[k][0], fl[k][1]); lvl.notes.push({ x: (fl[k][0] + 0.5) * TS, y: (fl[k][1] + 0.5) * TS, k }); }
  }

  // ---------------------------------------------------- lamps
  for (const r of lvl.rooms) {
    if (r.hall) continue;
    if (rng.f() < 0.55) lvl.lamps.push({ x: (r.x + r.w / 2) * TS, y: (r.y + r.h / 2) * TS, r: (2.5 + Math.min(r.w, r.h) * 0.35) * TS, flick: rng.f() < 0.25 });
  }
  if (lvl.rooms.some((r) => r.hall)) {
    for (let i = 0; i < area / 120; i++) { const [x, y] = rng.pick(allFloor); if (get(x, y) === FLOOR) lvl.lamps.push({ x: (x + 0.5) * TS, y: (y + 0.5) * TS, r: rng.range(2.5, 4) * TS, flick: rng.f() < 0.2 }); }
  }

  lvl.start = { x: (start[0] + 0.5) * TS, y: (start[1] + 0.5) * TS, tx: start[0], ty: start[1] };
  lvl.dist = dist;
  lvl.lootCount = lvl.loot.length;
  lvl.totalCoins = lvl.coins.reduce((a, c) => a + c.v, 0);
  return lvl;
}

// A* / BFS path on tile grid (4-dir with diagonal shortcuts allowed when clear)
export function findPath(lvl, sx, sy, tx, ty, allowLocked = true) {
  const { w, h, grid } = lvl;
  if (sx === tx && sy === ty) return [[tx, ty]];
  const pass = (t) => t === FLOOR || t === DOOR || (allowLocked && t === LOCK);
  if (tx < 0 || ty < 0 || tx >= w || ty >= h || !pass(grid[ty * w + tx])) return null;
  const prev = new Int32Array(w * h).fill(-1);
  const q = new Int32Array(w * h);
  let qh = 0, qt = 0;
  const s = sy * w + sx, t = ty * w + tx;
  prev[s] = s; q[qt++] = s;
  while (qh < qt) {
    const i = q[qh++];
    if (i === t) break;
    const x = i % w, y = (i / w) | 0;
    for (let k = 0; k < 4; k++) {
      const nx = x + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = y + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx;
      if (prev[ni] < 0 && pass(grid[ni])) { prev[ni] = i; q[qt++] = ni; }
    }
  }
  if (prev[t] < 0) return null;
  const path = [];
  let c = t;
  while (c !== s) { path.push([c % w, (c / w) | 0]); c = prev[c]; }
  path.reverse();
  return path;
}
