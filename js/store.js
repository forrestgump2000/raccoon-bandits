// Save data + the shop catalogue.
const KEY = 'raccoon-bandits-save-v1';

export const ITEMS = {
  // ---------- TOOLS: permanent unlocks
  xray: { cat: 'tools', e: '🥽', n: 'X-Ray Goggles', price: 300, key: 'active', cd: 22, dur: 8, desc: 'See guards, lasers & hidden secrets through walls for 8s. Recharges.' },
  cutter: { cat: 'tools', e: '🔪', n: 'Glass Cutter', price: 180, key: 'passive', desc: 'Open display cases silently and 2x faster. No more shattering glass!' },
  emf: { cat: 'tools', e: '📡', n: 'EMF Destabilizer', price: 420, key: 'active', cd: 28, dur: 8, desc: 'Fries cameras and lasers within 6 tiles for 8s. Recharges.' },
  lockpick: { cat: 'tools', e: '🗝️', n: 'Master Lockpicks', price: 150, key: 'passive', desc: 'Pick locked doors 3x faster.' },
  stetho: { cat: 'tools', e: '🩺', n: 'Safecracker Stethoscope', price: 240, key: 'passive', desc: 'Crack safes twice as fast.' },
  compass: { cat: 'tools', e: '🧭', n: 'Treasure Compass', price: 200, key: 'passive', desc: 'An arrow always points to the nearest loot.' },
  whiskers: { cat: 'tools', e: '📳', n: 'Sixth-Sense Whiskers', price: 380, key: 'passive', desc: 'Screen-edge warnings show where nearby guards are.' },
  nightvis: { cat: 'tools', e: '🔦', n: 'Night-Vision Monocle', price: 320, key: 'passive', desc: 'See much farther in the dark.' },
  hack: { cat: 'tools', e: '📱', n: 'Hacking Tablet', price: 500, key: 'active', cd: 40, dur: 10, desc: 'Shut down EVERY camera in the level for 10s. Recharges.' },
  cloak: { cat: 'tools', e: '🧥', n: 'Shadow Cloak', price: 650, key: 'active', cd: 35, dur: 4, desc: 'Become invisible for 4s. Recharges.' },
  grapple: { cat: 'tools', e: '🪝', n: 'Grapple Glove', price: 450, key: 'active', cd: 18, dur: 0, desc: 'Zip forward up to 5 tiles in the direction you aim. Recharges.' },
  // ---------- GADGETS: consumables
  pebble: { cat: 'gadgets', e: '🪨', n: 'Pebbles ×5', price: 25, qty: 5, desc: 'Throw to make a noise and lure guards away.' },
  chicken: { cat: 'gadgets', e: '🐔', n: 'Rubber Chicken ×2', price: 55, qty: 2, desc: 'A LOUD squeaky distraction. Guards from far away come running.' },
  smoke: { cat: 'gadgets', e: '💨', n: 'Smoke Bomb ×2', price: 60, qty: 2, desc: 'A thick cloud blocks all vision for 7s.' },
  dart: { cat: 'gadgets', e: '🎯', n: 'Sleep Dart ×2', price: 90, qty: 2, desc: 'Puts a guard to sleep for 15s. Aim carefully!' },
  banana: { cat: 'gadgets', e: '🍌', n: 'Banana Peel ×3', price: 45, qty: 3, desc: 'Drop it. Guards who step on it slip and get dizzy.' },
  donut: { cat: 'gadgets', e: '🍩', n: 'Donut Box ×2', price: 70, qty: 2, desc: 'Guards who spot it stop to snack for 8s.' },
  decoy: { cat: 'gadgets', e: '🎎', n: 'Decoy Hologram', price: 80, qty: 1, desc: 'Projects a fake you that keeps making noise.' },
  watch: { cat: 'gadgets', e: '⏱️', n: 'Time-Freeze Watch', price: 150, qty: 1, desc: 'Freezes all guards for 5s.' },
  energy: { cat: 'gadgets', e: '🧃', n: 'Turbo Juice ×2', price: 40, qty: 2, desc: 'Move 60% faster for 8s.' },
  tonic: { cat: 'gadgets', e: '🧪', n: 'Invisibility Tonic', price: 110, qty: 1, desc: 'Turn invisible for 6s.' },
  blueprint: { cat: 'gadgets', e: '🗺️', n: 'Blueprint Scroll', price: 70, qty: 1, desc: 'Reveals the whole map and all loot locations.' },
  charm: { cat: 'gadgets', e: '🍀', n: 'Second-Chance Charm', price: 200, qty: 1, desc: 'Auto-used when caught: stuns nearby guards and saves you.' },
  magnetB: { cat: 'gadgets', e: '🧲', n: 'Coin Vacuum', price: 60, qty: 1, desc: 'Sucks in every coin within 8 tiles.' },
  // ---------- UPGRADES: tiered passives
  paws: { cat: 'upgrades', e: '🐾', n: 'Velvet Paws', price: 80, max: 5, desc: 'Footsteps make 15% less noise per level.' },
  swift: { cat: 'upgrades', e: '👟', n: 'Swift Feet', price: 90, max: 5, desc: '+6% move speed per level.' },
  shadow: { cat: 'upgrades', e: '🌑', n: 'Shadow Fur', price: 110, max: 5, desc: 'Guards take 10% longer to spot you per level.' },
  pockets: { cat: 'upgrades', e: '👖', n: 'Deep Pockets', price: 100, max: 5, desc: '+15% coins earned per level.' },
  magnet: { cat: 'upgrades', e: '🧲', n: 'Coin Magnet', price: 70, max: 5, desc: 'Pull in coins from farther away.' },
  hands: { cat: 'upgrades', e: '🤲', n: 'Quick Hands', price: 90, max: 5, desc: 'Interact (crack, pick, cut) 12% faster per level.' },
  eyes: { cat: 'upgrades', e: '👁️', n: 'Sharp Eyes', price: 75, max: 5, desc: 'See 1 tile farther in the dark per level.' },
  belt: { cat: 'upgrades', e: '🎒', n: 'Recharge Belt', price: 150, max: 3, desc: 'Tools recharge 15% faster per level.' },
  // ---------- STYLE: cosmetics
  h_top: { cat: 'style', e: '🎩', n: 'Top Hat', price: 120, slot: 'hat', desc: 'A gentleman thief.' },
  h_crown: { cat: 'style', e: '👑', n: 'Crown', price: 500, slot: 'hat', desc: 'Royalty of robbery.' },
  h_cap: { cat: 'style', e: '🧢', n: 'Bandit Cap', price: 80, slot: 'hat', desc: 'Casual crime.' },
  h_grad: { cat: 'style', e: '🎓', n: 'Grad Cap', price: 150, slot: 'hat', desc: 'Masters in Mischief.' },
  h_party: { cat: 'style', e: '🥳', n: 'Party Hat', price: 90, slot: 'hat', desc: 'Every heist is a party.' },
  h_bow: { cat: 'style', e: '🎀', n: 'Bow', price: 90, slot: 'hat', desc: 'Cute but criminal.' },
  h_helmet: { cat: 'style', e: '⛑️', n: 'Safety Helmet', price: 100, slot: 'hat', desc: 'Safety first. Crime second.' },
  t_spark: { cat: 'style', e: '✨', n: 'Sparkle Trail', price: 150, slot: 'trail', color: '#fff6a0', desc: 'Leave a trail of glitter.' },
  t_rainbow: { cat: 'style', e: '🌈', n: 'Rainbow Trail', price: 300, slot: 'trail', color: 'rainbow', desc: 'Fabulous and felonious.' },
  t_fire: { cat: 'style', e: '🔥', n: 'Flame Trail', price: 250, slot: 'trail', color: '#ff7a2a', desc: 'Hot-footed.' },
  t_heart: { cat: 'style', e: '💖', n: 'Heart Trail', price: 200, slot: 'trail', color: '#ff6ab0', desc: 'Stealing hearts. And gold.' },
  t_bubble: { cat: 'style', e: '🫧', n: 'Bubble Trail', price: 150, slot: 'trail', color: '#a0e8ff', desc: 'Blub blub.' },
  t_music: { cat: 'style', e: '🎵', n: 'Music Trail', price: 220, slot: 'trail', color: '#c0a0ff', desc: 'Sneak with style.' },
};

