import { Game } from './game.js';
import { LEVELS, CHAPTERS } from './themes.js';
import { audio } from './audio.js';
import { save, persist, resetSave, ITEMS, ACTIVE_ORDER, upgradeCost, upg, has } from './store.js';
import { difficulty } from './levelgen.js';
import { drawHead, impliedHat } from './art-chars.js';
import { drawLoot, drawVehicle, drawIcon, drawEgg, artURL } from './art-things.js';
import { drawHat, drawCharacter } from './sprites.js';

const img = (u, s, cls = 'art') => `<img class="${cls}" src="${u}" width="${s}" height="${s}" alt="" draggable="false">`;
function portrait(e, hat, size = 64, angry = false) { return img(artURL('p' + e + hat + angry, size, (c, s) => { drawHead(c, e, s / 2, s * 0.58, s * 0.66, { t: 1.3, angry }); const h = hat || impliedHat(e); if (h) drawHat(c, h, s / 2, s * 0.58, s * 0.66 * 0.84, 0); }), size); }
const lootImg = (e, size = 40) => img(artURL('l' + e, size, (c, s) => drawLoot(c, e, s / 2, s / 2, s * 0.95, 0.5)), size);
const vehImg = (e, size = 64) => img(artURL('v' + e, size, (c, s) => drawVehicle(c, e, s / 2, s * 0.55, s * 0.9, 0, true)), size);
const iconImg = (id, size = 48) => img(artURL('i' + id, size, (c, s) => drawIcon(c, id, s / 2, s / 2, s * 0.85, 0)), size);
const eggImg = (seed, size = 40) => img(artURL('e' + seed, size, (c, s) => drawEgg(c, s / 2, s / 2, s * 0.9, seed, 0)), size);
const P = (d) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const SVG = {
  play: P('<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>'),
  map: P('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M9 4v14M15 6v14" stroke="currentColor" stroke-width="2"/>'),
  cart: P('<path d="M3 4h3l2.4 10.5h10L21 7H7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="10" cy="19" r="1.8" fill="currentColor"/><circle cx="17" cy="19" r="1.8" fill="currentColor"/>'),
  egg: P('<path d="M12 3c-3.6 0-6.5 6-6.5 10.2A6.5 6.5 0 0 0 12 21a6.5 6.5 0 0 0 6.5-7.8C18.5 9 15.6 3 12 3z" fill="currentColor"/>'),
  help: P('<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M9.3 9.4a2.8 2.8 0 1 1 3.9 2.6c-.8.4-1.2 1-1.2 1.9v.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17.3" r="1.3" fill="currentColor"/>'),
  gear: P('<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8.3 5.1l-1.9-.3a6.8 6.8 0 0 1-.8 1.9l1.1 1.6-1.9 1.9-1.6-1.1a6.8 6.8 0 0 1-1.9.8l-.3 1.9h-2.7l-.3-1.9a6.8 6.8 0 0 1-1.9-.8l-1.6 1.1-1.9-1.9 1.1-1.6a6.8 6.8 0 0 1-.8-1.9l-1.9-.3v-2.7l1.9-.3c.2-.7.4-1.3.8-1.9L4.7 6.5l1.9-1.9 1.6 1.1c.6-.4 1.2-.6 1.9-.8l.3-1.9h2.7l.3 1.9c.7.2 1.3.4 1.9.8l1.6-1.1 1.9 1.9-1.1 1.6c.4.6.6 1.2.8 1.9l1.9.3z" fill="currentColor"/>'),
  back: P('<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'),
  replay: P('<path d="M4 12a8 8 0 1 0 2.4-5.7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M4 3.5V9h5.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'),
  flag: P('<path d="M5 21V4m0 1h12l-2.5 4L17 13H5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>'),
  star: P('<path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2 6.4 20.2l1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor"/>'),
  bulb: P('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.3 1 2.2h5.2c0-.9.4-1.7 1-2.2A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
  music: P('<path d="M9 18V5l11-2v13" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="6.5" cy="18" r="2.8" fill="currentColor"/><circle cx="17.5" cy="16" r="2.8" fill="currentColor"/>'),
  sound: P('<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
  shake: P('<rect x="7" y="3" width="10" height="18" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M3 8v8M21 8v8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
};


const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const app = $('#app');
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (isTouch) document.body.classList.add('touch');

audio.musicOn = save.settings.music; audio.sfxOn = save.settings.sfx;

// ================================================================ GAME
const canvas = $('#game');
const game = new Game(canvas, {
  onWin, onLose, onToast: toast, onEgg, onNote, isTouch: () => isTouch,
  onStart: () => { $('#intro-card').classList.add('hidden'); },
  onMini: () => { game.drawMinimap($('#minimap')); },
});
function fit() { game.resize(window.innerWidth, window.innerHeight); menuBg.resize(); }
window.addEventListener('resize', fit);

let last = performance.now();
let mode = 'menu';
function frame(now) {
  const dt = (now - last) / 1000; last = now;
  if (mode === 'game') {
    game.update(dt);
    game.render();
    hudTick(dt);
  } else menuBg.draw(dt);
  requestAnimationFrame(frame);
}

// ================================================================ MENU BACKGROUND
const menuBg = (() => {
  const cv = $('#menu-bg'); const c = cv.getContext('2d');
  let W = 0, H = 0, t = 0, dpr = 1;
  let bld = [], stars = [], coins = [];
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    bld = [];
    for (let layer = 0; layer < 3; layer++) {
      let x = -50;
      while (x < W + 400) {
        const w = 50 + Math.random() * 90, h = (0.15 + Math.random() * 0.28 + layer * 0.08) * H;
        const wins = [];
        for (let wy = 12; wy < h - 10; wy += 16) for (let wx = 8; wx < w - 8; wx += 14) if (Math.random() < 0.3) wins.push([wx, wy, Math.random()]);
        bld.push({ x, w, h, layer, wins, ant: Math.random() < 0.2 });
        x += w + Math.random() * 10;
      }
    }
    stars = Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.6, s: Math.random() }));
  }
  function draw(dt) {
    t += dt;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#070818'); g.addColorStop(0.55, '#1a1650'); g.addColorStop(1, '#3a1d5a');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (const s of stars) { c.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(t * 2 + s.s * 30) * 0.3})`; c.fillRect(s.x, s.y, 1.5 + s.s, 1.5 + s.s); }
    // moon
    const mx = W * 0.8, my = H * 0.18;
    const mg = c.createRadialGradient(mx, my, 10, mx, my, 160); mg.addColorStop(0, 'rgba(255,240,200,0.35)'); mg.addColorStop(1, 'rgba(255,240,200,0)');
    c.fillStyle = mg; c.beginPath(); c.arc(mx, my, 160, 0, 7); c.fill();
    c.fillStyle = '#fff3cf'; c.beginPath(); c.arc(mx, my, 46, 0, 7); c.fill();
    c.fillStyle = 'rgba(200,180,140,0.35)'; [[-12, -8, 9], [14, 10, 7], [6, -18, 5]].forEach(([a, b, r]) => { c.beginPath(); c.arc(mx + a, my + b, r, 0, 7); c.fill(); });
    // searchlights
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const bx = W * (0.18 + i * 0.32), by = H;
      const a = -Math.PI / 2 + Math.sin(t * 0.5 + i * 2) * 0.6;
      const gr = c.createLinearGradient(bx, by, bx + Math.cos(a) * H, by + Math.sin(a) * H);
      gr.addColorStop(0, 'rgba(255,240,180,0.22)'); gr.addColorStop(1, 'rgba(255,240,180,0)');
      c.fillStyle = gr; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.cos(a - 0.08) * H * 1.3, by + Math.sin(a - 0.08) * H * 1.3); c.lineTo(bx + Math.cos(a + 0.08) * H * 1.3, by + Math.sin(a + 0.08) * H * 1.3); c.fill();
    }
    c.restore();
    // buildings parallax
    for (const b of bld) {
      const speed = [6, 14, 26][b.layer];
      let x = ((b.x - t * speed) % (W + 450) + (W + 450)) % (W + 450) - 100;
      const col = ['#1d1a48', '#141236', '#0c0b22'][b.layer];
      c.fillStyle = col; c.fillRect(x, H - b.h, b.w, b.h);
      if (b.ant) { c.fillRect(x + b.w / 2 - 1, H - b.h - 24, 2, 24); c.fillStyle = Math.sin(t * 3) > 0 ? '#ff3050' : '#501020'; c.beginPath(); c.arc(x + b.w / 2, H - b.h - 24, 3, 0, 7); c.fill(); }
      for (const [wx, wy, r] of b.wins) { c.fillStyle = `rgba(255,${200 + r * 50 | 0},120,${(0.25 + b.layer * 0.15) * (Math.sin(t * 0.7 + r * 40) > -0.8 ? 1 : 0.2)})`; c.fillRect(x + wx, H - b.h + wy, 7, 9); }
    }
    // running raccoon across rooftops
    const rx = ((t * 120) % (W + 300)) - 150, ry = H - H * 0.36 + Math.abs(Math.sin(t * 8)) * -10;
    drawCharacter(c, { x: rx, y: ry, ang: 0, walk: t * 14, body: '#5d6270', head: '🦝', size: 1.3, sack: 4, t });
    if (Math.random() < 0.3) coins.push({ x: rx - 30, y: ry, vx: -40 - Math.random() * 40, vy: -100 - Math.random() * 60, life: 1.2 });
    for (const k of coins) { k.life -= dt; k.vy += 300 * dt; k.x += k.vx * dt; k.y += k.vy * dt; c.fillStyle = `rgba(255,214,90,${k.life})`; c.beginPath(); c.arc(k.x, k.y, 3, 0, 7); c.fill(); }
    coins = coins.filter((k) => k.life > 0);
    const vg = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
  }
  return { resize, draw };
})();

