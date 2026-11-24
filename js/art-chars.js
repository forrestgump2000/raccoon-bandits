// Hand-drawn, animated character heads (no emoji). Every head is composed from vector parts.
import { shade } from './util.js';

const OL = 'rgba(22,14,30,0.8)';
const P2 = Math.PI * 2;
function E(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, P2); }
function fillOL(c, col, lw) { c.fillStyle = col; c.fill(); if (lw) { c.lineWidth = lw; c.strokeStyle = OL; c.stroke(); } }
function grad(c, x, y, r, col) {
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r * 1.1);
  g.addColorStop(0, shade(col, 0.28)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.22));
  return g;
}

// ---------------------------------------------------------------- spec tables
// animals: [base, light, ears, snout, marking, extras]
const A = {
  '🦝': ['#7d808c', '#ece8e0', 'pointy', 'short', 'mask', 'whiskers'],
  '🐭': ['#aaa4a2', '#f4dada', 'biground', 'tiny', '', 'whiskers'], '🐁': ['#e8e4e0', '#f8dede', 'biground', 'tiny', '', 'whiskers'],
  '🐀': ['#7a7470', '#c8b8b0', 'round', 'short', '', 'whiskers'],
  '🐈': ['#e0a050', '#fff0d8', 'cat', 'tiny', 'stripes', 'whiskers'], '🐱': ['#e8b060', '#fff4e0', 'cat', 'tiny', 'stripes', 'whiskers'],
  '🐈‍⬛': ['#2c2c34', '#50505c', 'cat', 'tiny', '', 'whiskers goldeyes'],
  '🐺': ['#3a3a46', '#8c8c9c', 'tall', 'long', '', 'goldeyes'], '🐕': ['#b07a40', '#f2dec2', 'floppy', 'long', '', 'tongue'],
  '🐕‍🦺': ['#c49454', '#f2dec2', 'pointy', 'long', 'saddle', ''], '🐩': ['#f2ecec', '#ffffff', 'floppy', 'short', '', 'fluff'],
  '🦊': ['#e27232', '#fff6ea', 'tall', 'long', 'foxcheek', ''], '🐒': ['#8a5a33', '#f2caa2', 'side', 'short', 'monkey', ''],
  '🐵': ['#9a6a3a', '#f4d0a8', 'side', 'short', 'monkey', ''], '🦅': ['#f4f4f0', '#ffffff', '', 'beak', '', 'brownneck'],
  '🐊': ['#3c7a3a', '#a8c878', '', 'croc', 'scales', 'teeth frogeyes'], '🦩': ['#f088b0', '#ffd4e4', '', 'curvebeak', '', ''],
  '🐍': ['#4a9a3a', '#c8e078', '', 'none', 'scales', 'tongue slit'], '🦌': ['#a07040', '#f2dec2', 'pointy', 'short', '', 'antlers rednose'],
  '🦇': ['#3c2c3c', '#6c5c6c', 'bigpointy', 'tiny', '', 'fangs'], '🦜': ['#2fb04f', '#ffdd40', '', 'hook', '', 'crest'],
  '🐧': ['#1e2430', '#ffffff', '', 'beak', 'penguin', ''], '🐻‍❄️': ['#eef2f6', '#ffffff', 'round', 'short', '', ''],
  '🐻': ['#7a5030', '#c8a070', 'round', 'short', '', ''], '🧸': ['#c08850', '#f2d2a2', 'round', 'short', '', 'stitch'],
  '🦭': ['#7a8a9a', '#aabaca', '', 'short', '', 'whiskers'], '🦉': ['#8a6a4a', '#f2e2c2', 'tufts', 'beak', 'owl', ''],
  '🐝': ['#f2c220', '#2a2a2a', '', 'none', 'bee', 'antennae'], '🐞': ['#d02a2a', '#1a1a1a', '', 'none', 'dots', 'antennae'],
  '🐑': ['#f6f6f6', '#3a3a3a', 'floppy', 'short', 'darkface', 'fluff'], '🐂': ['#5a3a22', '#8a6a4a', '', 'wide', '', 'horns ring'],
  '🐃': ['#3a2a1a', '#6a5a4a', '', 'wide', '', 'bighorns'], '🐄': ['#f6f6f6', '#f2b2b2', 'floppy', 'wide', 'spots', 'horns'],
  '🐜': ['#5a2a1a', '#7a3a2a', '', 'none', '', 'antennae mandibles'], '🐸': ['#4aa03a', '#b8e078', '', 'none', '', 'frogeyes smile'],
  '🦔': ['#9a7a5a', '#f2dab8', 'tiny', 'short', '', 'spikes'], '🦎': ['#3a9a5a', '#a8e0a0', '', 'short', 'scales', 'frogeyes'],
  '🦖': ['#5a8a3a', '#c8e0a0', '', 'wide', 'scales', 'teeth'], '🦕': ['#5aa07a', '#c0e8c8', '', 'short', 'spots', ''],
  '🦡': ['#5a5a5a', '#f4f4f4', 'tiny', 'long', 'badger', ''], '🐐': ['#e2dad2', '#faf2ea', 'floppy', 'long', '', 'horns goatee'],
  '🐢': ['#5a9a4a', '#c8e0a0', '', 'short', 'scales', ''], '🦒': ['#e2a84a', '#f8e2b2', 'pointy', 'long', 'spots', 'ossicones'],
  '🦁': ['#d6a444', '#f8e2b2', 'round', 'short', '', 'mane whiskers'], '🐗': ['#6a4a3a', '#a08070', 'pointy', 'wide', '', 'tusks'],
  '🐼': ['#f6f6f6', '#ffffff', 'roundblack', 'short', 'panda', ''], '🐫': ['#c8a060', '#e8d0a0', 'tiny', 'long', '', ''],
  '🦥': ['#9a8a6a', '#e2d2b2', '', 'short', 'sloth', 'smile'], '🦦': ['#7a5a3a', '#e2caaa', 'tiny', 'short', '', 'whiskers'],
  '🐆': ['#e2b040', '#fff2d2', 'cat', 'short', 'spots', 'whiskers'], '🐅': ['#ea8a2a', '#fff6e2', 'cat', 'short', 'stripes', 'whiskers'],
  '🐇': ['#f2eee8', '#ffffff', 'long', 'tiny', '', 'whiskers'], '🐘': ['#9a9aa6', '#c2c2ca', 'big', 'trunk', '', ''],
  '🐿️': ['#b4743c', '#f2d2a2', 'tufts', 'short', '', 'cheeks'], '🦚': ['#2a6ad0', '#3ac0a0', '', 'beak', '', 'peacock'],
  '🦫': ['#8a6a4a', '#b09070', 'tiny', 'wide', '', 'buckteeth'], '🦆': ['#f2d232', '#ffffff', '', 'bill', '', ''],
  '🐹': ['#e2a262', '#fff6e2', 'round', 'tiny', '', 'cheeks whiskers'], '🕊️': ['#f4f4f8', '#ffffff', '', 'beak', '', ''],
  '🦢': ['#ffffff', '#ffffff', '', 'orangebeak', '', ''], '🐛': ['#7ab03a', '#c8e078', '', 'none', 'dots', 'antennae smile'],
  '🐌': ['#b0a080', '#d8d0b8', '', 'none', '', 'eyestalks smile'], '🦄': ['#f6f2ff', '#ffd6f2', 'pointy', 'long', '', 'unihorn rainbowmane'],
  '🐉': ['#c4402e', '#f2c262', 'pointy', 'croc', 'scales', 'dragonhorns whiskersdragon'], '🐲': ['#2a8a4a', '#f2d262', 'pointy', 'croc', 'scales', 'dragonhorns whiskersdragon'],
  '🦋': ['#9ab0f0', '#ffffff', '', 'none', '', 'antennae wings'], '🐬': ['#6a9ac0', '#d2e8f8', '', 'rostrum', '', 'smile'],
  '🦈': ['#7a90a8', '#eef4f8', '', 'none', '', 'fin teeth'], '🐙': ['#c4457a', '#f2a2c2', '', 'none', 'dots', 'tentacles'],
  '🦂': ['#8a5a2a', '#c49454', '', 'none', 'scales', 'pincers'], '🐴': ['#8a5a3a', '#c49474', 'pointy', 'long', '', 'mane'],
  '🐦': ['#8a9ab0', '#c2cad8', '', 'beak', '', ''], '🐦‍⬛': ['#1c1c26', '#3c3c4a', '', 'beak', '', ''],
  '🦨': ['#1e1e24', '#ffffff', 'round', 'short', 'skunk', ''], '🐡': ['#d8b85a', '#f8f0c8', '', 'none', 'dots', 'spikes smile'],
  '🦀': ['#e2502a', '#f8a07a', '', 'none', '', 'eyestalks pincers smile'],
};
const SK = { l: '#f6d2b0', m: '#e2aa7c', d: '#b0764e', k: '#7c4c32' };
// humans: [skin, hair, hairStyle, hat, extras]
const H = {
  '👮': [SK.l, '#3a2a1a', 'short', 'police', ''], '👮‍♂️': [SK.m, '#2a1a10', 'short', 'police', 'mustache'], '👮‍♀️': [SK.d, '#2a1a10', 'bun', 'police', ''],
  '👨‍🍳': [SK.l, '#5a3a1a', 'short', 'chef', 'mustache'], '👩‍🍳': [SK.m, '#8a3a1a', 'long', 'chef', ''], '🧑‍🍳': [SK.d, '#2a1a10', 'short', 'chef', ''],
  '🤠': [SK.m, '#6a4020', 'short', 'cowboy', 'bandana'], '🧔': [SK.l, '#6a3a1a', 'short', '', 'beard'], '🧔‍♂️': [SK.m, '#3a2a1a', 'short', '', 'beard'],
  '👩‍🦰': [SK.l, '#c8502a', 'long', '', 'freckles'], '👨‍🦳': [SK.m, '#e8e8e8', 'short', '', 'mustache'], '👱‍♀️': [SK.l, '#f2d272', 'long', '', ''],
  '🧒': [SK.l, '#5a3a1a', 'spiky', '', 'freckles'], '🧝': [SK.l, '#c8902a', 'short', 'elf', 'elfears'], '🧝‍♀️': [SK.l, '#8a4a1a', 'long', 'elf', 'elfears'],
  '🧝‍♂️': [SK.m, '#f2e2a2', 'short', 'elf', 'elfears'], '🧛': ['#e6e0f2', '#14141a', 'slick', '', 'fangs redeyes'], '🧛‍♀️': ['#e6e0f2', '#14141a', 'long', '', 'fangs redeyes'],
  '🧟': ['#9ab88a', '#3a4a2a', 'messy', '', 'stitches deadeyes'], '🧟‍♂️': ['#8aa87a', '#2a3a1a', 'messy', '', 'stitches deadeyes'],
  '👩': [SK.m, '#3a2010', 'long', '', ''], '👴': [SK.l, '#e2e2e2', 'bald', '', 'beard glasses'], '🧓': [SK.m, '#d2d2d2', 'short', '', 'glasses'],
  '👨‍🚀': [SK.l, '#5a3a1a', 'short', 'astro', ''], '👩‍🚀': [SK.d, '#2a1a10', 'bun', 'astro', ''], '🧑‍🚀': [SK.m, '#3a2a1a', 'short', 'astro', ''],
  '💂': [SK.l, '#3a2a1a', 'short', 'bearskin', ''], '💂‍♂️': [SK.m, '#2a1a10', 'short', 'bearskin', 'mustache'], '💂‍♀️': [SK.l, '#8a4a1a', 'short', 'bearskin', ''],
  '👸': [SK.l, '#f2c242', 'long', 'tiara', 'blush'], '🤴': [SK.m, '#6a4a2a', 'short', 'crown', 'mustache'], '🤶': [SK.l, '#f2f2f2', 'bun', 'santa', 'glasses blush'],
  '🕴️': [SK.m, '#1a1a1a', 'slick', 'fedora', 'shades'], '💁‍♀️': [SK.d, '#2a1a10', 'long', '', 'blush'], '🤵': [SK.l, '#2a1a10', 'slick', '', ''],
  '🤵‍♀️': [SK.m, '#1a1a1a', 'bun', '', ''], '🧜‍♂️': ['#a8d8c8', '#2a8a8a', 'long', 'shellcrown', 'beard'], '🧜‍♀️': ['#b8e0d0', '#e25a8a', 'long', 'shellcrown', ''],
  '🧜': ['#b8e0d0', '#7a4ad0', 'long', 'shellcrown', ''], '🧙': [SK.l, '#e8e8e8', 'short', 'wizard', 'longbeard'], '🧙‍♀️': ['#b8d898', '#2a1a2a', 'long', 'witch', 'bignose'],
  '🧙‍♂️': ['#f4c8b0', '#f2f2f2', 'short', 'gnome', 'longbeard rosy'], '🧚': [SK.l, '#f080d0', 'bun', '', 'wings blush'], '🧚‍♂️': [SK.m, '#40c080', 'short', '', 'wings'],
  '🧑‍🌾': [SK.m, '#6a4a2a', 'short', 'straw', ''], '🥷': [SK.m, '#1a1a24', 'short', 'ninja', ''], '🦹': ['#d0a080', '#5a1a5a', 'short', '', 'villainmask'],
  '👩‍🔬': [SK.l, '#5a3a1a', 'bun', '', 'goggles'], '🧑‍🔬': [SK.m, '#2a1a10', 'messy', '', 'goggles'], '👨‍🔬': [SK.l, '#e8e8e8', 'messy', '', 'goggles mustache'],
  '👷': [SK.m, '#3a2a1a', 'short', 'hardhat', ''], '👷‍♀️': [SK.d, '#2a1a10', 'long', 'hardhat', ''], '👷‍♂️': [SK.l, '#6a4a2a', 'short', 'hardhat', 'beard'],
  '⛷️': [SK.l, '#3a2a1a', 'short', 'beanie', 'skigoggles'], '🏂': [SK.m, '#c8902a', 'long', 'beanie', 'skigoggles'], '🧑‍🦱': [SK.k, '#1a1a1a', 'curly', '', ''],
  '🧞': ['#6aa0f0', '#1a1a3a', 'topknot', '', 'earring goatee'], '🧕': [SK.d, '#2a7a6a', 'none', 'scarf', ''], '👨‍🚒': [SK.l, '#3a2a1a', 'short', 'fire', 'mustache'],
  '🧑‍🎤': [SK.l, '#ff4ab0', 'spiky', '', ''], '👩‍🎤': [SK.m, '#7a3ad0', 'long', '', 'lipstick'], '🧑‍💼': [SK.m, '#3a2a1a', 'slick', '', 'glasses'],
  '🧑‍✈️': [SK.l, '#3a2a1a', 'short', 'pilot', ''], '👨‍✈️': [SK.m, '#e2e2e2', 'short', 'captain', 'beard'], '👩‍✈️': [SK.d, '#2a1a10', 'bun', 'pilot', ''],
  '🧌': ['#8aa060', '#5a6a3a', 'bald', '', 'tusks bignose'], '🎬': [SK.l, '#3a2a1a', 'short', 'beret', 'glasses goatee'], '📸': [SK.m, '#2a2a2a', 'short', 'cap', 'stubble'],
  '💃': [SK.d, '#1a1a1a', 'bun', '', 'flower lipstick'], '🎷': [SK.k, '#1a1a1a', 'short', 'fedora', 'goatee'], '🎺': [SK.m, '#1a1a1a', 'short', 'sombrero', 'mustache'],
  '👩‍⚕️': [SK.l, '#8a5a2a', 'bun', 'nurse', ''], '🧐': [SK.l, '#a0a0a0', 'short', '', 'monocle mustache'], '🎭': [SK.l, '#1a1a1a', 'slick', '', 'halfmask'],
  '💅': [SK.m, '#ff80c0', 'long', '', 'lipstick blush'], '🕵️': [SK.l, '#5a3a1a', 'short', 'fedora', 'mustache'], '🕵️‍♀️': [SK.m, '#8a3a1a', 'long', 'fedora', ''],
  '🕵️‍♂️': [SK.d, '#2a1a10', 'short', 'fedora', 'mustache'], '👶': ['#f8dac4', '#e2c282', 'tuft', '', 'pacifier blush'], '👵': [SK.l, '#ececec', 'bun', '', 'glasses blush'],
  '🧖': [SK.l, '#5a3a1a', 'none', 'towel', 'cucumber'], '🧖‍♀️': [SK.m, '#3a2010', 'none', 'towel', 'cucumber'], '👼': ['#f8dac4', '#f2d272', 'curly', 'halo', 'blush'],
  '🤓': [SK.l, '#5a3a1a', 'short', '', 'glasses buckteeth'], '😴': ['#f2d2a2', '#d2b282', 'short', 'nightcap', 'sleepy'], '🏹': [SK.m, '#a05a2a', 'short', 'robin', 'goatee'],
  '🧑‍🔧': [SK.m, '#3a2a1a', 'short', 'cap', 'grease'], '👩‍🔧': [SK.d, '#2a1a10', 'bun', 'cap', 'grease'], '🧑‍🏫': [SK.l, '#8a8a8a', 'bald', '', 'glasses mustache'],
  '🤿': [SK.l, '#2a2a2a', 'short', 'diving', ''], '🧑‍💻': [SK.d, '#1a1a1a', 'short', 'headphones', 'glasses'], '🏯': [SK.l, '#1a1a1a', 'topknot', 'samurai', 'mustache'],
  '🤡': ['#ffffff', '#ff5a2a', 'clown', '', 'clownnose clownface'], '🎪': [SK.l, '#3a2a1a', 'short', 'tophat', 'mustache'], '🤹': [SK.m, '#2a2a2a', 'short', 'jester', 'blush'],
  '⚡': [SK.l, '#f8f8f8', 'long', 'laurel', 'longbeard glow'], '🔱': [SK.m, '#4ab0a0', 'long', 'crown', 'longbeard'], '👟': [SK.l, '#e2c282', 'curly', 'winged', ''],
  '👺': ['#d02a2a', '#1a1a1a', 'messy', '', 'tengu'], '🧑‍🦳': [SK.l, '#e8e8e8', 'short', '', ''],
};
const SPECIAL = { MUMMY: 'mummy', '👻': 'ghost', '🤖': 'robot', '🦾': 'cyborg', '💀': 'skull', '🎃': 'pumpkin', '👽': 'alien', '⛄': 'snowman', '🗿': 'statue', '🍪': 'ginger', '🧁': 'cupcake', '👾': 'invader', '🛸': 'drone', '♟️': 'pawn' };

