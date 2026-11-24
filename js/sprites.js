import { TS, shade, rgba } from './util.js';
import { drawHead, impliedHat } from './art-chars.js';

export const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
const cache = new Map();

export function emojiCanvas(e, size) {
  const px = Math.max(8, Math.round(size * 2));
  const key = e + '|' + px;
  let c = cache.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  const dim = Math.ceil(px * 1.35);
  c.width = c.height = dim;
  const x = c.getContext('2d');
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.font = `${px}px ${EMOJI_FONT}`;
  x.fillText(e, dim / 2, dim / 2 + px * 0.06);
  cache.set(key, c);
  return c;
}

export function drawEmoji(ctx, e, x, y, size, rot = 0, alpha = 1, flipX = false) {
  if (e === 'MUMMY') { drawMummyHead(ctx, x, y, size); return; }
  const c = emojiCanvas(e, size);
  const d = (c.width / 2) * (size / (c.width / 1.35));
  ctx.save();
  if (alpha !== 1) ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(c, -d, -d, d * 2, d * 2);
  ctx.restore();
}

export function drawMummyHead(ctx, x, y, size) {
  const r = size * 0.42;
  ctx.save();
  ctx.translate(x, y);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.2, 0, 0, r);
  g.addColorStop(0, '#f6ecd2'); g.addColorStop(1, '#c4b38a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(120,100,60,0.55)'; ctx.lineWidth = Math.max(1, r * 0.12);
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(-r, i * r * 0.32 - r * 0.15); ctx.lineTo(r, i * r * 0.32 + r * 0.2); ctx.stroke(); }
  ctx.fillStyle = '#2a1d10';
  ctx.fillRect(-r, -r * 0.18, r * 2, r * 0.36);
  ctx.restore();
  ctx.fillStyle = '#ffe04a';
  ctx.shadowColor = '#ffd000'; ctx.shadowBlur = r * 0.6;
  ctx.beginPath(); ctx.arc(-r * 0.35, 0, r * 0.13, 0, Math.PI * 2); ctx.arc(r * 0.35, 0, r * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// --------------------------------------------------------------- hats
export function drawHat(ctx, hat, x, y, s, t = 0) {
  if (!hat) return;
  ctx.save();
  ctx.translate(x, y);
  const r = s * 0.5;
  const P = (f) => { ctx.beginPath(); f(); };
  switch (hat) {
    case 'cowboy': {
      ctx.fillStyle = '#7a4a22';
      P(() => ctx.ellipse(0, -r * 0.55, r * 1.15, r * 0.32, 0, 0, Math.PI * 2)); ctx.fill();
      ctx.fillStyle = '#8f5a2c';
      P(() => { ctx.moveTo(-r * 0.6, -r * 0.55); ctx.quadraticCurveTo(-r * 0.6, -r * 1.25, 0, -r * 1.1); ctx.quadraticCurveTo(r * 0.6, -r * 1.25, r * 0.6, -r * 0.55); }); ctx.fill();
      ctx.fillStyle = '#3a2210'; ctx.fillRect(-r * 0.6, -r * 0.72, r * 1.2, r * 0.14);
      break;
    }
    case 'pirate': {
      ctx.fillStyle = '#1a1a1a';
      P(() => { ctx.moveTo(-r * 1.05, -r * 0.5); ctx.quadraticCurveTo(0, -r * 1.6, r * 1.05, -r * 0.5); ctx.quadraticCurveTo(0, -r * 0.8, -r * 1.05, -r * 0.5); }); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `${r * 0.55}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('☠', 0, -r * 0.78);
      break;
    }
    case 'helmet': case 'samurai': {
      ctx.fillStyle = hat === 'samurai' ? '#5a1010' : '#a8afba';
      P(() => ctx.arc(0, -r * 0.2, r * 0.95, Math.PI, 0)); ctx.fill();
      ctx.fillStyle = hat === 'samurai' ? '#d4af37' : '#6a717c';
      ctx.fillRect(-r * 0.95, -r * 0.25, r * 1.9, r * 0.14);
      if (hat === 'samurai') { P(() => { ctx.moveTo(-r * 0.5, -r * 1.1); ctx.lineTo(0, -r * 0.7); ctx.lineTo(r * 0.5, -r * 1.1); ctx.lineTo(0, -r * 0.9); }); ctx.fill(); }
      break;
    }
    case 'wizard': case 'witch': case 'gnome': case 'elf': {
      const col = hat === 'wizard' ? '#3a2a9a' : hat === 'witch' ? '#1a1024' : hat === 'gnome' ? '#c81e1e' : '#1f8a3a';
      ctx.fillStyle = col;
      if (hat !== 'elf' && hat !== 'gnome') { P(() => ctx.ellipse(0, -r * 0.5, r * 1.05, r * 0.25, 0, 0, Math.PI * 2)); ctx.fill(); }
      P(() => { ctx.moveTo(-r * 0.6, -r * 0.5); ctx.quadraticCurveTo(r * 0.1, -r * 1.4, r * 0.45 + Math.sin(t * 3) * r * 0.1, -r * 2.0); ctx.lineTo(r * 0.6, -r * 0.5); }); ctx.fill();
      if (hat === 'wizard') { ctx.fillStyle = '#ffd84a'; ctx.font = `${r * 0.5}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('★', 0, -r * 0.8); }
      if (hat === 'elf') { ctx.fillStyle = '#fff'; P(() => ctx.arc(r * 0.45, -r * 2, r * 0.18, 0, Math.PI * 2)); ctx.fill(); }
      if (hat === 'witch') { ctx.fillStyle = '#7a3ad0'; ctx.fillRect(-r * 0.55, -r * 0.7, r * 1.1, r * 0.14); }
      break;
    }
    case 'nemes': {
      // striped Egyptian headdress behind/around head
      ctx.fillStyle = '#d4af37';
      P(() => { ctx.moveTo(-r * 0.95, -r * 0.3); ctx.quadraticCurveTo(0, -r * 1.35, r * 0.95, -r * 0.3); ctx.lineTo(r * 1.0, r * 0.8); ctx.lineTo(r * 0.6, r * 0.8); ctx.lineTo(r * 0.55, -r * 0.1); ctx.lineTo(-r * 0.55, -r * 0.1); ctx.lineTo(-r * 0.6, r * 0.8); ctx.lineTo(-r * 1.0, r * 0.8); ctx.closePath(); }); ctx.fill();
      ctx.strokeStyle = '#1e3f8a'; ctx.lineWidth = r * 0.1;
      for (let i = -2; i <= 2; i++) { P(() => { ctx.moveTo(i * r * 0.35, -r * 1.0); ctx.lineTo(i * r * 0.45, -r * 0.2); }); ctx.stroke(); }
      ctx.fillStyle = '#1e3f8a'; ctx.fillRect(-r, r * 0.3, r * 0.4, r * 0.12); ctx.fillRect(r * 0.6, r * 0.3, r * 0.4, r * 0.12);
      break;
    }
    case 'sun': {
      ctx.fillStyle = '#ff4a1a'; ctx.shadowColor = '#ffb000'; ctx.shadowBlur = r * 0.8;
      P(() => ctx.arc(0, -r * 1.25, r * 0.45, 0, Math.PI * 2)); ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = '#d4af37'; ctx.lineWidth = r * 0.1;
      P(() => ctx.arc(0, -r * 1.25, r * 0.5, 0, Math.PI * 2)); ctx.stroke();
      break;
    }
    case 'moon': {
      ctx.fillStyle = '#e8e8ff'; ctx.shadowColor = '#a0c0ff'; ctx.shadowBlur = r * 0.6;
      P(() => { ctx.arc(0, -r * 1.2, r * 0.42, 0, Math.PI * 2); }); ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      P(() => ctx.arc(r * 0.18, -r * 1.3, r * 0.35, 0, Math.PI * 2)); ctx.fill();
      break;
    }
    case 'laurel': {
      ctx.strokeStyle = '#d4af37'; ctx.lineWidth = r * 0.14;
      P(() => ctx.arc(0, -r * 0.1, r * 0.78, Math.PI * 1.05, Math.PI * 1.95)); ctx.stroke();
      ctx.fillStyle = '#e8c24a';
      for (let i = 0; i < 7; i++) { const a = Math.PI * (1.08 + i * 0.13); P(() => ctx.ellipse(Math.cos(a) * r * 0.8, -r * 0.1 + Math.sin(a) * r * 0.8, r * 0.18, r * 0.08, a + 1.2, 0, Math.PI * 2)); ctx.fill(); }
      break;
    }
    case 'crown': {
      ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = '#a07a10'; ctx.lineWidth = 1;
      P(() => { ctx.moveTo(-r * 0.7, -r * 0.55); ctx.lineTo(-r * 0.7, -r * 1.15); ctx.lineTo(-r * 0.35, -r * 0.85); ctx.lineTo(0, -r * 1.3); ctx.lineTo(r * 0.35, -r * 0.85); ctx.lineTo(r * 0.7, -r * 1.15); ctx.lineTo(r * 0.7, -r * 0.55); ctx.closePath(); }); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e0204a'; P(() => ctx.arc(0, -r * 0.75, r * 0.12, 0, Math.PI * 2)); ctx.fill();
      break;
    }

    case 'police': case 'pilot': case 'captain2': case 'cap': case 'fire': case 'nurse': {
      const col = { police: '#1e2e5a', pilot: '#1a1a2a', cap: '#c03030', fire: '#c02020', nurse: '#ffffff' }[hat];
      if (hat === 'nurse') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.6); ctx.lineTo(r * 0.6, -r * 0.6); ctx.lineTo(r * 0.45, -r * 1.05); ctx.lineTo(-r * 0.45, -r * 1.05); ctx.fill(); ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#e02a3a'; ctx.fillRect(-r * 0.05, -r * 0.98, r * 0.1, r * 0.3); ctx.fillRect(-r * 0.15, -r * 0.88, r * 0.3, r * 0.1); break; }
      if (hat === 'fire') { ctx.fillStyle = col; P(() => ctx.ellipse(0, -r * 0.55, r * 1.15, r * 0.3, 0, 0, Math.PI * 2)); ctx.fill(); P(() => ctx.arc(0, -r * 0.55, r * 0.75, Math.PI, 0)); ctx.fill(); ctx.fillStyle = '#ffd040'; ctx.fillRect(-r * 0.15, -r * 1.2, r * 0.3, r * 0.4); break; }
      ctx.fillStyle = shade(col, -0.2); P(() => ctx.ellipse(0, -r * 0.5, r * 0.9, r * 0.2, 0, 0, Math.PI)); ctx.fill();
      ctx.fillStyle = col; P(() => { ctx.moveTo(-r * 0.9, -r * 0.55); ctx.quadraticCurveTo(-r * 1.0, -r * 1.25, 0, -r * 1.2); ctx.quadraticCurveTo(r * 1.0, -r * 1.25, r * 0.9, -r * 0.55); ctx.closePath(); }); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillRect(-r * 0.9, -r * 0.62, r * 1.8, r * 0.12);
      if (hat !== 'cap') { ctx.fillStyle = '#ffd040'; P(() => { for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.08 : r * 0.18; ctx.lineTo(Math.cos(a) * rr, -r * 0.88 + Math.sin(a) * rr); } }); ctx.fill(); }
      break;
    }
    case 'chef': { ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.2; ctx.fillRect(-r * 0.62, -r * 0.95, r * 1.24, r * 0.4); ctx.strokeRect(-r * 0.62, -r * 0.95, r * 1.24, r * 0.4); for (const [a, b, q] of [[-0.45, -1.15, 0.4], [0.45, -1.15, 0.4], [0, -1.35, 0.5]]) { P(() => ctx.arc(a * r, b * r, q * r, 0, Math.PI * 2)); ctx.fill(); ctx.stroke(); } break; }
    case 'bearskin': { const g = ctx.createLinearGradient(0, -r * 2.1, 0, -r * 0.4); g.addColorStop(0, '#2a2a2a'); g.addColorStop(1, '#0a0a0a'); ctx.fillStyle = g; P(() => ctx.ellipse(0, -r * 1.15, r * 0.85, r * 1.0, 0, 0, Math.PI * 2)); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 2; for (let k = -3; k <= 3; k++) { P(() => { ctx.moveTo(k * r * 0.2, -r * 2.0); ctx.lineTo(k * r * 0.22, -r * 0.5); }); ctx.stroke(); } ctx.fillStyle = '#d4af37'; ctx.fillRect(-r * 0.05, -r * 0.6, r * 0.1, r * 1.2); break; }
    case 'astro': { ctx.fillStyle = 'rgba(190,230,255,.28)'; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; P(() => ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2)); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.55)'; P(() => ctx.ellipse(-r * 0.5, -r * 0.6, r * 0.25, r * 0.12, -0.6, 0, Math.PI * 2)); ctx.fill(); ctx.fillStyle = '#d0d6e0'; ctx.fillRect(-r * 0.9, r * 0.95, r * 1.8, r * 0.22); break; }
    case 'tiara': { ctx.fillStyle = '#ffd84a'; P(() => { ctx.moveTo(-r * 0.6, -r * 0.7); ctx.lineTo(-r * 0.4, -r * 0.95); ctx.lineTo(-r * 0.2, -r * 0.8); ctx.lineTo(0, -r * 1.15); ctx.lineTo(r * 0.2, -r * 0.8); ctx.lineTo(r * 0.4, -r * 0.95); ctx.lineTo(r * 0.6, -r * 0.7); ctx.closePath(); }); ctx.fill(); ctx.fillStyle = '#ff5ab0'; P(() => ctx.arc(0, -r * 0.9, r * 0.1, 0, Math.PI * 2)); ctx.fill(); break; }
    case 'santa': case 'nightcap': { const col = hat === 'santa' ? '#d01a2a' : '#5a6ad0'; ctx.fillStyle = col; P(() => { ctx.moveTo(-r * 0.85, -r * 0.5); ctx.quadraticCurveTo(-r * 0.2, -r * 1.6, r * 0.9 + Math.sin(t * 2) * r * 0.1, -r * 1.0); ctx.lineTo(r * 0.85, -r * 0.5); }); ctx.fill(); ctx.fillStyle = '#fff'; P(() => ctx.ellipse(0, -r * 0.55, r * 0.95, r * 0.2, 0, 0, Math.PI * 2)); ctx.fill(); P(() => ctx.arc(r * 0.9 + Math.sin(t * 2) * r * 0.1, -r * 1.0, r * 0.18, 0, Math.PI * 2)); ctx.fill(); break; }
    case 'ninja': { ctx.fillStyle = '#1a1a24'; P(() => { ctx.arc(0, 0, r * 1.02, Math.PI * 1.02, Math.PI * 1.98); ctx.lineTo(r * 1.0, -r * 0.25); ctx.lineTo(-r * 1.0, -r * 0.25); }); ctx.fill(); P(() => { ctx.arc(0, 0, r * 1.02, 0.12, Math.PI - 0.12); ctx.lineTo(-r * 1.0, r * 0.18); ctx.lineTo(r * 1.0, r * 0.18); }); ctx.fill(); ctx.fillStyle = '#c02a2a'; ctx.fillRect(-r * 1.0, -r * 0.4, r * 2.0, r * 0.12); P(() => { ctx.moveTo(r * 0.95, -r * 0.35); ctx.lineTo(r * 1.4, -r * 0.1 + Math.sin(t * 6) * r * 0.1); ctx.lineTo(r * 1.35, -r * 0.4); }); ctx.fill(); break; }
    case 'straw': { ctx.fillStyle = '#e8c870'; P(() => ctx.ellipse(0, -r * 0.55, r * 1.3, r * 0.3, 0, 0, Math.PI * 2)); ctx.fill(); P(() => ctx.ellipse(0, -r * 0.8, r * 0.6, r * 0.4, 0, 0, Math.PI * 2)); ctx.fill(); ctx.fillStyle = '#c03030'; ctx.fillRect(-r * 0.6, -r * 0.7, r * 1.2, r * 0.1); break; }
    case 'towel': case 'scarf': { const col = hat === 'towel' ? '#f8f4ff' : '#2a7a6a'; ctx.fillStyle = col; P(() => { ctx.arc(0, -r * 0.05, r * 1.08, Math.PI * 0.95, Math.PI * 2.05); ctx.quadraticCurveTo(r * 0.6, -r * 0.6, 0, -r * 0.55); ctx.quadraticCurveTo(-r * 0.6, -r * 0.6, -r * 1.07, -r * 0.0); }); ctx.fill(); if (hat === 'scarf') { P(() => { ctx.moveTo(-r * 1.05, -r * 0.1); ctx.quadraticCurveTo(-r * 1.2, r * 0.8, -r * 0.4, r * 1.05); ctx.lineTo(r * 0.4, r * 1.05); ctx.quadraticCurveTo(r * 1.2, r * 0.8, r * 1.05, -r * 0.1); ctx.lineTo(r * 0.85, -r * 0.05); ctx.quadraticCurveTo(r * 0.9, r * 0.8, 0, r * 0.95); ctx.quadraticCurveTo(-r * 0.9, r * 0.8, -r * 0.85, -r * 0.05); }); ctx.fill(); } else { P(() => ctx.ellipse(0, -r * 1.05, r * 0.6, r * 0.3, 0, 0, Math.PI * 2)); ctx.fill(); } break; }
    case 'halo': { ctx.strokeStyle = '#ffe070'; ctx.lineWidth = r * 0.15; ctx.shadowColor = '#fff0a0'; ctx.shadowBlur = r; P(() => ctx.ellipse(0, -r * 1.3 + Math.sin(t * 2) * r * 0.06, r * 0.6, r * 0.18, 0, 0, Math.PI * 2)); ctx.stroke(); break; }
    case 'diving': { ctx.strokeStyle = '#2a2a32'; ctx.lineWidth = r * 0.12; P(() => ctx.ellipse(0, -r * 0.1, r * 0.75, r * 0.45, 0, 0, Math.PI * 2)); ctx.stroke(); ctx.fillStyle = 'rgba(160,220,255,.35)'; ctx.fill(); ctx.fillStyle = '#ffd040'; ctx.fillRect(r * 0.75, -r * 1.1, r * 0.15, r * 1.0); break; }
    case 'headphones': { ctx.strokeStyle = '#2a2a32'; ctx.lineWidth = r * 0.15; P(() => ctx.arc(0, -r * 0.1, r * 1.0, Math.PI * 1.05, Math.PI * 1.95)); ctx.stroke(); for (const sd of [-1, 1]) { ctx.fillStyle = '#e03a5a'; P(() => ctx.ellipse(sd * r * 0.98, 0, r * 0.22, r * 0.32, 0, 0, Math.PI * 2)); ctx.fill(); } break; }
    case 'jester': { const cols = ['#e03a3a', '#3a6ad0']; for (const sd of [-1, 1]) { ctx.fillStyle = cols[sd > 0 ? 1 : 0]; P(() => { ctx.moveTo(0, -r * 0.6); ctx.quadraticCurveTo(sd * r * 0.9, -r * 1.6, sd * r * 1.3, -r * 0.9 + Math.sin(t * 4 + sd) * r * 0.1); ctx.quadraticCurveTo(sd * r * 0.8, -r * 0.8, sd * r * 0.9, -r * 0.45); }); ctx.fill(); ctx.fillStyle = '#ffd040'; P(() => ctx.arc(sd * r * 1.3, -r * 0.9 + Math.sin(t * 4 + sd) * r * 0.1, r * 0.14, 0, Math.PI * 2)); ctx.fill(); } break; }
    case 'winged': { ctx.fillStyle = '#d4af37'; P(() => ctx.arc(0, -r * 0.4, r * 0.9, Math.PI, 0)); ctx.fill(); for (const sd of [-1, 1]) { ctx.fillStyle = '#fff'; P(() => { ctx.moveTo(sd * r * 0.8, -r * 0.6); ctx.quadraticCurveTo(sd * r * 1.6, -r * 1.3 + Math.sin(t * 8) * r * 0.15, sd * r * 1.5, -r * 0.4); ctx.closePath(); }); ctx.fill(); } break; }
    case 'shellcrown': { for (let k = -2; k <= 2; k++) { ctx.fillStyle = k % 2 ? '#ffb0c8' : '#ffe0a0'; P(() => ctx.ellipse(k * r * 0.32, -r * 0.85 - (2 - Math.abs(k)) * r * 0.08, r * 0.17, r * 0.22, k * 0.2, 0, Math.PI * 2)); ctx.fill(); } break; }
    case 'grad': { ctx.fillStyle = '#1a1a24'; P(() => ctx.arc(0, -r * 0.55, r * 0.65, Math.PI, 0)); ctx.fill(); P(() => { ctx.moveTo(-r * 1.1, -r * 0.95); ctx.lineTo(0, -r * 1.3); ctx.lineTo(r * 1.1, -r * 0.95); ctx.lineTo(0, -r * 0.6); ctx.closePath(); }); ctx.fill(); ctx.strokeStyle = '#ffd040'; ctx.lineWidth = r * 0.07; P(() => { ctx.moveTo(0, -r * 0.95); ctx.lineTo(r * 0.8, -r * 0.8); ctx.lineTo(r * 0.85, -r * 0.4 + Math.sin(t * 3) * r * 0.05); }); ctx.stroke(); break; }
    case 'party': { const g = ctx.createLinearGradient(-r * 0.5, 0, r * 0.5, 0); g.addColorStop(0, '#ff5ab0'); g.addColorStop(1, '#5ad0ff'); ctx.fillStyle = g; P(() => { ctx.moveTo(-r * 0.5, -r * 0.6); ctx.lineTo(0, -r * 1.9); ctx.lineTo(r * 0.5, -r * 0.6); ctx.closePath(); }); ctx.fill(); ctx.fillStyle = '#ffe040'; for (let k = 0; k < 3; k++) { P(() => ctx.arc(-r * 0.2 + k * r * 0.2, -r * 0.85 - k * r * 0.3, r * 0.07, 0, Math.PI * 2)); ctx.fill(); } P(() => ctx.arc(0, -r * 1.95, r * 0.15, 0, Math.PI * 2)); ctx.fill(); break; }
    case 'bow': { ctx.fillStyle = '#ff4a8a'; for (const sd of [-1, 1]) { P(() => { ctx.moveTo(r * 0.3, -r * 0.85); ctx.lineTo(r * 0.3 + sd * r * 0.5, -r * 1.15); ctx.lineTo(r * 0.3 + sd * r * 0.5, -r * 0.55); ctx.closePath(); }); ctx.fill(); } P(() => ctx.arc(r * 0.3, -r * 0.85, r * 0.13, 0, Math.PI * 2)); ctx.fill(); break; }
    case 'beret': case 'fedora': case 'tophat': case 'captain': case 'sailor': case 'beanie': case 'trucker': case 'hardhat': case 'miner': case 'ranger': case 'aviator': case 'robin': case 'headband': case 'turban': case 'sombrero': case 'viking': case 'feather': case 'shades': {
      const cols = { beret: '#1a1a1a', fedora: '#3a3030', tophat: '#151515', captain: '#f4f4f4', sailor: '#ffffff', beanie: '#2a4a8a', trucker: '#c03030', hardhat: '#f2c21a', miner: '#e0a020', ranger: '#8a7a4a', aviator: '#6a4a2a', robin: '#2a7a2a', headband: '#d02020', turban: '#e0a040', sombrero: '#c8a050', viking: '#9aa0a8', feather: '#2aa07a', shades: '#000' };
      ctx.fillStyle = cols[hat];
      if (hat === 'shades') { ctx.fillRect(-r * 0.6, -r * 0.12, r * 1.2, r * 0.22); break; }
      if (hat === 'headband') { ctx.fillRect(-r * 0.85, -r * 0.5, r * 1.7, r * 0.2); P(() => { ctx.moveTo(r * 0.8, -r * 0.45); ctx.lineTo(r * 1.2, -r * 0.2 + Math.sin(t * 6) * r * 0.1); ctx.lineTo(r * 1.15, -r * 0.5); }); ctx.fill(); break; }
      if (hat === 'sombrero') { P(() => ctx.ellipse(0, -r * 0.55, r * 1.5, r * 0.35, 0, 0, Math.PI * 2)); ctx.fill(); ctx.fillStyle = '#b08a40'; P(() => ctx.ellipse(0, -r * 0.85, r * 0.55, r * 0.45, 0, 0, Math.PI * 2)); ctx.fill(); ctx.strokeStyle = '#c02a2a'; ctx.lineWidth = r * 0.1; P(() => ctx.ellipse(0, -r * 0.55, r * 1.3, r * 0.28, 0, 0, Math.PI * 2)); ctx.stroke(); break; }
      if (hat === 'turban') { P(() => ctx.ellipse(0, -r * 0.65, r * 0.85, r * 0.55, 0, 0, Math.PI * 2)); ctx.fill(); ctx.fillStyle = '#c02a4a'; P(() => ctx.arc(0, -r * 0.7, r * 0.14, 0, Math.PI * 2)); ctx.fill(); break; }
      if (hat === 'tophat') { ctx.fillRect(-r * 0.9, -r * 0.62, r * 1.8, r * 0.16); ctx.fillRect(-r * 0.55, -r * 1.5, r * 1.1, r * 0.92); ctx.fillStyle = '#a01a2a'; ctx.fillRect(-r * 0.55, -r * 0.8, r * 1.1, r * 0.14); break; }
      if (hat === 'viking') { P(() => ctx.arc(0, -r * 0.3, r * 0.85, Math.PI, 0)); ctx.fill(); ctx.fillStyle = '#f0e6cc'; P(() => { ctx.moveTo(-r * 0.8, -r * 0.5); ctx.quadraticCurveTo(-r * 1.4, -r * 0.8, -r * 1.2, -r * 1.5); ctx.quadraticCurveTo(-r * 1.0, -r * 0.9, -r * 0.6, -r * 0.8); }); ctx.fill(); P(() => { ctx.moveTo(r * 0.8, -r * 0.5); ctx.quadraticCurveTo(r * 1.4, -r * 0.8, r * 1.2, -r * 1.5); ctx.quadraticCurveTo(r * 1.0, -r * 0.9, r * 0.6, -r * 0.8); }); ctx.fill(); break; }
      if (hat === 'feather') { ctx.fillStyle = '#2aa07a'; for (let i = -2; i <= 2; i++) { P(() => ctx.ellipse(i * r * 0.3, -r * 1.0, r * 0.13, r * 0.5, i * 0.25, 0, Math.PI * 2)); ctx.fill(); ctx.fillStyle = i % 2 ? '#e0402a' : '#2aa07a'; } ctx.fillStyle = '#d4af37'; ctx.fillRect(-r * 0.8, -r * 0.62, r * 1.6, r * 0.16); break; }
      // generic brimmed cap / hat
      const brimW = hat === 'beret' || hat === 'beanie' ? 0 : hat === 'fedora' || hat === 'ranger' || hat === 'robin' ? 1.15 : 0.95;
      if (brimW) { P(() => ctx.ellipse(0, -r * 0.55, r * brimW, r * 0.22, 0, 0, Math.PI * 2)); ctx.fill(); }
      P(() => ctx.ellipse(0, -r * 0.75, r * (hat === 'beret' ? 0.9 : 0.68), r * 0.42, hat === 'beret' ? -0.2 : 0, 0, Math.PI * 2)); ctx.fill();
      if (hat === 'captain' || hat === 'sailor') { ctx.fillStyle = '#1a2a4a'; ctx.fillRect(-r * 0.68, -r * 0.62, r * 1.36, r * 0.14); if (hat === 'captain') { ctx.fillStyle = '#d4af37'; P(() => ctx.arc(0, -r * 0.82, r * 0.12, 0, Math.PI * 2)); ctx.fill(); } }
      if (hat === 'miner') { ctx.fillStyle = '#fffbd0'; ctx.shadowColor = '#fff6a0'; ctx.shadowBlur = r; P(() => ctx.arc(0, -r * 0.8, r * 0.16, 0, Math.PI * 2)); ctx.fill(); }
      if (hat === 'robin') { ctx.fillStyle = '#e03a2a'; P(() => ctx.ellipse(r * 0.6, -r * 1.05, r * 0.08, r * 0.45, 0.6, 0, Math.PI * 2)); ctx.fill(); }
      if (hat === 'fedora') { ctx.fillStyle = '#111'; ctx.fillRect(-r * 0.68, -r * 0.7, r * 1.36, r * 0.12); }
      if (hat === 'aviator') { ctx.fillStyle = '#9ad0f0'; P(() => { ctx.arc(-r * 0.3, -r * 0.6, r * 0.18, 0, Math.PI * 2); ctx.arc(r * 0.3, -r * 0.6, r * 0.18, 0, Math.PI * 2); }); ctx.fill(); }
      break;
    }
  }
  ctx.restore();
}