// ================================================================ SCREENS
const screens = ['title', 'levels', 'shop', 'album'];
let curScreen = 'title';
function show(name) {
  mode = 'menu';
  document.body.classList.remove('ingame');
  $('#menu-bg').classList.remove('hidden');
  $('#hud').classList.add('hidden'); $('#touch').classList.add('hidden');
  for (const s of screens) $('#screen-' + s).classList.toggle('hidden', s !== name);
  const el = $('#screen-' + name);
  el.classList.remove('anim-in'); void el.offsetWidth; el.classList.add('anim-in');
  curScreen = name;
  updateCoins();
  if (name === 'title') renderTitle();
  if (name === 'levels') renderLevels();
  if (name === 'shop') renderShop();
  if (name === 'album') renderAlbum();
  audio.stopMusic();
}
function updateCoins(bump) {
  $$('.coin-count').forEach((e) => { e.textContent = save.coins.toLocaleString(); if (bump) { e.parentElement.classList.remove('bump'); void e.offsetWidth; e.parentElement.classList.add('bump'); } });
}
$$('[data-back]').forEach((b) => b.addEventListener('click', () => { click(); show(curScreen === 'shop' && returnTo ? returnTo : 'title'); returnTo = null; }));
let returnTo = null;
function click() { audio.init(); audio.play('click'); }
document.addEventListener('pointerover', (e) => { if (e.target.closest && e.target.closest('.btn,.lvl-card,.tab,.chap,.gad')) audio.play('hover'); });