export function headInfo(e) {
  if (SPECIAL[e]) return { kind: SPECIAL[e] };
  if (A[e]) { const a = A[e]; return { kind: 'animal', base: a[0], light: a[1], ears: a[2], snout: a[3], mark: a[4], ex: a[5].split(' ') }; }
  if (H[e]) { const h = H[e]; return { kind: 'human', skin: h[0], hair: h[1], style: h[2], hat: h[3], ex: h[4].split(' ') }; }
  return { kind: 'human', skin: SK.m, hair: '#3a2a1a', style: 'short', hat: '', ex: [] };
}

// ---------------------------------------------------------------- eyes
function eyes(c, r, o, opt = {}) {
  const { t = 0, lx = 0, ly = 0, seed = 0 } = o;
  const blink = ((t + seed * 1.7) % 3.6) < 0.12;
  const y = opt.y != null ? opt.y : -r * 0.05, dx = opt.dx || r * 0.34, er = opt.size || r * 0.2;
  for (const s of [-1, 1]) {
    const x = s * dx;
    if (opt.sleepy || blink) {
      c.strokeStyle = OL; c.lineWidth = r * 0.09; c.lineCap = 'round';
      c.beginPath(); c.arc(x, y - er * 0.2, er * 0.75, 0.2, Math.PI - 0.2); c.stroke();
      continue;
    }
    if (opt.dead) { c.strokeStyle = OL; c.lineWidth = r * 0.08; c.beginPath(); c.moveTo(x - er * 0.6, y - er * 0.6); c.lineTo(x + er * 0.6, y + er * 0.6); c.moveTo(x + er * 0.6, y - er * 0.6); c.lineTo(x - er * 0.6, y + er * 0.6); c.stroke(); continue; }
    if (opt.beady) { E(c, x + lx * er * 0.3, y + ly * er * 0.3, er * 0.55, er * 0.65); fillOL(c, '#141018'); c.fillStyle = '#fff'; E(c, x + lx * er * 0.3 - er * 0.18, y - er * 0.25, er * 0.18, er * 0.18); c.fill(); continue; }
    E(c, x, y, er, er * 1.08); fillOL(c, opt.sclera || '#ffffff', r * 0.045);
    const pc = opt.iris || '#1a1420';
    E(c, x + lx * er * 0.4, y + ly * er * 0.35, er * 0.58, er * 0.66); c.fillStyle = pc; c.fill();
    if (opt.slit) { c.fillStyle = '#000'; E(c, x + lx * er * 0.4, y + ly * er * 0.35, er * 0.15, er * 0.6); c.fill(); }
    c.fillStyle = '#fff'; E(c, x + lx * er * 0.4 - er * 0.2, y + ly * er * 0.35 - er * 0.25, er * 0.2, er * 0.2); c.fill();
  }
}

