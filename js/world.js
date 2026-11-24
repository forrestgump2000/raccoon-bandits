import { TS, RNG, shade, rgba, mix } from './util.js';
import { FLOOR, WALL, PROP, DOOR, LOCK } from './levelgen.js';
import { roundRect } from './sprites.js';
import { drawProp, drawDeco } from './art-things.js';

// Paint the static parts of a level to an offscreen canvas.
export function renderStatic(lvl, theme, L) {
  const c = document.createElement('canvas');
  c.width = lvl.w * TS; c.height = lvl.h * TS;
  const ctx = c.getContext('2d');
  const rng = new RNG(L * 31 + 7);
  const [f1, f2] = theme.fc;
  const [wt, ws] = theme.wc;
  const get = lvl.get;
  const isWall = (x, y) => { const t = get(x, y); return t === WALL; };

  ctx.fillStyle = shade(ws, -0.5);
  ctx.fillRect(0, 0, c.width, c.height);

  // ---------------- floors
  for (let y = 0; y < lvl.h; y++) for (let x = 0; x < lvl.w; x++) {
    const t = get(x, y);
    if (t === WALL) continue;
    drawFloorTile(ctx, theme.f, x * TS, y * TS, x, y, f1, f2, theme.acc, rng);
  }

  // rugs
  for (const r of lvl.rugs) {
    const pad = 6;
    ctx.save();
    ctx.globalAlpha = 0.55;
    roundRect(ctx, r.x * TS + pad, r.y * TS + pad, r.w * TS - pad * 2, r.h * TS - pad * 2, 10);
    ctx.fillStyle = theme.acc; ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = shade(theme.acc, 0.45); ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
    roundRect(ctx, r.x * TS + pad + 8, r.y * TS + pad + 8, r.w * TS - pad * 2 - 16, r.h * TS - pad * 2 - 16, 6); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // noisy floor
  for (const i of lvl.noise) {
    const x = (i % lvl.w) * TS, y = ((i / lvl.w) | 0) * TS;
    ctx.fillStyle = 'rgba(30,15,0,0.22)';
    ctx.fillRect(x + 2, y + 2, TS - 4, TS - 4);
    ctx.strokeStyle = 'rgba(255,230,170,0.28)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const yy = y + 12 + k * 12;
      ctx.moveTo(x + 8, yy);
      for (let s = 1; s <= 4; s++) ctx.lineTo(x + 8 + s * 8, yy + (s % 2 ? -3 : 3));
    }
    ctx.stroke();
  }
  // pressure plates
  for (const i of lvl.plates) {
    const x = (i % lvl.w) * TS, y = ((i / lvl.w) | 0) * TS;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    roundRect(ctx, x + 8, y + 8, TS - 16, TS - 16, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; ctx.stroke();
  }

  // floor deco
  lvl.deco.forEach((d, i) => drawDeco(ctx, d.e, d.x * TS, d.y * TS, TS * d.s, d.r, i));

  // ambient occlusion / wall shadows on floor
  for (let y = 0; y < lvl.h; y++) for (let x = 0; x < lvl.w; x++) {
    if (isWall(x, y)) continue;
    const px = x * TS, py = y * TS;
    if (isWall(x, y - 1)) { const g = ctx.createLinearGradient(0, py, 0, py + TS * 0.55); g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(px, py, TS, TS * 0.55); }
    if (isWall(x - 1, y)) { const g = ctx.createLinearGradient(px, 0, px + TS * 0.3, 0); g.addColorStop(0, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(px, py, TS * 0.3, TS); }
    if (isWall(x + 1, y)) { const g = ctx.createLinearGradient(px + TS, 0, px + TS * 0.7, 0); g.addColorStop(0, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(px + TS * 0.7, py, TS * 0.3, TS); }
  }

  // ---------------- walls (3/4 view)
  for (let y = 0; y < lvl.h; y++) for (let x = 0; x < lvl.w; x++) {
    if (!isWall(x, y)) continue;
    drawWallTile(ctx, theme, x, y, isWall, rng);
  }

  // props are drawn live by the game renderer (animated)
  return c;
}

function drawFloorTile(ctx, style, px, py, x, y, f1, f2, acc, rng) {
  const v = rng.f();
  const S = TS;
  switch (style) {
    case 'marble': {
      ctx.fillStyle = (x + y) % 2 ? f1 : mix(f1, f2, 0.5); ctx.fillRect(px, py, S, S);
      ctx.strokeStyle = rgba('#ffffff', 0.18); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px + v * S, py); ctx.bezierCurveTo(px + S * 0.3, py + S * 0.4, px + S * 0.8, py + S * 0.5, px + S * (1 - v), py + S); ctx.stroke();
      ctx.strokeStyle = rgba('#000000', 0.12); ctx.strokeRect(px + 0.5, py + 0.5, S - 1, S - 1);
      break;
    }
    case 'checker': ctx.fillStyle = (x + y) % 2 ? f1 : f2; ctx.fillRect(px, py, S, S);
      ctx.fillStyle = rgba('#ffffff', 0.06); ctx.fillRect(px, py, S, 3); break;
    case 'wood': {
      const ph = S / 4;
      for (let k = 0; k < 4; k++) {
        const r2 = rng.f();
        ctx.fillStyle = mix(f1, f2, r2);
        ctx.fillRect(px, py + k * ph, S, ph);
        ctx.fillStyle = rgba('#000000', 0.2); ctx.fillRect(px, py + k * ph + ph - 1, S, 1);
        if (((x * 3 + k * 7 + y) % 4) === 0) ctx.fillRect(px + (r2 * S) | 0, py + k * ph, 1, ph);
        ctx.fillStyle = rgba('#ffffff', 0.05); ctx.fillRect(px, py + k * ph, S, 1);
      }
      break;
    }
    case 'carpet': ctx.fillStyle = f1; ctx.fillRect(px, py, S, S);
      ctx.fillStyle = f2; ctx.beginPath(); ctx.moveTo(px + S / 2, py + 6); ctx.lineTo(px + S - 6, py + S / 2); ctx.lineTo(px + S / 2, py + S - 6); ctx.lineTo(px + 6, py + S / 2); ctx.fill();
      ctx.fillStyle = rgba(acc, 0.25); ctx.beginPath(); ctx.arc(px + S / 2, py + S / 2, 4, 0, Math.PI * 2); ctx.fill(); break;
    case 'stone': case 'cobble': {
      ctx.fillStyle = f2; ctx.fillRect(px, py, S, S);
      if (style === 'stone') {
        const n = 2;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          const off = (y + j) % 2 ? S / 4 : 0;
          ctx.fillStyle = mix(f1, f2, rng.f() * 0.6);
          roundRect(ctx, px + i * S / 2 + 1.5 + off * 0, py + j * S / 2 + 1.5, S / 2 - 3, S / 2 - 3, 3); ctx.fill();
          ctx.fillStyle = rgba('#ffffff', 0.08); ctx.fillRect(px + i * S / 2 + 3, py + j * S / 2 + 2.5, S / 2 - 6, 2);
        }
      } else {
        for (let k = 0; k < 5; k++) {
          ctx.fillStyle = mix(f1, f2, rng.f() * 0.7);
          ctx.beginPath(); ctx.ellipse(px + rng.f() * S, py + rng.f() * S, 7 + rng.f() * 6, 6 + rng.f() * 5, rng.f() * 3, 0, Math.PI * 2); ctx.fill();
        }
      }
      break;
    }
    case 'sand': case 'dirt': case 'snow': {
      ctx.fillStyle = f1; ctx.fillRect(px, py, S, S);
      for (let k = 0; k < 10; k++) { ctx.fillStyle = rgba(rng.f() < 0.5 ? f2 : '#ffffff', style === 'snow' ? 0.35 : 0.25); ctx.fillRect(px + rng.f() * S, py + rng.f() * S, 2, 2); }
      if (style === 'sand' && v < 0.4) { ctx.strokeStyle = rgba(f2, 0.6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, py + S * v * 2); ctx.quadraticCurveTo(px + S / 2, py + S * v * 2 - 6, px + S, py + S * v * 2); ctx.stroke(); }
      if (style === 'dirt' && v < 0.3) { ctx.fillStyle = rgba('#000', 0.18); ctx.beginPath(); ctx.ellipse(px + S * rng.f(), py + S * rng.f(), 5, 3, 0, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'metal': {
      ctx.fillStyle = (x + y) % 2 ? f1 : f2; ctx.fillRect(px, py, S, S);
      ctx.strokeStyle = rgba('#000000', 0.3); ctx.lineWidth = 1; ctx.strokeRect(px + 0.5, py + 0.5, S - 1, S - 1);
      ctx.fillStyle = rgba('#ffffff', 0.18);
      for (const [a, b] of [[5, 5], [S - 5, 5], [5, S - 5], [S - 5, S - 5]]) { ctx.beginPath(); ctx.arc(px + a, py + b, 1.6, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = rgba('#ffffff', 0.05); ctx.lineWidth = 2;
      for (let k = 8; k < S; k += 10) { ctx.beginPath(); ctx.moveTo(px + k, py + 10); ctx.lineTo(px + k + 4, py + 14); ctx.stroke(); }
      break;
    }
    case 'grass': {
      ctx.fillStyle = (x * 7 + y * 3) % 5 === 0 ? f2 : f1; ctx.fillRect(px, py, S, S);
      ctx.strokeStyle = rgba(shade(f1, 0.3).replace('rgb', 'rgb'), 1);
      ctx.strokeStyle = rgba('#ffffff', 0.1); ctx.lineWidth = 1.2;
      for (let k = 0; k < 7; k++) { const gx = px + rng.f() * S, gy = py + rng.f() * S; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + rng.f() * 3 - 1.5, gy - 5); ctx.stroke(); }
      ctx.fillStyle = rgba('#000', 0.08); for (let k = 0; k < 5; k++) ctx.fillRect(px + rng.f() * S, py + rng.f() * S, 2, 3);
      break;
    }
    case 'hex': {
      ctx.fillStyle = f2; ctx.fillRect(px, py, S, S);
      const r = S / 3.2;
      for (let j = -1; j < 3; j++) for (let i = -1; i < 3; i++) {
        const hx = px + i * r * 1.75 + (j % 2 ? r * 0.87 : 0), hy = py + j * r * 1.5;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k + Math.PI / 6; ctx.lineTo(hx + Math.cos(a) * r * 0.9, hy + Math.sin(a) * r * 0.9); }
        ctx.closePath(); ctx.fillStyle = mix(f1, f2, (i + j + 4) % 3 * 0.15); ctx.fill();
      }
      break;
    }
    case 'ice': {
      const g = ctx.createLinearGradient(px, py, px + S, py + S);
      g.addColorStop(0, f1); g.addColorStop(1, f2);
      ctx.fillStyle = g; ctx.fillRect(px, py, S, S);
      ctx.strokeStyle = rgba('#ffffff', 0.45); ctx.lineWidth = 1;
      if (v < 0.35) { ctx.beginPath(); ctx.moveTo(px + rng.f() * S, py); ctx.lineTo(px + rng.f() * S, py + S * 0.5); ctx.lineTo(px + rng.f() * S, py + S); ctx.stroke(); }
      ctx.strokeStyle = rgba('#ffffff', 0.18); ctx.beginPath(); ctx.moveTo(px + 4, py + S - 8); ctx.lineTo(px + 14, py + S - 18); ctx.stroke();
      break;
    }
    case 'grid': {
      ctx.fillStyle = f1; ctx.fillRect(px, py, S, S);
      ctx.strokeStyle = rgba(acc, 0.28); ctx.lineWidth = 1; ctx.strokeRect(px + 0.5, py + 0.5, S - 1, S - 1);
      if (v < 0.08) { ctx.fillStyle = rgba(acc, 0.25); ctx.fillRect(px + 2, py + 2, S - 4, S - 4); }
      break;
    }
    case 'cloud': {
      ctx.fillStyle = f2; ctx.fillRect(px, py, S, S);
      for (let k = 0; k < 4; k++) { ctx.fillStyle = rgba(rng.f() < 0.5 ? f1 : '#ffffff', 0.45); ctx.beginPath(); ctx.arc(px + rng.f() * S, py + rng.f() * S, 8 + rng.f() * 10, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'tatami': {
      ctx.fillStyle = f1; ctx.fillRect(px, py, S, S);
      ctx.strokeStyle = rgba(f2, 0.9); ctx.lineWidth = 1;
      for (let k = 3; k < S; k += 4) { ctx.beginPath(); ctx.moveTo(px, py + k); ctx.lineTo(px + S, py + k); ctx.stroke(); }
      ctx.fillStyle = '#3a2a1a';
      if ((x + y * 2) % 2 === 0) ctx.fillRect(px, py, 3, S); else ctx.fillRect(px, py, S, 3);
      break;
    }
    case 'tile': default: {
      ctx.fillStyle = mix(f1, f2, rng.f() * 0.5); ctx.fillRect(px, py, S, S);
      ctx.strokeStyle = rgba('#000000', 0.18); ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, S / 2 - 1, S / 2 - 1); ctx.strokeRect(px + S / 2, py + 1, S / 2 - 1, S / 2 - 1);
      ctx.strokeRect(px + 1, py + S / 2, S / 2 - 1, S / 2 - 1); ctx.strokeRect(px + S / 2, py + S / 2, S / 2 - 1, S / 2 - 1);
      ctx.fillStyle = rgba('#ffffff', 0.08); ctx.fillRect(px + 3, py + 3, S / 2 - 6, 2);
    }
  }
}

function drawWallTile(ctx, theme, x, y, isWall, rng) {
  const [wt, ws] = theme.wc;
  const px = x * TS, py = y * TS;
  const below = !isWall(x, y + 1);
  const face = below ? TS * 0.42 : 0;
  const topH = TS - face;
  const style = theme.w;
  // top face
  const g = ctx.createLinearGradient(0, py, 0, py + topH);
  g.addColorStop(0, shade(wt, 0.08)); g.addColorStop(1, shade(wt, -0.08));
  ctx.fillStyle = g;
  ctx.fillRect(px, py, TS, topH + 0.5);
  // top texture
  switch (style) {
    case 'hedge': for (let k = 0; k < 6; k++) { ctx.fillStyle = rgba(rng.f() < 0.5 ? '#ffffff' : '#000000', 0.1); ctx.beginPath(); ctx.arc(px + rng.f() * TS, py + rng.f() * topH, 5 + rng.f() * 5, 0, Math.PI * 2); ctx.fill(); } break;
    case 'rock': for (let k = 0; k < 3; k++) { ctx.fillStyle = rgba('#000000', 0.12); ctx.beginPath(); ctx.ellipse(px + rng.f() * TS, py + rng.f() * topH, 7, 4, rng.f() * 3, 0, Math.PI * 2); ctx.fill(); } break;
    case 'crystal': ctx.strokeStyle = rgba('#ffffff', 0.35); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, py + topH * rng.f()); ctx.lineTo(px + TS * rng.f(), py); ctx.moveTo(px + TS, py + topH * rng.f()); ctx.lineTo(px + TS * rng.f(), py + topH); ctx.stroke(); break;
    case 'candy': case 'stripe': ctx.save(); ctx.beginPath(); ctx.rect(px, py, TS, topH); ctx.clip(); ctx.fillStyle = rgba(ws, 0.9); for (let k = -2; k < 4; k++) { ctx.beginPath(); ctx.moveTo(px + k * 16, py); ctx.lineTo(px + k * 16 + 8, py); ctx.lineTo(px + k * 16 + 8 + topH, py + topH); ctx.lineTo(px + k * 16 + topH, py + topH); ctx.fill(); } ctx.restore(); break;
    case 'neon': ctx.fillStyle = shade(wt, -0.3); ctx.fillRect(px + 3, py + 3, TS - 6, topH - 6); break;
    case 'cloud': ctx.fillStyle = rgba('#ffffff', 0.6); ctx.beginPath(); ctx.arc(px + TS * 0.3, py + topH * 0.5, 10, 0, Math.PI * 2); ctx.arc(px + TS * 0.7, py + topH * 0.45, 12, 0, Math.PI * 2); ctx.fill(); break;
    case 'ice': ctx.fillStyle = rgba('#ffffff', 0.25); ctx.fillRect(px + 4, py + 4, 4, topH - 8); break;
    default: ctx.fillStyle = rgba('#000000', 0.06); if ((x + y) % 2) ctx.fillRect(px, py, TS, topH);
  }
  // rim highlights where top meets open floor
  ctx.fillStyle = rgba('#ffffff', 0.16);
  if (!isWall(x, y - 1)) ctx.fillRect(px, py, TS, 2);
  ctx.fillStyle = rgba('#000000', 0.25);
  if (!isWall(x - 1, y)) ctx.fillRect(px, py, 2, topH);
  if (!isWall(x + 1, y)) ctx.fillRect(px + TS - 2, py, 2, topH);

  if (!below) return;
  // front face
  const fy = py + topH;
  const fg = ctx.createLinearGradient(0, fy, 0, py + TS);
  fg.addColorStop(0, shade(ws, 0.1)); fg.addColorStop(1, shade(ws, -0.3));
  ctx.fillStyle = fg;
  ctx.fillRect(px, fy, TS, face);
  ctx.save(); ctx.beginPath(); ctx.rect(px, fy, TS, face); ctx.clip();
  switch (style) {
    case 'brick': case 'stone': {
      ctx.strokeStyle = rgba('#000000', 0.3); ctx.lineWidth = 1.5;
      const rows = 2, rh = face / rows;
      for (let r = 0; r < rows; r++) {
        ctx.beginPath(); ctx.moveTo(px, fy + r * rh); ctx.lineTo(px + TS, fy + r * rh); ctx.stroke();
        const off = (r + x) % 2 ? TS / 2 : TS / 4;
        const bw = style === 'brick' ? TS / 2 : TS * 0.75;
        for (let bx = off; bx < TS; bx += bw) { ctx.beginPath(); ctx.moveTo(px + bx, fy + r * rh); ctx.lineTo(px + bx, fy + (r + 1) * rh); ctx.stroke(); }
      }
      break;
    }
    case 'wood': ctx.strokeStyle = rgba('#000000', 0.3); ctx.lineWidth = 1; for (let k = 0; k < TS; k += 8) { ctx.beginPath(); ctx.moveTo(px + k, fy); ctx.lineTo(px + k, fy + face); ctx.stroke(); } break;
    case 'metal': ctx.fillStyle = rgba('#ffffff', 0.15); ctx.fillRect(px, fy + 3, TS, 2); ctx.fillStyle = rgba('#000', 0.3); ctx.fillRect(px + TS - 1, fy, 1, face); for (const k of [6, TS - 6]) { ctx.fillStyle = rgba('#fff', 0.3); ctx.beginPath(); ctx.arc(px + k, fy + face / 2, 1.5, 0, 7); ctx.fill(); } break;
    case 'paper': ctx.fillStyle = '#f4ecd8'; ctx.fillRect(px + 3, fy + 3, TS - 6, face - 6); ctx.strokeStyle = shade(ws, -0.2); ctx.lineWidth = 1.5; ctx.strokeRect(px + 3, fy + 3, TS - 6, face - 6); ctx.beginPath(); ctx.moveTo(px + TS / 2, fy + 3); ctx.lineTo(px + TS / 2, fy + face - 3); ctx.stroke(); break;
    case 'neon': ctx.shadowColor = theme.acc; ctx.shadowBlur = 8; ctx.fillStyle = theme.acc; ctx.fillRect(px, fy + 2, TS, 2); ctx.fillRect(px, fy + face - 4, TS, 1.5); break;
    case 'candy': case 'stripe': ctx.fillStyle = rgba('#ffffff', 0.7); for (let k = -2; k < 5; k++) { ctx.beginPath(); ctx.moveTo(px + k * 14, fy); ctx.lineTo(px + k * 14 + 7, fy); ctx.lineTo(px + k * 14 + 7 + face, fy + face); ctx.lineTo(px + k * 14 + face, fy + face); ctx.fill(); } break;
    case 'hedge': for (let k = 0; k < 5; k++) { ctx.fillStyle = rgba('#000', 0.15); ctx.beginPath(); ctx.arc(px + rng.f() * TS, fy + rng.f() * face, 5, 0, 7); ctx.fill(); } break;
    case 'crystal': case 'ice': ctx.fillStyle = rgba('#ffffff', 0.25); ctx.beginPath(); ctx.moveTo(px + 6, fy + face); ctx.lineTo(px + 14, fy); ctx.lineTo(px + 20, fy); ctx.lineTo(px + 12, fy + face); ctx.fill(); break;
    default: ctx.fillStyle = rgba('#000', 0.1); ctx.fillRect(px, fy + face - 4, TS, 4);
  }
  ctx.restore();
  ctx.fillStyle = rgba('#000000', 0.45); ctx.fillRect(px, py + TS - 2, TS, 2);
}