function renderTitle() {
  const stars = Object.values(save.stars).reduce((a, b) => a + b, 0);
  const eggs = Object.keys(save.eggs).length;
  $('#title-stats').innerHTML = `<span>${SVG.star} <b>${stars}</b>/300</span><span>${SVG.map} Heist <b>${Math.min(save.unlocked, 100)}</b>/100</span><span>${SVG.egg} <b>${eggs}</b>/300</span><span><b>${save.coins.toLocaleString()}</b> coins</span>`;
  $('#btn-play').innerHTML = save.unlocked > 1 || save.stars[1] ? `${SVG.play} Continue <small style="font-size:.55em;opacity:.75">Heist ${Math.min(save.unlocked, 100)}</small>` : `${SVG.play} Play`;
}
$('#btn-play').onclick = () => { click(); openBrief(Math.min(save.unlocked, 100)); };
$('#btn-levels').onclick = () => { click(); show('levels'); };
$('#btn-shop').onclick = () => { click(); show('shop'); };
$('#btn-album').onclick = () => { click(); show('album'); };
$('#btn-how').onclick = () => { click(); howTo(); };
$('#btn-settings').onclick = () => { click(); settings(); };

// ---------------------------------------------------------------- levels
let curChapter = Math.floor((Math.min(save.unlocked, 100) - 1) / 10);
function renderLevels() {
  const ch = $('#chapters');
  ch.innerHTML = CHAPTERS.map((c, i) => {
    const first = i * 10 + 1;
    const st = LEVELS.slice(i * 10, i * 10 + 10).reduce((a, _, k) => a + (save.stars[first + k] || 0), 0);
    return `<button class="chap ${i === curChapter ? 'active' : ''} ${first > save.unlocked ? 'locked' : ''}" data-ch="${i}" style="--cc:${c.color}"><span class="ci">${portrait(LEVELS[i * 10].h[0], LEVELS[i * 10].h[3], 34)}</span><span>${c.name}<small>★ ${st}/30</small></span></button>`;
  }).join('');
  ch.querySelectorAll('.chap').forEach((b) => (b.onclick = () => { click(); curChapter = +b.dataset.ch; renderLevels(); }));
  const active = ch.querySelector('.active'); if (active) active.scrollIntoView({ inline: 'center', block: 'nearest' });
  const grid = $('#level-grid');
  grid.innerHTML = '';
  for (let k = 0; k < 10; k++) {
    const L = curChapter * 10 + k + 1, th = LEVELS[L - 1];
    const locked = L > save.unlocked, st = save.stars[L] || 0;
    const eggs = [0, 1, 2].map((i) => `<i class="${save.eggs[`${L}-${i}`] ? 'on' : ''}"></i>`).join('');
    const card = document.createElement('button');
    card.className = `lvl-card ${locked ? 'locked' : ''} ${L === save.unlocked ? 'next' : ''}`;
    card.style.animationDelay = k * 0.04 + 's';
    card.innerHTML = `<div class="lvl-art" style="background:linear-gradient(135deg, ${th.fc[0]}, ${th.wc[1]} 70%, ${th.acc})">
        <div class="beam"></div><span class="lvl-num">${L}</span><div class="egg-dots">${eggs}</div>
        <span class="hero">${portrait(th.h[0], th.h[3], 78)}</span><span class="guard">${portrait(th.g[0][0], th.g[0][3], 40, true)}</span><span class="loot">${lootImg(th.l[0][0], 38)}</span></div>
      <div class="lvl-info"><b>${th.n}</b><div class="stars">${[0, 1, 2].map((i) => `<span class="${i < st ? 'on' : ''}">★</span>`).join('')}</div></div>`;
    card.onclick = () => { if (locked) { audio.init(); audio.play('deny'); toast('Finish the previous heist to unlock this one!'); return; } click(); openBrief(L); };
    grid.appendChild(card);
  }
}

// ---------------------------------------------------------------- briefing

function openBrief(L) {
  const th = LEVELS[L - 1], d = difficulty(L);
  const ch = CHAPTERS[Math.floor((L - 1) / 10)];
  const hz = [];
  if (L >= 2) hz.push(th.nz);
  if (L >= 3) hz.push('Cameras');
  if (L >= 4) hz.push('Locked doors & safes');
  if (L >= 5) hz.push('Laser tripwires');
  if (L >= 6) hz.push('Vents');
  if (L >= 12) hz.push('Pressure plates');
  if (L >= 12 && th.k) hz.push(`${th.k[1]}s`);
  if (L >= 25) hz.push('Hidden lasers');
  const guardsUniq = [...new Map(th.g.map((g) => [g[1], g])).values()];
  const st = save.stars[L] || 0;
  const eggs = [0, 1, 2].filter((i) => save.eggs[`${L}-${i}`]).length;
  const tips = [];
  if (L >= 2 && !has('cutter')) tips.push('Tip: a Glass Cutter opens display cases silently.');
  if (L >= 5 && !has('emf')) tips.push('Tip: the EMF Destabilizer shuts down lasers and cameras.');
  if (L >= 3 && !has('xray')) tips.push('Tip: X-Ray Goggles reveal guards through walls.');
  modal(`
    <div class="brief-head" style="background:linear-gradient(135deg, ${th.wc[1]}, ${th.acc})">
      <div class="bh-num">CHAPTER ${Math.floor((L - 1) / 10) + 1} · ${ch.name.toUpperCase()} · HEIST ${L}</div>
      <h2>${th.n}</h2><p>${th.d}</p><div class="bh-art">${vehImg(th.x[0], 84)}</div>
    </div>
    <div class="lineup">
      <div class="lu"><small>You are</small><div class="big">${portrait(th.h[0], th.h[3], 60)}</div><b>${th.h[1]}</b></div>
      <div class="lu"><small>Steal</small><div class="big">${th.l[0].map((e) => lootImg(e, 46)).join('')}</div><b>${3 + Math.floor(L / 30)}× ${th.l[1]}</b></div>
      <div class="lu" style="grid-column:1/-1"><small>Security</small><div class="big">${guardsUniq.map((g) => portrait(g[0], g[3], 52, true)).join('')}${th.k && L >= 12 ? portrait(th.k[0], '', 52, true) : ''}</div><b>${guardsUniq.map((g) => g[1]).join(', ')}</b>
        <div class="chips">${hz.map((h) => `<span class="chip ${/Laser|Pressure|Hidden/.test(h) ? 'warn' : ''}">${h}</span>`).join('')}</div>
        <div class="diff-bar"><i style="width:${8 + d.d * 92}%"></i></div></div>
    </div>
    <div class="chips"><span class="chip">Best: <span class="gold-t">${'★'.repeat(st)}</span>${'☆'.repeat(3 - st)}</span><span class="chip">Secrets: ${eggs}/3</span><span class="chip">Getaway: ${th.x[1]}</span></div>
    ${tips.length ? `<p style="margin:10px 0 0;font-size:13px">${SVG.bulb} ${tips[L % tips.length]}</p>` : ''}
    <div class="actions"><button class="btn" id="m-shop">${SVG.cart} Gear up</button><button class="btn gold" id="m-go">Start Heist ${SVG.play}</button></div>`);
  $('#m-go').onclick = () => { click(); closeModal(); startLevel(L); };
  $('#m-shop').onclick = () => { click(); closeModal(); returnTo = 'levels'; show('shop'); };
}