// ---------------------------------------------------------------- animal
function animal(c, s, o) {
  const r = s.r, t = o.t || 0, ex = s.ex, base = s.base, light = s.light;
  const lw = r * 0.09;
  const has = (k) => ex.includes(k);
  const inner = '#f2a2b2';
  // behind-head layers
  if (has('mane') || has('rainbowmane')) {
    const n = 14;
    c.beginPath();
    for (let i = 0; i <= n; i++) { const a = (i / n) * P2, rr = r * (i % 2 ? 1.25 : 1.48) + Math.sin(t * 2 + i) * r * 0.03; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr + r * 0.05); }
    if (has('rainbowmane')) { const g = c.createLinearGradient(-r, -r, r, r); ['#ff7ab8', '#ffd65a', '#5affb0', '#46c3ff', '#b07aff'].forEach((cl, i) => g.addColorStop(i / 4, cl)); fillOL(c, g, lw); }
    else fillOL(c, shade(base, -0.35), lw);
  }
  if (has('fluff')) { for (let i = 0; i < 9; i++) { const a = (i / 9) * P2; E(c, Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.9 - r * 0.05, r * 0.38, r * 0.38); fillOL(c, base === '#f6f6f6' ? '#ffffff' : shade(base, 0.1), lw * 0.7); } }
  if (has('spikes')) { c.beginPath(); for (let i = 0; i <= 18; i++) { const a = Math.PI * 0.95 + (i / 18) * Math.PI * 1.1, rr = i % 2 ? r * 1.05 : r * 1.5; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } fillOL(c, shade(base, -0.3), lw); }
  if (has('wings')) { for (const sd of [-1, 1]) { c.save(); c.rotate(sd * (0.3 + Math.sin(t * 10) * 0.25)); E(c, sd * r * 1.2, -r * 0.2, r * 0.85, r * 0.6, sd * 0.4); const g = c.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#b0c8ff'); g.addColorStop(1, '#f0a0e0'); fillOL(c, g, lw * 0.7); c.restore(); } }
  if (has('peacock')) { for (let i = -3; i <= 3; i++) { c.save(); c.rotate(i * 0.32); E(c, 0, -r * 1.35, r * 0.24, r * 0.55); fillOL(c, '#2aa07a', lw * 0.5); E(c, 0, -r * 1.6, r * 0.12, r * 0.14); c.fillStyle = '#2a4ad0'; c.fill(); c.restore(); } }
  if (has('tentacles')) { c.strokeStyle = base; c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const x0 = -r * 0.75 + i * r * 0.3; c.lineWidth = r * 0.28; c.beginPath(); c.moveTo(x0, r * 0.5); c.quadraticCurveTo(x0 + Math.sin(t * 4 + i) * r * 0.3, r * 1.0, x0 + Math.sin(t * 4 + i + 1) * r * 0.4, r * 1.3); c.stroke(); } c.strokeStyle = OL; c.lineWidth = lw * 0.5; }
  // ears
  const earTw = Math.sin(t * 1.3 + (o.seed || 0)) > 0.97 ? 0.15 : 0;
  const ear = (fn) => { for (const sd of [-1, 1]) { c.save(); c.scale(sd, 1); c.rotate(sd === 1 ? earTw : 0); fn(); c.restore(); } };
  switch (s.ears) {
    case 'pointy': case 'tall': case 'cat': case 'bigpointy': {
      const h = s.ears === 'tall' ? 1.05 : s.ears === 'bigpointy' ? 1.15 : s.ears === 'cat' ? 0.7 : 0.82;
      const w = s.ears === 'bigpointy' ? 0.5 : 0.38;
      ear(() => {
        c.beginPath(); c.moveTo(r * 0.25, -r * 0.7); c.lineTo(r * (0.55 + w * 0.3), -r * (0.55 + h)); c.lineTo(r * (0.55 + w), -r * 0.35); c.closePath(); fillOL(c, s.mark === 'mask' ? shade(base, -0.25) : base, lw);
        c.beginPath(); c.moveTo(r * 0.38, -r * 0.68); c.lineTo(r * (0.57 + w * 0.3), -r * (0.5 + h * 0.8)); c.lineTo(r * (0.5 + w * 0.8), -r * 0.45); c.closePath(); c.fillStyle = s.base === '#2c2c34' || s.base === '#3a3a46' ? '#5a4a5a' : inner; c.fill();
      });
      break;
    }
    case 'round': case 'biground': case 'roundblack': case 'tiny': {
      const er = s.ears === 'biground' ? 0.52 : s.ears === 'tiny' ? 0.2 : 0.34, ex2 = s.ears === 'biground' ? 0.78 : 0.68;
      ear(() => { E(c, r * ex2, -r * ex2 * 0.95, r * er, r * er); fillOL(c, s.ears === 'roundblack' ? '#1a1a20' : base, lw); if (s.ears !== 'roundblack') { E(c, r * ex2, -r * ex2 * 0.95, r * er * 0.58, r * er * 0.58); c.fillStyle = s.ears === 'biground' ? '#f8b8c8' : shade(light, -0.05); c.fill(); } });
      break;
    }
    case 'long': ear(() => { c.save(); c.translate(r * 0.32, -r * 0.7); c.rotate(0.15 + Math.sin(t * 2) * 0.06); E(c, 0, -r * 0.6, r * 0.22, r * 0.68); fillOL(c, base, lw); E(c, 0, -r * 0.6, r * 0.11, r * 0.5); c.fillStyle = inner; c.fill(); c.restore(); }); break;
    case 'floppy': ear(() => { c.save(); c.translate(r * 0.78, -r * 0.2); c.rotate(-0.35 + Math.sin(t * 3) * 0.08); E(c, 0, r * 0.32, r * 0.26, r * 0.55); fillOL(c, s.base === '#f6f6f6' && s.light === '#3a3a3a' ? '#3a3a3a' : shade(base, -0.2), lw); c.restore(); }); break;
    case 'big': ear(() => { E(c, r * 0.95, 0, r * 0.62, r * 0.78, 0.2 + Math.sin(t * 2) * 0.08); fillOL(c, shade(base, -0.05), lw); E(c, r * 0.95, 0, r * 0.42, r * 0.58, 0.2); c.fillStyle = '#d8a8b0'; c.fill(); }); break;
    case 'side': ear(() => { E(c, r * 0.95, -r * 0.05, r * 0.3, r * 0.34); fillOL(c, base, lw); E(c, r * 0.95, -r * 0.05, r * 0.17, r * 0.2); c.fillStyle = light; c.fill(); }); break;
    case 'tufts': ear(() => { c.beginPath(); c.moveTo(r * 0.3, -r * 0.8); c.quadraticCurveTo(r * 0.75, -r * 1.35, r * 0.72, -r * 1.3); c.lineTo(r * 0.75, -r * 0.5); c.closePath(); fillOL(c, shade(base, -0.1), lw); }); break;
  }
  if (has('antlers')) ear(() => { c.strokeStyle = '#7a5030'; c.lineWidth = r * 0.14; c.lineCap = 'round'; c.beginPath(); c.moveTo(r * 0.35, -r * 0.8); c.lineTo(r * 0.65, -r * 1.55); c.moveTo(r * 0.5, -r * 1.15); c.lineTo(r * 0.95, -r * 1.3); c.moveTo(r * 0.6, -r * 1.42); c.lineTo(r * 0.4, -r * 1.7); c.stroke(); });
  if (has('horns') || has('bighorns') || has('dragonhorns')) ear(() => { c.beginPath(); const big = has('bighorns'); c.moveTo(r * 0.45, -r * 0.65); c.quadraticCurveTo(r * (big ? 1.4 : 0.95), -r * (big ? 0.7 : 0.9), r * (big ? 1.3 : 0.75), -r * (big ? 1.3 : 1.35)); c.quadraticCurveTo(r * 0.75, -r * 0.85, r * 0.25, -r * 0.82); c.closePath(); fillOL(c, has('dragonhorns') ? '#f2e2b2' : '#efe6d2', lw); });
  if (has('ossicones')) ear(() => { c.fillStyle = shade(base, -0.3); c.fillRect(r * 0.2, -r * 1.3, r * 0.14, r * 0.55); E(c, r * 0.27, -r * 1.32, r * 0.14, r * 0.14); fillOL(c, '#6a4a2a', lw * 0.6); });
  if (has('crest')) { for (let i = -1; i <= 1; i++) { c.save(); c.rotate(i * 0.3 + Math.sin(t * 3) * 0.05); E(c, 0, -r * 1.15, r * 0.14, r * 0.42); fillOL(c, i ? '#ff5a3a' : '#ffd040', lw * 0.6); c.restore(); } }
  if (has('fin')) { c.beginPath(); c.moveTo(-r * 0.3, -r * 0.8); c.quadraticCurveTo(r * 0.1, -r * 1.7, r * 0.45, -r * 1.55); c.quadraticCurveTo(r * 0.25, -r * 1.1, r * 0.35, -r * 0.8); c.closePath(); fillOL(c, shade(base, -0.1), lw); }
  if (has('eyestalks')) ear(() => { c.strokeStyle = base; c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(r * 0.25, -r * 0.6); c.lineTo(r * 0.42, -r * 1.25 + Math.sin(t * 3) * r * 0.05); c.stroke(); E(c, r * 0.42, -r * 1.3, r * 0.2, r * 0.2); fillOL(c, '#fff', lw * 0.6); E(c, r * 0.44 + (o.lx || 0) * r * 0.07, -r * 1.3, r * 0.09, r * 0.09); c.fillStyle = '#111'; c.fill(); });
  if (has('antennae')) ear(() => { c.strokeStyle = OL; c.lineWidth = r * 0.07; c.beginPath(); c.moveTo(r * 0.2, -r * 0.8); c.quadraticCurveTo(r * 0.3, -r * 1.4, r * 0.62 + Math.sin(t * 4) * r * 0.06, -r * 1.45); c.stroke(); E(c, r * 0.62 + Math.sin(t * 4) * r * 0.06, -r * 1.45, r * 0.12, r * 0.12); fillOL(c, s.mark === 'bee' ? '#2a2a2a' : shade(base, -0.2), 0); });

  // head
  const oval = s.snout === 'long' || s.snout === 'croc' ? 1.04 : 1;
  E(c, 0, 0, r, r * oval);
  fillOL(c, grad(c, 0, 0, r, base), lw);
  c.save(); E(c, 0, 0, r * 0.98, r * oval * 0.98); c.clip();
  // markings
  switch (s.mark) {
    case 'mask': c.fillStyle = '#26262e'; c.beginPath(); c.moveTo(-r * 1.1, -r * 0.25); c.quadraticCurveTo(-r * 0.5, -r * 0.42, 0, -r * 0.12); c.quadraticCurveTo(r * 0.5, -r * 0.42, r * 1.1, -r * 0.25); c.lineTo(r * 1.1, r * 0.15); c.quadraticCurveTo(r * 0.5, r * 0.25, 0, r * 0.08); c.quadraticCurveTo(-r * 0.5, r * 0.25, -r * 1.1, r * 0.15); c.fill(); c.fillStyle = '#f2f0ea'; E(c, -r * 0.4, -r * 0.45, r * 0.25, r * 0.09, -0.2); c.fill(); E(c, r * 0.4, -r * 0.45, r * 0.25, r * 0.09, 0.2); c.fill(); break;
    case 'stripes': c.strokeStyle = shade(base, -0.4); c.lineWidth = r * 0.12; c.lineCap = 'round'; for (const sx of [-0.25, 0, 0.25]) { c.beginPath(); c.moveTo(sx * r, -r); c.lineTo(sx * r * 1.2, -r * 0.6); c.stroke(); } for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * r, -r * 0.1); c.lineTo(sd * r * 0.7, 0); c.stroke(); c.beginPath(); c.moveTo(sd * r, r * 0.15); c.lineTo(sd * r * 0.72, r * 0.2); c.stroke(); } break;
    case 'spots': c.fillStyle = shade(base, -0.38); [[-0.5, -0.5, 0.16], [0.45, -0.6, 0.12], [0.6, 0.2, 0.14], [-0.65, 0.3, 0.1], [0.05, -0.8, 0.1]].forEach(([a, b, q]) => { E(c, a * r, b * r, q * r, q * r * 0.85); c.fill(); }); break;
    case 'dots': c.fillStyle = s.light === '#1a1a1a' ? '#1a1a1a' : shade(base, 0.35); [[-0.5, -0.55, 0.15], [0.5, -0.5, 0.15], [0, -0.85, 0.12], [-0.7, 0.35, 0.12], [0.7, 0.35, 0.12]].forEach(([a, b, q]) => { E(c, a * r, b * r, q * r, q * r); c.fill(); }); break;
    case 'scales': c.strokeStyle = shade(base, -0.25); c.lineWidth = r * 0.05; for (let yy = -0.9; yy < 0; yy += 0.28) for (let xx = -0.9; xx < 1; xx += 0.3) { c.beginPath(); c.arc((xx + (yy * 3 % 2 ? 0.15 : 0)) * r, yy * r, r * 0.13, 0, Math.PI); c.stroke(); } break;
    case 'panda': c.fillStyle = '#1a1a20'; E(c, -r * 0.36, -r * 0.02, r * 0.3, r * 0.36, 0.5); c.fill(); E(c, r * 0.36, -r * 0.02, r * 0.3, r * 0.36, -0.5); c.fill(); break;
    case 'skunk': c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(-r * 0.14, -r); c.lineTo(r * 0.14, -r); c.lineTo(r * 0.08, -r * 0.2); c.lineTo(-r * 0.08, -r * 0.2); c.fill(); break;
    case 'badger': c.fillStyle = '#1e1e22'; E(c, -r * 0.55, -r * 0.1, r * 0.3, r * 0.9); c.fill(); E(c, r * 0.55, -r * 0.1, r * 0.3, r * 0.9); c.fill(); break;
    case 'penguin': c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(0, -r * 0.2); c.bezierCurveTo(-r * 0.3, -r * 0.75, -r * 0.95, -r * 0.4, -r * 0.6, r * 0.5); c.lineTo(r * 0.6, r * 0.5); c.bezierCurveTo(r * 0.95, -r * 0.4, r * 0.3, -r * 0.75, 0, -r * 0.2); c.fill(); E(c, 0, r * 0.5, r * 0.7, r * 0.5); c.fill(); break;
    case 'owl': c.fillStyle = light; E(c, -r * 0.36, -r * 0.05, r * 0.38, r * 0.38); c.fill(); E(c, r * 0.36, -r * 0.05, r * 0.38, r * 0.38); c.fill(); break;
    case 'darkface': c.fillStyle = '#3a3a3a'; E(c, 0, r * 0.2, r * 0.62, r * 0.75); c.fill(); break;
    case 'monkey': c.fillStyle = light; E(c, -r * 0.3, -r * 0.1, r * 0.36, r * 0.4); c.fill(); E(c, r * 0.3, -r * 0.1, r * 0.36, r * 0.4); c.fill(); E(c, 0, r * 0.4, r * 0.55, r * 0.42); c.fill(); break;
    case 'sloth': c.fillStyle = light; E(c, 0, r * 0.1, r * 0.8, r * 0.7); c.fill(); c.fillStyle = '#4a3a2a'; E(c, -r * 0.4, -r * 0.05, r * 0.3, r * 0.14, 0.4); c.fill(); E(c, r * 0.4, -r * 0.05, r * 0.3, r * 0.14, -0.4); c.fill(); break;
    case 'bee': c.fillStyle = '#2a2a2a'; c.fillRect(-r, -r * 0.6, r * 2, r * 0.22); c.fillRect(-r, r * 0.45, r * 2, r * 0.22); break;
    case 'saddle': c.fillStyle = '#3a2a1a'; E(c, 0, -r * 0.9, r * 0.9, r * 0.5); c.fill(); break;
    case 'foxcheek': c.fillStyle = light; c.beginPath(); c.moveTo(-r, r * 0.1); c.quadraticCurveTo(-r * 0.3, r * 0.1, 0, r * 0.5); c.quadraticCurveTo(r * 0.3, r * 0.1, r, r * 0.1); c.lineTo(r, r); c.lineTo(-r, r); c.fill(); break;
  }
  if (has('brownneck')) { c.fillStyle = '#6a4220'; E(c, 0, r * 1.15, r * 1.1, r * 0.45); c.fill(); }
  c.restore();
  // snout / muzzle
  const lk = (o.lx || 0) * r * 0.06;
  switch (s.snout) {
    case 'short': E(c, lk, r * 0.38, r * 0.42, r * 0.3); fillOL(c, light, lw * 0.6); E(c, lk, r * 0.25, r * 0.13, r * 0.09); fillOL(c, '#22181e', 0); c.strokeStyle = OL; c.lineWidth = r * 0.05; c.beginPath(); c.moveTo(lk, r * 0.32); c.lineTo(lk, r * 0.45); c.quadraticCurveTo(lk - r * 0.1, r * 0.55, lk - r * 0.18, r * 0.48); c.moveTo(lk, r * 0.45); c.quadraticCurveTo(lk + r * 0.1, r * 0.55, lk + r * 0.18, r * 0.48); c.stroke(); break;
    case 'tiny': E(c, lk, r * 0.3, r * 0.1, r * 0.07); fillOL(c, '#f27a9a', lw * 0.4); c.strokeStyle = OL; c.lineWidth = r * 0.05; c.beginPath(); c.moveTo(lk - r * 0.14, r * 0.42); c.quadraticCurveTo(lk - r * 0.05, r * 0.5, lk, r * 0.38); c.quadraticCurveTo(lk + r * 0.05, r * 0.5, lk + r * 0.14, r * 0.42); c.stroke(); break;
    case 'long': E(c, lk, r * 0.48, r * 0.38, r * 0.4); fillOL(c, light, lw * 0.7); E(c, lk, r * 0.68, r * 0.16, r * 0.11); fillOL(c, '#1e161c', 0); c.fillStyle = 'rgba(255,255,255,.5)'; E(c, lk - r * 0.05, r * 0.65, r * 0.05, r * 0.03); c.fill(); break;
    case 'wide': E(c, lk, r * 0.48, r * 0.62, r * 0.36); fillOL(c, light, lw * 0.7); c.fillStyle = '#3a2a2a'; E(c, lk - r * 0.22, r * 0.5, r * 0.08, r * 0.1); c.fill(); E(c, lk + r * 0.22, r * 0.5, r * 0.08, r * 0.1); c.fill(); break;
    case 'croc': E(c, lk, r * 0.55, r * 0.55, r * 0.45); fillOL(c, shade(base, 0.1), lw * 0.7); c.fillStyle = '#1a2a1a'; E(c, lk - r * 0.18, r * 0.35, r * 0.06, r * 0.05); c.fill(); E(c, lk + r * 0.18, r * 0.35, r * 0.06, r * 0.05); c.fill(); c.strokeStyle = OL; c.lineWidth = r * 0.05; c.beginPath(); c.moveTo(lk - r * 0.45, r * 0.7); c.quadraticCurveTo(lk, r * 0.85, lk + r * 0.45, r * 0.7); c.stroke(); break;
    case 'beak': case 'orangebeak': c.beginPath(); c.moveTo(lk - r * 0.22, r * 0.12); c.lineTo(lk + r * 0.22, r * 0.12); c.lineTo(lk, r * 0.62); c.closePath(); fillOL(c, s.snout === 'orangebeak' ? '#ff8a2a' : '#f2b42a', lw * 0.6); break;
    case 'hook': c.beginPath(); c.moveTo(lk - r * 0.25, r * 0.05); c.quadraticCurveTo(lk + r * 0.35, r * 0.0, lk + r * 0.1, r * 0.65); c.quadraticCurveTo(lk - r * 0.05, r * 0.4, lk - r * 0.25, r * 0.3); c.closePath(); fillOL(c, '#2a2a2a', lw * 0.6); break;
    case 'curvebeak': c.beginPath(); c.moveTo(lk - r * 0.15, r * 0.15); c.quadraticCurveTo(lk + r * 0.5, r * 0.3, lk + r * 0.1, r * 0.95); c.lineTo(lk - r * 0.05, r * 0.85); c.quadraticCurveTo(lk + r * 0.25, r * 0.4, lk - r * 0.2, r * 0.35); c.closePath(); fillOL(c, '#f2e2c2', lw * 0.5); c.fillStyle = '#1a1a1a'; E(c, lk + r * 0.05, r * 0.9, r * 0.08, r * 0.08); c.fill(); break;
    case 'bill': E(c, lk, r * 0.45, r * 0.45, r * 0.2); fillOL(c, '#ff9a2a', lw * 0.6); break;
    case 'rostrum': E(c, lk, r * 0.6, r * 0.25, r * 0.35); fillOL(c, light, lw * 0.6); break;
    case 'trunk': { c.strokeStyle = base; c.lineCap = 'round'; c.lineWidth = r * 0.34; c.beginPath(); c.moveTo(0, r * 0.2); c.quadraticCurveTo(r * 0.05, r * 0.9, r * 0.35 + Math.sin(t * 2) * r * 0.2, r * 1.15); c.stroke(); c.strokeStyle = OL; c.lineWidth = lw * 0.5; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-r * 0.12, r * (0.4 + k * 0.18)); c.lineTo(r * 0.14, r * (0.42 + k * 0.18)); c.stroke(); } break; }
  }
  // eyes
  const goldE = has('goldeyes');
  if (has('frogeyes')) { for (const sd of [-1, 1]) { E(c, sd * r * 0.45, -r * 0.7, r * 0.32, r * 0.3); fillOL(c, base, lw); } eyes(c, r, o, { y: -r * 0.72, dx: r * 0.45, size: r * 0.2, slit: s.base === '#3c7a3a', iris: s.base === '#3c7a3a' ? '#d8c020' : '#1a1420' }); }
  else if (s.snout === 'beak' || s.snout === 'hook' || s.snout === 'orangebeak' || s.ears === 'tiny' || s.mark === 'bee' || s.mark === 'dots' || s.base === '#1e2430') eyes(c, r, o, { beady: !(s.mark === 'owl'), size: s.mark === 'owl' ? r * 0.24 : r * 0.17, dx: s.mark === 'owl' ? r * 0.36 : r * 0.32, iris: s.mark === 'owl' ? '#f2a020' : undefined });
  else eyes(c, r, o, { iris: goldE ? '#e8b020' : s.mark === 'mask' ? '#2a1a14' : undefined, slit: goldE || s.ears === 'cat', sclera: s.mark === 'mask' ? '#f8f4f0' : undefined, sleepy: s.mark === 'sloth' });
  // front extras
  if (has('whiskers')) { c.strokeStyle = 'rgba(30,20,30,.55)'; c.lineWidth = r * 0.035; for (const sd of [-1, 1]) for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(sd * r * 0.3, r * 0.38 + k * r * 0.07); c.lineTo(sd * r * 0.95, r * 0.3 + k * r * 0.14); c.stroke(); } }
  if (has('whiskersdragon')) { c.strokeStyle = '#f2c262'; c.lineWidth = r * 0.06; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * r * 0.3, r * 0.5); c.quadraticCurveTo(sd * r * 1.1, r * 0.4 + Math.sin(t * 3) * r * 0.2, sd * r * 1.3, r * 0.9); c.stroke(); } }
  if (has('teeth')) { c.fillStyle = '#fff'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * r * 0.14 - r * 0.05, r * 0.72); c.lineTo(k * r * 0.14 + r * 0.05, r * 0.72); c.lineTo(k * r * 0.14, r * 0.84); c.fill(); } }
  if (has('fangs')) { c.fillStyle = '#fff'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * r * 0.1, r * 0.42); c.lineTo(sd * r * 0.2, r * 0.42); c.lineTo(sd * r * 0.15, r * 0.58); c.fill(); } }
  if (has('buckteeth')) { c.fillStyle = '#fff'; c.fillRect(-r * 0.12, r * 0.5, r * 0.11, r * 0.16); c.fillRect(r * 0.01, r * 0.5, r * 0.11, r * 0.16); }
  if (has('tusks')) { for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * r * 0.4, r * 0.55); c.quadraticCurveTo(sd * r * 0.6, r * 0.45, sd * r * 0.55, r * 0.2); c.lineTo(sd * r * 0.45, r * 0.5); fillOL(c, '#fff8e8', lw * 0.4); } }
  if (has('tongue') && Math.sin(t * 5) > 0.3) { c.strokeStyle = '#e2306a'; c.lineWidth = r * 0.07; c.beginPath(); c.moveTo(0, r * 0.75); c.lineTo(0, r * 1.05); c.lineTo(-r * 0.08, r * 1.15); c.moveTo(0, r * 1.05); c.lineTo(r * 0.08, r * 1.15); c.stroke(); }
  if (has('rednose')) { E(c, 0, r * 0.3, r * 0.16, r * 0.14); c.fillStyle = '#ff2a3a'; c.shadowColor = '#ff2a3a'; c.shadowBlur = r * 0.8; c.fill(); c.shadowBlur = 0; }
  if (has('cheeks')) { c.fillStyle = 'rgba(255,140,150,.45)'; E(c, -r * 0.6, r * 0.3, r * 0.22, r * 0.15); c.fill(); E(c, r * 0.6, r * 0.3, r * 0.22, r * 0.15); c.fill(); }
  if (has('smile')) { c.strokeStyle = OL; c.lineWidth = r * 0.06; c.beginPath(); c.arc(0, r * 0.3, r * 0.3, 0.3, Math.PI - 0.3); c.stroke(); }
  if (has('goatee')) { c.beginPath(); c.moveTo(-r * 0.12, r * 0.85); c.lineTo(r * 0.12, r * 0.85); c.lineTo(0, r * 1.25); fillOL(c, shade(base, -0.1), lw * 0.5); }
  if (has('unihorn')) { c.beginPath(); c.moveTo(-r * 0.13, -r * 0.85); c.lineTo(r * 0.13, -r * 0.85); c.lineTo(0, -r * 1.75); c.closePath(); const g = c.createLinearGradient(0, -r * 1.7, 0, -r * 0.8); g.addColorStop(0, '#fff6a0'); g.addColorStop(1, '#ffb0e0'); fillOL(c, g, lw * 0.6); }
  if (has('pincers')) { for (const sd of [-1, 1]) { c.save(); c.translate(sd * r * 1.05, r * 0.45); c.rotate(sd * (0.3 + Math.sin(t * 5) * 0.15)); E(c, 0, 0, r * 0.32, r * 0.26); fillOL(c, base, lw); c.fillStyle = shade(base, -0.4); c.beginPath(); c.moveTo(-sd * r * 0.05, -r * 0.05); c.lineTo(sd * r * 0.3, -r * 0.2); c.lineTo(sd * r * 0.3, r * 0.05); c.fill(); c.restore(); } }
  if (has('mandibles')) { c.strokeStyle = OL; c.lineWidth = r * 0.08; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * r * 0.2, r * 0.75); c.quadraticCurveTo(sd * r * 0.3, r * 1.05, 0, r * 1.05); c.stroke(); } }
  if (has('stitch')) { c.strokeStyle = shade(base, -0.4); c.lineWidth = r * 0.04; c.beginPath(); c.moveTo(0, -r); c.lineTo(0, -r * 0.4); for (let k = -0.9; k < -0.4; k += 0.15) { c.moveTo(-r * 0.06, k * r); c.lineTo(r * 0.06, k * r); } c.stroke(); }
  if (has('ring')) { c.strokeStyle = '#d4af37'; c.lineWidth = r * 0.07; c.beginPath(); c.arc(0, r * 0.62, r * 0.12, 0, P2); c.stroke(); }
  if (has('slit')) { /* snake eyes handled via slit pupils */ }
}

