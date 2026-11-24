// Fully synthesized sound effects + adaptive music (no audio files needed).
const SCALES = [
  [0, 2, 3, 5, 7, 8, 10],   // 0 minor
  [0, 1, 4, 5, 7, 8, 10],   // 1 phrygian dominant (desert)
  [0, 2, 4, 5, 7, 9, 11],   // 2 major
  [0, 2, 4, 7, 9],          // 3 pentatonic
  [0, 3, 5, 6, 7, 10],      // 4 blues
  [0, 2, 3, 5, 7, 9, 10],   // 5 dorian
  [0, 2, 4, 6, 8, 10],      // 6 whole tone
  [0, 2, 3, 5, 7, 8, 11],   // 7 harmonic minor
];

class Audio {
  constructor() {
    this.ctx = null; this.sfxOn = true; this.musicOn = true;
    this.mode = 0; this.intensity = 0; this.step = 0; this.timer = null; this.nextTime = 0;
    this.sirenNode = null; this.seed = 1; this.playing = false;
  }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.7; this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.8; this.sfx.connect(this.master);
      this.mus = this.ctx.createGain(); this.mus.gain.value = this.musicOn ? 0.32 : 0; this.mus.connect(this.master);
      const len = this.ctx.sampleRate * 1;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  }
  setMusic(on) { this.musicOn = on; if (this.mus) this.mus.gain.setTargetAtTime(on ? 0.32 : 0, this.ctx.currentTime, 0.1); }
  setSfx(on) { this.sfxOn = on; }

  tone(freq, dur, type = 'sine', vol = 0.3, slide = 0, delay = 0, dest) {
    if (!this.ctx || (!this.sfxOn && !dest)) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + dur + 0.02);
  }
  noise(dur, freq = 1000, q = 1, vol = 0.3, type = 'bandpass', delay = 0, dest) {
    if (!this.ctx || (!this.sfxOn && !dest)) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfx); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  play(name, opt = {}) {
    if (!this.ctx || !this.sfxOn) return;
    switch (name) {
      case 'step': this.noise(0.06, 300 + Math.random() * 200, 2, opt.vol || 0.12, 'lowpass'); break;
      case 'creak': this.tone(180 + Math.random() * 60, 0.25, 'sawtooth', 0.06, -60); this.noise(0.2, 600, 5, 0.1); break;
      case 'coin': this.tone(1318, 0.08, 'square', 0.06); this.tone(1976, 0.18, 'square', 0.06, 0, 0.06); break;
      case 'bigcoin': [1046, 1318, 1568, 2093].forEach((f, i) => this.tone(f, 0.15, 'square', 0.05, 0, i * 0.05)); break;
      case 'loot': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.14, 0, i * 0.07)); break;
      case 'egg': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.3, 'sine', 0.12, 0, i * 0.09)); this.tone(2093, 0.5, 'sine', 0.06, 0, 0.36); break;
      case 'door': this.noise(0.18, 220, 3, 0.18, 'lowpass'); this.tone(90, 0.15, 'sine', 0.12); break;
      case 'unlock': this.tone(900, 0.05, 'square', 0.08); this.tone(1400, 0.08, 'square', 0.08, 0, 0.07); this.noise(0.08, 3000, 4, 0.1, 'bandpass', 0.05); break;
      case 'tick': this.noise(0.025, 4000, 8, 0.08, 'bandpass'); break;
      case 'glass': for (let i = 0; i < 6; i++) this.tone(2000 + Math.random() * 3000, 0.2 + Math.random() * 0.3, 'triangle', 0.05, 0, i * 0.02); this.noise(0.4, 5000, 1, 0.25, 'highpass'); break;
      case 'cut': this.noise(0.4, 6000, 6, 0.08, 'bandpass'); this.tone(3000, 0.3, 'sine', 0.03, 500); break;
      case 'crash': this.noise(0.5, 1500, 0.8, 0.4, 'lowpass'); for (let i = 0; i < 4; i++) this.tone(1200 + Math.random() * 2000, 0.25, 'triangle', 0.06, 0, i * 0.03); break;
      case 'spotted': this.tone(880, 0.12, 'square', 0.12); this.tone(1320, 0.3, 'square', 0.12, 0, 0.1); break;
      case 'huh': this.tone(400, 0.2, 'triangle', 0.1, 200); break;
      case 'caught': [440, 415, 392, 370, 330].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.12, 0, i * 0.15)); this.noise(0.6, 200, 1, 0.3, 'lowpass', 0.6); break;
      case 'win': [523, 659, 784, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.15, 0, i * 0.11)); break;
      case 'throw': this.noise(0.2, 1800, 2, 0.12, 'bandpass'); this.tone(700, 0.18, 'sine', 0.05, -400); break;
      case 'clack': this.noise(0.08, 2500, 6, 0.3); this.tone(1800, 0.05, 'square', 0.05); break;
      case 'squeak': this.tone(900, 0.12, 'square', 0.12, 700); this.tone(1400, 0.25, 'square', 0.1, -800, 0.12); break;
      case 'smoke': this.noise(0.9, 800, 0.5, 0.3, 'lowpass'); break;
      case 'zap': this.tone(1600, 0.25, 'sawtooth', 0.08, -1400); this.noise(0.25, 4000, 2, 0.12); break;
      case 'emf': for (let i = 0; i < 5; i++) this.tone(200 + i * 150, 0.4, 'sawtooth', 0.05, 800, i * 0.04); break;
      case 'xray': this.tone(300, 0.6, 'sine', 0.1, 1200); this.tone(450, 0.6, 'sine', 0.06, 1500, 0.05); break;
      case 'freeze': [2000, 1600, 1200, 900].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.07, 0, i * 0.06)); break;
      case 'dart': this.noise(0.12, 3000, 3, 0.2, 'bandpass'); this.tone(1200, 0.1, 'sine', 0.06, -800); break;
      case 'snore': this.tone(120, 0.6, 'sawtooth', 0.04, 60); break;
      case 'slip': this.tone(600, 0.4, 'sine', 0.12, -450); this.noise(0.3, 1200, 1, 0.15, 'bandpass', 0.2); break;
      case 'hide': this.noise(0.25, 500, 1, 0.15, 'lowpass'); break;
      case 'vent': for (let i = 0; i < 4; i++) this.noise(0.08, 700, 3, 0.15, 'bandpass', i * 0.09); break;
      case 'buy': [784, 988, 1318].forEach((f, i) => this.tone(f, 0.12, 'square', 0.07, 0, i * 0.06)); break;
      case 'click': this.tone(1200, 0.04, 'square', 0.05); break;
      case 'hover': this.tone(1800, 0.025, 'sine', 0.03); break;
      case 'deny': this.tone(200, 0.15, 'square', 0.08); this.tone(150, 0.2, 'square', 0.08, 0, 0.1); break;
      case 'note': this.noise(0.2, 3000, 1, 0.08, 'highpass'); break;
      case 'chomp': for (let i = 0; i < 3; i++) this.noise(0.07, 600, 2, 0.2, 'lowpass', i * 0.15); break;
      case 'heartbeat': this.tone(60, 0.12, 'sine', 0.25); this.tone(55, 0.12, 'sine', 0.2, 0, 0.18); break;
      case 'revive': [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.3, 'sine', 0.12, 0, i * 0.05)); break;
    }
  }
  siren(on) {
    if (!this.ctx) return;
    if (on && !this.sirenNode && this.sfxOn) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 700; lfo.frequency.value = 1.6; lg.gain.value = 250;
      lfo.connect(lg); lg.connect(o.frequency);
      const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
      g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.06, this.ctx.currentTime + 0.2);
      o.connect(f); f.connect(g); g.connect(this.sfx); o.start(); lfo.start();
      this.sirenNode = { o, g, lfo };
    } else if (!on && this.sirenNode) {
      const s = this.sirenNode; this.sirenNode = null;
      s.g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15);
      setTimeout(() => { try { s.o.stop(); s.lfo.stop(); } catch (e) {} }, 600);
    }
  }
  // ---------------- music
  startMusic(mode = 0, seed = 1, tempo = 100) {
    if (!this.ctx) return;
    this.mode = mode; this.seed = seed; this.tempo = tempo; this.step = 0;
    let s = seed;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    // generate a melody pattern
    this.mel = Array.from({ length: 32 }, (_, i) => (r() < (i % 4 === 0 ? 0.7 : 0.35) ? Math.floor(r() * 8) : -1));
    this.bass = [0, -1, -1, 0, -1, -1, 4, -1, 0, -1, -1, 0, -1, 3, -1, -1];
    if (this.timer) return;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 40);
  }
  stopMusic() { if (this.timer) { clearInterval(this.timer); this.timer = null; } }
  setIntensity(v) { this.intensity = v; }
  schedule() {
    if (!this.ctx) return;
    const sc = SCALES[this.mode] || SCALES[0];
    const root = 110 * Math.pow(2, ((this.seed % 5) - 2) / 12);
    const spb = 60 / (this.tempo * (1 + this.intensity * 0.35)) / 4;
    const note = (deg, oct) => root * Math.pow(2, oct + (sc[((deg % sc.length) + sc.length) % sc.length] + 12 * Math.floor(deg / sc.length)) / 12);
    while (this.nextTime < this.ctx.currentTime + 0.15) {
      const st = this.step % 32, t0 = this.nextTime - this.ctx.currentTime;
      const b = this.bass[st % 16];
      if (b >= 0) this.tone(note(b, 0), spb * 2.5, 'triangle', 0.22, 0, Math.max(0, t0), this.mus);
      const m = this.mel[st];
      if (m >= 0 && (this.step % 64 < 48 || this.intensity > 0.3)) this.tone(note(m, 2), spb * 1.6, 'sine', 0.09, 0, Math.max(0, t0), this.mus);
      if (st % 4 === 2) this.noise(0.04, 7000, 1, 0.03 + this.intensity * 0.05, 'highpass', Math.max(0, t0), this.mus);
      if (this.intensity > 0.5 && st % 2 === 0) this.noise(0.03, 9000, 1, 0.04, 'highpass', Math.max(0, t0), this.mus);
      if (st % 8 === 0) this.noise(0.12, 120, 1, 0.12 + this.intensity * 0.12, 'lowpass', Math.max(0, t0), this.mus);
      this.nextTime += spb;
      this.step++;
    }
  }
}
export const audio = new Audio();