// ---------------------------------------------------------------- shop
let shopTab = 'tools';
const SK_LINES = ['Psst. Got coins? I got gear.', 'No refunds. No questions. No receipts.', 'These goggles? Totally legit. Mostly.', 'A rubber chicken never lets you down.', 'Fell off a truck. A very fancy truck.', 'Buy two, get... also two.', 'Smells? That\'s the smell of quality.'];
function renderShop() {
  $('#sk-line').textContent = SK_LINES[Math.floor(Math.random() * SK_LINES.length)];
  const tabs = [['tools', 'Tools'], ['gadgets', 'Gadgets'], ['upgrades', 'Upgrades'], ['style', 'Style']];
  $('#shop-tabs').innerHTML = tabs.map(([k, n]) => `<button class="tab ${k === shopTab ? 'active' : ''}" data-t="${k}">${n}</button>`).join('');
  $$('#shop-tabs .tab').forEach((b) => (b.onclick = () => { click(); shopTab = b.dataset.t; renderShop(); }));
  const grid = $('#shop-grid');
  grid.innerHTML = '';
  Object.entries(ITEMS).filter(([, it]) => it.cat === shopTab).forEach(([id, it], i) => {
    const el = document.createElement('div');
    el.className = 'item';
    el.style.animationDelay = i * 0.03 + 's';
    let action = '', meta = '';
    const price = (p) => `<span class="price"><span class="coin-ico"></span>${p}</span>`;
    if (it.cat === 'tools') {
      if (has(id)) { el.classList.add('owned-tool'); meta = `<span class="own">${it.key === 'active' ? 'Active · recharges' : 'Passive · always on'}</span>`; }
      else action = `<button class="btn small gold" data-buy="${id}" ${save.coins < it.price ? 'disabled' : ''}>Buy ${price(it.price)}</button>`;
    } else if (it.cat === 'gadgets') {
      meta = `<span class="own">Owned: ${save.items[id] || 0}</span>`;
      action = `<button class="btn small gold" data-buy="${id}" ${save.coins < it.price ? 'disabled' : ''}>Buy ${price(it.price)}</button>`;
    } else if (it.cat === 'upgrades') {
      const lv = upg(id);
      meta = `<div class="pips">${Array.from({ length: it.max }, (_, k) => `<i class="${k < lv ? 'on' : ''}"></i>`).join('')}</div>`;
      action = lv >= it.max ? '<span class="own">MAXED</span>' : `<button class="btn small gold" data-buy="${id}" ${save.coins < upgradeCost(id) ? 'disabled' : ''}>Upgrade ${price(upgradeCost(id))}</button>`;
    } else {
      const owned = save.ownedCos[id];
      const equipped = save.cos[it.slot] === id;
      action = owned ? `<button class="btn small ${equipped ? 'green' : ''}" data-equip="${id}">${equipped ? '✓ Equipped' : 'Equip'}</button>` : `<button class="btn small gold" data-buy="${id}" ${save.coins < it.price ? 'disabled' : ''}>Buy ${price(it.price)}</button>`;
    }
    el.innerHTML = `<div class="ie">${iconImg(id, 56)}</div><div class="ib"><h4>${it.n}</h4><p>${it.desc}</p><div class="meta">${meta}${action}</div></div>`;
    grid.appendChild(el);
  });
  grid.querySelectorAll('[data-buy]').forEach((b) => (b.onclick = () => buy(b.dataset.buy, b)));
  grid.querySelectorAll('[data-equip]').forEach((b) => (b.onclick = () => { click(); const it = ITEMS[b.dataset.equip]; save.cos[it.slot] = save.cos[it.slot] === b.dataset.equip ? null : b.dataset.equip; persist(); renderShop(); }));
}
function buy(id, btn) {
  audio.init();
  const it = ITEMS[id];
  const cost = it.cat === 'upgrades' ? upgradeCost(id) : it.price;
  if (save.coins < cost) { audio.play('deny'); return; }
  save.coins -= cost;
  if (it.cat === 'tools') save.owned[id] = true;
  else if (it.cat === 'gadgets') save.items[id] = (save.items[id] || 0) + it.qty;
  else if (it.cat === 'upgrades') save.upg[id] = upg(id) + 1;
  else { save.ownedCos[id] = true; save.cos[it.slot] = id; }
  persist(); audio.play('buy');
  const r = btn.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top, iconImg(id, 48));
  $('#sk-line').textContent = ['Pleasure doing business.', 'Good choice. Great choice, even.', 'Use it wisely. Or chaotically.', 'Come back soon, bandit.'][Math.floor(Math.random() * 4)];
  updateCoins(true);
  renderShop();
}
function burst(x, y, e) {
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('div');
    if (i === 0) s.innerHTML = e; else { s.className = 'spark'; }
    Object.assign(s.style, { position: 'fixed', left: x + 'px', top: y + 'px', fontSize: i === 0 ? '40px' : '18px', zIndex: 60, pointerEvents: 'none', transition: 'all .8s cubic-bezier(.2,.8,.3,1)', transform: 'translate(-50%,-50%)' });
    document.body.appendChild(s);
    requestAnimationFrame(() => { const a = Math.random() * Math.PI * 2, d = i === 0 ? 0 : 60 + Math.random() * 60; s.style.transform = `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - (i === 0 ? 60 : 0)}px)) scale(${i === 0 ? 1.4 : 0.6})`; s.style.opacity = '0'; });
    setTimeout(() => s.remove(), 900);
  }
}