// ---------------------------------------------------------------- human
function human(c, s, o) {
  const r = s.r, t = o.t || 0, ex = s.ex, skin = s.skin, hair = s.hair, st = s.style;
  const lw = r * 0.09;
  const has = (k) => ex.includes(k);
  // back hair
  if (st === 'long') { E(c, 0, r * 0.15, r * 1.08, r * 1.15); fillOL(c, hair, lw); }
  if (st === 'clown') { for (const sd of [-1, 1]) { E(c, sd * r * 0.95, -r * 0.3, r * 0.5, r * 0.55); fillOL(c, hair, lw); } }
  if (has('wings')) { for (const sd of [-1, 1]) { c.save(); c.rotate(sd * (0.3 + Math.sin(t * 12) * 0.2)); E(c, sd * r * 1.25, -r * 0.1, r * 0.7, r * 0.45, sd * 0.5); c.fillStyle = 'rgba(200,240,255,.6)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = lw * 0.5; c.stroke(); c.restore(); } }
  // ears
  for (const sd of [-1, 1]) {
    if (has('elfears')) { c.beginPath(); c.moveTo(sd * r * 0.85, -r * 0.15); c.lineTo(sd * r * 1.45, -r * 0.55); c.lineTo(sd * r * 0.9, r * 0.2); c.closePath(); fillOL(c, skin, lw * 0.7); }
    else { E(c, sd * r * 0.95, r * 0.05, r * 0.18, r * 0.24); fillOL(c, skin, lw * 0.7); }
  }
  // head
  E(c, 0, 0, r * 0.95, r);
  fillOL(c, grad(c, 0, 0, r, skin), lw);
  // face paint
  if (has('clownface')) { c.fillStyle = 'rgba(80,140,255,.6)'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * r * 0.35, -r * 0.45); c.lineTo(sd * r * 0.45, -r * 0.05); c.lineTo(sd * r * 0.25, -r * 0.05); c.fill(); } c.strokeStyle = '#e02a3a'; c.lineWidth = r * 0.12; c.beginPath(); c.arc(0, r * 0.25, r * 0.38, 0.25, Math.PI - 0.25); c.stroke(); }
  if (has('grease')) { c.fillStyle = 'rgba(40,30,20,.35)'; E(c, r * 0.45, r * 0.4, r * 0.15, r * 0.08, 0.4); c.fill(); }
  if (has('freckles')) { c.fillStyle = 'rgba(160,80,40,.5)'; for (const [a, b] of [[-0.45, 0.25], [-0.32, 0.32], [-0.55, 0.35], [0.45, 0.25], [0.32, 0.32], [0.55, 0.35]]) { E(c, a * r, b * r, r * 0.035, r * 0.035); c.fill(); } }
  if (has('blush') || has('rosy')) { c.fillStyle = 'rgba(255,110,130,.38)'; E(c, -r * 0.5, r * 0.3, r * 0.18, r * 0.11); c.fill(); E(c, r * 0.5, r * 0.3, r * 0.18, r * 0.11); c.fill(); }
  // eyes & brows
  if (has('tengu')) { c.beginPath(); c.moveTo(-r * 0.1, r * 0.05); c.quadraticCurveTo(r * 0.1, r * 0.9, r * 0.05, r * 1.3); c.lineTo(r * 0.15, r * 0.1); fillOL(c, shade(skin, 0.1), lw * 0.6); }
  const ey = -r * 0.02;
  if (has('halfmask')) { c.beginPath(); c.moveTo(0, -r * 0.95); c.quadraticCurveTo(r * 1.0, -r * 0.8, r * 0.85, r * 0.3); c.lineTo(0, r * 0.45); c.closePath(); fillOL(c, '#f4f4f4', lw * 0.6); }
  if (!has('cucumber')) eyes(c, r, o, { y: ey, dx: r * 0.34, size: r * 0.17, sleepy: has('sleepy'), dead: has('deadeyes'), iris: has('redeyes') ? '#d01a2a' : '#2a2030' });
  else { for (const sd of [-1, 1]) { E(c, sd * r * 0.34, ey, r * 0.22, r * 0.22); fillOL(c, '#8ad070', lw * 0.5); E(c, sd * r * 0.34, ey, r * 0.15, r * 0.15); c.fillStyle = '#d0f0b0'; c.fill(); } }
  c.strokeStyle = shade(hair, -0.2); c.lineWidth = r * 0.07; c.lineCap = 'round';
  const angry = o.angry;
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * r * 0.18, -r * (angry ? 0.24 : 0.32)); c.lineTo(sd * r * 0.5, -r * 0.34); c.stroke(); }
  // nose & mouth
  if (has('bignose')) { E(c, 0, r * 0.25, r * 0.2, r * 0.22); fillOL(c, shade(skin, -0.08), lw * 0.5); }
  else if (has('clownnose')) { E(c, 0, r * 0.2, r * 0.16, r * 0.16); fillOL(c, '#ff2a3a', lw * 0.4); c.fillStyle = 'rgba(255,255,255,.6)'; E(c, -r * 0.05, r * 0.15, r * 0.05, r * 0.04); c.fill(); }
  else if (!has('tengu')) { c.strokeStyle = shade(skin, -0.3); c.lineWidth = r * 0.05; c.beginPath(); c.moveTo(0, r * 0.08); c.quadraticCurveTo(r * 0.08, r * 0.24, -r * 0.02, r * 0.26); c.stroke(); }
  if (!has('bandana') && !has('clownface') && !has('pacifier')) {
    c.strokeStyle = has('lipstick') ? '#d02a5a' : OL; c.lineWidth = r * (has('lipstick') ? 0.1 : 0.06);
    c.beginPath(); if (angry) { c.moveTo(-r * 0.2, r * 0.52); c.lineTo(r * 0.2, r * 0.5); } else c.arc(0, r * 0.32, r * 0.22, 0.4, Math.PI - 0.4); c.stroke();
  }
  if (has('fangs')) { c.fillStyle = '#fff'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * r * 0.08, r * 0.52); c.lineTo(sd * r * 0.18, r * 0.5); c.lineTo(sd * r * 0.14, r * 0.66); c.fill(); } }
  if (has('tusks')) { for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * r * 0.25, r * 0.6); c.lineTo(sd * r * 0.35, r * 0.25); c.lineTo(sd * r * 0.4, r * 0.6); fillOL(c, '#fff8e0', lw * 0.4); } }
  if (has('buckteeth')) { c.fillStyle = '#fff'; c.fillRect(-r * 0.1, r * 0.5, r * 0.09, r * 0.12); c.fillRect(r * 0.01, r * 0.5, r * 0.09, r * 0.12); }
  if (has('stitches')) { c.strokeStyle = '#3a2a2a'; c.lineWidth = r * 0.04; c.beginPath(); c.moveTo(-r * 0.7, -r * 0.5); c.lineTo(-r * 0.2, -r * 0.6); for (let k = 0; k < 4; k++) { const x = -r * 0.65 + k * r * 0.14; c.moveTo(x, -r * 0.62); c.lineTo(x + r * 0.03, -r * 0.46); } c.stroke(); }
  // facial hair
  if (has('beard') || has('longbeard')) { const L = has('longbeard') ? 1.25 : 0.85; c.beginPath(); c.moveTo(-r * 0.85, 0); c.quadraticCurveTo(-r * 0.8, r * L, 0, r * (L + 0.15) + Math.sin(t * 2) * r * 0.03); c.quadraticCurveTo(r * 0.8, r * L, r * 0.85, 0); c.quadraticCurveTo(r * 0.5, r * 0.5, 0, r * 0.45); c.quadraticCurveTo(-r * 0.5, r * 0.5, -r * 0.85, 0); fillOL(c, hair, lw * 0.6); }
  if (has('mustache') || has('beard') || has('longbeard')) { c.fillStyle = shade(hair, -0.1); for (const sd of [-1, 1]) { E(c, sd * r * 0.2, r * 0.35, r * 0.24, r * 0.09, sd * -0.25); c.fill(); } }
  if (has('goatee')) { c.beginPath(); c.moveTo(-r * 0.15, r * 0.62); c.lineTo(r * 0.15, r * 0.62); c.lineTo(0, r * 0.95); fillOL(c, hair, lw * 0.4); }
  if (has('stubble')) { c.fillStyle = 'rgba(40,30,30,.18)'; E(c, 0, r * 0.5, r * 0.65, r * 0.4); c.fill(); }
  if (has('bandana')) { c.beginPath(); c.moveTo(-r * 0.93, r * 0.05); c.lineTo(r * 0.93, r * 0.05); c.quadraticCurveTo(r * 0.8, r * 0.85, 0, r * 1.05); c.quadraticCurveTo(-r * 0.8, r * 0.85, -r * 0.93, r * 0.05); fillOL(c, '#20202a', lw * 0.6); c.fillStyle = 'rgba(255,255,255,.25)'; for (const [a, b] of [[-0.4, 0.4], [0.3, 0.5], [0, 0.75]]) { E(c, a * r, b * r, r * 0.06, r * 0.06); c.fill(); } }
  if (has('pacifier')) { E(c, 0, r * 0.48, r * 0.22, r * 0.14); fillOL(c, '#7ad0ff', lw * 0.5); E(c, 0, r * 0.48, r * 0.08, r * 0.08); c.fillStyle = '#fff'; c.fill(); }
  // glasses etc
  if (has('glasses') || has('monocle')) { c.strokeStyle = '#2a2a2a'; c.lineWidth = r * 0.06; for (const sd of (has('monocle') ? [1] : [-1, 1])) { c.beginPath(); c.arc(sd * r * 0.34, ey, r * 0.24, 0, P2); c.stroke(); } if (!has('monocle')) { c.beginPath(); c.moveTo(-r * 0.1, ey); c.lineTo(r * 0.1, ey); c.stroke(); } c.fillStyle = 'rgba(200,230,255,.25)'; }
  if (has('shades')) { c.fillStyle = '#111'; for (const sd of [-1, 1]) { c.beginPath(); c.roundRect ? c.roundRect(sd * r * 0.34 - r * 0.27, ey - r * 0.14, r * 0.54, r * 0.3, r * 0.08) : c.rect(sd * r * 0.34 - r * 0.27, ey - r * 0.14, r * 0.54, r * 0.3); c.fill(); } c.fillRect(-r * 0.1, ey - r * 0.08, r * 0.2, r * 0.06); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-r * 0.55, ey - r * 0.1, r * 0.12, r * 0.05); }
  if (has('goggles') || has('skigoggles')) { const ski = has('skigoggles'); c.fillStyle = ski ? '#ff8a2a' : '#5a5a6a'; c.fillRect(-r * 0.95, -r * 0.22, r * 1.9, r * 0.12); for (const sd of (ski ? [0] : [-1, 1])) { E(c, sd * r * 0.34, -r * (ski ? 0.05 : 0.15), ski ? r * 0.72 : r * 0.22, r * (ski ? 0.25 : 0.2)); const g = c.createLinearGradient(0, -r * 0.4, 0, r * 0.1); g.addColorStop(0, ski ? '#ffd040' : '#a0e8ff'); g.addColorStop(1, ski ? '#ff5aa0' : '#4a8ad0'); fillOL(c, g, lw * 0.6); } }
  if (has('villainmask')) { c.fillStyle = '#1a1a2a'; c.beginPath(); c.moveTo(-r * 0.9, -r * 0.2); c.quadraticCurveTo(0, -r * 0.4, r * 0.9, -r * 0.2); c.lineTo(r * 0.8, r * 0.12); c.quadraticCurveTo(0, -r * 0.05, -r * 0.8, r * 0.12); c.fill(); c.fillStyle = '#fff'; E(c, -r * 0.34, -r * 0.05, r * 0.1, r * 0.06); c.fill(); E(c, r * 0.34, -r * 0.05, r * 0.1, r * 0.06); c.fill(); }
  if (has('earring')) { c.strokeStyle = '#ffd040'; c.lineWidth = r * 0.06; c.beginPath(); c.arc(r * 0.95, r * 0.35, r * 0.1, 0, P2); c.stroke(); }
  if (has('flower')) { for (let k = 0; k < 5; k++) { const a = k * 1.256; E(c, -r * 0.7 + Math.cos(a) * r * 0.14, -r * 0.7 + Math.sin(a) * r * 0.14, r * 0.12, r * 0.12); c.fillStyle = '#ff3a5a'; c.fill(); } E(c, -r * 0.7, -r * 0.7, r * 0.07, r * 0.07); c.fillStyle = '#ffd040'; c.fill(); }
  // front hair
  c.fillStyle = hair;
  switch (st) {
    case 'short': case 'long': c.beginPath(); c.moveTo(-r * 0.97, -r * 0.05); c.bezierCurveTo(-r * 1.0, -r * 1.25, r * 1.0, -r * 1.25, r * 0.97, -r * 0.05); c.quadraticCurveTo(r * 0.7, -r * 0.55, r * 0.15, -r * 0.5); c.quadraticCurveTo(-r * 0.3, -r * 0.35, -r * 0.55, -r * 0.55); c.quadraticCurveTo(-r * 0.85, -r * 0.4, -r * 0.97, -r * 0.05); fillOL(c, hair, lw * 0.6); break;
    case 'slick': c.beginPath(); c.moveTo(-r * 0.95, -r * 0.15); c.bezierCurveTo(-r * 0.9, -r * 1.2, r * 0.9, -r * 1.2, r * 0.95, -r * 0.15); c.quadraticCurveTo(r * 0.3, -r * 0.7, -r * 0.95, -r * 0.15); fillOL(c, hair, lw * 0.6); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = r * 0.06; c.beginPath(); c.arc(0, -r * 0.2, r * 0.7, -2.4, -1.5); c.stroke(); break;
    case 'spiky': c.beginPath(); c.moveTo(-r * 0.97, -r * 0.1); for (let k = 0; k <= 7; k++) { const a = Math.PI + (k / 7) * Math.PI; const rr = k % 2 ? r * 1.0 : r * 1.35; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr - r * 0.1); } c.lineTo(r * 0.97, -r * 0.1); c.quadraticCurveTo(0, -r * 0.55, -r * 0.97, -r * 0.1); fillOL(c, hair, lw * 0.6); break;
    case 'bun': c.beginPath(); c.moveTo(-r * 0.97, -r * 0.05); c.bezierCurveTo(-r * 1.0, -r * 1.2, r * 1.0, -r * 1.2, r * 0.97, -r * 0.05); c.quadraticCurveTo(0, -r * 0.65, -r * 0.97, -r * 0.05); fillOL(c, hair, lw * 0.6); E(c, 0, -r * 1.1, r * 0.35, r * 0.3); fillOL(c, hair, lw * 0.6); break;
    case 'curly': for (let k = 0; k < 9; k++) { const a = Math.PI * 1.05 + (k / 8) * Math.PI * 0.9; E(c, Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85, r * 0.3, r * 0.3); fillOL(c, hair, lw * 0.5); } break;
    case 'messy': c.beginPath(); c.moveTo(-r * 0.97, 0); for (let k = 0; k <= 10; k++) { const a = Math.PI + (k / 10) * Math.PI; const rr = r * (1.05 + (k % 3) * 0.12); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr - r * 0.05); } c.lineTo(r * 0.97, 0); c.quadraticCurveTo(0, -r * 0.5, -r * 0.97, 0); fillOL(c, hair, lw * 0.6); break;
    case 'bald': for (const sd of [-1, 1]) { E(c, sd * r * 0.85, -r * 0.2, r * 0.18, r * 0.3); fillOL(c, hair, lw * 0.5); } c.fillStyle = 'rgba(255,255,255,.35)'; E(c, -r * 0.3, -r * 0.7, r * 0.2, r * 0.1, -0.4); c.fill(); break;
    case 'tuft': c.strokeStyle = hair; c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(0, -r * 0.95); c.quadraticCurveTo(r * 0.3, -r * 1.4, r * 0.05, -r * 1.25); c.stroke(); break;
    case 'topknot': c.beginPath(); c.moveTo(-r * 0.97, -r * 0.05); c.bezierCurveTo(-r * 1.0, -r * 1.2, r * 1.0, -r * 1.2, r * 0.97, -r * 0.05); c.quadraticCurveTo(0, -r * 0.6, -r * 0.97, -r * 0.05); fillOL(c, hair, lw * 0.6); E(c, 0, -r * 1.15, r * 0.18, r * 0.22); fillOL(c, hair, lw * 0.5); break;
    case 'clown': E(c, 0, -r * 0.85, r * 0.3, r * 0.2); fillOL(c, hair, lw * 0.5); break;
  }
  if (st === 'long') { for (const sd of [-1, 1]) { E(c, sd * r * 0.88, r * 0.3, r * 0.22, r * 0.6); fillOL(c, hair, lw * 0.5); } }
  if (has('glow')) { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(160,200,255,.15)'; E(c, 0, 0, r * 1.3, r * 1.3); c.fill(); c.globalCompositeOperation = 'source-over'; }
}

