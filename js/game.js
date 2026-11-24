import { TS, RNG, clamp, lerp, dist, angDiff, rgba, shade, mix, segCircle, easeOutCubic } from './util.js';
import { generateLevel, difficulty, findPath, FLOOR, WALL, PROP, DOOR, LOCK } from './levelgen.js';
import { renderStatic } from './world.js';
import { drawCharacter, drawCoin, roundRect } from './sprites.js';
import { drawHead, headInfo } from './art-chars.js';
import { drawProp, drawLoot, drawVehicle, drawEgg, drawSparkle, drawNote, drawLock, drawBanana, drawDonut, drawShards, drawPebble, drawRubberChicken, drawSmokeBomb, drawDart, drawDizzy, drawEyesPeek, drawBolt, drawLeaf, drawIcon } from './art-things.js';
import { LEVELS } from './themes.js';
import { audio } from './audio.js';
import { save, ITEMS, upg, has, persist } from './store.js';

const GENERIC_LINES = ['*yawn*', 'Quiet night...', 'Did I lock the back door?', 'I need a raise.', 'Hmm hmm hmm~', 'What was that?', 'Five more hours...', 'My feet hurt.'];
const NOTE_LINES = [
  'MEMO: Whoever keeps leaving the lights on, STOP. - Mgmt',
  'Reminder: Do NOT feed the {hero}s. They come back.',
  'Shift schedule: everyone, all night, forever. Love, the Boss.',
  'Lost: one sense of direction. If found, please return.',
  'The {loot} are counted every morning. EVERY morning.',
  'Rumor has it a {hero} was spotted near the vents. Probably nothing.',
  'Note to self: buy more flashlight batteries. And snacks.',
  'Safety tip: noisy floors are noisy. Walk softly (hold SHIFT).',
  'If you hear a rubber chicken, IGNORE IT. It is a trap. Probably.',
  'Security drill on Tuesday. Or was it Wednesday...',
];