// ---------------------------------------------------------------- album
function renderAlbum() {
  const n = Object.keys(save.eggs).length;
  $('#egg-count').innerHTML = `${SVG.egg} <b>${n}</b>/300`;
  const g = $('#album-grid');
  g.innerHTML = LEVELS.map((th, i) => {
    const L = i + 1;
    return `<div class="alb"><h5>${L}. ${th.n}</h5><div class="eggs">${th.eg.map((e, k) => save.eggs[`${L}-${k}`] ? `<button class="egg on" data-l="${L}" data-k="${k}">${eggImg(L * 3 + k, 40)}</button>` : '<button class="egg">?</button>').join('')}</div></div>`;
  }).join('');
  g.querySelectorAll('.egg.on').forEach((b) => (b.onclick = () => { click(); const e = LEVELS[b.dataset.l - 1].eg[b.dataset.k]; modal(`<div style="text-align:center">${eggImg(b.dataset.l * 3 + +b.dataset.k, 96)}</div><h2 style="text-align:center">Secret #${+b.dataset.k + 1}</h2><p style="text-align:center">${e[1]}</p><p style="text-align:center;font-size:13px">Found in: ${LEVELS[b.dataset.l - 1].n}</p><div class="actions"><button class="btn" onclick="document.dispatchEvent(new Event('closemodal'))">Nice</button></div>`); }));
}

// ---------------------------------------------------------------- modal
function modal(html) { $('#modal').innerHTML = html; $('#modal-wrap').classList.remove('hidden'); }
function closeModal() { $('#modal-wrap').classList.add('hidden'); }
document.addEventListener('closemodal', closeModal);
$('#modal-wrap').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal-wrap' && !$('#modal').dataset.lock) closeModal(); });

function howTo() {
  modal(`<h2>How to rob anything</h2>
    <div class="keys">
      <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><span>Move (or arrow keys / touch joystick)</span>
      <span><kbd>Shift</kbd></span><span>Sneak — silent footsteps, slower, harder to spot</span>
      <span><kbd>E</kbd> / <kbd>Space</kbd></span><span>Interact — hold to crack safes, pick locks, cut glass</span>
      <span><kbd>1</kbd>–<kbd>9</kbd></span><span>Use gadgets & tools (mouse aims throws)</span>
      <span><kbd>M</kbd></span><span>Big map</span>
      <span><kbd>Esc</kbd> / <kbd>P</kbd></span><span>Pause</span>
    </div>
    <div class="tips">
      <div>Stay out of flashlight beams. The ring over a guard's head shows how suspicious they are.</div>
      <div>Walking makes noise. Noisy floors are much louder — sneak across them!</div>
      <div>Lasers, cameras and pressure plates sound the alarm and bring guards running.</div>
      <div>Hide in objects to break line of sight — but not while they're watching!</div>
      <div>Grab every target, then escape to your getaway vehicle. Coins buy gear in the Black Market.</div>
      <div>Stars: escape · collect 70% of coins · never get spotted.</div>
      <div>Every level hides 3 secret easter eggs. Look for sparkles in quiet corners.</div>
    </div>
    <div class="actions"><button class="btn gold" onclick="document.dispatchEvent(new Event('closemodal'))">Got it!</button></div>`);
}
function settings(inGame) {
  const row = (k, n) => `<div class="toggle-row"><span>${n}</span><button class="switch ${save.settings[k] ? 'on' : ''}" data-k="${k}"></button></div>`;
  modal(`<h2>Settings</h2>${row('music', SVG.music + ' Music')}${row('sfx', SVG.sound + ' Sound effects')}${row('shake', SVG.shake + ' Screen shake')}
    <div class="actions">${inGame ? '' : '<button class="btn red small" id="m-reset">Reset progress</button>'}<button class="btn gold" id="m-done">Done</button></div>`);
  $$('#modal .switch').forEach((b) => (b.onclick = () => {
    audio.init(); const k = b.dataset.k; save.settings[k] = !save.settings[k]; persist();
    b.classList.toggle('on', save.settings[k]);
    if (k === 'music') audio.setMusic(save.settings.music);
    if (k === 'sfx') audio.setSfx(save.settings.sfx);
    audio.play('click');
  }));
  $('#m-done').onclick = () => { click(); if (inGame) pauseMenu(); else closeModal(); };
  const r = $('#m-reset');
  if (r) r.onclick = () => { if (r.dataset.c) resetSave(); else { r.dataset.c = 1; r.textContent = 'Tap again to confirm'; } };
}

// ================================================================ IN-GAME
let curLevel = 1;
function startLevel(L) {
  audio.init();
  curLevel = L;
  mode = 'game';
  document.body.classList.add('ingame');
  for (const s of screens) $('#screen-' + s).classList.add('hidden');
  $('#menu-bg').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  if (isTouch) $('#touch').classList.remove('hidden');
  $('#bigmap').classList.add('hidden');
  closeModal();
  fit();
  game.load(L);
  audio.setMusic(save.settings.music);
  const th = game.theme;
  $('#hud-lvnum').textContent = L;
  $('#hud-lvname').textContent = th.n;
  $('#hud-loot').innerHTML = game.lvl.loot.map((l) => `<span>${lootImg(l.e, 30)}</span>`).join('');
  lastLoot = 0; lastCoins = -1;
  buildGadgets();
  const guardsUniq = [...new Set(th.g.map((g) => g[0]))];
  $('#intro-card').innerHTML = `<div class="ic"><small>HEIST ${L} · ${CHAPTERS[Math.floor((L - 1) / 10)].name.toUpperCase()}</small><h2>${th.n}</h2>
    <div class="vs">${portrait(th.h[0], th.h[3], 72)} <span style="font-size:20px;opacity:.7">vs</span> ${th.g.filter((g, i, a) => a.findIndex((o) => o[0] === g[0]) === i).map((g) => portrait(g[0], g[3], 56, true)).join('')}</div>
    <p>Steal ${game.lvl.lootCount}× ${th.l[1]} — then escape in the ${th.x[1]}</p><div class="skip">${isTouch ? 'Tap' : 'Press any key'} to skip</div></div>`;
  $('#intro-card').classList.remove('hidden');
  if (!save.seenIntro) { save.seenIntro = true; persist(); setTimeout(() => toast(isTouch ? 'Drag on the left to move · Action to interact · Sneak to tiptoe' : 'WASD to move · hold SHIFT to sneak · E to interact'), 3400); }
}