// ---------------------------------------------------------------- specials
function special(c, kind, r, o) {
  const t = o.t || 0, lw = r * 0.09;
  switch (kind) {
    case 'mummy': {
      E(c, 0, 0, r * 0.95, r); fillOL(c, grad(c, 0, 0, r, '#e6d8b5'), lw);
      c.save(); E(c, 0, 0, r * 0.93, r * 0.98); c.clip();
      c.strokeStyle = 'rgba(130,110,70,.6)'; c.lineWidth = r * 0.12;
      for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(-r, i * r * 0.28 - r * 0.15); c.lineTo(r, i * r * 0.28 + r * 0.2); c.stroke(); }
      c.fillStyle = '#2a1d10'; c.fillRect(-r, -r * 0.22, r * 2, r * 0.4); c.restore();
      c.fillStyle = '#ffe04a'; c.shadowColor = '#ffd000'; c.shadowBlur = r * 0.8;
      const bl = ((t + 1) % 4) < 0.12 ? 0.2 : 1;
      E(c, -r * 0.34 + (o.lx || 0) * r * 0.05, -r * 0.02, r * 0.13, r * 0.11 * bl); c.fill(); E(c, r * 0.34 + (o.lx || 0) * r * 0.05, -r * 0.02, r * 0.13, r * 0.11 * bl); c.fill();
      c.shadowBlur = 0;
      c.strokeStyle = 'rgba(230,216,181,.9)'; c.lineWidth = r * 0.1; c.beginPath(); c.moveTo(r * 0.6, r * 0.6); c.quadraticCurveTo(r * 1.1, r * 0.9 + Math.sin(t * 3) * r * 0.2, r * 1.25, r * 1.3); c.stroke();
      break;
    }
    case 'ghost': {
      const wob = Math.sin(t * 3) * r * 0.06;
      c.beginPath(); c.moveTo(-r * 0.95, r * 0.2); c.bezierCurveTo(-r * 1.0, -r * 1.4, r * 1.0, -r * 1.4, r * 0.95, r * 0.2);
      for (let k = 0; k <= 4; k++) { const x = r * 0.95 - (k / 4) * r * 1.9; c.quadraticCurveTo(x + r * 0.24, r * (0.95 + (k % 2 ? 0.15 : -0.1)) + wob, x, r * 0.75 + wob); }
      c.closePath();
      const g = c.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c8d0f0');
      c.shadowColor = '#c0d8ff'; c.shadowBlur = r * 0.8; fillOL(c, g, lw); c.shadowBlur = 0;
      c.fillStyle = '#1a1a2a'; E(c, -r * 0.32 + (o.lx || 0) * r * 0.08, -r * 0.2, r * 0.15, r * 0.24); c.fill(); E(c, r * 0.32 + (o.lx || 0) * r * 0.08, -r * 0.2, r * 0.15, r * 0.24); c.fill();
      E(c, 0, r * 0.28, r * 0.13, r * 0.17); c.fill();
      c.fillStyle = 'rgba(255,140,170,.4)'; E(c, -r * 0.6, r * 0.1, r * 0.14, r * 0.08); c.fill(); E(c, r * 0.6, r * 0.1, r * 0.14, r * 0.08); c.fill();
      break;
    }
    case 'robot': case 'cyborg': {
      if (kind === 'robot') { c.strokeStyle = '#5a6070'; c.lineWidth = r * 0.08; c.beginPath(); c.moveTo(0, -r * 0.9); c.lineTo(0, -r * 1.35); c.stroke(); E(c, 0, -r * 1.4, r * 0.14, r * 0.14); c.fillStyle = Math.sin(t * 6) > 0 ? '#ff3050' : '#ffb0b0'; c.fill(); }
      c.beginPath(); c.roundRect(-r * 0.92, -r * 0.88, r * 1.84, r * 1.76, r * 0.35);
      const g = c.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#e2e8f2'); g.addColorStop(1, '#7a8494'); fillOL(c, g, lw);
      if (kind === 'cyborg') { c.save(); c.beginPath(); c.rect(-r, -r, r, r * 2); c.clip(); E(c, 0, 0, r * 0.93, r * 0.98); fillOL(c, grad(c, 0, 0, r, '#e2aa7c'), 0); c.restore(); }
      c.beginPath(); c.roundRect(-r * 0.7, -r * 0.4, r * 1.4, r * 0.5, r * 0.2); c.fillStyle = '#141a26'; c.fill();
      const sc = (Math.sin(t * 2) * 0.5 + 0.5) * r * 0.8 - r * 0.4;
      c.fillStyle = kind === 'cyborg' ? '#ff3050' : '#46e0ff'; c.shadowColor = c.fillStyle; c.shadowBlur = r * 0.6;
      E(c, -r * 0.3 + sc * 0.3 + (o.lx || 0) * r * 0.1, -r * 0.15, r * 0.12, r * 0.1); c.fill(); E(c, r * 0.3 + sc * 0.3 + (o.lx || 0) * r * 0.1, -r * 0.15, r * 0.12, r * 0.1); c.fill();
      c.shadowBlur = 0;
      c.fillStyle = '#3a4050'; for (let k = -2; k <= 2; k++) c.fillRect(k * r * 0.18 - r * 0.05, r * 0.4, r * 0.1, r * 0.2);
      c.fillStyle = '#c0c8d4'; E(c, -r * 0.7, -r * 0.7, r * 0.06, r * 0.06); c.fill(); E(c, r * 0.7, -r * 0.7, r * 0.06, r * 0.06); c.fill();
      break;
    }
    case 'skull': {
      E(c, 0, -r * 0.1, r * 0.95, r * 0.9); fillOL(c, grad(c, 0, 0, r, '#f2eee2'), lw);
      c.beginPath(); c.roundRect(-r * 0.5, r * 0.4, r, r * 0.55, r * 0.15); fillOL(c, '#e8e4d8', lw);
      c.fillStyle = '#1a1420'; E(c, -r * 0.36, -r * 0.05, r * 0.24, r * 0.27); c.fill(); E(c, r * 0.36, -r * 0.05, r * 0.24, r * 0.27); c.fill();
      c.fillStyle = '#ff4a4a'; E(c, -r * 0.36, -r * 0.02, r * 0.06, r * 0.06); c.fill(); E(c, r * 0.36, -r * 0.02, r * 0.06, r * 0.06); c.fill();
      c.fillStyle = '#1a1420'; c.beginPath(); c.moveTo(0, r * 0.2); c.lineTo(-r * 0.1, r * 0.4); c.lineTo(r * 0.1, r * 0.4); c.fill();
      c.strokeStyle = OL; c.lineWidth = r * 0.05; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * r * 0.2, r * 0.45); c.lineTo(k * r * 0.2, r * 0.9); c.stroke(); }
      break;
    }
    case 'pumpkin': {
      c.fillStyle = '#4a7a2a'; c.fillRect(-r * 0.1, -r * 1.2, r * 0.2, r * 0.4);
      for (const k of [-0.5, 0.5, 0]) { E(c, k * r, 0, r * (k ? 0.6 : 0.65), r * 0.88); fillOL(c, grad(c, k * r, 0, r * 0.8, '#ff8a1a'), lw); }
      c.fillStyle = '#ffd040'; c.shadowColor = '#ffb000'; c.shadowBlur = r * (0.5 + Math.sin(t * 9) * 0.3);
      for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * r * 0.15, -r * 0.05); c.lineTo(sd * r * 0.55, -r * 0.05); c.lineTo(sd * r * 0.35, -r * 0.4); c.fill(); }
      c.beginPath(); c.moveTo(-r * 0.6, r * 0.25); for (let k = 0; k <= 6; k++) c.lineTo(-r * 0.6 + k * r * 0.2, r * (k % 2 ? 0.45 : 0.3)); c.lineTo(r * 0.5, r * 0.55); c.quadraticCurveTo(0, r * 0.75, -r * 0.5, r * 0.55); c.fill();
      c.shadowBlur = 0;
      break;
    }
    case 'alien': {
      for (const sd of [-1, 1]) { c.strokeStyle = '#4ab05a'; c.lineWidth = r * 0.08; c.beginPath(); c.moveTo(sd * r * 0.3, -r * 0.8); c.lineTo(sd * r * 0.55, -r * 1.35 + Math.sin(t * 4 + sd) * r * 0.08); c.stroke(); E(c, sd * r * 0.55, -r * 1.38 + Math.sin(t * 4 + sd) * r * 0.08, r * 0.13, r * 0.13); c.fillStyle = '#b0ff80'; c.fill(); }
      c.beginPath(); c.moveTo(0, r * 1.0); c.bezierCurveTo(-r * 1.3, r * 0.2, -r * 1.0, -r * 1.05, 0, -r * 1.0); c.bezierCurveTo(r * 1.0, -r * 1.05, r * 1.3, r * 0.2, 0, r * 1.0); fillOL(c, grad(c, 0, 0, r, '#6ad05a'), lw);
      c.fillStyle = '#0a0a14'; for (const sd of [-1, 1]) { E(c, sd * r * 0.38, -r * 0.05, r * 0.3, r * 0.2, sd * 0.5); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,.7)'; for (const sd of [-1, 1]) { E(c, sd * r * 0.32 + (o.lx || 0) * r * 0.06, -r * 0.12, r * 0.07, r * 0.05); c.fill(); }
      c.strokeStyle = OL; c.lineWidth = r * 0.05; c.beginPath(); c.arc(0, r * 0.4, r * 0.12, 0.2, Math.PI - 0.2); c.stroke();
      break;
    }
    case 'snowman': {
      E(c, 0, 0, r, r); fillOL(c, grad(c, 0, 0, r, '#ffffff'), lw);
      c.fillStyle = '#1a1a1a'; E(c, -r * 0.32, -r * 0.15, r * 0.1, r * 0.1); c.fill(); E(c, r * 0.32, -r * 0.15, r * 0.1, r * 0.1); c.fill();
      for (let k = -2; k <= 2; k++) { E(c, k * r * 0.17, r * 0.45 + Math.abs(k) * -r * 0.06, r * 0.05, r * 0.05); c.fill(); }
      c.beginPath(); c.moveTo(-r * 0.05, r * 0.08); c.lineTo(r * 0.7, r * 0.2); c.lineTo(-r * 0.05, r * 0.28); fillOL(c, '#ff8a2a', lw * 0.4);
      c.fillStyle = '#1a1a1a'; c.fillRect(-r * 0.75, -r * 0.85, r * 1.5, r * 0.14); c.fillRect(-r * 0.5, -r * 1.5, r * 1.0, r * 0.7); c.fillStyle = '#c02a2a'; c.fillRect(-r * 0.5, -r * 0.98, r, r * 0.12);
      break;
    }
    case 'statue': {
      c.beginPath(); c.moveTo(-r * 0.7, -r * 1.05); c.lineTo(r * 0.7, -r * 1.05); c.lineTo(r * 0.85, r * 1.0); c.lineTo(-r * 0.85, r * 1.0); c.closePath(); fillOL(c, grad(c, 0, 0, r, '#9a948a'), lw);
      c.fillStyle = '#6a645a'; c.fillRect(-r * 0.7, -r * 0.35, r * 1.4, r * 0.18);
      c.fillStyle = '#ff9a3a'; c.shadowColor = '#ff7a1a'; c.shadowBlur = r * 0.6;
      E(c, -r * 0.35, -r * 0.1, r * 0.12, r * 0.07); c.fill(); E(c, r * 0.35, -r * 0.1, r * 0.12, r * 0.07); c.fill(); c.shadowBlur = 0;
      c.fillStyle = '#7a746a'; c.beginPath(); c.moveTo(0, -r * 0.1); c.lineTo(-r * 0.2, r * 0.45); c.lineTo(r * 0.2, r * 0.45); c.fill();
      c.fillRect(-r * 0.35, r * 0.65, r * 0.7, r * 0.1);
      break;
    }
    case 'ginger': {
      E(c, 0, 0, r, r); fillOL(c, grad(c, 0, 0, r, '#c07a3a'), lw);
      c.strokeStyle = '#fff'; c.lineWidth = r * 0.08; c.beginPath(); c.arc(0, 0, r * 0.85, 0, P2); c.setLineDash([r * 0.15, r * 0.12]); c.stroke(); c.setLineDash([]);
      eyes(c, r, o, { beady: true, size: r * 0.15 });
      c.strokeStyle = '#fff'; c.lineWidth = r * 0.08; c.beginPath(); c.arc(0, r * 0.25, r * 0.35, 0.3, Math.PI - 0.3); c.stroke();
      c.fillStyle = '#ff3a5a'; E(c, -r * 0.6, r * 0.25, r * 0.1, r * 0.1); c.fill(); E(c, r * 0.6, r * 0.25, r * 0.1, r * 0.1); c.fill();
      break;
    }
    case 'cupcake': {
      c.beginPath(); c.moveTo(-r * 0.75, 0); c.lineTo(r * 0.75, 0); c.lineTo(r * 0.55, r * 1.0); c.lineTo(-r * 0.55, r * 1.0); c.closePath(); fillOL(c, '#f2c282', lw);
      c.strokeStyle = 'rgba(160,100,40,.5)'; c.lineWidth = r * 0.05; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * r * 0.28, 0); c.lineTo(k * r * 0.2, r); c.stroke(); }
      for (const [x, y, q] of [[-0.5, -0.1, 0.45], [0.5, -0.1, 0.45], [0, -0.35, 0.55], [0, -0.85, 0.32]]) { E(c, x * r, y * r, q * r, q * r * 0.85); fillOL(c, '#ff8ac8', lw * 0.6); }
      eyes(c, r, o, { y: -r * 0.25, beady: true, size: r * 0.14 });
      E(c, 0, -r * 1.15, r * 0.16, r * 0.16); fillOL(c, '#e2203a', lw * 0.4);
      break;
    }
    case 'invader': {
      const px = r * 0.24, map = ['..X.....X..', '...X...X...', '..XXXXXXX..', '.XX.XXX.XX.', 'XXXXXXXXXXX', 'X.XXXXXXX.X', 'X.X.....X.X', '...XX.XX...'];
      c.fillStyle = '#b06aff'; c.shadowColor = '#b06aff'; c.shadowBlur = r * 0.4;
      map.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') c.fillRect((i - 5.5) * px * 0.75, (j - 4) * px * 0.75 + (j > 5 && Math.sin(t * 6) > 0 ? px * 0.2 : 0), px * 0.75, px * 0.75); }));
      c.shadowBlur = 0;
      break;
    }
    case 'drone': {
      E(c, 0, r * 0.15, r * 1.2, r * 0.45); fillOL(c, grad(c, 0, 0, r, '#9aa6b8'), lw);
      E(c, 0, -r * 0.15, r * 0.55, r * 0.5); const g = c.createLinearGradient(0, -r * 0.6, 0, r * 0.2); g.addColorStop(0, '#c0f8ff'); g.addColorStop(1, '#3a8ad0'); fillOL(c, g, lw * 0.7);
      for (let k = -2; k <= 2; k++) { E(c, k * r * 0.45, r * 0.3, r * 0.08, r * 0.08); c.fillStyle = (Math.floor(t * 6) + k) % 2 ? '#ffd040' : '#ff3050'; c.fill(); }
      break;
    }
    case 'pawn': {
      E(c, 0, -r * 0.35, r * 0.55, r * 0.55); fillOL(c, grad(c, 0, 0, r, '#2c2c34'), lw);
      c.beginPath(); c.moveTo(-r * 0.45, r * 0.1); c.lineTo(r * 0.45, r * 0.1); c.lineTo(r * 0.75, r * 0.9); c.lineTo(-r * 0.75, r * 0.9); c.closePath(); fillOL(c, '#24242c', lw);
      eyes(c, r * 0.8, o, { y: -r * 0.35, size: r * 0.13 });
      c.fillStyle = '#1a1a20'; c.fillRect(-r * 0.6, -r * 0.05, r * 1.2, r * 0.15);
      break;
    }
  }
}

// ---------------------------------------------------------------- public: draw a head
const infoCache = new Map();
export function drawHead(c, e, x, y, size, o = {}) {
  let info = infoCache.get(e);
  if (!info) { info = headInfo(e); infoCache.set(e, info); }
  const r = size * 0.42;
  c.save();
  c.translate(x, y);
  if (o.rot) c.rotate(o.rot);
  if (info.kind === 'animal') animal(c, { ...info, r }, o);
  else if (info.kind === 'human') human(c, { ...info, r }, o);
  else special(c, info.kind, r, o);
  c.restore();
  return info;
}
export function impliedHat(e) { const i = infoCache.get(e) || headInfo(e); return i.kind === 'human' ? i.hat : ''; }