// --------------------------------------------------------------- characters
// o: {x,y,ang,walk,body,head,hat,size,guard,light,sack,alpha,crouch,hound,tint,cosHat,t}
export function drawCharacter(ctx, o) {
  const s = (o.size || 1) * TS;
  const { x, y } = o;
  const ang = o.ang || 0;
  const walk = o.walk || 0;
  const crouch = o.crouch ? 0.88 : 1;
  ctx.save();
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(x, y + s * 0.12, s * 0.34, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(crouch, crouch);
  const step = Math.sin(walk) * s * 0.12;
  if (o.hound) {
    // four-legged blob body with tail
    ctx.fillStyle = shade(o.body || '#6a5040', -0.25);
    for (const [fx, fy] of [[0.22, -0.16], [0.22, 0.16], [-0.2, -0.16], [-0.2, 0.16]]) {
      ctx.beginPath(); ctx.ellipse(s * fx + (fx > 0 ? step : -step) * (fy > 0 ? 1 : -1), s * fy, s * 0.07, s * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = shade(o.body || '#6a5040', -0.1); ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-s * 0.28, 0); ctx.quadraticCurveTo(-s * 0.45, Math.sin(walk * 2) * s * 0.15, -s * 0.5, Math.sin(walk * 2 + 1) * s * 0.1); ctx.stroke();
    const g = ctx.createLinearGradient(0, -s * 0.2, 0, s * 0.2);
    g.addColorStop(0, shade(o.body || '#6a5040', 0.15)); g.addColorStop(1, shade(o.body || '#6a5040', -0.2));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.3, s * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    // feet
    ctx.fillStyle = shade(o.body, -0.55);
    ctx.beginPath(); ctx.ellipse(step, -s * 0.13, s * 0.1, s * 0.065, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-step, s * 0.13, s * 0.1, s * 0.065, 0, 0, Math.PI * 2); ctx.fill();
    // loot sack on back
    if (o.sack != null) {
      const sr = s * (0.15 + Math.min(o.sack, 6) * 0.025);
      ctx.fillStyle = '#7a5a34';
      ctx.beginPath(); ctx.arc(-s * 0.2, 0, sr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a3e20'; ctx.beginPath(); ctx.arc(-s * 0.2 + sr * 0.35, -sr * 0.2, sr * 0.25, 0, Math.PI * 2); ctx.fill();
      if (o.sack > 0) { ctx.fillStyle = '#ffd84a'; ctx.font = `${sr * 0.9}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', -s * 0.2, sr * 0.1); }
    }
    // body / shoulders
    const g = ctx.createLinearGradient(-s * 0.2, -s * 0.25, s * 0.2, s * 0.25);
    g.addColorStop(0, shade(o.body, 0.2)); g.addColorStop(1, shade(o.body, -0.25));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.19, s * 0.27, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();
    // arms / hands
    const skin = o.hand || shade(o.body, 0.35);
    ctx.fillStyle = skin;
    if (o.guard) {
      ctx.beginPath(); ctx.arc(s * 0.24, s * 0.12, s * 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.1, -s * 0.24, s * 0.06, 0, Math.PI * 2); ctx.fill();
      // flashlight
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(s * 0.22, s * 0.07, s * 0.2, s * 0.09);
      ctx.fillStyle = o.light || '#fff6c0';
      ctx.beginPath(); ctx.arc(s * 0.42, s * 0.115, s * 0.05, 0, Math.PI * 2); ctx.fill();
    } else {
      const sw = Math.sin(walk) * s * 0.1;
      ctx.beginPath(); ctx.arc(s * 0.05 + sw, -s * 0.27, s * 0.055, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.05 - sw, s * 0.27, s * 0.055, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();

  // head (upright, bobbing)
  const bob = Math.abs(Math.sin(walk)) * s * 0.05;
  const hx = x + Math.cos(ang) * s * (o.hound ? 0.22 : 0.02);
  const hy = y - s * (o.hound ? 0.08 : 0.16) - bob + Math.sin(ang) * s * (o.hound ? 0.12 : 0.02);
  const hs = s * (o.hound ? 0.5 : 0.62) * (o.headScale || 1);
  const hat = o.cosHat || o.hat || impliedHat(o.head);
  const hd = hs * 1.12;
  if (hat === 'nemes') drawHat(ctx, 'nemes', hx, hy, hd * 0.84, o.t || 0);
  const ho = { t: o.t || 0, lx: Math.cos(ang), ly: Math.sin(ang) * 0.6, seed: o.seed || 0, rot: Math.sin(walk) * 0.06, angry: o.angry };
  if (o.tint) { ctx.save(); ctx.shadowColor = o.tint; ctx.shadowBlur = 14; drawHead(ctx, o.head, hx, hy, hd, ho); ctx.restore(); }
  else drawHead(ctx, o.head, hx, hy, hd, ho);
  if (hat && hat !== 'nemes') drawHat(ctx, hat, hx, hy, hd * 0.84, o.t || 0);
  ctx.restore();
}

export function drawCoin(ctx, x, y, t, big) {
  const r = big ? 11 : 7.5;
  const sx = Math.abs(Math.cos(t * 3));
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 2) * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, r + 4, r * 0.8, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.scale(Math.max(0.15, sx), 1);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
  g.addColorStop(0, '#fff6b0'); g.addColorStop(0.5, '#ffcc33'); g.addColorStop(1, '#c78a10');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a06a00'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#b07a08'; ctx.font = `bold ${r * 1.1}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(big ? '★' : '$', 0, 1);
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
export { rgba };