function buildGadgets() {
  const bar = $('#gadget-bar');
  const list = ACTIVE_ORDER.filter((id) => (ITEMS[id].cat === 'tools' ? has(id) : (save.items[id] || 0) > 0));
  bar.innerHTML = list.map((id, i) => `<button class="gad" data-g="${id}" title="${ITEMS[id].n}"><span class="k">${i < 9 && !isTouch ? i + 1 : ''}</span>${iconImg(id, 40)}<span class="q">${ITEMS[id].cat === 'tools' ? '' : save.items[id]}</span><span class="cd" style="transform:scaleY(0)"></span></button>`).join('');
  gadgetList = list;
  bar.querySelectorAll('.gad').forEach((b) => b.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); useGadget(b.dataset.g); }));
}
let gadgetList = [];
function useGadget(id) {
  if (game.useGadget(id)) {
    const b = $(`.gad[data-g="${id}"]`);
    if (b) { b.classList.add('used'); setTimeout(() => b.classList.remove('used'), 120); }
    if (ITEMS[id].cat !== 'tools') { if ((save.items[id] || 0) <= 0) buildGadgets(); else b.querySelector('.q').textContent = save.items[id]; }
  }
}

let lastLoot = 0, lastCoins = -1, hudT = 0;
function hudTick(dt) {
  if (game.state === 'idle') return;
  const p = game.player;
  if (p.loot !== lastLoot) {
    const spans = $$('#hud-loot span');
    spans.forEach((s, i) => s.classList.toggle('got', i < p.loot));
    lastLoot = p.loot;
  }
  $('#hud-obj').textContent = p.loot >= game.lvl.lootCount ? `Escape to the ${game.theme.x[1]}!` : `Steal ${game.lvl.lootCount - p.loot} more ${game.theme.l[1]}`;
  if (game.collectedCoins !== lastCoins) {
    $('#hud-coins').textContent = game.collectedCoins;
    if (lastCoins >= 0) { const c = $('.hud-coins'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
    lastCoins = game.collectedCoins;
  }
  if ((hudT += dt) < 0.1) return;
  hudT = 0;
  // stealth status
  const st = $('#hud-stealth');
  const chasing = game.guards.some((g) => g.state === 'chase');
  const maxSus = Math.max(0, ...game.guards.map((g) => (g.sleep > 0 ? 0 : g.sus)));
  let txt, cls = '';
  if (game.state === 'intro') { txt = 'Casing the joint...'; }
  else if (chasing) { txt = 'SPOTTED — break line of sight!'; cls = 'seen'; }
  else if (p.hidden) { txt = `Hiding in the ${game.theme.hs[1]}`; cls = 'safe'; }
  else if (p.invis > 0) { txt = 'Invisible'; cls = 'safe'; }
  else if (maxSus > 0.15) { txt = 'Someone is suspicious...'; cls = 'sus'; }
  else if (p.sneak) { txt = 'Sneaking'; cls = 'safe'; }
  else txt = p.moving ? 'Walking (makes noise)' : 'Lurking in the shadows';
  st.textContent = txt; st.className = cls;
  $('#alarm-banner').classList.toggle('hidden', !(game.alarm > 0));
  // cooldowns
  for (const id of gadgetList) {
    const it = ITEMS[id]; const b = $(`.gad[data-g="${id}"]`); if (!b) continue;
    const cd = b.querySelector('.cd');
    if (it.cat === 'tools') { const r = Math.max(0, game.cds[id] || 0) / it.cd; cd.style.transform = `scaleY(${r})`; }
    const active = (id === 'xray' && game.fx.xray > 0) || (id === 'emf' && game.fx.emf > 0) || (id === 'hack' && game.fx.hack > 0) || ((id === 'cloak' || id === 'tonic') && p.invis > 0);
    b.classList.toggle('active', active);
  }
  $('#t-sneak') && $('#t-sneak').classList.toggle('on', game.input.sneakToggle);
  if (!$('#bigmap').classList.contains('hidden')) game.drawMinimap($('#bigmap-cv'), true);
}

function onWin(r) {
  const L = curLevel;
  const prevStars = save.stars[L] || 0;
  save.stars[L] = Math.max(prevStars, r.stars);
  save.coins += r.total;
  save.unlocked = Math.max(save.unlocked, Math.min(100, L + 1));
  save.stats.heists++; save.stats.coinsTotal += r.total; if (r.ghost) save.stats.ghost++;
  persist();
  audio.stopMusic();
  const mm = Math.floor(r.time / 60), ss = Math.floor(r.time % 60).toString().padStart(2, '0');
  modal(`<h2 class="result-title">HEIST COMPLETE!</h2>
    <div class="big-stars">${[0, 1, 2].map((i) => `<span class="${i < r.stars ? 'on' : ''}">★</span>`).join('')}</div>
    <div class="star-reqs"><span class="ok">✓ Escaped with the loot</span><span class="${r.coinPct >= 0.7 ? 'ok' : ''}">${r.coinPct >= 0.7 ? '✓' : '✗'} Collected 70% of coins (${Math.round(r.coinPct * 100)}%)</span><span class="${r.ghost ? 'ok' : ''}">${r.ghost ? '✓' : '✗'} Ghost — never spotted, no alarms</span></div>
    <div class="res-rows">
      <div class="res-row" style="animation-delay:.6s"><span>Coins grabbed</span><b>${r.coins}</b></div>
      <div class="res-row" style="animation-delay:.7s"><span>${lootImg(game.theme.l[0][0], 20)} Loot bonus</span><b>+${r.lootBonus}</b></div>
      ${r.ghostBonus ? `<div class="res-row" style="animation-delay:.8s"><span>Ghost bonus</span><b>+${r.ghostBonus}</b></div>` : ''}
      ${r.firstBonus ? `<div class="res-row" style="animation-delay:.85s"><span>First clear</span><b>+${r.firstBonus}</b></div>` : ''}
      ${r.pocket > 1 ? `<div class="res-row" style="animation-delay:.9s"><span>Deep Pockets</span><b>×${r.pocket.toFixed(2)}</b></div>` : ''}
      <div class="res-row total" style="animation-delay:1s"><span>Total earned</span><b>+<span id="count-up">0</span></b></div>
      <div class="res-row" style="animation-delay:1.1s"><span>Time · Secrets</span><b>${mm}:${ss} · ${r.eggs}/${r.eggsTotal}</b></div>
    </div>
    <div class="actions"><button class="btn" id="m-map">${SVG.map} Heists</button><button class="btn" id="m-shop2">${SVG.cart} Shop</button><button class="btn" id="m-replay">${SVG.replay} Replay</button>${L < 100 ? '<button class="btn gold" id="m-next">Next Heist ${SVG.play}</button>' : ''}</div>`);
  $('#modal').dataset.lock = 1;
  let v = 0; const tgt = r.total; const step = Math.max(1, Math.ceil(tgt / 40));
  const iv = setInterval(() => { v = Math.min(tgt, v + step); const el = $('#count-up'); if (el) el.textContent = v; audio.play('coin'); if (v >= tgt) clearInterval(iv); }, 35);
  wireEnd(L);
  if (L === 100) setTimeout(() => toast('YOU BEAT ALL 100 HEISTS! You are the Raccoon King!', 'gold'), 1500);
}
function onLose(by) {
  const L = curLevel;
  audio.stopMusic();
  const tips = ['Hold SHIFT to sneak — it is silent and harder to spot.', 'Throw pebbles (1) to lure guards away from loot.', 'Watch the suspicion ring over a guard\'s head. Back off before it fills!', 'Hide in objects to break line of sight.', 'Guards hear footsteps. Walk softly near them.', 'Smoke bombs block all vision, including cameras.', 'Sleep darts take a guard out of the game for 15 seconds.', 'The Black Market sells upgrades that make you quieter and faster.'];
  modal(`<div class="busted"><div class="stamp">BUSTED!</div><div class="by">${portrait(by ? by.e : '👮', by ? by.hat : '', 96, true)}</div>
    <p>Caught by <b style="color:#fff">${by ? by.n : 'security'}</b>.</p><p style="font-size:14px">${SVG.bulb} ${tips[Math.floor(Math.random() * tips.length)]}</p></div>
    <div class="actions"><button class="btn" id="m-map">${SVG.map} Heists</button><button class="btn" id="m-shop2">${SVG.cart} Shop</button><button class="btn gold" id="m-replay">${SVG.replay} Try Again</button></div>`);
  $('#modal').dataset.lock = 1;
  wireEnd(L);
}
function wireEnd(L) {
  const done = () => { delete $('#modal').dataset.lock; game.state = 'idle'; audio.siren(false); };
  $('#m-map').onclick = () => { click(); done(); closeModal(); curChapter = Math.floor((Math.min(save.unlocked, 100) - 1) / 10); show('levels'); };
  $('#m-shop2').onclick = () => { click(); done(); closeModal(); returnTo = 'levels'; show('shop'); };
  $('#m-replay').onclick = () => { click(); done(); startLevel(L); };
  const n = $('#m-next'); if (n) n.onclick = () => { click(); done(); curChapter = Math.floor(L / 10); show('levels'); openBrief(L + 1); };
}

function pauseMenu() {
  if (game.state === 'play' || game.state === 'intro') { game.prevState = game.state; game.state = 'paused'; }
  audio.siren(false);
  modal(`<h2>Paused</h2><p>${game.theme.n} · Heist ${curLevel}</p>
    <div class="actions" style="flex-direction:column"><button class="btn gold" id="m-resume">${SVG.play} Resume</button><button class="btn" id="m-restart">${SVG.replay} Restart heist</button><button class="btn" id="m-how">${SVG.help} How to play</button><button class="btn" id="m-set">${SVG.gear} Settings</button><button class="btn red" id="m-quit">${SVG.flag} Quit to heists</button></div>`);
  $('#modal').dataset.lock = 1;
  $('#m-resume').onclick = resume;
  $('#m-restart').onclick = () => { click(); delete $('#modal').dataset.lock; startLevel(curLevel); };
  $('#m-how').onclick = () => { click(); howTo(); $('#modal .actions .btn').onclick = pauseMenu; };
  $('#m-set').onclick = () => { click(); settings(true); };
  $('#m-quit').onclick = () => { click(); delete $('#modal').dataset.lock; closeModal(); game.state = 'idle'; show('levels'); };
}
function resume() { click(); delete $('#modal').dataset.lock; closeModal(); if (game.state === 'paused') game.state = game.prevState || 'play'; if (game.alarm > 0) audio.siren(true); }
$('#btn-pause').onclick = () => { click(); pauseMenu(); };

// ---------------------------------------------------------------- toasts / eggs / notes
function toast(msg, cls = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + cls; t.innerHTML = msg;
  const box = $('#toasts');
  box.appendChild(t);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => t.remove(), cls === 'egg' ? 5200 : 3700);
}
function onEgg(e, isNew) {
  const n = Object.keys(save.eggs).length;
  toast(`<span class="ee">${eggImg(curLevel * 3 + e.id, 44)}</span>${isNew ? 'SECRET FOUND!' : 'Secret (already found)'} <small>(${n}/300)</small><br><span style="font-weight:700;font-size:13px">${e.text}</span>`, 'egg');
}
function onNote(text) { toast(`<div class="note-paper" style="font-size:15px;padding:16px 18px">${text}</div>`); }

// ================================================================ INPUT
window.addEventListener('keydown', (e) => {
  audio.init();
  if (mode !== 'game') { if (e.code === 'Escape' && !$('#modal-wrap').classList.contains('hidden') && !$('#modal').dataset.lock) closeModal(); return; }
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  game.input.keys.add(e.code);
  game.input.pressed.add('any');
  if (['KeyE', 'Space', 'Enter'].includes(e.code)) game.input.pressed.add('interact');
  if (e.code === 'Escape' || e.code === 'KeyP') { if (game.state === 'paused') resume(); else if (game.state === 'play' || game.state === 'intro') pauseMenu(); }
  if (e.code === 'KeyM') toggleMap();
  if (e.code === 'KeyC') game.input.sneakToggle = !game.input.sneakToggle;
  const m = /^Digit([1-9])$/.exec(e.code);
  if (m && gadgetList[+m[1] - 1]) useGadget(gadgetList[+m[1] - 1]);
});
window.addEventListener('keyup', (e) => game.input.keys.delete(e.code));
window.addEventListener('blur', () => { game.input.keys.clear(); if (mode === 'game' && game.state === 'play') pauseMenu(); });
canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { game.input.mouse.sx = e.clientX; game.input.mouse.sy = e.clientY; game.input.mouse.t = game.time; } });
canvas.addEventListener('pointerdown', (e) => { audio.init(); game.input.pressed.add('any'); if (e.pointerType === 'mouse') { game.input.mouse.sx = e.clientX; game.input.mouse.sy = e.clientY; game.input.mouse.t = game.time; } });
$('#intro-card').addEventListener('pointerdown', () => game.input.pressed.add('any'));
function toggleMap() { const bm = $('#bigmap'); bm.classList.toggle('hidden'); if (!bm.classList.contains('hidden')) game.drawMinimap($('#bigmap-cv'), true); }
$('#minimap').addEventListener('pointerdown', (e) => { e.stopPropagation(); toggleMap(); });
$('#bigmap').addEventListener('pointerdown', toggleMap);

