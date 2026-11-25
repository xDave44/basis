// Basis – Effekte: Töne, Konfetti. Alles über Klassen und CSS-Variablen (die CSP erlaubt keine Inline-Styles).

const LS_SOUND = 'basis-sound';
let ac = null;

export function soundOn() {
  try { return localStorage.getItem(LS_SOUND) !== 'off'; } catch (e) { return true; }
}
export function setSound(on) {
  try { localStorage.setItem(LS_SOUND, on ? 'on' : 'off'); } catch (e) { /* gesperrt */ }
}

const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

function ctx() {
  if (!soundOn()) return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    if (!ac) ac = new AC();
    if (ac.state === 'suspended') ac.resume();
    return ac;
  } catch (e) { return null; }
}

function note(c, f, t, dur, vol) {
  const o = c.createOscillator(); const o2 = c.createOscillator();
  const g = c.createGain(); const g2 = c.createGain();
  o.type = 'sine'; o.frequency.value = f;
  o2.type = 'triangle'; o2.frequency.value = f * 2; g2.gain.value = 0.2;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(c.destination);
  o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}

const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];

// Ein Ton je Haken, mit jedem Schritt eine Stufe höher. `final` hängt den Schlussakkord an.
export function ping(step, final) {
  try {
    const c = ctx();
    if (!c) return;
    const now = c.currentTime;
    note(c, SCALE[Math.max(0, Math.min(step, SCALE.length - 1))], now, 0.34, 0.2);
    if (final === 'day') {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(c, f, now + 0.5 + i * 0.09, 1.0, 0.16));
      note(c, 1318.51, now + 0.5 + 0.42, 1.4, 0.13);
    } else if (final === 'small') {
      [659.25, 783.99, 1046.5].forEach((f, i) => note(c, f, now + 0.16 + i * 0.07, 0.6, 0.14));
    }
  } catch (e) { /* kein Ton möglich */ }
}

// Leiser Ton fürs Zurücknehmen und Verschieben.
export function tick() {
  try {
    const c = ctx();
    if (!c) return;
    note(c, 392, c.currentTime, 0.16, 0.08);
  } catch (e) { /* kein Ton möglich */ }
}

export function buzz(ms) {
  try { if (navigator.vibrate) navigator.vibrate(ms || 10); } catch (e) { /* nicht verfügbar */ }
}

const el = (cls) => { const s = document.createElement('span'); s.className = cls; s.setAttribute('aria-hidden', 'true'); return s; };

// Konfetti nur aus der Palette der App: Orange-Töne und Creme auf dunklem Grund, Tinte und Creme auf Orange.
const COLORS = ['#FF8A3D', '#FF8A3D', '#FF8A3D', '#FFB27A', '#FFB27A', '#FFD9B8', '#F2EDE6', '#C2551A'];
export const INK_COLORS = ['#1C0D03', '#1C0D03', '#1C0D03', '#4A2208', '#FFF1E2', '#FFF1E2', '#FFFFFF', '#B84F16'];
const SHAPES = [[9, 15, 2], [10, 10, 2], [9, 9, 4.5], [5, 20, 2.5], [12, 7, 2]];

// Konfetti: Explosion aus einem Punkt und danach Regen. `host` ist ein 0×0-Element am Ursprung.
// opts: { burst, rain, spread (halbe Breite in px), fall (Fallhöhe in px), rainTop (px über dem Ursprung), delay }
export function confetti(host, opts) {
  if (!host || reduced()) return;
  const o = Object.assign({ burst: 96, rain: 54, spread: 780, fall: 820, rainTop: 520, delay: 540, colors: COLORS }, opts || {});
  const rnd = Math.random;
  const piece = () => {
    const sh = SHAPES[Math.floor(rnd() * SHAPES.length)];
    const p = el('fx-piece');
    p.style.width = sh[0] + 'px';
    p.style.height = sh[1] + 'px';
    p.style.margin = (-sh[1] / 2) + 'px 0 0 ' + (-sh[0] / 2) + 'px';
    p.style.borderRadius = sh[2] + 'px';
    p.style.background = o.colors[Math.floor(rnd() * o.colors.length)];
    return p;
  };
  const frag = document.createDocumentFragment();
  for (let i = 0; i < o.burst; i++) {
    const outer = el('fx-cx');
    const inner = piece();
    inner.classList.add('fx-cy');
    const delay = Math.round(o.delay + rnd() * 320);
    const dur = Math.round(1900 + rnd() * 1300);
    outer.style.setProperty('--x', Math.round((rnd() * 2 - 1) * o.spread * (0.25 + rnd() * 0.75)) + 'px');
    inner.style.setProperty('--up', -Math.round(o.fall * 0.15 + rnd() * o.fall * 0.4) + 'px');
    inner.style.setProperty('--y', Math.round(o.fall * 0.36 + rnd() * o.fall * 0.64) + 'px');
    inner.style.setProperty('--r', Math.round((rnd() * 2 - 1) * 1000) + 'deg');
    outer.style.animationDuration = dur + 'ms';
    outer.style.animationDelay = delay + 'ms';
    inner.style.animationDuration = dur + 'ms';
    inner.style.animationDelay = delay + 'ms';
    outer.append(inner);
    frag.append(outer);
  }
  for (let i = 0; i < o.rain; i++) {
    const outer = el('fx-rain');
    const inner = piece();
    inner.classList.add('fx-fall');
    outer.style.left = Math.round((rnd() * 2 - 1) * o.spread) + 'px';
    outer.style.top = -o.rainTop + 'px';
    inner.style.setProperty('--y', Math.round(o.rainTop + o.fall + rnd() * 160) + 'px');
    inner.style.setProperty('--r', Math.round((rnd() * 2 - 1) * 900) + 'deg');
    inner.style.animationDuration = Math.round(2600 + rnd() * 1800) + 'ms';
    inner.style.animationDelay = Math.round(o.delay + 560 + rnd() * 2400) + 'ms';
    outer.append(inner);
    frag.append(outer);
  }
  host.append(frag);
}