export const ACTIVE_ORDER = ['xray', 'emf', 'hack', 'cloak', 'grapple', 'pebble', 'chicken', 'smoke', 'dart', 'banana', 'donut', 'decoy', 'watch', 'energy', 'tonic', 'blueprint', 'magnetB'];

const DEFAULT = () => ({
  coins: 50, unlocked: 1, stars: {}, best: {}, owned: {}, items: { pebble: 5, smoke: 1 }, upg: {},
  cos: { hat: null, trail: null }, ownedCos: {}, eggs: {}, settings: { music: true, sfx: true, shake: true },
  stats: { heists: 0, caught: 0, coinsTotal: 0, ghost: 0 }, seenIntro: false,
});

export const save = (() => {
  let s;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
  const d = DEFAULT();
  s = Object.assign(d, s || {});
  for (const k of Object.keys(d)) if (typeof d[k] === 'object' && d[k] && !Array.isArray(d[k])) s[k] = Object.assign({}, d[k], s[k] || {});
  return s;
})();

export function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} }
export function resetSave() { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); }

export function upgradeCost(id) { const it = ITEMS[id]; const lv = save.upg[id] || 0; return Math.round(it.price * Math.pow(lv + 1, 1.45)); }
export function upg(id) { return save.upg[id] || 0; }
export function has(id) { return !!save.owned[id]; }