// touch joystick
(() => {
  const zone = $('#joy-zone'), base = $('#joy-base'), knob = $('#joy-knob');
  let id = null, cx = 0, cy = 0;
  zone.addEventListener('pointerdown', (e) => {
    audio.init(); game.input.pressed.add('any');
    id = e.pointerId; zone.setPointerCapture(id);
    const r = zone.getBoundingClientRect();
    cx = e.clientX; cy = e.clientY;
    base.style.left = (cx - r.left - 60) + 'px'; base.style.top = (cy - r.top - 60) + 'px'; base.style.bottom = 'auto';
    move(e);
  });
  const move = (e) => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const d = Math.hypot(dx, dy), max = 50;
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    game.input.joy.x = dx / max; game.input.joy.y = dy / max;
  };
  zone.addEventListener('pointermove', move);
  const end = (e) => { if (e.pointerId !== id) return; id = null; game.input.joy.x = 0; game.input.joy.y = 0; knob.style.transform = ''; };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
  const act = $('#t-act');
  act.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.init(); game.input.interact = true; game.input.pressed.add('interact'); game.input.pressed.add('any'); });
  const actUp = () => { game.input.interact = false; };
  act.addEventListener('pointerup', actUp); act.addEventListener('pointercancel', actUp); act.addEventListener('pointerleave', actUp);
  $('#t-sneak').addEventListener('pointerdown', (e) => { e.preventDefault(); game.input.sneakToggle = !game.input.sneakToggle; audio.play('click'); });
})();