export class Game {
  constructor(canvas, hooks) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.light = document.createElement('canvas');
    this.lctx = this.light.getContext('2d');
    this.hooks = hooks;
    this.input = { keys: new Set(), mouse: { sx: 0, sy: 0, t: -99 }, joy: { x: 0, y: 0 }, interact: false, sneakToggle: false, pressed: new Set() };
    this.state = 'idle';
    this.vw = 800; this.vh = 600; this.dpr = 1;
    this.mini = null;
  }

  resize(w, h) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.vw = w; this.vh = h;
    this.cv.width = Math.round(w * this.dpr); this.cv.height = Math.round(h * this.dpr);
    this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px';
    this.LS = 0.5;
    this.light.width = Math.ceil(w * this.LS); this.light.height = Math.ceil(h * this.LS);
    this.baseZoom = clamp(Math.min(w / (25 * TS), h / (15 * TS)), 0.5, 1.4);
  }

  // ============================================================ LOAD
  load(L) {
    this.L = L;
    this.theme = LEVELS[L - 1];
    this.diff = difficulty(L);
    this.lvl = generateLevel(L, this.theme);
    this.staticCv = renderStatic(this.lvl, this.theme, L);
    this.rng = new RNG(Date.now() & 0xffff);
    const lv = this.lvl;
    this.player = { x: lv.start.x, y: lv.start.y - TS, ang: -Math.PI / 2, walk: 0, sneak: false, hidden: null, loot: 0, coins: 0, stepT: 0, invis: 0, boost: 0, moving: false, r: TS * 0.28, dash: null, vent: null, hideBusted: false, trailT: 0, spd: 0 };
    this.guards = lv.guards.map((g, i) => ({
      ...g, id: i, state: g.sentry ? 'look' : 'patrol', ri: 0, pi: 0, sus: 0, timer: this.rng.range(0.5, 2), route: null, target: null,
      lastSeen: null, lostT: 0, bubble: null, lookBase: g.ang, walk: 0, sleep: 0, stun: 0, repath: 0, chatT: this.rng.range(5, 18), poly: null, alerted: false,
      home: { x: g.x, y: g.y }, sawPlayer: false, eatT: 0, visible: false, spd: 0,
    }));
    this.time = 0; this.alarm = 0; this.alarms = 0; this.alarmCool = 0; this.spotted = false; this.chases = 0;
    this.explored = new Uint8Array(lv.w * lv.h);
    this.particles = []; this.fxParticles = []; this.projectiles = []; this.smokes = []; this.bananas = []; this.donuts = []; this.decoys = []; this.rings = [];
    this.fx = { xray: 0, emf: 0, emfPos: null, hack: 0, freeze: 0, blueprint: false };
    this.cds = {};
    this.shake = 0; this.flash = 0; this.flashColor = '#fff';
    this.interactTarget = null; this.interactProg = 0;
    this.eggsFound = []; this.collectedCoins = 0;
    this.toastQ = [];
    this.cam = { x: lv.start.x, y: lv.start.y, zoom: this.baseZoom };
    // intro camera pan from loot to player
    const lx = lv.loot.reduce((a, l) => a + l.x, 0) / lv.loot.length, ly = lv.loot.reduce((a, l) => a + l.y, 0) / lv.loot.length;
    this.intro = { t: 0, dur: 3.2, from: { x: (lx + 0.5) * TS, y: (ly + 0.5) * TS } };
    this.state = 'intro';
    this.escapeT = 0; this.caughtT = 0; this.caughtBy = null;
    this.miniT = 0;
    this.revealMini = false;
    this.viewR = (8.5 + upg('eyes') + (has('nightvis') ? 2.5 : 0)) * TS;
    this.tag = (save.cos.trail && ITEMS[save.cos.trail]) ? ITEMS[save.cos.trail].color : null;
    this.notesText = lv.notes.map((n, i) => this.fill(NOTE_LINES[(this.L * 3 + i * 5) % NOTE_LINES.length]));
    this.lines = (this.theme.ln || []).concat(GENERIC_LINES);
    audio.startMusic(this.theme.mus || 0, L * 13 + 7, 92 + (L % 5) * 6);
    audio.setIntensity(0);
  }
  fill(s) { return s.replace('{hero}', this.theme.h[1].split(' ')[0]).replace('{loot}', this.theme.l[1]); }

  // ============================================================ TILE HELPERS
  tileAt(x, y) { return this.lvl.get(Math.floor(x / TS), Math.floor(y / TS)); }
  doorAt(tx, ty) { return this.lvl.doors.get(ty * this.lvl.w + tx); }
  opaque(tx, ty) {
    const t = this.lvl.get(tx, ty);
    if (t === WALL || t === PROP) return true;
    if (t === DOOR || t === LOCK) { const d = this.doorAt(tx, ty); return !d || d.open < 0.5; }
    return false;
  }
  solidForPlayer(tx, ty) {
    const t = this.lvl.get(tx, ty);
    if (t === WALL || t === PROP || t === LOCK) return true;
    if (t === DOOR) { const d = this.doorAt(tx, ty); return d && d.open < 0.55; }
    return false;
  }
  castRay(ox, oy, ang, max) {
    const dx = Math.cos(ang), dy = Math.sin(ang);
    let mx = Math.floor(ox / TS), my = Math.floor(oy / TS);
    const ddx = Math.abs(1 / (dx || 1e-9)) * TS, ddy = Math.abs(1 / (dy || 1e-9)) * TS;
    const stepX = dx < 0 ? -1 : 1, stepY = dy < 0 ? -1 : 1;
    let sdx = dx < 0 ? (ox / TS - mx) * ddx : (mx + 1 - ox / TS) * ddx;
    let sdy = dy < 0 ? (oy / TS - my) * ddy : (my + 1 - oy / TS) * ddy;
    let d = 0;
    for (let i = 0; i < 200; i++) {
      if (sdx < sdy) { d = sdx; sdx += ddx; mx += stepX; } else { d = sdy; sdy += ddy; my += stepY; }
      if (d >= max) return max;
      if (this.opaque(mx, my)) return d;
    }
    return max;
  }
  los(ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay);
    if (d < 1) return true;
    return this.castRay(ax, ay, Math.atan2(by - ay, bx - ax), d) >= d - 2;
  }
  smokeBlocks(ax, ay, bx, by) {
    for (const s of this.smokes) if (segCircle(ax, ay, bx, by, s.x, s.y) < s.r * 0.85) return true;
    return false;
  }

  // ============================================================ UPDATE
  update(dt) {
    dt = Math.min(dt, 0.05);
    if (this.state === 'idle' || this.state === 'paused') return;
    this.time += dt;
    const lv = this.lvl, p = this.player;

    if (this.state === 'intro') {
      this.intro.t += dt;
      const k = easeOutCubic(clamp((this.intro.t - 0.6) / (this.intro.dur - 0.8), 0, 1));
      this.cam.x = lerp(this.intro.from.x, p.x, k); this.cam.y = lerp(this.intro.from.y, p.y, k);
      this.cam.zoom = lerp(this.baseZoom * 0.62, this.baseZoom, k);
      this.updateAmbient(dt);
      this.updateDoors(dt);
      if (this.intro.t >= this.intro.dur || this.input.pressed.size) { this.state = 'play'; this.cam.zoom = this.baseZoom; this.hooks.onStart && this.hooks.onStart(); }
      this.input.pressed.clear();
      return;
    }
    if (this.state === 'caught') {
      this.caughtT += dt;
      this.cam.zoom = lerp(this.cam.zoom, this.baseZoom * 1.5, dt * 3);
      this.cam.x = lerp(this.cam.x, p.x, dt * 4); this.cam.y = lerp(this.cam.y, p.y, dt * 4);
      this.updateParticles(dt);
      if (this.caughtT > 2.0 && !this.lostFired) { this.lostFired = true; this.hooks.onLose(this.caughtBy); }
      return;
    }
    if (this.state === 'escape') {
      this.escapeT += dt;
      this.updateParticles(dt);
      if (Math.random() < 0.6) this.particles.push({ x: lv.start.x + this.escapeT * 300 * this.escapeT - 20, y: lv.start.y + 14, vx: -40 - Math.random() * 60, vy: -20 - Math.random() * 30, life: 0.8, max: 0.8, size: 8 + Math.random() * 8, color: 'rgba(200,190,170,0.6)', type: 'smoke' });
      if (this.escapeT > 2.2 && !this.wonFired) { this.wonFired = true; this.hooks.onWin(this.results()); }
      return;
    }

    // ---------------- timers
    for (const k in this.cds) if (this.cds[k] > 0) this.cds[k] -= dt * (1 + 0.15 * upg('belt'));
    for (const k of ['xray', 'emf', 'hack', 'freeze']) if (this.fx[k] > 0) this.fx[k] -= dt;
    if (p.invis > 0) p.invis -= dt;
    if (p.boost > 0) p.boost -= dt;
    if (this.alarm > 0) { this.alarm -= dt; if (this.alarm <= 0) audio.siren(false); }
    if (this.alarmCool > 0) this.alarmCool -= dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.5);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2);

    this.updatePlayer(dt);
    this.updateDoors(dt);
    for (const g of this.guards) this.updateGuard(g, dt);
    this.updateCameras(dt);
    this.updateLasers(dt);
    this.updateProjectiles(dt);
    this.updateParticles(dt);
    this.updateAmbient(dt);

    // music intensity
    const chasing = this.guards.some((g) => g.state === 'chase');
    const sus = Math.max(0, ...this.guards.map((g) => g.sus));
    audio.setIntensity(chasing || this.alarm > 0 ? 1 : sus > 0.3 ? 0.5 : 0);

    // camera
    const lead = p.moving ? TS * 0.8 : 0;
    const tx = p.x + Math.cos(p.ang) * lead, ty = p.y + Math.sin(p.ang) * lead;
    this.cam.x = lerp(this.cam.x, tx, Math.min(1, dt * 5));
    this.cam.y = lerp(this.cam.y, ty, Math.min(1, dt * 5));
    this.cam.zoom = lerp(this.cam.zoom, this.baseZoom, dt * 3);

    // explored
    if ((this.miniT += dt) > 0.15) { this.miniT = 0; this.markExplored(); this.hooks.onMini && this.hooks.onMini(); }
    this.input.pressed.clear();
  }

  // ------------------------------------------------------------ PLAYER
  updatePlayer(dt) {
    const p = this.player, inp = this.input;
    let mx = 0, my = 0;
    const K = inp.keys;
    if (K.has('ArrowLeft') || K.has('KeyA')) mx -= 1;
    if (K.has('ArrowRight') || K.has('KeyD')) mx += 1;
    if (K.has('ArrowUp') || K.has('KeyW')) my -= 1;
    if (K.has('ArrowDown') || K.has('KeyS')) my += 1;
    if (Math.abs(inp.joy.x) + Math.abs(inp.joy.y) > 0.15) { mx = inp.joy.x; my = inp.joy.y; }
    const mag = Math.hypot(mx, my);
    if (mag > 1) { mx /= mag; my /= mag; }
    p.sneak = K.has('ShiftLeft') || K.has('ShiftRight') || inp.sneakToggle || (mag > 0 && mag < 0.55 && inp.joy.x !== 0);

    // dash (grapple)
    if (p.dash) {
      p.dash.t += dt;
      const k = Math.min(1, p.dash.t / 0.22);
      p.x = lerp(p.dash.fx, p.dash.tx, easeOutCubic(k)); p.y = lerp(p.dash.fy, p.dash.ty, easeOutCubic(k));
      if (Math.random() < 0.8) this.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 5, color: '#c0e8ff', type: 'dot' });
      if (k >= 1) p.dash = null;
      return;
    }
    if (p.vent) {
      p.vent.t += dt;
      if (p.vent.t > 0.45 && !p.vent.moved) { p.vent.moved = true; p.x = p.vent.to.x; p.y = p.vent.to.y + 1; this.cam.x = p.x; this.cam.y = p.y; }
      if (p.vent.t > 0.9) p.vent = null;
      return;
    }

    if (p.hidden) {
      p.moving = false;
      if (this.input.pressed.has('interact') || (mag > 0.5 && this.time - p.hiddenAt > 0.4)) this.unhide();
      return;
    }

    const base = 3.75 * TS * (1 + 0.06 * upg('swift'));
    const spd = base * (p.sneak ? 0.5 : 1) * (p.boost > 0 ? 1.6 : 1);
    p.moving = mag > 0.1;
    if (p.moving) {
      const ta = Math.atan2(my, mx);
      p.ang += angDiff(p.ang, ta) * Math.min(1, dt * 14);
      this.movePlayer(mx * spd * dt, my * spd * dt);
      p.walk += dt * (p.sneak ? 7 : 12);
      p.spd = spd;
      // footsteps
      p.stepT -= dt;
      if (p.stepT <= 0) {
        p.stepT = p.sneak ? 0.42 : 0.28;
        const tx = Math.floor(p.x / TS), ty = Math.floor(p.y / TS), ti = ty * this.lvl.w + tx;
        const paws = 1 - 0.15 * upg('paws');
        if (this.lvl.noise.has(ti)) {
          const r = (p.sneak ? 2.2 : 6.5) * paws;
          this.makeNoise(p.x, p.y, r, p.sneak ? 0.5 : 1);
          audio.play('creak');
          if (!p.sneak) this.toastOnce('nz', `${this.theme.nz}! Hold SHIFT to sneak across noisy floors.`);
        } else if (!p.sneak) {
          this.makeNoise(p.x, p.y, 2.3 * paws, 0.25);
          audio.play('step', { vol: 0.06 });
          if (Math.random() < 0.5) this.particles.push({ x: p.x - Math.cos(p.ang) * 8, y: p.y + 10, vx: (Math.random() - 0.5) * 20, vy: -10, life: 0.5, max: 0.5, size: 4, color: 'rgba(220,210,190,0.45)', type: 'smoke' });
        }
        if (this.lvl.plates.has(ti)) { this.triggerAlarm(p.x, p.y, 'Pressure plate!'); }
      }
      // trail cosmetic
      if (this.tag && (p.trailT -= dt) <= 0) {
        p.trailT = 0.05;
        const col = this.tag === 'rainbow' ? `hsl(${(this.time * 300) % 360},90%,65%)` : this.tag;
        this.particles.push({ x: p.x + (Math.random() - 0.5) * 10, y: p.y + 6 + (Math.random() - 0.5) * 10, vx: 0, vy: -8, life: 0.7, max: 0.7, size: 3 + Math.random() * 3, color: col, type: 'glow' });
      }
    } else { p.walk = 0; p.spd = 0; }

    // vases
    for (const v of this.lvl.vases) {
      if (v.broken) continue;
      const d = dist(p.x, p.y, v.x, v.y);
      if (d < TS * 0.55) {
        if (!p.sneak && p.moving) {
          v.broken = true;
          audio.play('crash');
          this.makeNoise(v.x, v.y, 7, 1);
          this.shake = 0.4;
          for (let i = 0; i < 14; i++) this.particles.push({ x: v.x, y: v.y, vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.5) * 220, life: 0.7, max: 0.7, size: 4, color: '#c9a080', type: 'dot', drag: 3 });
          this.toastOnce('vase', 'CRASH! Sneak (SHIFT) near fragile objects.');
        } else v.wob = 1;
        // push out
        const a = Math.atan2(p.y - v.y, p.x - v.x);
        if (!v.broken) { p.x = v.x + Math.cos(a) * TS * 0.55; p.y = v.y + Math.sin(a) * TS * 0.55; }
      }
      if (v.wob > 0) v.wob -= dt * 2;
    }

    // coins
    const magR = TS * (0.9 + 0.55 * upg('magnet'));
    for (const c of this.lvl.coins) {
      if (c.taken) continue;
      const d = dist(p.x, p.y, c.x, c.y);
      if (d < magR || c.pull) {
        const a = Math.atan2(p.y - c.y, p.x - c.x);
        const s = Math.max(200, 900 - d * 3) * dt;
        c.x += Math.cos(a) * s; c.y += Math.sin(a) * s;
      }
      if (d < TS * 0.42) {
        c.taken = true; p.coins += c.v; this.collectedCoins += c.v;
        audio.play(c.big ? 'bigcoin' : 'coin');
        this.particles.push({ x: c.x, y: c.y - 10, vx: 0, vy: -40, life: 0.8, max: 0.8, text: `+${c.v}`, color: '#ffd84a', type: 'text' });
        for (let i = 0; i < 5; i++) this.particles.push({ x: c.x, y: c.y, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120, life: 0.4, max: 0.4, size: 3, color: '#ffe680', type: 'glow' });
      }
    }
    // eggs
    for (const e of this.lvl.eggs) {
      if (e.taken) continue;
      if (dist(p.x, p.y, e.x, e.y) < TS * 0.6) {
        e.taken = true;
        audio.play('egg');
        this.eggsFound.push(e.id);
        const key = `${this.L}-${e.id}`;
        const isNew = !save.eggs[key];
        save.eggs[key] = true; persist();
        this.hooks.onEgg(e, isNew);
        for (let i = 0; i < 20; i++) this.particles.push({ x: e.x, y: e.y, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200, life: 1, max: 1, size: 4, color: `hsl(${Math.random() * 360},90%,70%)`, type: 'glow', drag: 2 });
      }
    }
    // free loot
    for (const l of this.lvl.loot) {
      if (l.taken || !l.opened) continue;
      if (dist(p.x, p.y, (l.x + 0.5) * TS, (l.y + 0.5) * TS) < TS * 0.6) this.takeLoot(l);
    }
    // exit
    if (p.loot >= this.lvl.lootCount && dist(p.x, p.y, this.lvl.start.x, this.lvl.start.y) < TS * 1.2) {
      this.state = 'escape'; this.escapeT = 0; audio.play('win'); audio.siren(false); audio.setIntensity(0);
    }

    // interactions
    this.findInteract();
    const it = this.interactTarget;
    const held = this.input.interact || K.has('KeyE') || K.has('Space') || K.has('Enter');
    if (it) {
      if (it.instant) {
        if (this.input.pressed.has('interact')) it.act();
      } else if (held) {
        this.interactProg += dt / it.time;
        if (it.tick && Math.random() < dt * 6) audio.play('tick');
        if (this.interactProg >= 1) { this.interactProg = 0; it.act(); }
      } else this.interactProg = Math.max(0, this.interactProg - dt * 0.5);
      if (this.lastIt !== it.key) { this.interactProg = 0; this.lastIt = it.key; }
    } else { this.interactProg = 0; this.lastIt = null; }

    // gadgets via number keys handled by useSlot from UI
  }

  movePlayer(dx, dy) {
    const p = this.player, r = p.r;
    const collide = (nx, ny) => {
      const x0 = Math.floor((nx - r) / TS), x1 = Math.floor((nx + r) / TS), y0 = Math.floor((ny - r) / TS), y1 = Math.floor((ny + r) / TS);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        if (!this.solidForPlayer(tx, ty)) continue;
        // circle vs box
        const cx = clamp(nx, tx * TS, tx * TS + TS), cy = clamp(ny, ty * TS, ty * TS + TS);
        if ((nx - cx) ** 2 + (ny - cy) ** 2 < r * r) return true;
      }
      return false;
    };
    // substeps
    const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 8);
    for (let s = 0; s < steps; s++) {
      const sx = dx / steps, sy = dy / steps;
      if (!collide(p.x + sx, p.y)) p.x += sx;
      else { // slide around corners
        if (!collide(p.x + sx, p.y - Math.abs(sx))) { p.x += sx; p.y -= Math.abs(sx) * 0.5; }
        else if (!collide(p.x + sx, p.y + Math.abs(sx))) { p.x += sx; p.y += Math.abs(sx) * 0.5; }
      }
      if (!collide(p.x, p.y + sy)) p.y += sy;
      else {
        if (!collide(p.x - Math.abs(sy), p.y + sy)) { p.y += sy; p.x -= Math.abs(sy) * 0.5; }
        else if (!collide(p.x + Math.abs(sy), p.y + sy)) { p.y += sy; p.x += Math.abs(sy) * 0.5; }
      }
    }
  }

  takeLoot(l) {
    l.taken = true;
    this.player.loot++;
    audio.play('loot');
    this.flash = 0.25; this.flashColor = '#ffe680';
    const wx = (l.x + 0.5) * TS, wy = (l.y + 0.5) * TS;
    for (let i = 0; i < 26; i++) this.particles.push({ x: wx, y: wy, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300, life: 1, max: 1, size: 4, color: '#ffd84a', type: 'glow', drag: 2.5 });
    this.particles.push({ x: wx, y: wy - 20, vx: 0, vy: -30, life: 1.4, max: 1.4, text: `${this.theme.l[1].replace(/s$/, '')}! ${this.player.loot}/${this.lvl.lootCount}`, color: '#fff', type: 'text', big: true });
    if (this.player.loot >= this.lvl.lootCount) this.hooks.onToast(`All ${this.theme.l[1]} secured! Escape in the ${this.theme.x[1]}!`, 'gold');
  }

  findInteract() {
    const p = this.player, lv = this.lvl;
    let best = null, bd = TS * 1.25;
    const consider = (x, y, obj) => { const d = dist(p.x, p.y, x, y); if (d < bd) { bd = d; best = obj; } };
    const hands = 1 - 0.12 * upg('hands');
    for (const l of lv.loot) {
      if (l.taken || l.opened) continue;
      const wx = (l.x + 0.5) * TS, wy = (l.y + 0.5) * TS;
      if (l.kind === 'case') {
        const cut = has('cutter');
        consider(wx, wy, { key: l, x: wx, y: wy, label: cut ? 'Cut Glass' : 'Smash Case', time: (cut ? 0.8 : 1.1) * hands, tick: false, act: () => {
          l.opened = true;
          if (cut) { audio.play('cut'); this.particles.push({ x: wx, y: wy - 20, vx: 0, vy: -30, life: 1, max: 1, text: 'silent cut!', color: '#bff', type: 'text' }); }
          else { audio.play('glass'); this.makeNoise(wx, wy, 8, 1); this.shake = 0.5; for (let i = 0; i < 20; i++) this.particles.push({ x: wx, y: wy, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.5) * 260, life: 0.8, max: 0.8, size: 3, color: '#cfefff', type: 'dot', drag: 3 }); this.toastOnce('glass', 'Smashing glass is LOUD. A Glass Cutter (Shop) does it silently.'); }
          this.takeLoot(l);
        } });
      } else if (l.kind === 'safe') {
        consider(wx, wy, { key: l, x: wx, y: wy, label: 'Crack Safe', time: (has('stetho') ? 1.6 : 3.2) * hands, tick: true, act: () => { l.opened = true; audio.play('unlock'); this.takeLoot(l); } });
      }
    }
    for (const d of lv.doors.values()) {
      if (!d.locked) continue;
      const wx = (d.x + 0.5) * TS, wy = (d.y + 0.5) * TS;
      consider(wx, wy, { key: d, x: wx, y: wy, label: 'Pick Lock', time: (has('lockpick') ? 0.8 : 2.4) * hands, tick: true, act: () => {
        // unlock this door and its twin
        for (const o of lv.doors.values()) if (o.locked && Math.abs(o.x - d.x) + Math.abs(o.y - d.y) <= 1) { o.locked = false; lv.grid[o.y * lv.w + o.x] = DOOR; }
        audio.play('unlock');
      } });
    }
    for (const s of lv.switches) {
      if (s.used) continue;
      const wx = (s.x + 0.5) * TS, wy = (s.y + 0.5) * TS;
      consider(wx, wy, { key: s, x: wx, y: wy, label: 'Cut Laser Wires', time: 1.2 * hands, tick: true, act: () => { s.used = true; for (const l of lv.lasers) if (l.group === s.group) l.off = true; audio.play('zap'); this.hooks.onToast('Lasers disabled!', 'blue'); } });
    }
    for (const h of lv.hides) consider(h.x, h.y, { key: h, x: h.x, y: h.y, label: `Hide (${this.theme.hs[1]})`, instant: true, act: () => this.hide(h) });
    for (const v of lv.vents) consider(v.x, v.y, { key: v, x: v.x, y: v.y, label: 'Crawl into Vent', instant: true, act: () => { audio.play('vent'); this.player.vent = { t: 0, to: v.to }; this.toastOnce('vent', 'Vents connect distant parts of the map.'); } });
    lv.notes.forEach((n, i) => consider(n.x, n.y, { key: n, x: n.x, y: n.y, label: 'Read Note', instant: true, act: () => { audio.play('note'); this.hooks.onNote(this.notesText[i]); } }));
    this.interactTarget = best;
  }

  hide(h) {
    const p = this.player;
    // was anyone watching?
    const watcher = this.guards.find((g) => g.state === 'chase' && this.guardSees(g, true));
    p.hidden = h; p.hiddenAt = this.time; p.hideBusted = !!watcher;
    p.x = h.x; p.y = h.y;
    audio.play('hide');
    if (watcher) this.toastOnce('busted-hide', 'They saw you hide! Get out and run!');
  }
  unhide() {
    const p = this.player; const h = p.hidden; p.hidden = null; p.hideBusted = false;
    // step out to a free side
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
      const tx = h.tx + dx, ty = h.ty + dy;
      if (!this.solidForPlayer(tx, ty)) { p.x = (tx + 0.5) * TS; p.y = (ty + 0.5) * TS; break; }
    }
    audio.play('hide');
  }

  // ------------------------------------------------------------ NOISE / ALARM
  makeNoise(x, y, radiusTiles, strength = 1, silentRing = false) {
    const R = radiusTiles * TS;
    if (!silentRing) this.rings.push({ x, y, r: 0, max: R, life: 0.7, strength });
    for (const g of this.guards) {
      if (g.sleep > 0 || g.stun > 0 || g.state === 'chase' || g.state === 'eat') continue;
      const hr = R * this.diff.hearing * (g.hound ? 1.4 : 1);
      if (dist(g.x, g.y, x, y) < hr) this.investigate(g, x, y, strength > 0.8);
    }
  }
  investigate(g, x, y, hurry) {
    g.state = 'investigate'; g.target = { x, y }; g.route = null; g.repath = 0; g.hurry = hurry;
    g.sus = Math.max(g.sus, 0.3);
    if (!g.bubble || g.bubble.kind !== '?') { g.bubble = { text: '?', t: 1.5, kind: '?' }; audio.play('huh'); }
  }
  triggerAlarm(x, y, why) {
    if (this.alarmCool > 0) return;
    this.alarmCool = 3;
    this.alarm = 9; this.alarms++;
    audio.siren(true);
    this.shake = 0.6; this.flash = 0.4; this.flashColor = '#ff2040';
    this.hooks.onToast(`ALARM! ${why || ''}`, 'red');
    for (const g of this.guards) {
      if (g.sleep > 0 || g.state === 'chase') continue;
      if (dist(g.x, g.y, x, y) < TS * 26) { this.investigate(g, x, y, true); g.sus = Math.max(g.sus, 0.6); g.bubble = { text: '!', t: 1.5, kind: '!' }; }
    }
  }

  // ------------------------------------------------------------ DOORS
  updateDoors(dt) {
    const p = this.player;
    for (const d of this.lvl.doors.values()) {
      const cx = (d.x + 0.5) * TS, cy = (d.y + 0.5) * TS;
      let want = 0;
      if (!d.locked && dist(p.x, p.y, cx, cy) < TS * 1.25) want = 1;
      for (const g of this.guards) if (g.sleep <= 0 && dist(g.x, g.y, cx, cy) < TS * 1.3) { want = 1; break; }
      if (want && d.open < 0.05 && dist(p.x, p.y, cx, cy) < TS * 6) audio.play('door');
      d.open = clamp(d.open + (want ? 5 : -2.5) * dt, 0, 1);
    }
  }

  // ------------------------------------------------------------ GUARDS
  guardSees(g, ignoreHidden = false) {
    const p = this.player;
    if ((p.hidden && !ignoreHidden) || p.invis > 0 || p.vent) return false;
    if (g.sleep > 0 || g.stun > 0 || this.fx.freeze > 0) return false;
    const d = dist(g.x, g.y, p.x, p.y);
    const range = this.diff.visionRange * TS * (g.hound ? 0.6 : 1) * (g.state === 'chase' ? 1.25 : 1);
    const half = g.hound ? 0.95 : this.diff.visionHalf;
    const near = d < TS * (p.sneak ? 0.9 : 1.6);
    if (d > range && !near) return false;
    const a = Math.atan2(p.y - g.y, p.x - g.x);
    if (!near && Math.abs(angDiff(g.ang, a)) > half) return false;
    if (!this.los(g.x, g.y, p.x, p.y)) return false;
    if (this.smokeBlocks(g.x, g.y, p.x, p.y)) return false;
    return true;
  }

  updateGuard(g, dt) {
    if (g.bubble) { g.bubble.t -= dt; if (g.bubble.t <= 0) g.bubble = null; }
    if (this.fx.freeze > 0) return;
    if (g.sleep > 0) {
      g.sleep -= dt;
      if (Math.random() < dt * 1.2) this.particles.push({ x: g.x + 10, y: g.y - 26, vx: 12, vy: -22, life: 1.4, max: 1.4, text: 'z', color: '#cfe0ff', type: 'text' });
      if (g.sleep <= 0) { g.state = 'search'; g.timer = 2.5; g.bubble = { text: '?!', t: 1.2, kind: '?' }; g.sus = 0; }
      return;
    }
    if (g.stun > 0) { g.stun -= dt; g.ang += dt * 9; if (g.stun <= 0) { g.state = 'search'; g.timer = 2; } return; }
    const p = this.player;
    const sees = this.state === 'play' && this.time > 1.5 && this.guardSees(g);
    const d = dist(g.x, g.y, p.x, p.y);
    if (sees) {
      const range = this.diff.visionRange * TS;
      const shadowMul = 1 / (1 + 0.1 * upg('shadow'));
      const closeness = clamp(1.55 - (d / range) * 1.1, 0.35, 1.6);
      const rate = (1 / this.diff.detectTime) * closeness * (p.sneak ? 0.72 : 1) * shadowMul * (this.alarm > 0 ? 1.5 : 1);
      g.sus = Math.min(1, g.sus + rate * dt);
      g.lastSeen = { x: p.x, y: p.y }; g.lostT = 0;
      if (g.sus >= 1 && g.state !== 'chase') this.startChase(g);
      else if (g.sus > 0.2 && ['patrol', 'look', 'return', 'search', 'investigate'].includes(g.state)) {
        g.state = 'suspicious'; g.timer = 0.2;
        if (!g.bubble || g.bubble.kind !== '?') { g.bubble = { text: '?', t: 1.4, kind: '?' }; audio.play('huh'); }
      }
    } else {
      if (g.state === 'chase') {
        g.lostT += dt;
        if (p.hidden && p.hideBusted) { g.lastSeen = { x: p.x, y: p.y }; g.lostT = 0; }
        if (g.lostT > 2.6) { g.state = 'investigate'; g.target = g.lastSeen; g.route = null; g.hurry = true; g.sus = 0.7; g.bubble = { text: '?', t: 1.5, kind: '?' }; }
      } else g.sus = Math.max(0, g.sus - dt * (g.state === 'suspicious' ? 0.12 : 0.2));
    }

    const walk = this.diff.guardSpeed * TS * (g.hound ? 1.25 : 1) * (this.alarm > 0 ? 1.2 : 1);
    const run = this.diff.chaseSpeed * TS * (g.hound ? 1.1 : 1);
    let moving = false;
    switch (g.state) {
      case 'patrol': {
        if (!g.routes.length) { g.state = 'look'; g.timer = 3; break; }
        const r = g.routes[g.ri];
        if (g.pi >= r.length) { g.state = 'look'; g.timer = this.rng.range(1.2, 2.8); g.lookBase = g.ang; break; }
        moving = this.stepAlong(g, r, walk, dt);
        if ((g.chatT -= dt) <= 0) { g.chatT = this.rng.range(10, 22); if (d < TS * 12) g.bubble = { text: this.rng.pick(this.lines), t: 3, kind: 'talk' }; }
        break;
      }
      case 'look': {
        g.timer -= dt;
        g.ang = g.lookBase + Math.sin(this.time * 1.3 + g.id) * (g.sentry ? 1.3 : 0.9);
        if (g.sentry) { g.lookBase += dt * 0.15; if ((g.chatT -= dt) <= 0) { g.chatT = this.rng.range(12, 24); if (d < TS * 12) g.bubble = { text: this.rng.pick(this.lines), t: 3, kind: 'talk' }; } break; }
        if (g.timer <= 0) { g.ri = (g.ri + 1) % g.routes.length; g.pi = 0; g.state = 'patrol'; }
        break;
      }
      case 'suspicious': {
        const tgt = g.lastSeen || p;
        const ta = Math.atan2(tgt.y - g.y, tgt.x - g.x);
        g.ang += angDiff(g.ang, ta) * Math.min(1, dt * 5);
        if (!sees) { g.timer += dt; if (g.timer > 1.3) { g.state = 'investigate'; g.target = g.lastSeen; g.route = null; g.hurry = false; } }
        else if (g.sus > 0.55) { // creep closer
          const a = Math.atan2(p.y - g.y, p.x - g.x);
          this.guardMove(g, Math.cos(a) * walk * 0.5 * dt, Math.sin(a) * walk * 0.5 * dt);
          moving = true;
        }
        break;
      }
      case 'investigate': {
        if (!g.target) { g.state = 'return'; break; }
        if (!g.route || (g.repath -= dt) <= 0) { g.route = this.routeTo(g, g.target.x, g.target.y); g.pi = 0; g.repath = 2; }
        if (!g.route) { g.state = 'search'; g.timer = 2; break; }
        moving = this.stepAlong(g, g.route, g.hurry ? run * 0.85 : walk * 1.15, dt);
        if (g.pi >= g.route.length || dist(g.x, g.y, g.target.x, g.target.y) < TS * 0.6) { g.state = 'search'; g.timer = this.rng.range(2.5, 4); g.lookBase = g.ang; }
        this.checkDonuts(g);
        break;
      }
      case 'search': {
        g.timer -= dt;
        g.ang = g.lookBase + Math.sin(this.time * 2.2 + g.id) * 1.4;
        if (g.timer <= 0) { g.state = 'return'; g.route = null; if (Math.random() < 0.5) g.bubble = { text: this.rng.pick(['Must\'ve been the wind.', 'Huh. Nothing.', 'I\'m hearing things.', 'Weird...']), t: 2, kind: 'talk' }; }
        this.checkDonuts(g);
        break;
      }
      case 'return': {
        const homeT = g.sentry || !g.routes.length ? [Math.floor(g.home.x / TS), Math.floor(g.home.y / TS)] : g.routes[g.ri][0] || g.wps[0];
        const hx = (homeT[0] + 0.5) * TS, hy = (homeT[1] + 0.5) * TS;
        if (!g.route) { g.route = this.routeTo(g, hx, hy); g.pi = 0; }
        if (!g.route) { g.state = g.sentry ? 'look' : 'patrol'; g.pi = 0; break; }
        moving = this.stepAlong(g, g.route, walk, dt);
        if (g.pi >= g.route.length) { g.route = null; g.alerted = false; if (g.sentry || !g.routes.length) { g.state = 'look'; g.lookBase = g.ang; } else { g.state = 'patrol'; g.pi = 0; } }
        this.checkDonuts(g);
        break;
      }
      case 'chase': {
        if ((g.repath -= dt) <= 0) { const t = g.lastSeen || p; g.route = this.routeTo(g, t.x, t.y); g.pi = 0; g.repath = 0.35; }
        if (g.route) moving = this.stepAlong(g, g.route, run, dt);
        if (sees && d < TS * 2.2) { const a = Math.atan2(p.y - g.y, p.x - g.x); this.guardMove(g, Math.cos(a) * run * 0.6 * dt, Math.sin(a) * run * 0.6 * dt); g.ang = a; }
        if (d < TS * 0.62 + p.r * 0.5 && (!p.hidden || p.hideBusted) && !p.vent && p.invis <= 0) this.caught(g);
        break;
      }
      case 'eat': {
        g.timer -= dt;
        if (Math.random() < dt * 3) { audio.play('chomp'); this.particles.push({ x: g.x, y: g.y - 20, vx: (Math.random() - 0.5) * 30, vy: -20, life: 0.6, max: 0.6, size: 3, color: '#e0a060', type: 'dot' }); }
        if (g.timer <= 0) { g.state = 'return'; g.route = null; g.bubble = { text: 'Mmm, donut.', t: 2, kind: 'talk' }; }
        break;
      }
    }
    g.walk = moving ? g.walk + dt * (g.state === 'chase' ? 14 : 8) : 0;

    // bananas
    for (const b of this.bananas) {
      if (!b.dead && dist(g.x, g.y, b.x, b.y) < TS * 0.45) {
        b.dead = true; g.stun = 4.5; g.state = 'stun'; g.sus = 0; audio.play('slip');
        g.bubble = { text: 'WHOA!', t: 1.5, kind: 'talk' };
        for (let i = 0; i < 6; i++) this.particles.push({ x: g.x, y: g.y - 30, vx: Math.cos(i) * 40, vy: Math.sin(i) * 20 - 10, life: 1.2, max: 1.2, text: '★', color: '#ffe060', type: 'text' });
      }
    }
  }

  checkDonuts(g) {
    for (const dn of this.donuts) {
      if (dn.eaten || dn.flying) continue;
      const d = dist(g.x, g.y, dn.x, dn.y);
      if (d < TS * 0.7) { dn.eaten = true; g.state = 'eat'; g.timer = 8; g.bubble = { text: 'Donut!!', t: 1.5, kind: 'talk' }; return; }
      if (d < TS * 7 && this.los(g.x, g.y, dn.x, dn.y) && g.state !== 'investigate') { g.state = 'investigate'; g.target = { x: dn.x, y: dn.y }; g.route = null; g.hurry = false; g.bubble = { text: 'Ooh, donut?', t: 1.5, kind: 'talk' }; }
    }
  }

  startChase(g) {
    g.state = 'chase'; g.route = null; g.repath = 0; g.lostT = 0;
    g.bubble = { text: '!', t: 1.6, kind: '!' };
    if (!this.spotted) this.hooks.onToast(`${g.spec.n} spotted you! RUN & HIDE!`, 'red');
    this.spotted = true; this.chases++;
    audio.play('spotted');
    this.shake = 0.3;
    // shout to nearby guards
    for (const o of this.guards) {
      if (o === g || o.state === 'chase' || o.sleep > 0) continue;
      if (dist(o.x, o.y, g.x, g.y) < TS * 8) this.investigate(o, this.player.x, this.player.y, true);
    }
  }

  routeTo(g, x, y) {
    const sx = Math.floor(g.x / TS), sy = Math.floor(g.y / TS);
    let tx = Math.floor(x / TS), ty = Math.floor(y / TS);
    const t = this.lvl.get(tx, ty);
    if (!(t === FLOOR || t === DOOR || t === LOCK)) {
      // nearest passable
      let found = false;
      for (let r = 1; r < 3 && !found; r++) for (let dy = -r; dy <= r && !found; dy++) for (let dx = -r; dx <= r; dx++) { const tt = this.lvl.get(tx + dx, ty + dy); if (tt === FLOOR || tt === DOOR) { tx += dx; ty += dy; found = true; break; } }
    }
    return findPath(this.lvl, sx, sy, tx, ty, true);
  }

  stepAlong(g, route, speed, dt) {
    if (g.pi >= route.length) return false;
    const [tx, ty] = route[g.pi];
    const cx = (tx + 0.5) * TS, cy = (ty + 0.5) * TS;
    const dx = cx - g.x, dy = cy - g.y;
    const d = Math.hypot(dx, dy);
    if (d < TS * 0.35 || (d < TS * 0.6 && g.pi < route.length - 1)) { g.pi++; return true; }
    const m = Math.min(d, speed * dt);
    g.x += (dx / d) * m; g.y += (dy / d) * m;
    const ta = Math.atan2(dy, dx);
    g.ang += angDiff(g.ang, ta) * Math.min(1, dt * 7);
    return true;
  }
  guardMove(g, dx, dy) {
    const nx = g.x + dx, ny = g.y + dy;
    const t = this.lvl.get(Math.floor(nx / TS), Math.floor(ny / TS));
    if (t === FLOOR || t === DOOR || t === LOCK) { g.x = nx; g.y = ny; }
  }

  caught(g) {
    if (this.state !== 'play') return;
    if ((save.items.charm || 0) > 0) {
      save.items.charm--; persist();
      audio.play('revive');
      this.hooks.onToast('Second-Chance Charm saved you!', 'gold');
      this.flash = 0.6; this.flashColor = '#80ff80';
      for (const o of this.guards) if (dist(o.x, o.y, this.player.x, this.player.y) < TS * 7) { o.stun = 4; o.state = 'stun'; o.sus = 0; }
      for (let i = 0; i < 30; i++) this.particles.push({ x: this.player.x, y: this.player.y, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300, life: 1, max: 1, size: 5, color: '#80ff9a', type: 'glow', drag: 2 });
      return;
    }
    this.state = 'caught'; this.caughtT = 0; this.caughtBy = g.spec; this.lostFired = false;
    g.bubble = { text: 'GOTCHA!', t: 3, kind: '!' };
    audio.play('caught'); audio.siren(false); audio.setIntensity(0);
    this.shake = 1; this.flash = 0.8; this.flashColor = '#ff2040';
    save.stats.caught++; persist();
  }

  // ------------------------------------------------------------ CAMERAS / LASERS
  emfNear(x, y) { return this.fx.emf > 0 && this.fx.emfPos && dist(x, y, this.fx.emfPos.x, this.fx.emfPos.y) < TS * 6.5; }
  updateCameras(dt) {
    const p = this.player;
    for (const c of this.lvl.cameras) {
      c.ang = c.base + Math.sin(this.time * c.speed + c.phase) * c.sweep;
      c.off = this.fx.hack > 0 || this.emfNear(c.x, c.y);
      if (c.off) { c.meter = 0; continue; }
      let sees = false;
      if (!p.hidden && p.invis <= 0 && !p.vent) {
        const d = dist(c.x, c.y, p.x, p.y);
        const a = Math.atan2(p.y - c.y, p.x - c.x);
        if (d < this.diff.camRange * TS && Math.abs(angDiff(c.ang, a)) < 0.36 && this.los(c.x, c.y, p.x, p.y) && !this.smokeBlocks(c.x, c.y, p.x, p.y)) sees = true;
      }
      c.meter = clamp((c.meter || 0) + (sees ? dt / 0.75 : -dt), 0, 1);
      if (c.meter >= 1) { c.meter = 0; this.triggerAlarm(p.x, p.y, 'Camera spotted you!'); }
    }
  }
  laserOn(l) {
    if (l.off) return false;
    if (this.emfNear((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2)) return false;
    if (l.blink) return ((this.time + l.phase) % l.period) < l.period * 0.62;
    return true;
  }
  updateLasers(dt) {
    const p = this.player;
    if (p.vent || p.dash) return;
    for (const l of this.lvl.lasers) {
      if (!this.laserOn(l)) continue;
      if (segCircle(l.x1, l.y1, l.x2, l.y2, p.x, p.y) < p.r * 0.7) {
        if (this.alarmCool <= 0) {
          for (let i = 0; i < 10; i++) this.particles.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200, life: 0.5, max: 0.5, size: 3, color: '#ff3050', type: 'glow' });
          audio.play('zap');
        }
        this.triggerAlarm(p.x, p.y, 'You tripped a laser!');
      }
    }
  }

  // ------------------------------------------------------------ GADGETS
  aimPoint(maxTiles = 7) {
    const p = this.player, m = this.input.mouse;
    let ang = p.ang, d = maxTiles * TS * 0.75;
    if (this.time - m.t < 3 && m.t > 0) {
      const w = this.screenToWorld(m.sx, m.sy);
      ang = Math.atan2(w.y - p.y, w.x - p.x);
      d = Math.min(maxTiles * TS, dist(p.x, p.y, w.x, w.y));
    }
    const hit = this.castRay(p.x, p.y, ang, d);
    const dd = Math.max(TS * 0.6, Math.min(d, hit - TS * 0.35));
    return { x: p.x + Math.cos(ang) * dd, y: p.y + Math.sin(ang) * dd, ang };
  }
  canUse(id) {
    const it = ITEMS[id];
    if (!it) return false;
    if (it.cat === 'tools') return has(id) && !(this.cds[id] > 0);
    return (save.items[id] || 0) > 0;
  }
  useGadget(id) {
    if (this.state !== 'play') return false;
    const it = ITEMS[id];
    const p = this.player;
    if (!this.canUse(id)) { audio.play('deny'); return false; }
    if (p.hidden && !['xray', 'hack', 'watch', 'blueprint'].includes(id)) { audio.play('deny'); return false; }
    const consume = () => { if (it.cat !== 'tools') { save.items[id]--; persist(); } else this.cds[id] = it.cd; };
    const aim = this.aimPoint(id === 'chicken' ? 9 : 7);
    switch (id) {
      case 'xray': this.fx.xray = it.dur; audio.play('xray'); break;
      case 'emf': this.fx.emf = it.dur; this.fx.emfPos = { x: p.x, y: p.y }; audio.play('emf'); this.rings.push({ x: p.x, y: p.y, r: 0, max: TS * 6.5, life: 0.9, color: '#60d0ff' }); break;
      case 'hack': this.fx.hack = it.dur; audio.play('emf'); this.hooks.onToast('All cameras offline!', 'blue'); break;
      case 'cloak': p.invis = it.dur; audio.play('xray'); break;
      case 'tonic': p.invis = 6; audio.play('xray'); break;
      case 'grapple': {
        const dd = Math.min(5 * TS, this.castRay(p.x, p.y, aim.ang, 5 * TS) - TS * 0.4);
        if (dd < TS * 0.8) { audio.play('deny'); return false; }
        // find farthest non-solid point
        let best = 0;
        for (let s = TS * 0.3; s <= dd; s += 6) { const x = p.x + Math.cos(aim.ang) * s, y = p.y + Math.sin(aim.ang) * s; if (!this.solidForPlayer(Math.floor(x / TS), Math.floor(y / TS))) best = s; else break; }
        p.dash = { t: 0, fx: p.x, fy: p.y, tx: p.x + Math.cos(aim.ang) * best, ty: p.y + Math.sin(aim.ang) * best };
        audio.play('throw');
        break;
      }
      case 'pebble': case 'chicken': case 'smoke': case 'banana': case 'donut': case 'decoy': case 'dart': {
        this.projectiles.push({ kind: id, x: p.x, y: p.y, sx: p.x, sy: p.y, tx: aim.x, ty: aim.y, t: 0, dur: id === 'dart' ? 0.18 : 0.55, e: it.e, ang: aim.ang });
        audio.play(id === 'dart' ? 'dart' : 'throw');
        break;
      }
      case 'watch': this.fx.freeze = 5; audio.play('freeze'); this.flash = 0.4; this.flashColor = '#a0d8ff'; break;
      case 'energy': p.boost = 8; audio.play('buy'); break;
      case 'blueprint': this.fx.blueprint = true; this.explored.fill(1); audio.play('note'); this.hooks.onToast('Map revealed! Press M for the big map.', 'blue'); break;
      case 'magnetB': for (const c of this.lvl.coins) if (!c.taken && dist(c.x, c.y, p.x, p.y) < TS * 8) c.pull = true; audio.play('emf'); break;
    }
    consume();
    return true;
  }
  updateProjectiles(dt) {
    for (const pr of this.projectiles) {
      pr.t += dt;
      const k = Math.min(1, pr.t / pr.dur);
      pr.x = lerp(pr.sx, pr.tx, k); pr.y = lerp(pr.sy, pr.ty, k);
      pr.h = Math.sin(k * Math.PI) * (pr.kind === 'dart' ? 0 : 40);
      if (pr.kind === 'dart') {
        // hit guard along path
        for (const g of this.guards) {
          if (g.sleep > 0) continue;
          if (dist(g.x, g.y, pr.x, pr.y) < TS * 0.6) { this.sleepGuard(g); pr.done = true; break; }
        }
        if (k >= 1 && !pr.done) {
          // auto-target a guard near the aim line within cone
          const p = this.player;
          let best = null, bd = 9 * TS;
          for (const g of this.guards) {
            if (g.sleep > 0) continue;
            const d = dist(p.x, p.y, g.x, g.y), a = Math.atan2(g.y - p.y, g.x - p.x);
            if (d < bd && Math.abs(angDiff(pr.ang, a)) < 0.35 && this.los(p.x, p.y, g.x, g.y)) { bd = d; best = g; }
          }
          if (best) this.sleepGuard(best);
          pr.done = true;
        }
        continue;
      }
      if (k >= 1 && !pr.done) {
        pr.done = true;
        switch (pr.kind) {
          case 'pebble': audio.play('clack'); this.makeNoise(pr.x, pr.y, 5.5, 0.6); break;
          case 'chicken': audio.play('squeak'); this.makeNoise(pr.x, pr.y, 10, 1); this.particles.push({ x: pr.x, y: pr.y - 20, vx: 0, vy: -30, life: 1.2, max: 1.2, text: 'SQUEAAAK!', color: '#ffe060', type: 'text' }); this.decoys.push({ x: pr.x, y: pr.y, t: 2, e: 'chicken', silent: true }); break;
          case 'smoke': audio.play('smoke'); this.smokes.push({ x: pr.x, y: pr.y, r: TS * 2.6, t: 7 }); break;
          case 'banana': this.bananas.push({ x: pr.x, y: pr.y }); break;
          case 'donut': this.donuts.push({ x: pr.x, y: pr.y }); break;
          case 'decoy': this.decoys.push({ x: pr.x, y: pr.y, t: 8, e: this.theme.h[0], pulse: 0 }); this.makeNoise(pr.x, pr.y, 6, 0.7); break;
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.done);
    for (const s of this.smokes) s.t -= dt;
    this.smokes = this.smokes.filter((s) => s.t > 0);
    for (const dc of this.decoys) {
      dc.t -= dt;
      if (!dc.silent && (dc.pulse -= dt) <= 0) { dc.pulse = 2; this.makeNoise(dc.x, dc.y, 6, 0.7); audio.play('squeak'); }
    }
    this.decoys = this.decoys.filter((d) => d.t > 0);
    this.bananas = this.bananas.filter((b) => !b.dead);
    this.donuts = this.donuts.filter((d) => !d.eaten);
  }
  sleepGuard(g) {
    g.sleep = 15; g.state = 'sleep'; g.sus = 0; g.bubble = { text: 'zzZ', t: 1.5, kind: 'talk' };
    audio.play('snore');
  }

  // ------------------------------------------------------------ PARTICLES / AMBIENT
  updateParticles(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; }
      if (p.type === 'smoke') p.size += dt * 14;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const r of this.rings) { r.dur = r.dur || r.life; r.life -= dt; r.r = Math.max(0, r.max * (1 - r.life / r.dur)); }
    this.rings = this.rings.filter((r) => r.life > 0);
  }
  updateAmbient(dt) {
    const fx = this.theme.fx;
    if (!fx || fx === 'none') return;
    const vwW = this.vw / this.cam.zoom, vhW = this.vh / this.cam.zoom;
    const x0 = this.cam.x - vwW / 2, y0 = this.cam.y - vhW / 2;
    const target = { snow: 90, rain: 110, sand: 60, bubbles: 40, embers: 45, leaves: 22, petals: 30, stars: 50, sparkle: 30, mist: 14, dust: 40, flour: 50, confetti: 45, fireflies: 30 }[fx] || 30;
    while (this.fxParticles.length < target) {
      const p = { x: x0 + Math.random() * vwW, y: y0 + Math.random() * vhW, t: Math.random() * 10, s: Math.random() };
      this.fxParticles.push(p);
    }
    for (const p of this.fxParticles) {
      p.t += dt;
      switch (fx) {
        case 'snow': p.y += (30 + p.s * 40) * dt; p.x += Math.sin(p.t + p.s * 6) * 20 * dt + 10 * dt; break;
        case 'rain': p.y += 600 * dt; p.x += 120 * dt; break;
        case 'sand': p.x += (120 + p.s * 140) * dt; p.y += Math.sin(p.t * 2) * 10 * dt; break;
        case 'bubbles': p.y -= (30 + p.s * 40) * dt; p.x += Math.sin(p.t * 2 + p.s * 9) * 15 * dt; break;
        case 'embers': p.y -= (25 + p.s * 30) * dt; p.x += Math.sin(p.t * 1.5 + p.s * 9) * 20 * dt; break;
        case 'leaves': case 'petals': case 'confetti': p.y += (25 + p.s * 30) * dt; p.x += Math.sin(p.t + p.s * 9) * 30 * dt; break;
        case 'mist': p.x += 12 * dt; break;
        case 'fireflies': p.x += Math.sin(p.t * 0.8 + p.s * 20) * 25 * dt; p.y += Math.cos(p.t * 0.6 + p.s * 10) * 25 * dt; break;
        default: p.x += Math.sin(p.t * 0.3 + p.s * 9) * 8 * dt; p.y += Math.cos(p.t * 0.4 + p.s * 5) * 6 * dt;
      }
      // wrap into view
      if (p.x < x0 - 40) p.x += vwW + 80; if (p.x > x0 + vwW + 40) p.x -= vwW + 80;
      if (p.y < y0 - 40) p.y += vhW + 80; if (p.y > y0 + vhW + 40) p.y -= vhW + 80;
    }
  }

  markExplored() {
    const p = this.player, lv = this.lvl;
    const R = this.viewR;
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const d = this.castRay(p.x, p.y, a, R);
      for (let s = 0; s <= d + TS * 0.5; s += TS * 0.5) {
        const tx = Math.floor((p.x + Math.cos(a) * s) / TS), ty = Math.floor((p.y + Math.sin(a) * s) / TS);
        if (tx >= 0 && ty >= 0 && tx < lv.w && ty < lv.h) this.explored[ty * lv.w + tx] = 1;
      }
    }
  }

  screenToWorld(sx, sy) { return { x: (sx - this.vw / 2) / this.cam.zoom + this.cam.x, y: (sy - this.vh / 2) / this.cam.zoom + this.cam.y }; }

  results() {
    const lv = this.lvl;
    const coinPct = lv.totalCoins ? this.collectedCoins / lv.totalCoins : 1;
    const ghost = !this.spotted && this.alarms === 0;
    const stars = 1 + (coinPct >= 0.7 ? 1 : 0) + (ghost ? 1 : 0);
    const pocket = 1 + 0.15 * upg('pockets');
    const lootBonus = lv.lootCount * (10 + Math.floor(this.L * 0.8));
    const first = !save.stars[this.L];
    const firstBonus = first ? 20 + this.L * 2 : 0;
    const ghostBonus = ghost ? Math.round((this.collectedCoins + lootBonus) * 0.3) : 0;
    const total = Math.round((this.collectedCoins + lootBonus + ghostBonus + firstBonus) * pocket);
    return { coins: this.collectedCoins, coinPct, lootBonus, ghostBonus, firstBonus, total, stars, ghost, time: this.time, alarms: this.alarms, eggs: this.eggsFound.length, eggsTotal: lv.eggs.length, pocket };
  }

  toastOnce(key, msg) {
    this.toasted = this.toasted || {};
    if (this.toasted[key]) return;
    this.toasted[key] = 1;
    this.hooks.onToast(msg);
  }

  // ============================================================ RENDER
  render() {
    if (!this.lvl) return;
    const ctx = this.ctx, lv = this.lvl, p = this.player, th = this.theme;
    const z = this.cam.zoom, dpr = this.dpr;
    let sx = 0, sy = 0;
    if (this.shake > 0 && save.settings.shake) { sx = (Math.random() - 0.5) * this.shake * 14; sy = (Math.random() - 0.5) * this.shake * 14; }
    const ox = this.vw / 2 - this.cam.x * z + sx, oy = this.vh / 2 - this.cam.y * z + sy;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = shade(th.wc[1], -0.75);
    ctx.fillRect(0, 0, this.vw, this.vh);
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * ox, dpr * oy);
    const vx0 = this.cam.x - this.vw / 2 / z - TS, vy0 = this.cam.y - this.vh / 2 / z - TS;
    const vx1 = this.cam.x + this.vw / 2 / z + TS, vy1 = this.cam.y + this.vh / 2 / z + TS;
    const inView = (x, y, m = 0) => x > vx0 - m && x < vx1 + m && y > vy0 - m && y < vy1 + m;
    // static map
    const cx0 = Math.max(0, vx0), cy0 = Math.max(0, vy0), cx1 = Math.min(this.staticCv.width, vx1), cy1 = Math.min(this.staticCv.height, vy1);
    if (cx1 > cx0 && cy1 > cy0) ctx.drawImage(this.staticCv, cx0, cy0, cx1 - cx0, cy1 - cy0, cx0, cy0, cx1 - cx0, cy1 - cy0);
    const t = this.time;

    // exit zone
    const ready = p.loot >= lv.lootCount;
    {
      const ex = lv.start.x, ey = lv.start.y;
      ctx.save();
      ctx.strokeStyle = ready ? `rgba(90,255,140,${0.6 + Math.sin(t * 5) * 0.3})` : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 30;
      ctx.beginPath(); ctx.arc(ex, ey, TS * 1.1, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      if (this.state !== 'escape' || this.escapeT < 0.5) {
        drawVehicle(ctx, th.x[0], ex + TS * 0.05, ey, TS * 1.5, t, true);
      } else {
        const k = this.escapeT - 0.5;
        ctx.globalAlpha = Math.max(0, 1 - k * 0.5); drawVehicle(ctx, th.x[0], ex + k * k * 420, ey - k * 20, TS * 1.5, t * 2); ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    // live props (animated)
    for (const [i, pr] of lv.props) {
      const px = (i % lv.w + 0.5) * TS, py = (((i / lv.w) | 0) + 0.5) * TS;
      if (inView(px, py, TS)) drawProp(ctx, pr.e, px, py - 2, TS * 0.98 * pr.s, t, i);
    }
    // vents / hides / notes / switches
    for (const v of lv.vents) if (inView(v.x, v.y)) { ctx.fillStyle = '#1a1a1e'; roundRect(ctx, v.x - 17, v.y - 13, 34, 26, 4); ctx.fill(); ctx.strokeStyle = '#7a7a86'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = '#4a4a52'; for (let k = -8; k <= 8; k += 5) { ctx.beginPath(); ctx.moveTo(v.x - 13, v.y + k * 0.9); ctx.lineTo(v.x + 13, v.y + k * 0.9); ctx.stroke(); } }
    for (const h of lv.hides) if (inView(h.x, h.y)) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(h.x, h.y + 16, 20, 7, 0, 0, Math.PI * 2); ctx.fill(); drawProp(ctx, th.hs[0], h.x + (p.hidden === h ? Math.sin(t * 25) * 1.2 : 0), h.y - 4, TS * 1.0, t, 7); }
    for (const n of lv.notes) if (inView(n.x, n.y)) drawNote(ctx, n.x, n.y, TS * 0.5, t + n.k);
    for (const s of lv.switches) if (inView((s.x + 0.5) * TS, (s.y + 0.5) * TS)) {
      const wx = (s.x + 0.5) * TS, wy = (s.y + 0.5) * TS;
      ctx.fillStyle = '#2a2e36'; roundRect(ctx, wx - 12, wy - 14, 24, 28, 4); ctx.fill();
      ctx.fillStyle = s.used ? '#555' : (Math.sin(t * 6) > 0 ? '#ff3050' : '#a01020'); ctx.beginPath(); ctx.arc(wx, wy - 5, 4, 0, 7); ctx.fill();
      ctx.fillStyle = s.used ? '#666' : '#ffd23a'; ctx.fillRect(wx - 7, wy + 2, 14, 6);
    }
    // eggs (faint sparkle)
    for (const e of lv.eggs) {
      if (e.taken || !inView(e.x, e.y)) continue;
      const a = this.fx.xray > 0 ? 1 : 0.55 + Math.sin(t * 3 + e.id) * 0.25;
      drawEgg(ctx, e.x, e.y, TS * 0.5, this.L * 3 + e.id, t, a);
      if (Math.sin(t * 2 + e.id * 2) > 0.92) drawSparkle(ctx, e.x + 10, e.y - 12, 14, 0.9);
    }
    // coins
    for (const c of lv.coins) if (!c.taken && inView(c.x, c.y)) drawCoin(ctx, c.x, c.y, t + c.ph, c.big);
    // loot
    for (const l of lv.loot) {
      if (l.taken) continue;
      const wx = (l.x + 0.5) * TS, wy = (l.y + 0.5) * TS;
      if (!inView(wx, wy)) continue;
      const gl = ctx.createRadialGradient(wx, wy, 2, wx, wy, TS * 0.8);
      gl.addColorStop(0, 'rgba(255,220,100,0.45)'); gl.addColorStop(1, 'rgba(255,220,100,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(wx, wy, TS * 0.8, 0, 7); ctx.fill();
      if (l.kind === 'safe' && !l.opened) {
        ctx.fillStyle = '#4a4e58'; roundRect(ctx, wx - 19, wy - 19, 38, 38, 5); ctx.fill();
        ctx.fillStyle = '#5e636e'; roundRect(ctx, wx - 16, wy - 16, 32, 32, 4); ctx.fill();
        ctx.strokeStyle = '#2a2e36'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#c9ccd4'; ctx.beginPath(); ctx.arc(wx, wy, 8, 0, 7); ctx.fill();
        ctx.strokeStyle = '#3a3e48'; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(t * 2) * 7, wy + Math.sin(t * 2) * 7); ctx.stroke();
        drawLoot(ctx, l.e, wx + 13, wy - 18, 22, t);
      } else {
        drawLoot(ctx, l.e, wx, wy - 4 + Math.sin(t * 2.5 + l.x) * 3, TS * 0.8, t);
        if (l.kind === 'case' && !l.opened) {
          ctx.fillStyle = 'rgba(180,230,255,0.22)'; roundRect(ctx, wx - 20, wy - 24, 40, 42, 4); ctx.fill();
          ctx.strokeStyle = 'rgba(220,245,255,0.8)'; ctx.lineWidth = 2; ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.moveTo(wx - 14, wy - 18); ctx.lineTo(wx - 4, wy - 18); ctx.moveTo(wx - 14, wy - 12); ctx.lineTo(wx - 10, wy - 12); ctx.stroke();
          ctx.fillStyle = '#5a4030'; ctx.fillRect(wx - 22, wy + 16, 44, 6);
        }
      }
      if (Math.random() < 0.05) this.particles.push({ x: wx + (Math.random() - 0.5) * 30, y: wy + (Math.random() - 0.5) * 30, vx: 0, vy: -15, life: 0.8, max: 0.8, size: 2.5, color: '#fff2a0', type: 'glow' });
    }
    // vases
    for (const v of lv.vases) if (inView(v.x, v.y)) {
      if (v.broken) { drawShards(ctx, v.x, v.y + 4, TS * 0.6); continue; }
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(v.x, v.y + 12, 11, 4, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(v.x, v.y + 10); ctx.rotate(Math.sin(t * 30) * 0.15 * Math.max(0, v.wob)); drawProp(ctx, v.e, 0, -12, TS * 0.62, t); ctx.restore();
    }
    for (const b of this.bananas) drawBanana(ctx, b.x, b.y, 26);
    for (const d of this.donuts) drawDonut(ctx, d.x, d.y, 26, t);
    for (const d of this.decoys) { if (d.e === 'chicken') { drawRubberChicken(ctx, d.x, d.y, 30, Math.sin(t * 20) * 0.3); continue; } ctx.save(); ctx.globalAlpha = 0.55 + Math.sin(t * 20) * 0.15; drawCharacter(ctx, { x: d.x, y: d.y, ang: t * 2, walk: t * 8, body: th.h[2], head: th.h[0], hat: th.h[3], t, tint: '#5af0ff' }); ctx.restore(); }

    // doors
    for (const d of lv.doors.values()) {
      const wx = d.x * TS, wy = d.y * TS;
      if (!inView(wx, wy)) continue;
      const o = d.open;
      const col = d.locked ? '#7a2a2a' : shade(th.wc[1], 0.15);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(wx, wy, TS, TS);
      ctx.fillStyle = col;
      if (d.horiz) { const w = TS * (1 - o * 0.85); ctx.fillRect(wx, wy + TS * 0.32, w, TS * 0.36); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(wx, wy + TS * 0.32, w, 3); }
      else { const hh = TS * (1 - o * 0.85); ctx.fillRect(wx + TS * 0.32, wy, TS * 0.36, hh); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(wx + TS * 0.32, wy, 3, hh); }
      if (d.locked) drawLock(ctx, wx + TS / 2, wy + TS / 2, 20);
    }

    // characters sorted by y
    const chars = [];
    for (const g of this.guards) {
      if (!inView(g.x, g.y, TS)) { g.visible = false; continue; }
      const vis = this.fx.xray > 0 || (dist(g.x, g.y, p.x, p.y) < this.viewR * 1.05 && this.los(p.x, p.y, g.x, g.y)) || this.state === 'intro';
      g.visible = vis;
      if (vis) chars.push({ y: g.y, g });
    }
    if (!p.hidden && !p.vent) chars.push({ y: p.y, p: true });
    chars.sort((a, b) => a.y - b.y);
    for (const c of chars) {
      if (c.p) {
        const alpha = p.invis > 0 ? 0.35 + Math.sin(t * 20) * 0.1 : 1;
        let scale = 1;
        if (this.state === 'escape') scale = Math.max(0, 1 - this.escapeT * 2);
        if (scale <= 0) continue;
        drawCharacter(ctx, { x: p.x, y: p.y, ang: p.ang, walk: p.walk, body: th.h[2], head: th.h[0], hat: th.h[3], size: scale, sack: p.loot, alpha, crouch: p.sneak, tint: p.boost > 0 ? '#ffe040' : null, cosHat: save.cos.hat ? ITEMS[save.cos.hat].e : null, t });
      } else {
        const g = c.g;
        const frozen = this.fx.freeze > 0;
        ctx.save();
        if (g.sleep > 0) { ctx.globalAlpha = 0.85; }
        drawCharacter(ctx, { x: g.x, y: g.y, ang: g.sleep > 0 ? g.ang + 1.5 : g.ang, walk: g.walk, body: g.hound ? headInfo(g.spec.e).base : g.spec.c, seed: g.id, angry: g.state === 'chase', head: g.spec.e, hat: g.spec.hat, guard: !g.hound, hound: g.hound, light: th.lt, size: g.hound ? 0.85 : 1.05, tint: frozen ? '#80c8ff' : (g.state === 'chase' ? '#ff3050' : null), t, alpha: this.fx.xray > 0 && !this.los(p.x, p.y, g.x, g.y) ? 0.55 : 1 });
        if (frozen) { ctx.fillStyle = 'rgba(150,210,255,0.35)'; ctx.beginPath(); ctx.arc(g.x, g.y - 6, TS * 0.42, 0, 7); ctx.fill(); }
        ctx.restore();
      }
    }
    // hidden indicator
    if (p.hidden) {
      ctx.save(); ctx.globalAlpha = 0.85;
      drawEyesPeek(ctx, p.x, p.y - 10, 22, t);
      ctx.restore();
    }
    if (p.vent) { const k = p.vent.t; const sc = Math.max(0.01, k < 0.45 ? 1 - k * 2 : (k - 0.45) * 2); drawHead(ctx, th.h[0], p.x, p.y, TS * 0.6 * sc, { t }); }

    // smoke
    for (const s of this.smokes) {
      for (let i = 0; i < 9; i++) {
        const a = i * 0.7 + t * 0.3, rr = s.r * (0.35 + (i % 3) * 0.2);
        ctx.fillStyle = `rgba(200,200,210,${0.32 * Math.min(1, s.t / 1.5)})`;
        ctx.beginPath(); ctx.arc(s.x + Math.cos(a) * rr * 0.6, s.y + Math.sin(a) * rr * 0.5, s.r * 0.55, 0, 7); ctx.fill();
      }
    }
    // particles (world) under lighting
    for (const q of this.particles) if (q.type === 'smoke' || q.type === 'dot') {
      ctx.globalAlpha = Math.max(0, q.life / q.max);
      ctx.fillStyle = q.color;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ---------------- LIGHTING
    this.renderLighting(ox, oy, z);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(this.light, 0, 0, this.vw, this.vh);
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * ox, dpr * oy);

    // additive flashlight tint
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const g of this.guards) {
      if (!g.poly || g.sleep > 0 || g.hound) continue;
      const R = this.diff.visionRange * TS;
      const gr = ctx.createRadialGradient(g.x, g.y, 4, g.x, g.y, R);
      const col = g.state === 'chase' ? '#ff4050' : g.state === 'suspicious' || g.state === 'investigate' ? '#ffb030' : th.lt;
      gr.addColorStop(0, rgba(col, 0.26)); gr.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = gr;
      ctx.beginPath(); g.poly.forEach((pt, i) => (i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]))); ctx.closePath(); ctx.fill();
    }
    for (const c of lv.cameras) {
      if (c.off || !c.poly) continue;
      const R = this.diff.camRange * TS;
      const gr = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, R);
      gr.addColorStop(0, `rgba(255,${c.meter > 0 ? 40 : 60},60,${0.22 + c.meter * 0.3})`); gr.addColorStop(1, 'rgba(255,40,60,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); c.poly.forEach((pt, i) => (i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]))); ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // lasers (glowing above darkness)
    for (const l of lv.lasers) {
      const on = this.laserOn(l);
      if (l.hidden && this.fx.xray <= 0 && dist(p.x, p.y, (l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2) > TS * 2.2) { if (!on) continue; if (Math.sin(t * 13 + l.cx) < 0.97) continue; }
      // emitters
      ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(l.x1, l.y1, 5, 0, 7); ctx.arc(l.x2, l.y2, 5, 0, 7); ctx.fill();
      if (!on) { ctx.strokeStyle = 'rgba(255,60,80,0.12)'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke(); ctx.setLineDash([]); continue; }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,30,60,0.35)'; ctx.lineWidth = 8 + Math.sin(t * 20) * 2;
      ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,120,140,0.95)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
      ctx.restore();
    }
    // cameras bodies
    for (const c of lv.cameras) {
      if (!inView(c.x, c.y)) continue;
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.ang);
      ctx.fillStyle = '#c8ccd4'; roundRect(ctx, -6, -7, 20, 14, 3); ctx.fill();
      ctx.fillStyle = '#2a2e36'; ctx.fillRect(12, -5, 5, 10);
      ctx.fillStyle = c.off ? '#555' : (Math.sin(t * 8) > 0 ? '#ff2040' : '#801020'); ctx.beginPath(); ctx.arc(2, 0, 2.5, 0, 7); ctx.fill();
      ctx.restore();
      if (c.off) drawBolt(ctx, c.x, c.y - 14, 14, 0.5 + Math.random() * 0.5);
      if (c.meter > 0) { ctx.strokeStyle = '#ff3050'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.x, c.y, 14, -Math.PI / 2, -Math.PI / 2 + c.meter * Math.PI * 2); ctx.stroke(); }
    }

    // xray outlines for hidden stuff
    if (this.fx.xray > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const g of this.guards) { ctx.strokeStyle = 'rgba(80,255,200,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(g.x, g.y - 6, TS * 0.42, 0, 7); ctx.stroke(); }
      for (const i of lv.plates) { const x = (i % lv.w) * TS, y = ((i / lv.w) | 0) * TS; ctx.strokeStyle = 'rgba(255,80,80,0.8)'; ctx.strokeRect(x + 8, y + 8, TS - 16, TS - 16); }
      ctx.restore();
    }

    // noise rings
    for (const r of this.rings) {
      ctx.strokeStyle = r.color ? rgba(r.color, r.life) : `rgba(255,255,255,${r.life * 0.5 * (r.strength || 1)})`;
      ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(r.x, r.y, Math.max(0, r.r), 0, 7); ctx.stroke();
    }
    // glow + text particles
    for (const q of this.particles) {
      if (q.type === 'glow') { ctx.globalAlpha = Math.max(0, q.life / q.max); ctx.fillStyle = q.color; ctx.shadowColor = q.color; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
      else if (q.type === 'text') { ctx.globalAlpha = Math.min(1, (q.life / q.max) * 2); ctx.font = `900 ${q.big ? 18 : 14}px "Lilita One", system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(q.text, q.x, q.y); ctx.fillStyle = q.color; ctx.fillText(q.text, q.x, q.y); }
    }
    ctx.globalAlpha = 1;
    // projectiles
    for (const pr of this.projectiles) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(pr.x, pr.y + 6, 7, 3, 0, 0, 7); ctx.fill();
      if (pr.kind === 'dart') drawDart(ctx, pr.x, pr.y, 26, pr.ang); else { ctx.save(); ctx.translate(pr.x, pr.y - (pr.h || 0)); ctx.rotate(pr.t * 12); drawIcon(ctx, pr.kind, 0, 0, 24, t); ctx.restore(); }
    }

    // guard indicators
    for (const g of this.guards) {
      if (!inView(g.x, g.y, TS)) continue;
      if (!g.visible && !(g.bubble && g.bubble.kind !== 'talk')) continue;
      const hy = g.y - TS * 0.95;
      if (g.sus > 0.02 && g.state !== 'chase' && g.sleep <= 0) {
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(g.x, hy, 9, 0, 7); ctx.stroke();
        ctx.strokeStyle = g.sus > 0.6 ? '#ff4050' : '#ffc030'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(g.x, hy, 9, -Math.PI / 2, -Math.PI / 2 + g.sus * Math.PI * 2); ctx.stroke();
      }
      if (g.bubble) {
        const b = g.bubble;
        if (b.kind === 'talk') {
          if (!g.visible) continue;
          ctx.font = '600 12px Nunito, system-ui, sans-serif';
          const w = Math.min(220, ctx.measureText(b.text).width + 16);
          ctx.globalAlpha = Math.min(1, b.t * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.95)'; roundRect(ctx, g.x - w / 2, hy - 34, w, 22, 9); ctx.fill();
          ctx.beginPath(); ctx.moveTo(g.x - 5, hy - 13); ctx.lineTo(g.x + 5, hy - 13); ctx.lineTo(g.x, hy - 6); ctx.fill();
          ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.text, g.x, hy - 23, 210);
          ctx.globalAlpha = 1;
        } else {
          const pop = Math.min(1.4, 1 + Math.max(0, b.t - 1.2) * 1.5);
          ctx.font = `900 ${Math.round(26 * pop)}px "Lilita One", system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = 5; ctx.strokeStyle = '#000'; ctx.strokeText(b.text, g.x, hy - 18 + Math.sin(t * 12) * 2);
          ctx.fillStyle = b.kind === '!' ? '#ff3050' : '#ffc030'; ctx.fillText(b.text, g.x, hy - 18 + Math.sin(t * 12) * 2);
        }
      }
      if (g.stun > 0) drawDizzy(ctx, g.x, g.y - TS * 0.75, 24, t);
    }

    // interact prompt
    if (this.interactTarget && this.state === 'play') {
      const it = this.interactTarget;
      const label = it.label;
      const kb = this.hooks.isTouch() ? 'Tap' : (it.instant ? 'E' : 'Hold E');
      ctx.font = '800 13px Nunito, system-ui, sans-serif';
      const w = ctx.measureText(label).width + ctx.measureText(kb).width + 34;
      const bx = it.x - w / 2, by = it.y - TS * 1.15 + Math.sin(t * 4) * 2;
      ctx.fillStyle = 'rgba(14,16,30,0.88)'; roundRect(ctx, bx, by, w, 26, 13); ctx.fill();
      ctx.strokeStyle = 'rgba(255,214,90,0.9)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#ffd65a'; roundRect(ctx, bx + 4, by + 4, ctx.measureText(kb).width + 12, 18, 9); ctx.fill();
      ctx.fillStyle = '#1a1420'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(kb, bx + 10, by + 13.5);
      ctx.fillStyle = '#fff'; ctx.fillText(label, bx + ctx.measureText(kb).width + 22, by + 13.5);
      if (this.interactProg > 0) {
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(it.x, it.y, 22, 0, 7); ctx.stroke();
        ctx.strokeStyle = '#5aff8a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(it.x, it.y, 22, -Math.PI / 2, -Math.PI / 2 + this.interactProg * Math.PI * 2); ctx.stroke();
      }
    }

    // aim reticle when mouse aiming
    if (this.state === 'play' && this.time - this.input.mouse.t < 3 && this.input.mouse.t > 0 && !this.hooks.isTouch()) {
      const a = this.aimPoint(7);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(a.x, a.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(a.x, a.y, 8, 0, 7); ctx.stroke();
    }

    // ambient fx particles
    this.renderAmbient(ctx);

    // ---------------- screen space overlays
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // vignette
    const vg = ctx.createRadialGradient(this.vw / 2, this.vh / 2, Math.min(this.vw, this.vh) * 0.35, this.vw / 2, this.vh / 2, Math.max(this.vw, this.vh) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, this.vw, this.vh);
    if (this.alarm > 0) { ctx.fillStyle = `rgba(255,0,40,${0.12 + Math.sin(t * 8) * 0.1})`; ctx.fillRect(0, 0, this.vw, this.vh); }
    if (this.fx.freeze > 0) { ctx.fillStyle = 'rgba(120,200,255,0.12)'; ctx.fillRect(0, 0, this.vw, this.vh); }
    if (this.fx.xray > 0) { ctx.fillStyle = 'rgba(40,255,160,0.07)'; ctx.fillRect(0, 0, this.vw, this.vh); }
    if (this.flash > 0) { ctx.fillStyle = rgba(this.flashColor, this.flash * 0.5); ctx.fillRect(0, 0, this.vw, this.vh); }
    // whiskers: edge arrows for guards near but offscreen/unseen
    if (has('whiskers') && this.state === 'play') {
      for (const g of this.guards) {
        const d = dist(g.x, g.y, p.x, p.y);
        if (d > TS * 9 || g.visible || g.sleep > 0) continue;
        const a = Math.atan2(g.y - p.y, g.x - p.x);
        const R = Math.min(this.vw, this.vh) * 0.42;
        const x = this.vw / 2 + Math.cos(a) * R, y = this.vh / 2 + Math.sin(a) * R;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = g.state === 'chase' ? '#ff3050' : `rgba(255,200,60,${1 - d / (TS * 9)})`;
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-6, 8); ctx.fill();
        ctx.restore();
      }
    }
    // treasure compass
    if (has('compass') && this.state === 'play') {
      let best = null, bd = 1e9;
      const targets = p.loot >= lv.lootCount ? [{ x: lv.start.x, y: lv.start.y }] : lv.loot.filter((l) => !l.taken).map((l) => ({ x: (l.x + 0.5) * TS, y: (l.y + 0.5) * TS }));
      for (const tg of targets) { const d = dist(p.x, p.y, tg.x, tg.y); if (d < bd) { bd = d; best = tg; } }
      if (best && bd > TS * 3) {
        const a = Math.atan2(best.y - p.y, best.x - p.x);
        const sxp = this.vw / 2 + (p.x - this.cam.x) * z + Math.cos(a) * 52, syp = this.vh / 2 + (p.y - this.cam.y) * z + Math.sin(a) * 52;
        ctx.save(); ctx.translate(sxp, syp); ctx.rotate(a);
        ctx.fillStyle = p.loot >= lv.lootCount ? '#5aff8a' : '#ffd84a'; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-5, -6); ctx.lineTo(-2, 0); ctx.lineTo(-5, 6); ctx.fill();
        ctx.restore();
      }
    }
  }

  renderLighting(ox, oy, z) {
    const lc = this.lctx, LS = this.LS, lv = this.lvl, p = this.player, th = this.theme, t = this.time;
    lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.globalCompositeOperation = 'source-over';
    lc.clearRect(0, 0, this.light.width, this.light.height);
    const dark = mix('#03040c', th.wc[1], 0.18);
    const dk = th.dk * (this.state === 'intro' ? 0.85 : 1);
    lc.fillStyle = rgba(dark, dk);
    lc.fillRect(0, 0, this.light.width, this.light.height);
    lc.setTransform(LS * z, 0, 0, LS * z, LS * ox, LS * oy);
    lc.globalCompositeOperation = 'destination-out';

    // player vision
    const R = this.viewR;
    const N = 140;
    lc.beginPath();
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const d = this.castRay(p.x, p.y, a, R);
      // extend slightly into walls so wall faces are lit
      const dd = Math.min(R, d + TS * 0.5);
      const x = p.x + Math.cos(a) * dd, y = p.y + Math.sin(a) * dd;
      i ? lc.lineTo(x, y) : lc.moveTo(x, y);
    }
    lc.closePath();
    const pg = lc.createRadialGradient(p.x, p.y, TS * 0.5, p.x, p.y, R);
    pg.addColorStop(0, 'rgba(0,0,0,0.82)'); pg.addColorStop(0.6, 'rgba(0,0,0,0.55)'); pg.addColorStop(1, 'rgba(0,0,0,0)');
    lc.fillStyle = pg; lc.fill();

    // lamps
    for (const l of lv.lamps) {
      const fl = l.flick ? (Math.sin(t * 17 + l.x) > 0.85 ? 0.3 : 1) : 1;
      const g = lc.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, `rgba(0,0,0,${0.55 * fl})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = g; lc.beginPath(); lc.arc(l.x, l.y, l.r, 0, 7); lc.fill();
    }
    // exit glow
    { const g = lc.createRadialGradient(lv.start.x, lv.start.y, 0, lv.start.x, lv.start.y, TS * 2.5); g.addColorStop(0, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); lc.fillStyle = g; lc.beginPath(); lc.arc(lv.start.x, lv.start.y, TS * 2.5, 0, 7); lc.fill(); }
    // loot glimmer
    for (const l of lv.loot) if (!l.taken) { const x = (l.x + 0.5) * TS, y = (l.y + 0.5) * TS; const g = lc.createRadialGradient(x, y, 0, x, y, TS * 1.2); g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); lc.fillStyle = g; lc.beginPath(); lc.arc(x, y, TS * 1.2, 0, 7); lc.fill(); }

    // guard cones
    const range = this.diff.visionRange * TS;
    const camX0 = this.cam.x - this.vw / z, camX1 = this.cam.x + this.vw / z, camY0 = this.cam.y - this.vh / z, camY1 = this.cam.y + this.vh / z;
    for (const g of this.guards) {
      g.poly = null;
      if (g.sleep > 0) continue;
      if (g.x < camX0 - range || g.x > camX1 + range || g.y < camY0 - range || g.y > camY1 + range) continue;
      const r = range * (g.hound ? 0.6 : 1) * (g.state === 'chase' ? 1.25 : 1);
      const half = g.hound ? 0.95 : this.diff.visionHalf;
      const ox2 = g.x + Math.cos(g.ang) * 8, oy2 = g.y + Math.sin(g.ang) * 8;
      const pts = [[ox2, oy2]];
      const n = 22;
      for (let i = 0; i <= n; i++) {
        const a = g.ang - half + (i / n) * half * 2;
        const d = this.castRay(ox2, oy2, a, r);
        pts.push([ox2 + Math.cos(a) * d, oy2 + Math.sin(a) * d]);
      }
      g.poly = pts;
      const gr = lc.createRadialGradient(ox2, oy2, 2, ox2, oy2, r);
      const s = g.hound ? 0.35 : 0.95;
      gr.addColorStop(0, `rgba(0,0,0,${s})`); gr.addColorStop(0.75, `rgba(0,0,0,${s * 0.6})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = gr;
      lc.beginPath(); pts.forEach((pt, i) => (i ? lc.lineTo(pt[0], pt[1]) : lc.moveTo(pt[0], pt[1]))); lc.closePath(); lc.fill();
      // small halo around guard
      const hg = lc.createRadialGradient(g.x, g.y, 0, g.x, g.y, TS * 1.1); hg.addColorStop(0, 'rgba(0,0,0,0.5)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = hg; lc.beginPath(); lc.arc(g.x, g.y, TS * 1.1, 0, 7); lc.fill();
    }
    // camera cones
    const cr = this.diff.camRange * TS;
    for (const c of lv.cameras) {
      c.poly = null;
      if (c.off || c.x < camX0 - cr || c.x > camX1 + cr || c.y < camY0 - cr || c.y > camY1 + cr) continue;
      const pts = [[c.x, c.y]];
      for (let i = 0; i <= 12; i++) { const a = c.ang - 0.36 + (i / 12) * 0.72; const d = this.castRay(c.x + Math.cos(c.ang) * 4, c.y + Math.sin(c.ang) * 4, a, cr); pts.push([c.x + Math.cos(a) * d, c.y + Math.sin(a) * d]); }
      c.poly = pts;
      const gr = lc.createRadialGradient(c.x, c.y, 2, c.x, c.y, cr);
      gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = gr; lc.beginPath(); pts.forEach((pt, i) => (i ? lc.lineTo(pt[0], pt[1]) : lc.moveTo(pt[0], pt[1]))); lc.closePath(); lc.fill();
    }
    // xray: reveal everything a bit
    if (this.fx.xray > 0) { lc.fillStyle = 'rgba(0,0,0,0.35)'; lc.fillRect(this.cam.x - this.vw / z, this.cam.y - this.vh / z, this.vw * 2 / z, this.vh * 2 / z); }
    lc.globalCompositeOperation = 'source-over';
  }

  renderAmbient(ctx) {
    const fx = this.theme.fx, t = this.time;
    if (!fx || fx === 'none') return;
    ctx.save();
    for (const p of this.fxParticles) {
      switch (fx) {
        case 'snow': ctx.fillStyle = `rgba(255,255,255,${0.5 + p.s * 0.4})`; ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 + p.s * 2.5, 0, 7); ctx.fill(); break;
        case 'rain': ctx.strokeStyle = 'rgba(160,190,255,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 5, p.y - 22); ctx.stroke(); break;
        case 'sand': ctx.fillStyle = 'rgba(230,200,140,0.35)'; ctx.fillRect(p.x, p.y, 6 + p.s * 10, 1.5); break;
        case 'bubbles': ctx.strokeStyle = 'rgba(200,250,255,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, 2 + p.s * 5, 0, 7); ctx.stroke(); break;
        case 'embers': ctx.fillStyle = `rgba(255,${120 + p.s * 100 | 0},40,${0.5 + Math.sin(p.t * 5) * 0.3})`; ctx.shadowColor = '#ff7a20'; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 + p.s * 2, 0, 7); ctx.fill(); ctx.shadowBlur = 0; break;
        case 'leaves': drawLeaf(ctx, p.x, p.y, 12 + p.s * 6, p.t * 2, p.s < 0.5 ? 'rgba(210,130,40,.75)' : 'rgba(190,70,30,.75)'); break;
        case 'petals': ctx.fillStyle = `rgba(255,${170 + p.s * 50 | 0},210,0.7)`; ctx.beginPath(); ctx.ellipse(p.x, p.y, 4, 2.2, p.t * 2, 0, 7); ctx.fill(); break;
        case 'confetti': ctx.fillStyle = `hsla(${p.s * 360},90%,65%,0.75)`; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t * 4); ctx.fillRect(-3, -1.5, 6, 3); ctx.restore(); break;
        case 'stars': ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(p.t * 3 + p.s * 20) * 0.3})`; ctx.fillRect(p.x, p.y, 2, 2); break;
        case 'sparkle': { const a = Math.max(0, Math.sin(p.t * 2 + p.s * 20)); ctx.fillStyle = `rgba(255,250,200,${a * 0.8})`; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(0.785); ctx.fillRect(-1, -5 * a, 2, 10 * a); ctx.fillRect(-5 * a, -1, 10 * a, 2); ctx.restore(); break; }
        case 'mist': { const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 90 + p.s * 80); g.addColorStop(0, 'rgba(200,200,230,0.09)'); g.addColorStop(1, 'rgba(200,200,230,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 90 + p.s * 80, 0, 7); ctx.fill(); break; }
        case 'fireflies': { const a = 0.4 + Math.sin(p.t * 3 + p.s * 10) * 0.4; ctx.fillStyle = `rgba(220,255,120,${a})`; ctx.shadowColor = '#d0ff60'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, 7); ctx.fill(); ctx.shadowBlur = 0; break; }
        case 'flour': ctx.fillStyle = 'rgba(255,250,240,0.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, 1.2 + p.s * 1.5, 0, 7); ctx.fill(); break;
        default: ctx.fillStyle = `rgba(255,240,210,${0.12 + p.s * 0.2})`; ctx.beginPath(); ctx.arc(p.x, p.y, 1 + p.s * 1.5, 0, 7); ctx.fill();
      }
    }
    ctx.restore();
  }

  // minimap drawing into a provided canvas
  drawMinimap(cv, big = false) {
    const lv = this.lvl; if (!lv) return;
    const c = cv.getContext('2d');
    const s = Math.min(cv.width / lv.w, cv.height / lv.h);
    const offX = (cv.width - lv.w * s) / 2, offY = (cv.height - lv.h * s) / 2;
    c.clearRect(0, 0, cv.width, cv.height);
    c.fillStyle = 'rgba(8,10,22,0.85)'; c.fillRect(0, 0, cv.width, cv.height);
    for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) {
      const i = y * lv.w + x;
      if (!this.explored[i]) continue;
      const t = lv.grid[i];
      c.fillStyle = t === WALL ? 'rgba(160,170,200,0.75)' : t === PROP ? 'rgba(110,120,150,0.6)' : t === LOCK ? '#b04040' : t === DOOR ? '#8a7a5a' : 'rgba(60,70,100,0.7)';
      c.fillRect(offX + x * s, offY + y * s, Math.ceil(s), Math.ceil(s));
    }
    const P = (wx, wy) => [offX + (wx / TS) * s, offY + (wy / TS) * s];
    const dot = (wx, wy, r, col) => { const [x, y] = P(wx, wy); c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
    const [ex, ey] = P(lv.start.x, lv.start.y);
    c.fillStyle = this.player.loot >= lv.lootCount ? '#5aff8a' : '#a0ffc0'; c.font = `${Math.max(10, s * 3)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.beginPath(); c.arc(ex, ey, Math.max(4, s * 1.2), 0, 7); c.fill();
    for (const l of lv.loot) if (!l.taken && (this.explored[l.y * lv.w + l.x] || this.fx.blueprint)) dot((l.x + 0.5) * TS, (l.y + 0.5) * TS, Math.max(2.5, s * 0.8), '#ffd84a');
    for (const g of this.guards) if (g.visible || this.fx.xray > 0) dot(g.x, g.y, Math.max(2, s * 0.6), g.state === 'chase' ? '#ff3050' : '#ff9a40');
    if (big) for (const cm of lv.cameras) if (this.explored[cm.ty * lv.w + cm.tx]) dot(cm.x, cm.y, Math.max(1.5, s * 0.4), '#ff5070');
    const [px, py] = P(this.player.x, this.player.y);
    c.fillStyle = '#5ad0ff'; c.strokeStyle = '#fff'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(px, py, Math.max(3, s * 0.8), 0, 7); c.fill(); c.stroke();
  }
}