// ================================================================ BOOT
// SVG icons on menu buttons
[['#btn-play', 'play'], ['#btn-levels', 'map'], ['#btn-shop', 'cart'], ['#btn-album', 'egg'], ['#btn-how', 'help'], ['#btn-settings', 'gear']].forEach(([sel, k]) => { const b = $(sel); if (b && !b.querySelector('svg')) b.innerHTML = SVG[k] + ' ' + b.innerHTML; });
$$('[data-back]').forEach((b) => (b.innerHTML = SVG.back + ' Back'));
// animated logo raccoon, shopkeeper and touch buttons
(() => {
  const live = [['#logo-cv', (c, s, t) => { drawHead(c, '🦝', s / 2, s * 0.55, s * 0.82, { t, lx: Math.sin(t * 0.7), ly: 0.2 }); drawHat(c, 'fedora', s / 2, s * 0.55, s * 0.82 * 0.84, t); }],
    ['#sk-cv', (c, s, t) => { drawHead(c, '🦨', s / 2, s * 0.56, s * 0.78, { t, lx: Math.sin(t), ly: 0.2 }); drawHat(c, 'beanie', s / 2, s * 0.56, s * 0.78 * 0.84, t); }]];
  const tbs = $$('.tb-cv');
  let t = 0;
  const loop = () => {
    t += 0.016;
    for (const [sel, fn] of live) { const cv = $(sel); if (!cv || cv.offsetParent === null) continue; const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); fn(c, cv.width, t); }
    if (mode === 'game') for (const cv of tbs) { const c = cv.getContext('2d'); c.clearRect(0, 0, 80, 80); drawIcon(c, cv.dataset.i, 40, 40, 56, t); }
    requestAnimationFrame(loop);
  };
  loop();
})();
fit();
show('title');
requestAnimationFrame(frame);
// expose for debugging
window.__game = game;
window.__start = startLevel;
