// Basis – persönliche Zentrale (PWA)
import { createStore, newId } from './store.js';
import * as G from './game.js';
import * as FX from './fx.js';

if (window.top !== window.self) {
  document.documentElement.textContent = '';
  throw new Error('Basis darf nicht in fremde Seiten eingebettet werden.');
}

const VERSION = '1.1.0';
const DEMO = new URLSearchParams(location.search).has('demo');
const MQ_DESK = window.matchMedia('(min-width: 900px)');
const MQ_RM = window.matchMedia('(prefers-reduced-motion: reduce)');
const isDesk = () => MQ_DESK.matches;
const reduced = () => MQ_RM.matches;
const NS = 'http://www.w3.org/2000/svg';
const EASE = 'cubic-bezier(.2,.8,.2,1)';

const STATUSES = ['Idee', 'Im Aufbau', 'Akquise', 'Laufend', 'Pausiert'];
const TONE = { 'Idee': 'var(--st-idee)', 'Im Aufbau': 'var(--accent)', 'Akquise': 'var(--st-akquise)', 'Laufend': 'var(--st-laufend)', 'Pausiert': 'var(--st-pausiert)' };
const CARD = { d: { big: [320, 264], small: [252, 184] }, m: { big: [206, 178], small: [152, 138] } };
const PRIOS = [['hoch', 'Hoch'], ['mittel', 'Mittel'], ['niedrig', 'Niedrig']];
const DOC_GROUPS = ['Finanzen', 'Projekte', 'Privat', 'Sonstiges'];
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/* ---------------- Hilfen ---------------- */

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

function h(tag, props) {
  const el = document.createElement(tag);
  if (tag === 'form') el.noValidate = true;
  if (props) {
    Object.keys(props).forEach((k) => {
      const v = props[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style') {
        Object.keys(v).forEach((p) => { if (p.startsWith('--')) el.style.setProperty(p, v[p]); else el.style[p] = v[p]; });
      } else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked' || k === 'selected' || k === 'disabled') el[k] = !!v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    });
  }
  for (let i = 2; i < arguments.length; i++) add(el, arguments[i]);
  return el;
}
function add(el, c) {
  if (c == null || c === false) return;
  if (Array.isArray(c)) { c.forEach((x) => add(el, x)); return; }
  el.append(c instanceof Node ? c : document.createTextNode(String(c)));
}

const ICONS = {
  home: ['M3.5 10.5 12 3.5l8.5 7', 'M5.5 9.5V20h13V9.5'],
  today: [['circle', 12, 12, 8.5], 'M8.5 12.2l2.4 2.4 4.6-4.9'],
  map: [['circle', 6, 7, 2.5], ['circle', 18, 9, 2.5], ['circle', 10, 18, 2.5], 'M8.4 7.4l7.2 1.2M6.9 9.4l2.2 6.3M16.3 10.9l-4.7 5.3'],
  board: [['rect', 3.5, 4, 7.5, 6.5, 1.75], ['rect', 13, 13.5, 7.5, 6.5, 1.75], 'M11 7.25h2.25A2.75 2.75 0 0 1 16 10v3.5'],
  list: ['M8.5 6.5h11M8.5 12h11M8.5 17.5h11', ['circle', 4.6, 6.5, 0.6], ['circle', 4.6, 12, 0.6], ['circle', 4.6, 17.5, 0.6]],
  sun: [['circle', 12, 12, 4], 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4'],
  sound: ['M4.5 9.5h3l4.5-4v13l-4.5-4h-3z', 'M15.5 9a4 4 0 0 1 0 6', 'M18 6.5a7.5 7.5 0 0 1 0 11'],
  badge: [['rect', 3.5, 6.5, 14, 14, 3.5], ['circle', 17.5, 6.5, 3]],
  play: ['M8 5.5v13l10.5-6.5z'],
  doc: ['M6.5 3.5h7l4 4v13h-11z', 'M13.5 3.5v4h4', 'M9.5 12.5h5M9.5 16h5'],
  file: ['M6.5 3.5h7l4 4v13h-11z', 'M13.5 3.5v4h4'],
  sheet: [['rect', 4, 4, 16, 16, 2.5], 'M4 9.5h16M4 14.75h16M10 9.5V20'],
  folder: ['M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z'],
  link: ['M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1', 'M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1'],
  person: [['circle', 12, 8, 3.75], 'M4.5 20.5c1.4-3.8 4.2-5.75 7.5-5.75s6.1 1.95 7.5 5.75'],
  bag: [['rect', 3.5, 7, 17, 13, 2.5], 'M9 7V5.75C9 4.78 9.78 4 10.75 4h2.5c.97 0 1.75.78 1.75 1.75V7', 'M3.5 12.5h17'],
  stack: [['rect', 4, 9, 16, 11, 2.5], 'M6.5 6h11', 'M8.5 3.25h7'],
  habit: ['M4 12a8 8 0 0 1 13.7-5.7L20 8.5', 'M20 4v4.5h-4.5', 'M20 12a8 8 0 0 1-13.7 5.7L4 15.5', 'M4 20v-4.5h4.5'],
  plus: ['M12 5v14M5 12h14'],
  calendar: [['rect', 4, 5.5, 16, 14.5, 2.5], 'M4 10.5h16M8.5 3.5v4M15.5 3.5v4'],
  check: ['M5 12.5 10 17.5 19 7'],
  close: ['M6 6l12 12M18 6 6 18'],
  chevron: ['m9 6 6 6-6 6'],
  back: ['m15 6-6 6 6 6'],
  left: ['m14 6-6 6 6 6'],
  ext: ['M8 16 16 8M10 8h6v6'],
  pencil: ['M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z', 'M14 6.5l3.5 3.5'],
  updown: ['m8 9 4-4 4 4M8 15l4 4 4-4'],
  trash: ['M4.5 7h15M10 11v6M14 11v6M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5h6V7'],
  gear: ['M4 7h9M17 7h3M4 17h3M11 17h9', ['circle', 15, 7, 2], ['circle', 9, 17, 2]],
  cloud: ['M7 18.5h10a4 4 0 0 0 .4-7.98A6 6 0 0 0 6.2 9.6 4.5 4.5 0 0 0 7 18.5z', 'm9.5 13.75 1.9 1.9 3.6-3.6'],
  cloudOff: ['M7 18.5h10a4 4 0 0 0 .4-7.98A6 6 0 0 0 6.2 9.6 4.5 4.5 0 0 0 7 18.5z', 'M4 4l16 16'],
  pin: ['M9 4.5h6l-1 5 3 3H7l3-3z', 'M12 12.5v7'],
  more: [['circle', 6, 12, 1.3], ['circle', 12, 12, 1.3], ['circle', 18, 12, 1.3]],
  star: ['M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4 7.2 18.9l.9-5.4L4.2 9.7l5.4-.8z'],
  download: ['M12 4v11', 'm7 10 5 5 5-5', 'M5 19.5h14'],
  upload: ['M12 15V4', 'm7 9 5-5 5 5', 'M5 19.5h14'],
  logout: ['M14 4.5h4.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H14', 'M10 8l-4 4 4 4', 'M6 12h10'],
  import: ['M4 12.5V18a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18v-5.5', 'M12 3.5v10', 'm8 9.5 4 4 4-4']
};

function icon(name, size, sw) {
  const s = document.createElementNS(NS, 'svg');
  const z = size || 20;
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', z);
  s.setAttribute('height', z);
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', sw || 1.8);
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('focusable', 'false');
  (ICONS[name] || []).forEach((p) => {
    let el;
    if (typeof p === 'string') { el = document.createElementNS(NS, 'path'); el.setAttribute('d', p); }
    else if (p[0] === 'rect') {
      el = document.createElementNS(NS, 'rect');
      el.setAttribute('x', p[1]); el.setAttribute('y', p[2]); el.setAttribute('width', p[3]); el.setAttribute('height', p[4]); el.setAttribute('rx', p[5]);
    } else {
      el = document.createElementNS(NS, 'circle');
      el.setAttribute('cx', p[1]); el.setAttribute('cy', p[2]); el.setAttribute('r', p[3]);
    }
    s.appendChild(el);
  });
  return s;
}

// Kleines App-Zeichen (gleiche Form wie das Icon)
function appMark(size) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 1024 1024');
  s.setAttribute('width', size);
  s.setAttribute('height', size);
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('class', 'mark');
  const parts = [
    ['rect', { width: 1024, height: 1024, fill: '#1E1B18' }],
    ['rect', { x: 196, y: 196, width: 440, height: 440, rx: 112, fill: '#FF8A3D', transform: 'rotate(-9 416 416)' }],
    ['rect', { x: 384, y: 384, width: 440, height: 440, rx: 112, fill: '#FFFFFF', 'fill-opacity': 0.22, stroke: '#FFFFFF', 'stroke-opacity': 0.7, 'stroke-width': 22, transform: 'rotate(7 604 604)' }],
    ['path', { d: 'M498 612 572 686 716 528', fill: 'none', stroke: '#FFFFFF', 'stroke-width': 64, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: 'rotate(7 604 604)' }]
  ];
  parts.forEach((p) => {
    const el = document.createElementNS(NS, p[0]);
    Object.keys(p[1]).forEach((k) => el.setAttribute(k, p[1][k]));
    s.appendChild(el);
  });
  return s;
}

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d) => { const x = d || new Date(); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };
const parseKey = (k) => { const a = String(k).split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); };
const dayDiff = (k) => Math.round((parseKey(k) - parseKey(dateKey())) / 864e5);
const fmtDay = (d) => d.toLocaleDateString('de-AT', { day: 'numeric', month: 'short' }).replace(/\.$/, '');
const isKey = (k) => /^\d{4}-\d{2}-\d{2}$/.test(k || '');

function dueInfo(due) {
  if (!isKey(due)) return null;
  const n = dayDiff(due);
  const d = parseKey(due);
  if (n < 0) return { label: n === -1 ? 'Gestern' : fmtDay(d), tone: 'overdue', n: n };
  if (n === 0) return { label: 'Heute', tone: 'today', n: n };
  if (n === 1) return { label: 'Morgen', tone: '', n: n };
  if (n < 7) return { label: WD[d.getDay()], tone: '', n: n };
  return { label: fmtDay(d), tone: '', n: n };
}

function cleanUrl(raw) {
  let u = String(raw || '').trim();
  if (!u) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
  try {
    const p = new URL(u);
    if (p.protocol !== 'https:' || p.hostname.indexOf('.') < 1 || p.username || p.password) return null;
    return p.href;
  } catch (e) { return null; }
}

function docKind(url) {
  if (/^https:\/\/docs\.google\.com\/spreadsheets\//.test(url)) return 'sheet';
  if (/^https:\/\/drive\.google\.com\/drive\/folders\//.test(url)) return 'folder';
  if (/^https:\/\/(docs|drive)\.google\.com\//.test(url)) return 'file';
  return 'link';
}

const plural = (n, one, many) => (n === 1 ? '1 ' + one : n + ' ' + many);

// Geräte-Einstellungen (nicht synchronisiert)
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* gesperrt */ } }
};

// Haken, der sich beim Abhaken zeichnet
function tickSvg() {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 18 18');
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('focusable', 'false');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', 'M4 9.5l3.2 3.2L14 5.8');
  p.setAttribute('pathLength', '1');
  p.setAttribute('class', 'tick');
  s.appendChild(p);
  return s;
}

/* ---------------- Zustand ---------------- */

let store = null;
let D = emptyData();
const session = { phase: 'boot', user: null, error: '', loaded: false, status: { kind: 'pending', text: 'Verbinde …' } };
// Daten da? (loaded = erste Lieferung angekommen; ready = alle Sammlungen; synced = sicher vom Server)
const dataReady = () => session.loaded && !!(session.status && session.status.ready);
const dataSynced = () => dataReady() && !!session.status.synced;
const ui = {
  route: { view: 'start', id: null },
  drafts: Object.create(null),
  edit: null,
  menu: null,
  confirm: null,
  editingIdea: false,
  addingArea: false,
  addingDoc: false,
  pending: new Set(),
  committed: new Set(),
  fxUntil: 0,
  check: false,
  party: null,
  snoozed: false,
  flash: null,
  showAllRest: false,
  month: null,
  loginBusy: false,
  loginMsg: '',
  loginErr: ''
};
let lastScreenKey = '';
let navDir = 'tab';
let backFocus = null;
let deferredRender = false;

function emptyData() { return { todos: {}, ideas: {}, links: {}, areas: {}, docs: {}, habits: {}, habitLog: {}, meta: {} }; }
const entries = (m) => Object.keys(m || {}).map((id) => Object.assign({ id: id }, m[id]));
const byOrder = (a, b) => ((a.order ?? 0) - (b.order ?? 0)) || ((a.createdAt || 0) - (b.createdAt || 0));

const areasList = () => entries(D.areas).sort(byOrder);
const ideasList = () => entries(D.ideas).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
const docsList = () => entries(D.docs).sort(byOrder);
const habitsList = () => entries(D.habits).sort(byOrder);
const todosList = () => entries(D.todos);
const todosFor = (ctx) => todosList().filter((t) => t.ctx === ctx);
const PRIO_RANK = { hoch: 0, mittel: 1, niedrig: 2 };
function sortOpen(a, b) {
  const da = isKey(a.due) ? a.due : '9999-12-31';
  const db = isKey(b.due) ? b.due : '9999-12-31';
  if (da !== db) return da < db ? -1 : 1;
  return ((PRIO_RANK[a.prio] ?? 1) - (PRIO_RANK[b.prio] ?? 1)) || ((a.createdAt || 0) - (b.createdAt || 0));
}
const sortDone = (a, b) => (b.doneAt || 0) - (a.doneAt || 0);

function linksList() {
  const ideas = D.ideas || {};
  return entries(D.links).filter((l) => ideas[l.a] && ideas[l.b] && l.a !== l.b);
}
function ctxName(ctx) {
  const [type, id] = String(ctx || '').split(':');
  if (type === 'area' && D.areas[id]) return D.areas[id].title;
  if (type === 'idea' && D.ideas[id]) return D.ideas[id].name;
  return '';
}
function D_ctxExists(ctx) {
  const [type, id] = String(ctx || '').split(':');
  return (type === 'area' && !!D.areas[id]) || (type === 'idea' && !!D.ideas[id]);
}
const openCount = (ctx) => todosFor(ctx).filter((t) => !t.done).length;

/* ---------------- Heute: Tagesring und Serie ---------------- */

const liveTodos = () => todosList().filter((t) => D_ctxExists(t.ctx));
function dayState() {
  const today = dateKey();
  const todos = liveTodos();
  const sum = G.daySummary(todos, today, ui.pending);
  const dues = G.openDues(todos);
  const rec = (D.meta && D.meta.days) || null;
  return { today: today, todos: todos, sum: sum, dues: dues, rec: rec, streak: G.streakInfo(rec, today, sum.openN === 0, dues) };
}

function dayHeadline(sum) {
  if (sum.total === 0) return ui.snoozed ? 'Für heute ist nichts mehr offen' : (sum.rest.length ? 'Heute ist noch nichts geplant' : 'Heute steht nichts an');
  if (sum.openN === 0) return 'Tag geschafft';
  if (sum.n === 0) return sum.openN === 1 ? 'Heute steht 1 Sache an' : 'Heute stehen ' + sum.openN + ' Dinge an';
  return sum.openN === 1 ? 'Noch 1 Sache für heute' : 'Noch ' + sum.openN + ' Dinge für heute';
}

// [fett, normal]
function streakWords(ds) {
  const s = ds.streak; const sum = ds.sum;
  if (sum.openN > 0) {
    if (s.before > 0) return [plural(s.before, 'Tag', 'Tage') + ' in Folge.', 'Heute holst du dir Tag ' + (s.before + 1) + '.'];
    return ['Heute startet deine Serie.', 'Hak alles ab, dann zählt Tag 1.'];
  }
  const tm = sum.tomorrowN;
  const note = tm ? (tm === 1 ? 'Morgen wartet 1 Aufgabe.' : 'Morgen warten ' + tm + ' Aufgaben.') : (sum.total ? 'Morgen ist noch nichts geplant.' : '');
  return [plural(s.current, 'Tag', 'Tage') + ' in Folge.', note];
}
function streakP(ds) {
  const w = streakWords(ds);
  return h('p', { class: 'hero-streak' }, h('strong', { text: w[0] }), w[1] ? ' ' : null, w[1] ? h('span', { text: w[1] }) : null);
}

// Segment-Ring. Bis 14 Teile ein Bogen je Teil, darüber ein durchgehender Bogen.
const RING = { size: 208, r: 90, w: 14, gap: 12 };
function ringEl(total, n, opts) {
  const o = opts || {};
  const C = 2 * Math.PI * RING.r;
  const seg = total >= 1 && total <= 14;
  const N = seg ? total : 1;
  const gap = N === 1 ? 0 : RING.gap;
  const slot = C / N;
  const dash = N === 1 ? C : Math.max(2, slot - gap - RING.w);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'ring-svg');
  svg.setAttribute('viewBox', '0 0 ' + RING.size + ' ' + RING.size);
  svg.setAttribute('aria-hidden', 'true');
  const glow = document.createElementNS(NS, 'g');
  glow.setAttribute('class', 'ring-glow');
  const c0 = RING.size / 2;
  for (let i = 0; i < N; i++) {
    const rot = -90 + ((i * slot + (N === 1 ? 0 : (gap + RING.w) / 2)) / C) * 360;
    const mk = (cls) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', c0); c.setAttribute('cy', c0); c.setAttribute('r', RING.r);
      c.setAttribute('stroke-width', RING.w);
      c.setAttribute('transform', 'rotate(' + rot.toFixed(3) + ' ' + c0 + ' ' + c0 + ')');
      c.setAttribute('class', cls);
      return c;
    };
    const track = mk('ring-track');
    track.style.strokeDasharray = dash.toFixed(2) + ' ' + (C - dash).toFixed(2);
    svg.appendChild(track);
    glow.appendChild(mk('ring-fill'));
  }
  svg.appendChild(glow);
  const el = h('div', { class: 'ring' + (o.cls ? ' ' + o.cls : ''), role: 'img' }, svg, h('div', { class: 'ring-center' }));
  el._ring = { total: total, seg: seg, C: C, dash: dash, word: o.word || 'erledigt', n: -1 };
  ringSet(el, n, false);
  return el;
}

// Stellt den Ring auf n von total. `live` = aus einem Klick heraus, mit Bewegung.
function ringSet(el, n, live) {
  const g = el._ring;
  if (!g) return;
  const fills = $$('.ring-fill', el);
  fills.forEach((c, i) => {
    let len; let on;
    if (g.seg) { on = i < n; len = g.dash; } else { on = g.total > 0 && n > 0; len = g.total > 0 ? g.C * Math.min(1, n / g.total) : 0; }
    c.style.strokeDasharray = (g.seg ? len : Math.max(len, 0.01)).toFixed(2) + ' ' + g.C.toFixed(2);
    c.style.strokeDashoffset = g.seg ? (on ? '0' : len.toFixed(2)) : '0';
    c.classList.toggle('is-on', on);
  });
  const center = $('.ring-center', el);
  const done = g.total > 0 && n >= g.total;
  const empty = g.total === 0;
  const mode = done ? 'done' : (empty ? 'empty' : 'count');
  el.classList.toggle('is-quiet', empty);
  if (el.dataset.mode !== mode) {
    el.dataset.mode = mode;
    el.classList.toggle('is-drawn', !!live && done);
    if (mode === 'count') {
      const col = h('div', { class: 'odo-col' });
      if (g.total <= 40) for (let i = 0; i <= g.total; i++) col.append(h('div', { text: String(i) }));
      else col.append(h('div', { text: String(n) }));
      center.replaceChildren(h('div', { class: 'odo' }, col), h('div', { class: 'ring-of', text: 'von ' + g.total + ' ' + g.word }));
    } else {
      const s = document.createElementNS(NS, 'svg');
      s.setAttribute('class', 'ring-check');
      s.setAttribute('viewBox', '0 0 72 72');
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M20 37.5l11 11 21-23');
      p.setAttribute('pathLength', '1');
      s.appendChild(p);
      center.replaceChildren(s);
    }
  }
  if (mode === 'count') {
    const col = $('.odo-col', el);
    if (col) {
      if (g.total <= 40) col.style.transform = 'translateY(' + (-(100 / (g.total + 1)) * n).toFixed(4) + '%)';
      else col.firstChild.textContent = String(n);
    }
  }
  el.setAttribute('aria-label', empty ? 'Nichts offen' : (n + ' von ' + g.total + ' ' + g.word));
  if (live && g.n !== n && !reduced()) { el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); }
  g.n = n;
}

// Passt Kopf, Zähler und Morgen-Check an, ohne die Seite neu aufzubauen (laufende Bewegungen bleiben).
function daySync() {
  const ds = dayState();
  const sum = ds.sum;
  const hero = $('.view-start .hero');
  if (hero) {
    const ring = $('.ring', hero);
    if (ring && ring._ring && ring._ring.total === sum.total) ringSet(ring, sum.n, true);
    else if (ring) ring.replaceWith(ringEl(sum.total, sum.n));
    const ttl = $('.hero-title', hero);
    const hl = dayHeadline(sum);
    if (ttl && ttl.textContent !== hl) { ttl.textContent = hl; ttl.classList.remove('is-swap'); void ttl.offsetWidth; ttl.classList.add('is-swap'); }
    const sp = $('.hero-streak', hero);
    if (sp) sp.replaceWith(streakP(ds));
  }
  const mc = $('#overlay .mc');
  if (mc) {
    const main = $('.mc-main', mc);
    if (main) main.textContent = checkHeadline(sum);
    const sp = $('.hero-streak', mc);
    if (sp) sp.replaceWith(streakP(ds));
  }
  renderSidebar();
  renderTabbar();
}

// Hält den heutigen Stand der Serie fest. Nur mit sicher aktuellen Daten, damit kein alter
// Zwischenstand vom Offline-Speicher einen besseren Stand vom Server überschreibt.
let recSig = '';
let recAt = 0;
function syncDayRecord() {
  if (!store || !dataSynced() || ui.pending.size) return;
  const today = dateKey();
  const todos = liveTodos();
  const patch = G.dayRecordPatch(D.meta && D.meta.days, today, G.daySummary(todos, today), G.openDues(todos), true);
  if (!patch) { recSig = ''; return; }
  const sig = JSON.stringify(patch);
  if (sig === recSig && Date.now() - recAt < 8000) return;
  recSig = sig; recAt = Date.now();
  save((s) => s.patch('meta', 'days', patch));
}

// Zahl am App-Symbol
let badgeShown = -1;
function syncBadge() {
  if (!('setAppBadge' in navigator)) return;
  if (!dataReady()) return;
  const n = LS.get('basis-badge', 'on') === 'off' ? 0 : G.daySummary(liveTodos(), dateKey()).openSaved;
  if (n === badgeShown) return;
  badgeShown = n;
  try { (n > 0 ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(() => {}); } catch (e) { /* nicht verfügbar */ }
}

// Habits
const habitDone = (hid, key) => { const l = D.habitLog[key]; return !!(l && Array.isArray(l.ids) && l.ids.indexOf(hid) >= 0); };

/* ---------------- Morgen-Check und Feier ---------------- */

let dayShown = '';
function maybeCheck() {
  if (ui.check || ui.party) return;
  if (!dataReady()) return;
  const today = dateKey();
  if (LS.get('basis-check', 'on') === 'off' || LS.get('basis-check-day', '') === today) return;
  const sum = dayState().sum;
  if (!sum.openN && !sum.rest.length) return;
  LS.set('basis-check-day', today);
  ui.check = true;
}

function greeting() {
  const hr = new Date().getHours();
  return hr < 5 ? 'Neuer Tag.' : (hr < 11 ? 'Guten Morgen.' : (hr < 18 ? 'Hallo.' : 'Guten Abend.'));
}
function checkHeadline(sum) {
  if (sum.total === 0) return sum.rest.length ? 'Was nimmst du dir heute vor?' : 'Heute steht nichts an.';
  if (sum.openN === 0) return 'Schon alles erledigt.';
  if (sum.n === 0) return sum.openN === 1 ? 'Heute steht 1 Sache an.' : 'Heute stehen ' + sum.openN + ' Dinge an.';
  return sum.openN === 1 ? 'Noch 1 Sache für heute.' : 'Noch ' + sum.openN + ' Dinge für heute.';
}

function checkContent() {
  const ds = dayState();
  const sum = ds.sum;
  const body = h('div', { class: 'mc-body' });
  if (sum.total) {
    body.append(h('div', { class: 'list today-list', role: 'group', 'aria-label': 'Aufgaben heute' },
      sum.items.map((t, i) => todoRow(t, { meta: ctxName(t.ctx), index: i, focus: true, act: 'snooze', fixed: true }))));
  }
  const cand = sum.rest.slice(0, 6);
  if (cand.length) {
    body.append(
      sum.total ? h('h3', { class: 'mc-sub', text: 'Auch heute?' }) : null,
      h('div', { class: 'list today-list cand-list', role: 'group', 'aria-label': 'Weitere offene Aufgaben' },
        cand.map((t, i) => todoRow(t, { meta: ctxName(t.ctx), index: i, act: 'plan', dueInMeta: true, fixed: true }))));
  }
  return h('div', { class: 'mc' },
    h('div', { class: 'mc-glow', 'aria-hidden': 'true' }),
    h('h2', { class: 'mc-title', id: 'mc-title' }, h('span', { class: 'mc-hello', text: greeting() }), h('span', { class: 'mc-main', text: checkHeadline(sum) })),
    body,
    h('div', { class: 'mc-foot' }, streakP(ds),
      h('button', { type: 'button', class: 'btn btn-primary btn-xl', 'data-ov-focus': '1', onclick: closeCheck, text: 'Los geht’s' })));
}

function closeCheck() { if (!ui.check) return; ui.check = false; render(); }

const PRAISE = ['Liste leer, Kopf frei.', 'Sauber durchgezogen.', 'Nichts mehr offen.', 'Heute hast du geliefert.', 'Alles weg.', 'Das war dein Tag.', 'So geht ein guter Tag.'];

function openParty() {
  if (session.phase !== 'app') return;
  const ds = dayState();
  const s = ds.streak;
  const yday = Math.floor((parseKey(ds.today) - new Date(parseKey(ds.today).getFullYear(), 0, 0)) / 864e5);
  ui.party = {
    n: ds.sum.n,
    before: s.before,
    current: s.before + 1,
    prevBest: s.prevBest,
    week: G.weekDots(ds.rec, ds.today, true, ds.dues),
    praise: PRAISE[yday % PRAISE.length]
  };
  ui.check = false;
  ui.edit = null;
  render();
}
function closeParty() { if (!ui.party) return; ui.party = null; render(); }

function partyContent(pt) {
  const ring = document.createElementNS(NS, 'svg');
  ring.setAttribute('class', 'party-ring');
  ring.setAttribute('viewBox', '0 0 232 232');
  ring.setAttribute('aria-hidden', 'true');
  const c = document.createElementNS(NS, 'circle');
  c.setAttribute('cx', 116); c.setAttribute('cy', 116); c.setAttribute('r', 100);
  const tk = document.createElementNS(NS, 'path');
  tk.setAttribute('d', 'M80 119l25 25 50-54');
  tk.setAttribute('pathLength', '1');
  ring.append(c, tk);
  const deco = (cls) => h('div', { class: cls, 'aria-hidden': 'true' });
  const conf = h('div', { class: 'party-confetti', 'aria-hidden': 'true' });
  // Strahlen und Blitz sind riesig; sie liegen in einer eigenen Ebene, damit sie keine Scrollfläche aufziehen.
  const back = h('div', { class: 'party-deco', 'aria-hidden': 'true' }, deco('party-rays'), deco('party-flash'));
  const stage = h('div', { class: 'party-stage' }, deco('party-halo'), deco('party-wave w1'), deco('party-wave w2'), deco('party-wave w3'), ring);

  let rec = '';
  if (pt.current === 1) rec = 'Morgen geht es mit Tag 2 weiter';
  else if (pt.current > pt.prevBest) rec = 'neuer Rekord';
  else if (pt.current === pt.prevBest) rec = 'das ist dein Rekord';
  else rec = 'noch ' + plural(pt.prevBest - pt.current, 'Tag', 'Tage') + ' bis zu deinem Rekord';
  const okN = pt.week.filter((d) => d.state === 'ok' || d.state === 'today-ok').length;

  const el = h('div', { class: 'party' }, stage,
    h('h2', { class: 'party-title', id: 'party-title', text: 'Tag geschafft' }),
    h('p', { class: 'party-praise', text: pt.praise }),
    h('div', { class: 'party-streak' },
      h('div', { class: 'party-num' }, h('div', { class: 'party-odo is-roll', 'aria-hidden': 'true' }, h('div', null, h('div', { text: String(pt.before) }), h('div', { text: String(pt.current) })))),
      h('div', { class: 'party-label' }, h('span', { class: 'sr-only', text: String(pt.current) + ' ' }), pt.current === 1 ? 'Tag in Folge' : 'Tage in Folge')),
    h('div', { class: 'party-week', role: 'img', 'aria-label': 'Diese Woche ' + okN + ' von 7 Tagen geschafft' },
      pt.week.map((d) => h('span', { class: 'wd' + (d.state === 'ok' ? ' is-ok' : (d.state === 'today-ok' ? ' is-now' : (d.state === 'miss' ? ' is-miss' : ''))), dataset: { l: d.label }, text: d.label }))),
    h('p', { class: 'party-stats', text: (pt.n === 1 ? '1 Aufgabe' : pt.n + ' Aufgaben') + ' erledigt · ' + rec }),
    h('button', { type: 'button', class: 'btn btn-primary btn-xl party-btn', 'data-ov-focus': '1', onclick: closeParty, text: 'Weiter' }));
  el._conf = conf;
  el._back = back;
  el._stage = stage;
  return el;
}

function renderOverlay() {
  const ov = $('#overlay');
  if (!ov) return;
  const app = $('#app');
  const kind = session.phase !== 'app' ? '' : (ui.party ? 'party' : (ui.check ? 'check' : ''));
  const was = ov.dataset.kind || '';
  if (!kind) {
    if (was) {
      ov.hidden = true;
      ov.replaceChildren();
      ov.dataset.kind = '';
      app.removeAttribute('inert');
      const sc = $('#screen');
      if (sc && session.phase === 'app') { try { sc.focus({ preventScroll: true }); } catch (e) { /* ok */ } }
    }
    return;
  }
  app.setAttribute('inert', '');
  ov.hidden = false;
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  if (kind === 'party') {
    if (was === 'party') return;
    ov.dataset.kind = 'party';
    ov.classList.remove('is-still');
    ov.setAttribute('aria-labelledby', 'party-title');
    const el = partyContent(ui.party);
    // Konfetti liegt neben dem (bei wenig Höhe scrollbaren) Inhalt, damit es keine Scrollfläche aufzieht.
    ov.replaceChildren(h('div', { class: 'ov-scrim', 'aria-hidden': 'true' }), el._back, el, el._conf);
    const W = window.innerWidth; const H = window.innerHeight;
    const r = el._stage.getBoundingClientRect();
    const cy = Math.max(60, Math.round(r.top + r.height / 2));
    [el._conf, el._back].forEach((n) => { n.style.left = Math.round(r.left + r.width / 2) + 'px'; n.style.top = cy + 'px'; });
    FX.confetti(el._conf, { spread: Math.min(820, W * 0.56), fall: Math.min(820, H * 0.9), rainTop: cy + 40 });
  } else {
    const fresh = was !== 'check';
    const old = $('.mc-body', ov);
    const keep = old ? old.scrollTop : 0;
    ov.dataset.kind = 'check';
    ov.classList.toggle('is-still', !fresh);
    ov.setAttribute('aria-labelledby', 'mc-title');
    ov.replaceChildren(h('button', { type: 'button', class: 'ov-scrim', tabindex: '-1', 'aria-label': 'Schließen', onclick: closeCheck }), checkContent());
    const nb = $('.mc-body', ov);
    if (nb) nb.scrollTop = keep;
    if (!fresh) return;
  }
  requestAnimationFrame(() => { const b = $('[data-ov-focus]', ov); if (b) { try { b.focus({ preventScroll: true }); } catch (e) { /* ok */ } } });
}

/* ---------------- Routen ---------------- */

const SLUG = { start: 'start', map: 'map', habits: 'habits', docs: 'dokumente', areas: 'bereiche', area: 'bereich', settings: 'einstellungen' };
const UNSLUG = Object.fromEntries(Object.entries(SLUG).map(([k, v]) => [v, k]));
function hrefOf(view, id) { return '#/' + SLUG[view] + (id ? '/' + encodeURIComponent(id) : ''); }
function parseHash() {
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  const view = UNSLUG[parts[0]] || 'start';
  let id = null;
  try { id = parts[1] ? decodeURIComponent(parts[1]) : null; } catch (e) { id = null; }
  return { view: view, id: id };
}
function go(view, id, dir) {
  navDir = dir || 'tab';
  const target = hrefOf(view, id);
  if (location.hash === target) { onRoute(); return; }
  location.hash = target;
}
function onRoute() {
  const prev = ui.route;
  ui.route = parseHash();
  // Wer weiterblättert, will die Überlagerung nicht mehr sehen.
  ui.party = null; ui.check = false;
  if (prev.view !== ui.route.view || (prev.view !== 'map' && prev.id !== ui.route.id)) {
    ui.edit = null; ui.menu = null; ui.confirm = null; ui.editingIdea = false; ui.addingDoc = false;
  }
  if (prev.view === 'map' && ui.route.view === 'map' && prev.id !== ui.route.id) { ui.edit = null; ui.confirm = null; ui.editingIdea = false; }
  if (editNext && ui.route.view === 'map' && ui.route.id === editNext) { ui.editingIdea = true; }
  editNext = null;
  render();
}
let editNext = null;

/* ---------------- Speichern ---------------- */

function save(fn) {
  if (!store) return;
  try {
    const p = fn(store);
    if (p && typeof p.catch === 'function') p.catch((e) => toast('Speichern fehlgeschlagen: ' + (e && e.message ? e.message : 'unbekannter Fehler')));
  } catch (e) { toast('Speichern fehlgeschlagen.'); console.error(e); }
}

/* ---------------- Rendern ---------------- */

let rafId = 0;
let fxTimer = 0;
// Solange ein Abhak-Effekt läuft, wartet der Neuaufbau kurz – sonst würde er die Bewegung abschneiden.
function scheduleRender() {
  if (rafId) return;
  const wait = ui.fxUntil - Date.now();
  if (wait > 0) {
    if (!fxTimer) fxTimer = setTimeout(() => { fxTimer = 0; scheduleRender(); }, wait + 8);
    return;
  }
  rafId = requestAnimationFrame(() => { rafId = 0; render(); });
}
function holdRender(ms) { if (!reduced()) ui.fxUntil = Math.max(ui.fxUntil, Date.now() + ms); }

function render() {
  if (drag && drag.active) { deferredRender = true; return; }
  const a = document.activeElement;
  const key = a && a.dataset ? a.dataset.key : null;
  let sel = null;
  try { sel = key && typeof a.selectionStart === 'number' ? [a.selectionStart, a.selectionEnd] : null; } catch (e) { sel = null; }
  // Haken und Zeilen-Knöpfe: Fokus über den Neuaufbau retten (Tastatur-Bedienung).
  const rowEl = !key && a && a.closest ? a.closest('[data-id]') : null;
  const rowKeep = rowEl ? { id: rowEl.dataset.id, ov: !!a.closest('#overlay'), cls: ['check', 'row-act', 'row-edit', 'habit-text', 'icard-open'].find((c) => a.classList.contains(c)) } : null;
  if (session.phase !== 'app') { renderGate(); renderOverlay(); }
  else renderApp();
  if (rowKeep && rowKeep.cls && !a.isConnected) {
    const root = rowKeep.ov ? $('#overlay') : $('#screen');
    const n = root && !root.hidden ? root.querySelector('[data-id="' + CSS.escape(rowKeep.id) + '"] .' + rowKeep.cls) : null;
    if (n) { try { n.focus({ preventScroll: true }); } catch (e) { /* ok */ } }
  }
  if (key) {
    const n = document.querySelector('[data-key="' + CSS.escape(key) + '"]');
    if (n && n !== document.activeElement) {
      try { n.focus({ preventScroll: true }); } catch (e) { /* ok */ }
      if (sel && typeof n.setSelectionRange === 'function') { try { n.setSelectionRange(sel[0], sel[1]); } catch (e) { /* ok */ } }
    }
  }
}

function renderGate() {
  $('#app').hidden = true;
  const g = $('#gate');
  g.hidden = false;
  if (session.phase === 'boot') {
    g.replaceChildren(h('div', { class: 'gate-card' }, h('span', { class: 'gate-mark' }, appMark(64)), h('p', { class: 'gate-note', text: 'Lädt …' })));
    return;
  }
  if (session.phase === 'error') {
    g.replaceChildren(h('div', { class: 'gate-card' },
      h('span', { class: 'gate-mark' }, appMark(64)),
      h('h1', { class: 'gate-title', text: 'Keine Verbindung' }),
      h('p', { class: 'gate-note', text: session.error }),
      h('button', { type: 'button', class: 'btn btn-primary btn-wide', onclick: () => location.reload(), text: 'Erneut versuchen' })));
    return;
  }
  // Anmeldung
  const form = h('form', { class: 'gate-card', novalidate: true, onsubmit: onLogin },
    h('span', { class: 'gate-mark' }, appMark(64)),
    h('h1', { class: 'gate-title', text: 'Basis' }),
    h('p', { class: 'gate-note', text: 'Melde dich mit deinem Konto an.' }),
    h('label', { class: 'field-label', for: 'login-email', text: 'E-Mail' }),
    h('input', { id: 'login-email', class: 'input', type: 'email', autocomplete: 'username', inputmode: 'email', required: true, 'data-key': 'login-email', value: ui.drafts['login-email'] || '', oninput: draftInput }),
    h('label', { class: 'field-label', for: 'login-pass', text: 'Passwort' }),
    h('input', { id: 'login-pass', class: 'input', type: 'password', autocomplete: 'current-password', required: true, 'data-key': 'login-pass', value: ui.drafts['login-pass'] || '', oninput: draftInput }),
    ui.loginErr ? h('p', { class: 'form-error', role: 'alert', text: ui.loginErr }) : null,
    ui.loginMsg ? h('p', { class: 'form-ok', role: 'status', text: ui.loginMsg }) : null,
    h('button', { type: 'submit', class: 'btn btn-primary btn-wide', disabled: ui.loginBusy, text: ui.loginBusy ? 'Anmelden …' : 'Anmelden' }),
    h('button', { type: 'button', class: 'btn btn-plain', onclick: onReset, text: 'Passwort vergessen?' }),
    stayHint() ? h('p', { class: 'gate-hint', text: stayHint() }) : null);
  g.replaceChildren(form);
}

// Hinweis, wenn die Anmeldung in diesem Fenster nicht dauerhaft bleiben kann.
function stayHint() {
  try {
    localStorage.setItem('basis-probe', '1');
    localStorage.removeItem('basis-probe');
  } catch (e) {
    return 'Dieses Fenster kann die Anmeldung nicht speichern, zum Beispiel im privaten Modus. Öffne Basis in einem normalen Fenster.';
  }
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  if (ios && !standalone) return 'Am iPhone bleibst du nur angemeldet, wenn du Basis vom Home-Bildschirm aus öffnest: Teilen → „Zum Home-Bildschirm“.';
  return '';
}

// Bittet den Browser, die App-Daten (inkl. Anmeldung) nicht von selbst zu löschen.
function keepStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  } catch (e) { /* nicht unterstützt */ }
}

function draftInput(e) { const k = e.target.dataset.key; if (k) ui.drafts[k] = e.target.value; }

async function onLogin(e) {
  e.preventDefault();
  const email = String(ui.drafts['login-email'] || '').trim();
  const pw = String(ui.drafts['login-pass'] || '');
  if (!email || !pw) { ui.loginErr = 'Bitte E-Mail und Passwort eingeben.'; ui.loginMsg = ''; render(); return; }
  ui.loginBusy = true; ui.loginErr = ''; ui.loginMsg = '';
  render();
  try {
    await store.signIn(email, pw);
    ui.drafts['login-pass'] = '';
  } catch (err) {
    const c = err && err.code ? err.code : '';
    ui.loginErr = /invalid-credential|wrong-password|user-not-found|invalid-login/.test(c) ? 'E-Mail oder Passwort stimmt nicht.'
      : /too-many-requests/.test(c) ? 'Zu viele Versuche. Bitte kurz warten.'
      : /network-request-failed/.test(c) ? 'Keine Verbindung. Prüfe dein Internet.'
      : /invalid-email/.test(c) ? 'Bitte eine gültige E-Mail eingeben.'
      : /user-disabled/.test(c) ? 'Dieses Konto ist gesperrt.'
      : /operation-not-allowed/.test(c) ? 'Die Anmeldung mit E-Mail ist in Firebase noch nicht aktiviert.'
      : /api-key|referer|blocked/.test(c) ? 'Firebase lehnt diese Adresse ab. Prüfe die App-Konfiguration.'
      : 'Anmeldung fehlgeschlagen.';
  }
  ui.loginBusy = false;
  render();
}

async function onReset() {
  const email = String(ui.drafts['login-email'] || '').trim();
  if (!email) { ui.loginErr = 'Gib zuerst deine E-Mail ein.'; ui.loginMsg = ''; render(); return; }
  try { await store.resetPassword(email); } catch (e) { /* gleiche Meldung, damit nichts verraten wird */ }
  ui.loginErr = '';
  ui.loginMsg = 'Wenn es ein Konto gibt, kommt gleich eine E-Mail zum Zurücksetzen.';
  render();
}

function renderApp() {
  $('#gate').hidden = true;
  $('#app').hidden = false;
  dayShown = dateKey();
  maybeCheck();
  renderSidebar();
  renderTabbar();
  renderScreen();
  renderPanel();
  renderOverlay();
  syncDayRecord();
  syncBadge();
}

/* ---------- Navigation ---------- */

function navLink(view, label, ic, count, id) {
  const r = ui.route;
  const active = r.view === view && (view !== 'area' || r.id === id);
  return h('a', { class: 'nav-item' + (active ? ' is-active' : ''), href: hrefOf(view, id), 'aria-current': active ? 'page' : null },
    h('span', { class: 'nav-icon' }, icon(ic, 20)),
    h('span', { class: 'nav-label', text: label }),
    count !== '' && count != null ? h('span', { class: 'nav-count' + (view === 'start' ? ' is-hot' : ''), text: String(count) }) : null);
}

function syncLine() {
  const st = session.status || {};
  const ok = st.kind === 'ok' || st.kind === 'local';
  return h('div', { class: 'sync sync-' + (st.kind || 'pending'), role: 'status' }, icon(ok ? 'cloud' : 'cloudOff', 18), h('span', { text: st.text || '' }));
}

function renderSidebar() {
  const areas = areasList();
  const hl = habitsList();
  const today = dateKey();
  const doneToday = hl.filter((x) => habitDone(x.id, today)).length;
  const sb = $('#sidebar');
  sb.replaceChildren(
    h('div', { class: 'brand' }, h('span', { class: 'brand-mark' }, appMark(28)), h('span', { text: 'Basis' })),
    h('nav', { class: 'side-nav', 'aria-label': 'Navigation' },
      navLink('start', 'Heute', 'today', dayState().sum.openN || ''),
      navLink('map', 'Business-Map', 'map', ideasList().reduce((n, p) => n + openCount('idea:' + p.id), 0) || ''),
      navLink('habits', 'Habits', 'habit', hl.length ? doneToday + '/' + hl.length : ''),
      navLink('docs', 'Dokumente', 'doc', '')),
    h('h2', { class: 'side-label', text: 'Bereiche' }),
    h('nav', { class: 'side-nav', 'aria-label': 'Bereiche' },
      areas.map((a) => navLink('area', a.title, a.icon || 'folder', openCount('area:' + a.id) || '', a.id)),
      areaAdder('side')),
    h('div', { class: 'side-fill' }),
    syncLine(),
    navLink('settings', 'Einstellungen', 'gear', ''));
}

function areaAdder(where) {
  if (ui.addingArea === where) {
    const key = 'area-new-' + where;
    return h('form', { class: 'inline-add', onsubmit: (e) => { e.preventDefault(); commitArea(where); } },
      h('label', { class: 'sr-only', for: key, text: 'Name des neuen Bereichs' }),
      h('input', { id: key, class: 'input input-sm', type: 'text', maxlength: 40, autocomplete: 'off', enterkeyhint: 'done', placeholder: 'Name des Bereichs', 'data-key': key, value: ui.drafts[key] || '', oninput: draftInput, onkeydown: (e) => { if (e.key === 'Escape') { e.preventDefault(); ui.addingArea = false; render(); } } }),
      h('button', { type: 'submit', class: 'icon-btn icon-btn-accent', 'aria-label': 'Bereich anlegen' }, icon('check', 18, 2.4)));
  }
  return h('button', { type: 'button', class: where === 'side' ? 'nav-item nav-add' : 'row-btn row-add', onclick: () => { ui.addingArea = where; ui.drafts['area-new-' + where] = ''; render(); focusLater('#area-new-' + where); } },
    h('span', { class: where === 'side' ? 'nav-icon' : 'row-icon' }, icon('plus', where === 'side' ? 20 : 22)), h('span', { text: 'Bereich hinzufügen' }));
}

function commitArea(where) {
  const key = 'area-new-' + where;
  const title = String(ui.drafts[key] || '').trim().slice(0, 40);
  ui.addingArea = false;
  ui.drafts[key] = '';
  if (!title) { render(); return; }
  const id = newId('b');
  const order = areasList().reduce((m, a) => Math.max(m, a.order ?? 0), 0) + 1;
  save((s) => s.put('areas', id, { title: title, icon: 'folder', order: order, createdAt: Date.now() }));
  go('area', id, 'push');
}

const TABS = [['start', 'Heute', 'today'], ['map', 'Ideen', 'map'], ['areas', 'Bereiche', 'stack'], ['habits', 'Habits', 'habit'], ['docs', 'Dokumente', 'doc']];
function renderTabbar() {
  const tb = $('#tabbar');
  if (!tb.dataset.built) {
    tb.dataset.built = '1';
    tb.append(h('span', { class: 'tab-lens', 'aria-hidden': 'true' }));
    TABS.forEach((t) => tb.append(h('a', { class: 'tab', href: hrefOf(t[0]), dataset: { tab: t[0] } }, icon(t[2], 24), h('span', { text: t[1] }),
      t[0] === 'start' ? h('span', { class: 'tab-dot', hidden: true }) : null)));
  }
  const dot = $('.tab-dot', tb);
  if (dot) {
    const openN = dayState().sum.openN;
    dot.hidden = openN === 0;
    dot.textContent = openN > 99 ? '99+' : String(openN);
    dot.setAttribute('aria-label', openN === 1 ? '1 Aufgabe offen' : openN + ' Aufgaben offen');
  }
  const v = ui.route.view;
  const cur = v === 'area' ? 'areas' : (v === 'settings' ? 'start' : v);
  const idx = Math.max(0, TABS.findIndex((t) => t[0] === cur));
  tb.style.setProperty('--i', String(idx));
  $$('.tab', tb).forEach((a) => {
    const on = a.dataset.tab === cur;
    a.classList.toggle('is-active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

/* ---------- Bildschirme ---------- */

function screenKey() { const r = ui.route; return r.view + ':' + (r.view === 'map' ? '' : (r.id || '')) + ':' + (isDesk() ? 'd' : 'm'); }

function renderScreen() {
  const sc = $('#screen');
  const r = ui.route;
  let node;
  if (r.view === 'map') node = screenMap();
  else if (r.view === 'area') node = screenArea(r.id);
  else if (r.view === 'areas') node = isDesk() ? screenStart() : screenAreas();
  else if (r.view === 'docs') node = screenDocs();
  else if (r.view === 'habits') node = screenHabits();
  else if (r.view === 'settings') node = screenSettings();
  else node = screenStart();
  const keep = sc.firstElementChild && sc.firstElementChild.dataset.screen === node.dataset.screen ? sc.scrollTop : 0;
  sc.classList.toggle('is-wide', node.dataset.screen === 'map');
  sc.replaceChildren(node);
  const k = screenKey();
  if (k !== lastScreenKey) {
    const first = !lastScreenKey;
    lastScreenKey = k;
    window.scrollTo(0, 0);
    sc.scrollTop = 0;
    enterScreen(node, first);
  } else {
    sc.scrollTop = keep;
  }
}

function enterScreen(node, first) {
  const dir = navDir; navDir = 'tab';
  if (reduced()) return;
  const from = dir === 'push' ? 'translateX(28px)' : (dir === 'pop' ? 'translateX(-28px)' : 'translateY(10px)');
  anim(node, [{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }], { duration: first ? 420 : 360, easing: EASE, fill: 'backwards' });
  if (node.dataset.screen === 'map') {
    $$('.card', node).forEach((c, i) => anim(c, [{ opacity: 0, transform: 'translateY(16px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: 80 + i * 60, easing: EASE, fill: 'backwards' }));
    $$('.line', node).forEach((p, i) => anim(p, [{ strokeDashoffset: '1' }, { strokeDashoffset: '0' }], { duration: 760, delay: 380 + i * 110, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'backwards' }));
    $$('.icard', node).forEach((c, i) => anim(c, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 460, delay: 60 + i * 50, easing: EASE, fill: 'backwards' }));
  }
  if (node.dataset.screen === 'habits') {
    $$('.habit', node).forEach((c, i) => anim(c, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 80 + i * 45, easing: EASE, fill: 'backwards' }));
  }
}

function anim(el, frames, opts) {
  if (!el || typeof el.animate !== 'function' || reduced()) return null;
  try { return el.animate(frames, opts); } catch (e) { return null; }
}

function focusLater(sel) { requestAnimationFrame(() => { const n = $(sel); if (n) { try { n.focus({ preventScroll: true }); } catch (e) { /* ok */ } } }); }

function header(title, sub, actions, opts) {
  return h('header', { class: 'head' + (opts && opts.back ? ' has-back' : '') },
    opts && opts.back ? h('a', { class: 'back-btn', href: opts.back, onclick: () => { navDir = 'pop'; } }, icon('back', 20, 2.2), h('span', { text: opts.backLabel || 'Zurück' })) : null,
    h('div', { class: 'head-row' },
      h('div', { class: 'head-text' }, h('h1', { class: 'title', text: title }), sub ? h('p', { class: 'sub', text: sub }) : null),
      actions ? h('div', { class: 'head-actions' }, actions) : null));
}

function section(title, body, opts) {
  const id = 'h-' + Math.random().toString(36).slice(2, 8);
  return h('section', { class: 'sect' + (opts && opts.cls ? ' ' + opts.cls : ''), 'aria-labelledby': id },
    h('div', { class: 'sect-head' }, h('h2', { id: id, class: 'sect-title' + (opts && opts.muted ? ' is-muted' : ''), text: title }), opts && opts.aside ? h('span', { class: 'sect-aside', text: opts.aside }) : null),
    body);
}

/* ---------- Heute ---------- */

function screenStart() {
  const ds = dayState();
  const sum = ds.sum;
  let dl = '';
  try { dl = new Date().toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { dl = dateKey(); }
  const gear = isDesk() ? null : h('a', { class: 'icon-btn icon-btn-quiet', href: hrefOf('settings'), 'aria-label': 'Einstellungen' }, icon('gear', 22));
  const top = h('div', { class: 'topline' }, h('span', { text: dl }), gear);

  const st = session.status || {};
  const notice = st.kind === 'error' ? h('div', { class: 'notice', role: 'alert' }, icon('cloudOff', 20), h('span', { text: st.text + (st.keep ? '. Deine Änderungen bleiben auf diesem Gerät gespeichert.' : '.') })) : null;

  // Bis die Daten da sind, bleibt der Kopf still – sonst stünde kurz „nichts an“ da.
  const loading = !dataReady();
  const hero = h('section', { class: 'hero', 'aria-label': 'Heute', 'aria-busy': loading ? 'true' : null },
    h('div', { class: 'hero-glow', 'aria-hidden': 'true' }),
    ringEl(sum.total, sum.n),
    h('h1', { class: 'title hero-title', text: loading ? '\u00a0' : dayHeadline(sum) }),
    loading ? h('p', { class: 'hero-streak', text: '\u00a0' }) : streakP(ds));

  const view = h('div', { class: 'view view-start', dataset: { screen: 'start' } }, top, hero, notice);

  if (sum.total) {
    view.append(h('div', { class: 'list today-list', role: 'group', 'aria-label': 'Aufgaben heute' },
      sum.items.map((t, i) => todoRow(t, { meta: ctxName(t.ctx), index: i, focus: true, act: 'snooze' }))));
  }
  view.append(addBar('add-start', { selectCtx: true, fold: true, dueToday: true, placeholder: 'Neue Aufgabe für heute …' }));

  // Was sonst noch offen ist – mit einem Tipp nach heute holen
  if (sum.rest.length) {
    const max = ui.showAllRest ? sum.rest.length : 5;
    const more = sum.rest.length - max;
    view.append(h('section', { class: 'box', 'aria-label': 'Demnächst' },
      h('h2', { class: 'box-title' }, 'Demnächst', h('span', { text: sum.rest.length + ' offen' })),
      h('div', { class: 'list rest-list' },
        sum.rest.slice(0, max).map((t, i) => todoRow(t, { meta: ctxName(t.ctx), index: i, act: 'plan', dueInMeta: true })),
        more > 0 ? h('button', { type: 'button', class: 'row-btn row-link sep', onclick: () => { ui.showAllRest = true; render(); } }, h('span', { text: 'Alle ' + sum.rest.length + ' zeigen' }), h('span', { class: 'row-trail' }, icon('chevron', 16, 2))) : null)));
  }

  const hl = habitsList();
  if (hl.length) {
    const today = dateKey();
    const n = hl.filter((x) => habitDone(x.id, today)).length;
    view.append(h('section', { class: 'box', 'aria-label': 'Habits heute' },
      h('h2', { class: 'box-title' }, 'Habits heute', h('span', { class: 'hchips-n', text: n + ' von ' + hl.length })),
      h('div', { class: 'hchips' }, hl.map((x) => habitChip(x))),
      h('a', { class: 'row-btn row-link sep', href: hrefOf('habits') }, h('span', { text: 'Alle Habits' }), h('span', { class: 'row-trail' }, icon('chevron', 16, 2)))));
  }

  const duo = h('div', { class: 'duo' });
  const pins = docsList().filter((d) => d.pin);
  duo.append(h('section', { class: 'box', 'aria-label': 'Schnellzugriff' },
    h('h2', { class: 'box-title' }, 'Schnellzugriff'),
    h('div', { class: 'list' }, pins.map((d, i) => docRow(d, i, { compact: true })),
      h('a', { class: 'row-btn row-link' + (pins.length ? ' sep' : ''), href: hrefOf('docs') }, h('span', { text: 'Alle Dokumente' }), h('span', { class: 'row-count', text: String(docsList().length) }), h('span', { class: 'row-trail' }, icon('chevron', 16, 2))))));
  const steps = ideasList().map((p) => ({ p: p, t: todosFor('idea:' + p.id).filter((t) => !t.done).sort(sortOpen)[0] })).filter((x) => x.t);
  if (steps.length) {
    duo.append(h('section', { class: 'box', 'aria-label': 'Nächste Schritte' },
      h('h2', { class: 'box-title' }, 'Nächste Schritte'),
      h('div', { class: 'list' }, steps.map((x, i) => h('a', { class: 'row-btn step' + (i ? ' sep' : ''), href: hrefOf('map', x.p.id) },
        h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: x.t.t }), h('span', { class: 'row-meta', style: { color: TONE[x.p.status] || 'var(--text-3)' }, text: x.p.name })),
        h('span', { class: 'row-trail' }, icon('chevron', 16, 2)))))));
  }
  view.append(duo);
  return view;
}

// Habit als Kachel auf der Heute-Seite
function habitChip(x) {
  const key = dateKey();
  const done = habitDone(x.id, key);
  const s = G.habitStats(D.habitLog, x.id, key).streak;
  return h('button', { type: 'button', class: 'hchip', dataset: { habit: x.id }, 'aria-pressed': done ? 'true' : 'false', 'aria-label': x.name + (done ? ', erledigt' : ', offen') + (s ? ', ' + plural(s, 'Tag', 'Tage') + ' in Folge' : ''), onclick: (e) => toggleHabit(x.id, key, e.currentTarget) },
    h('span', { class: 'hchip-ring' }, tickSvg()),
    h('span', { text: x.name }),
    s ? h('span', { class: 'hchip-n', text: String(s) }) : null);
}

/* ---------- To-Dos ---------- */

function checkBtn(on, label, onclick, opts) {
  const o = opts || {};
  return h('button', { type: 'button', class: 'check' + (o.lg ? ' check-lg' : '') + (on ? ' is-on' : '') + (o.hi ? ' is-hi' : ''), 'aria-label': label, 'aria-pressed': on ? 'true' : 'false', onclick: (e) => onclick(e.currentTarget) },
    h('span', { class: 'check-ring' }, tickSvg()));
}

function lateWords(due) {
  const n = -dayDiff(due);
  return n === 1 ? 'seit gestern fällig' : 'seit ' + n + ' Tagen fällig';
}

// opts: meta, index, focus (große Zeile der Heute-Liste), act ('snooze' | 'plan'), dueInMeta, fixed (nicht bearbeitbar)
function todoRow(t, opts) {
  const o = opts || {};
  if (ui.edit === t.id && !o.fixed) return todoEditor(t, o);
  const pend = ui.pending.has(t.id);
  const done = !!t.done;
  const info = dueInfo(t.due);
  const late = !done && info && info.n < 0;
  const metaParts = [];
  if (o.meta) metaParts.push(o.meta);
  if (t.tag) metaParts.push(t.tag);
  if (o.focus) {
    if (late) metaParts.push(lateWords(t.due));
    else if (t.prio === 'hoch' && !done) metaParts.push('wichtig');
  } else if (o.dueInMeta) {
    if (info) metaParts.push(info.label);
    else if (t.prio === 'hoch') metaParts.push('wichtig');
  }
  if (done && t.doneAt && !o.focus) metaParts.push('erledigt ' + fmtDay(new Date(t.doneAt)));
  const text = [
    h('span', { class: 'row-title-text' }, h('span', { class: 'strike', text: t.t })),
    metaParts.length ? h('span', { class: 'row-meta', text: metaParts.join(' · ') }) : null];
  const body = o.fixed
    ? h('span', { class: 'row-text' }, text)
    : h('button', { type: 'button', class: 'row-text row-edit', 'aria-label': 'Bearbeiten: ' + t.t, onclick: () => { ui.edit = t.id; ui.drafts['edit-t-' + t.id] = t.t; ui.drafts['edit-due-' + t.id] = t.due || ''; ui.drafts['edit-prio-' + t.id] = t.prio || 'mittel'; render(); focusLater('[data-key="edit-t-' + CSS.escape(t.id) + '"]'); } }, text);
  let act = null;
  if (!done && !pend && o.act === 'snooze') {
    act = h('button', { type: 'button', class: 'row-act', 'aria-label': 'Auf morgen verschieben: ' + t.t, onclick: (e) => snoozeTodo(t, e.currentTarget), text: isDesk() ? 'Auf morgen' : 'Morgen' });
  } else if (!done && !pend && o.act === 'plan') {
    act = h('button', { type: 'button', class: 'row-act row-act-hot', 'aria-label': 'Heute erledigen: ' + t.t, onclick: () => planToday(t), text: 'Heute' });
  }
  const row = h('div', { class: 'row todo' + (o.index ? ' sep' : '') + (pend ? ' is-checking' : '') + (done ? ' is-done' : '') + (late ? ' is-late' : ''), dataset: { id: t.id } },
    checkBtn(done || pend, (done ? 'Wieder öffnen: ' : 'Als erledigt markieren: ') + t.t, (btn) => toggleTodo(t, btn), { hi: t.prio === 'hoch', lg: !!o.focus }),
    body,
    info && !done && !o.focus && !o.dueInMeta ? h('span', { class: 'due' + (info.tone ? ' due-' + info.tone : ''), text: info.label }) : null,
    act);
  // Kurzes Aufleuchten für frisch Eingeplantes; übersteht auch einen zweiten Aufbau direkt danach.
  if (ui.flash && ui.flash.id === t.id && !o.fixed && !reduced()) {
    if (!ui.flash.at) ui.flash.at = performance.now();
    const gone = performance.now() - ui.flash.at;
    if (gone < 900) { row.classList.add('is-flash'); row.style.animationDelay = (-gone).toFixed(0) + 'ms'; } else ui.flash = null;
  }
  return row;
}

function todoEditor(t, o) {
  const k = 'edit-t-' + t.id;
  const kd = 'edit-due-' + t.id;
  const kp = 'edit-prio-' + t.id;
  const doSave = () => {
    const title = String(ui.drafts[k] || '').trim().slice(0, 140);
    if (!title) { toast('Der Titel darf nicht leer sein.'); return; }
    const due = isKey(ui.drafts[kd]) ? ui.drafts[kd] : null;
    const prio = PRIO_RANK[ui.drafts[kp]] !== undefined ? ui.drafts[kp] : 'mittel';
    ui.edit = null;
    save((s) => s.patch('todos', t.id, { t: title, due: due, prio: prio }));
    render();
  };
  return h('form', { class: 'row editor' + (o.index ? ' sep' : ''), onsubmit: (e) => { e.preventDefault(); doSave(); } },
    h('label', { class: 'sr-only', for: 'f-' + k, text: 'Titel' }),
    h('input', { id: 'f-' + k, class: 'input', type: 'text', maxlength: 140, autocomplete: 'off', enterkeyhint: 'done', 'data-key': k, value: ui.drafts[k] ?? t.t, oninput: draftInput, onkeydown: (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); ui.edit = null; render(); } } }),
    h('div', { class: 'editor-bar' },
      dateField(kd, 'Fällig am'),
      prioField(kp),
      h('span', { class: 'grow' }),
      h('button', { type: 'button', class: 'btn btn-danger-plain', onclick: () => { ui.edit = null; deleteTodo(t); } }, icon('trash', 18), h('span', { text: 'Löschen' })),
      h('button', { type: 'submit', class: 'btn btn-primary btn-sm', text: 'Fertig' })));
}

function dateField(key, label) {
  return h('label', { class: 'pill-field' }, icon('calendar', 16), h('span', { class: 'sr-only', text: label }),
    h('input', { type: 'date', class: 'pill-input', 'data-key': key, value: ui.drafts[key] || '', oninput: draftInput, onchange: draftInput }));
}
function prioField(key) {
  const cur = ui.drafts[key] || 'mittel';
  return h('label', { class: 'pill-field' }, h('span', { class: 'sr-only', text: 'Priorität' }),
    h('select', { class: 'pill-input', 'data-key': key, onchange: draftInput }, PRIOS.map((p) => h('option', { value: p[0], selected: p[0] === cur, text: p[1] }))));
}

function addBar(key, opts) {
  const o = opts || {};
  const kd = key + '-due';
  const kp = key + '-prio';
  const kc = key + '-ctx';
  if (!ui.drafts[kp]) ui.drafts[kp] = 'mittel';
  if (o.dueToday && ui.drafts[kd] === undefined) ui.drafts[kd] = dateKey();
  const targets = o.selectCtx ? areasList().map((a) => ['area:' + a.id, a.title]).concat(ideasList().map((p) => ['idea:' + p.id, p.name])) : [];
  if (o.selectCtx && (!ui.drafts[kc] || !targets.some((t) => t[0] === ui.drafts[kc]))) ui.drafts[kc] = targets.length ? targets[0][0] : '';
  const submit = (e) => {
    if (e) e.preventDefault();
    const title = String(ui.drafts[key] || '').trim().slice(0, 140);
    const ctx = o.ctx || ui.drafts[kc];
    if (!title || !ctx) return;
    const due = isKey(ui.drafts[kd]) ? ui.drafts[kd] : null;
    const prio = PRIO_RANK[ui.drafts[kp]] !== undefined ? ui.drafts[kp] : 'mittel';
    ui.drafts[key] = '';
    ui.drafts[kd] = o.dueToday ? dateKey() : '';
    ui.drafts[kp] = 'mittel';
    const id = newId('t');
    if (o.dueToday && due === dateKey()) ui.flash = { id: id, at: 0 };
    save((s) => s.put('todos', id, { t: title, ctx: ctx, due: due, prio: prio, tag: '', done: false, doneAt: null, createdAt: Date.now() }));
    render();
    focusLater('[data-key="' + key + '"]');
  };
  return h('form', { class: 'addbar' + (o.fold ? ' addbar-fold' + (ui.drafts[key] ? ' is-open' : '') : ''), onsubmit: submit },
    h('div', { class: 'addbar-main' },
      h('label', { class: 'sr-only', for: 'f-' + key, text: 'Neues To-Do' }),
      h('input', { id: 'f-' + key, class: 'input', type: 'text', maxlength: 140, autocomplete: 'off', enterkeyhint: 'done', placeholder: o.placeholder || 'Neues To-Do …', 'data-key': key, value: ui.drafts[key] || '', oninput: (e) => { draftInput(e); if (o.fold) e.target.form.classList.toggle('is-open', !!e.target.value); } }),
      h('button', { type: 'submit', class: 'icon-btn icon-btn-accent icon-btn-lg', 'aria-label': 'To-Do hinzufügen' }, icon('plus', 20, 2.4))),
    h('div', { class: 'addbar-opts' },
      o.selectCtx && targets.length ? h('label', { class: 'pill-field' }, h('span', { class: 'sr-only', text: 'Ziel' }),
        h('select', { class: 'pill-input', 'data-key': kc, onchange: draftInput }, targets.map((t) => h('option', { value: t[0], selected: t[0] === ui.drafts[kc], text: t[1] })))) : null,
      dateField(kd, 'Fällig am'),
      prioField(kp)));
}

// Abhaken: sofort sichtbar (Haken, Funken, Ton, Ring), gespeichert nach kurzer Bedenkzeit.
const CHECK_MS = 560;
function toggleTodo(t, btn) {
  const row = btn && btn.closest('.row, .icard-next');
  if (ui.committed.has(t.id)) return;
  if (t.done) {
    FX.tick();
    save((s) => s.patch('todos', t.id, { done: false, doneAt: null }));
    return;
  }
  if (ui.pending.has(t.id)) {
    ui.pending.delete(t.id);
    if (row) row.classList.remove('is-checking', 'is-flash');
    if (btn) { btn.classList.remove('is-on', 'is-pop'); btn.setAttribute('aria-pressed', 'false'); }
    FX.tick();
    daySync();
    scheduleRender();
    return;
  }
  const before = dayState().sum;
  ui.pending.add(t.id);
  const after = dayState().sum;
  const fin = before.openN > 0 && after.openN === 0 && after.total > 0;
  if (row) { row.classList.add('is-checking'); if (!reduced()) row.classList.add('is-flash'); }
  if (btn) { btn.classList.add('is-on', 'is-pop'); btn.setAttribute('aria-pressed', 'true'); FX.sparks(btn); }
  if (row) { const act = $('.row-act', row); if (act) act.hidden = true; }
  FX.ping(Math.max(0, after.n - 1), fin ? 'day' : null);
  FX.buzz(fin ? 24 : 10);
  holdRender(CHECK_MS + 60);
  daySync();
  // Letzter Schritt einer Idee: kurzer Glückwunsch (die Tages-Feier geht vor).
  const im = fin ? null : /^idea:(.+)$/.exec(t.ctx || '');
  if (im && D.ideas[im[1]]) {
    const all = todosFor(t.ctx);
    if (all.length >= 2 && !all.some((x) => !x.done && !ui.pending.has(x.id))) {
      banner(D.ideas[im[1]].name || 'Idee', 'Alle ' + all.length + ' Schritte erledigt');
      burstFrom(btn, false);
    }
  }
  setTimeout(() => {
    if (!ui.pending.has(t.id)) return;
    const party = fin && dayState().sum.openN === 0;
    ui.committed.add(t.id);
    setTimeout(() => { if (ui.committed.delete(t.id)) { ui.pending.delete(t.id); scheduleRender(); } }, 5000);
    save((s) => s.patch('todos', t.id, { done: true, doneAt: Date.now() }));
    if (party) openParty();
    scheduleRender();
  }, reduced() ? 150 : CHECK_MS);
}

// Gespeichert? Dann braucht es den Zwischenstand nicht mehr.
function settlePending() {
  ui.committed.forEach((id) => {
    const t = D.todos[id];
    if (!t || t.done) { ui.committed.delete(id); ui.pending.delete(id); }
  });
}

function snoozeTodo(t, btn) {
  const before = dayState().sum;
  const openIds = before.items.filter((x) => !x.isDone).map((x) => x.id);
  const fin = openIds.length === 1 && openIds[0] === t.id && before.n >= 1;
  const row = btn && btn.closest('.row');
  const go2 = () => {
    ui.snoozed = true;
    save((s) => s.patch('todos', t.id, { due: G.addDays(dateKey(), 1) }));
    if (fin) { FX.ping(Math.max(0, before.n - 1), 'day'); setTimeout(openParty, 420); }
    scheduleRender();
  };
  FX.tick();
  const a = row ? anim(row, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(28px)' }], { duration: 200, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }) : null;
  if (a) a.onfinish = go2; else go2();
}

function planToday(t) {
  ui.flash = { id: t.id, at: 0 };
  FX.tick();
  save((s) => s.patch('todos', t.id, { due: dateKey() }));
  scheduleRender();
}

function deleteTodo(t) {
  const copy = Object.assign({}, D.todos[t.id]);
  save((s) => s.remove('todos', t.id));
  render();
  toast('To-Do gelöscht', () => save((s) => s.put('todos', t.id, copy)));
}

function todoGroups(list) {
  const g = { over: [], today: [], tomorrow: [], week: [], later: [], none: [] };
  list.forEach((t) => {
    const i = dueInfo(t.due);
    if (!i) g.none.push(t);
    else if (i.n < 0) g.over.push(t);
    else if (i.n === 0) g.today.push(t);
    else if (i.n === 1) g.tomorrow.push(t);
    else if (i.n < 7) g.week.push(t);
    else g.later.push(t);
  });
  return [['Überfällig', g.over], ['Heute', g.today], ['Morgen', g.tomorrow], ['Diese Woche', g.week], ['Später', g.later], ['Ohne Datum', g.none]]
    .filter((x) => x[1].length).map((x) => [x[0], x[1].sort(sortOpen)]);
}

/* ---------- Bereiche ---------- */

function screenAreas() {
  const areas = areasList();
  const total = areas.reduce((n, a) => n + openCount('area:' + a.id), 0);
  const list = h('div', { class: 'list' }, areas.map((a, i) => h('a', { class: 'row-btn area-row' + (i ? ' sep' : ''), href: hrefOf('area', a.id), onclick: () => { navDir = 'push'; } },
    h('span', { class: 'row-icon' }, icon(a.icon || 'folder', 22)),
    h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: a.title }), areaMeta(a.id)),
    h('span', { class: 'row-count', text: String(openCount('area:' + a.id)) }),
    h('span', { class: 'row-trail' }, icon('chevron', 16, 2)))), areaAdder('list'));
  return h('div', { class: 'view', dataset: { screen: 'areas' } }, header('Bereiche', plural(areas.length, 'Bereich', 'Bereiche') + ' · ' + total + ' offen'), list);
}

function areaMeta(id) {
  const today = dateKey();
  const due = todosFor('area:' + id).filter((t) => !t.done && isKey(t.due) && t.due <= today).length;
  return due ? h('span', { class: 'row-meta due-today', text: due === 1 ? '1 heute fällig' : due + ' heute fällig' }) : null;
}

function screenArea(id) {
  const a = D.areas[id];
  if (!a) return h('div', { class: 'view', dataset: { screen: 'area' } }, header('Bereich nicht gefunden', ''));
  const ctx = 'area:' + id;
  const all = todosFor(ctx);
  const open = all.filter((t) => !t.done);
  const done = all.filter((t) => t.done).sort(sortDone);
  const menuKey = 'area:' + id;
  const actions = h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Bereich bearbeiten', 'aria-expanded': ui.menu === menuKey ? 'true' : 'false', onclick: () => { ui.menu = ui.menu === menuKey ? null : menuKey; ui.confirm = null; ui.drafts['area-rename'] = a.title; render(); } }, icon('more', 20));
  const view = h('div', { class: 'view view-narrow', dataset: { screen: 'area' } },
    header(a.title, open.length === 1 ? '1 To-Do offen' : open.length + ' To-Dos offen', actions, isDesk() ? null : { back: hrefOf('areas'), backLabel: 'Bereiche' }));
  if (ui.menu === menuKey) view.append(areaMenu(id, a));
  view.append(addBar('add-' + ctx, { ctx: ctx, placeholder: 'Neues To-Do in ' + a.title + ' …' }));
  const groups = todoGroups(open);
  groups.forEach((g) => view.append(section(g[0], h('div', { class: 'list' }, g[1].map((t, i) => todoRow(t, { index: i }))))));
  if (!groups.length) view.append(h('p', { class: 'empty empty-loose', text: done.length ? 'Alles erledigt.' : 'Noch keine To-Dos. Leg oben das erste an.' }));
  if (done.length) view.append(section('Erledigt · ' + done.length, h('div', { class: 'list' }, done.slice(0, 10).map((t, i) => todoRow(t, { index: i }))), { muted: true }));
  return view;
}

function areaMenu(id, a) {
  const close = () => { ui.menu = null; ui.confirm = null; render(); };
  if (ui.confirm === 'area:' + id) {
    const n = todosFor('area:' + id).length;
    return h('div', { class: 'menu-card' }, h('p', { class: 'menu-text', text: n ? 'Bereich mit ' + plural(n, 'To-Do', 'To-Dos') + ' löschen?' : 'Bereich löschen?' }),
      h('div', { class: 'menu-actions' },
        h('button', { type: 'button', class: 'btn btn-danger', onclick: () => deleteArea(id), text: 'Löschen' }),
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: close, text: 'Abbrechen' })));
  }
  return h('form', { class: 'menu-card', onsubmit: (e) => { e.preventDefault(); const t = String(ui.drafts['area-rename'] || '').trim().slice(0, 40); if (t) save((s) => s.patch('areas', id, { title: t })); close(); } },
    h('label', { class: 'field-label', for: 'f-area-rename', text: 'Name' }),
    h('input', { id: 'f-area-rename', class: 'input', type: 'text', maxlength: 40, autocomplete: 'off', 'data-key': 'area-rename', value: ui.drafts['area-rename'] ?? a.title, oninput: draftInput }),
    h('div', { class: 'menu-actions' },
      h('button', { type: 'submit', class: 'btn btn-primary', text: 'Speichern' }),
      h('button', { type: 'button', class: 'btn btn-danger-plain', onclick: () => { ui.confirm = 'area:' + id; render(); } }, icon('trash', 18), h('span', { text: 'Bereich löschen' }))));
}

function deleteArea(id) {
  const ops = [{ op: 'remove', coll: 'areas', id: id }];
  todosFor('area:' + id).forEach((t) => ops.push({ op: 'remove', coll: 'todos', id: t.id }));
  ui.menu = null; ui.confirm = null;
  save((s) => s.batch(ops));
  go(isDesk() ? 'start' : 'areas', null, 'pop');
  toast('Bereich gelöscht');
}

/* ---------- Business-Map ---------- */

function cardSize(p, mode) { const c = CARD[mode][p.big ? 'big' : 'small']; return { w: c[0], h: c[1] }; }
function boardWidthMobile() { return Math.max(300, Math.min(document.documentElement.clientWidth, 600) - 32); }

function geometry(mode) {
  const bw = mode === 'm' ? boardWidthMobile() : null;
  return ideasList().map((p) => {
    const s = cardSize(p, mode);
    const at = (p.pos && p.pos[mode]) || { x: 24, y: 24 };
    let x = Math.max(0, Math.round(Number(at.x) || 0));
    const y = Math.max(0, Math.round(Number(at.y) || 0));
    if (bw) x = Math.min(x, Math.max(0, bw - s.w));
    return { p: p, id: p.id, x: x, y: y, w: s.w, h: s.h };
  });
}

function linePath(a, b) {
  const x1 = a.x + a.w / 2; const y1 = a.y + a.h / 2;
  const x2 = b.x + b.w / 2; const y2 = b.y + b.h / 2;
  if (Math.abs(x2 - x1) >= Math.abs(y2 - y1)) {
    const mx = (x1 + x2) / 2;
    return 'M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2;
  }
  const my = (y1 + y2) / 2;
  return 'M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + my + ' ' + x2 + ' ' + my + ' ' + x2 + ' ' + y2;
}

const mapViewKey = () => 'basis-mapview-' + (isDesk() ? 'd' : 'm');
const mapView = () => { const v = LS.get(mapViewKey(), ''); return v === 'list' || v === 'board' ? v : (isDesk() ? 'board' : 'list'); };

function screenMap() {
  const mode = isDesk() ? 'd' : 'm';
  const viewMode = mapView();
  const ideas = ideasList();
  const openId = ui.route.id;
  const now = Date.now();
  let total = 0; let week = 0;
  ideas.forEach((p) => { const st = G.ideaStats(todosFor('idea:' + p.id), now, p.createdAt); total += st.open; week += st.week; });

  const sub = plural(ideas.length, 'Idee', 'Ideen') + ' · ' + (total === 1 ? '1 offener Schritt' : total + ' offene Schritte') + (week ? ' · ' + week + ' diese Woche erledigt' : '');
  const newBtn = isDesk()
    ? h('button', { type: 'button', class: 'btn btn-primary', onclick: newIdea }, icon('plus', 18, 2.2), h('span', { text: 'Neue Idee' }))
    : h('button', { type: 'button', class: 'icon-btn icon-btn-accent icon-btn-lg', 'aria-label': 'Neue Idee', onclick: newIdea }, icon('plus', 20, 2.4));
  const segBtn = (v, label, ic) => h('button', { type: 'button', class: 'seg-btn', 'aria-pressed': viewMode === v ? 'true' : 'false', onclick: () => { if (mapView() === v) return; LS.set(mapViewKey(), v); lastScreenKey = ''; render(); } }, icon(ic, 18), h('span', { text: label }));
  const bar = h('div', { class: 'map-bar' },
    h('div', { class: 'seg', role: 'group', 'aria-label': 'Ansicht' }, segBtn('list', 'Liste', 'list'), segBtn('board', 'Board', 'board')),
    viewMode === 'board' ? h('span', { class: 'sect-aside', text: isDesk() ? 'Karten frei verschieben' : 'Halten und ziehen' }) : null);

  const view = h('div', { class: 'view view-map', dataset: { screen: 'map', mapview: viewMode } },
    header(isDesk() ? 'Business-Map' : 'Ideen', sub, newBtn), bar);

  if (viewMode === 'list') {
    view.append(ideas.length
      ? h('div', { class: 'idea-list' }, sortIdeas(ideas, now).map((p) => ideaListCard(p, openId === p.id, now)))
      : h('p', { class: 'empty empty-loose', text: 'Noch keine Ideen. Leg oben die erste an.' }));
    return view;
  }

  const geo = geometry(mode);
  const byId = {};
  geo.forEach((g) => { byId[g.id] = g; });
  const maxR = geo.reduce((m, g) => Math.max(m, g.x + g.w), 0);
  const maxB = geo.reduce((m, g) => Math.max(m, g.y + g.h), 0);
  const bw = mode === 'm' ? boardWidthMobile() : Math.max(1060, maxR + 40);
  const bh = mode === 'm' ? Math.max(560, maxB + 24) : Math.max(600, maxB + 40);

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'lines');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', bw);
  svg.setAttribute('height', bh);
  linksList().forEach((l) => {
    const a = byId[l.a]; const b = byId[l.b];
    if (!a || !b) return;
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', linePath(a, b));
    p.setAttribute('pathLength', '1');
    p.setAttribute('class', 'line' + (openId && (l.a === openId || l.b === openId) ? ' is-hot' : ''));
    p.dataset.a = l.a;
    p.dataset.b = l.b;
    svg.appendChild(p);
  });

  const board = h('div', { class: 'board', 'data-board': mode, style: { width: mode === 'd' ? bw + 'px' : '100%', height: bh + 'px' } }, svg,
    geo.map((g, i) => ideaCard(g, mode, i, openId === g.id)));
  view.append(h('div', { class: 'board-wrap' }, board));
  return view;
}

// Aktive Ideen zuerst, Pausiertes ans Ende; sonst wie angelegt.
function sortIdeas(ideas, now) {
  const w = (p) => (p.status === 'Pausiert' ? 2 : (G.ideaStats(todosFor('idea:' + p.id), now, p.createdAt).open ? 0 : 1));
  return ideas.slice().sort((a, b) => (w(a) - w(b)) || ((a.createdAt || 0) - (b.createdAt || 0)));
}

function ideaMomentum(p, st) {
  if (p.status === 'Pausiert') return null;
  if (st.week > 0) return { text: st.week + ' diese Woche erledigt', hot: true };
  if (st.complete) return { text: 'alles erledigt', hot: true };
  if (st.quietDays >= 7) return { text: 'still seit ' + st.quietDays + ' Tagen', hot: false };
  return null;
}

function progressBar(pct, tone, full) {
  return h('span', { class: 'bar' + (full ? ' is-full' : ''), style: { '--p': String(pct), '--tone': tone || 'var(--accent)' }, 'aria-hidden': 'true' }, h('span'));
}

function ideaListCard(p, selected, now) {
  const ctx = 'idea:' + p.id;
  const list = todosFor(ctx);
  const st = G.ideaStats(list, now, p.createdAt);
  const tone = TONE[p.status] || 'var(--text-2)';
  const mom = ideaMomentum(p, st);
  const next = st.next;
  const pend = next && ui.pending.has(next.id);
  const linked = linksList().filter((l) => l.a === p.id || l.b === p.id).map((l) => D.ideas[l.a === p.id ? l.b : l.a]).filter(Boolean);
  const open = (focusSel) => { backFocus = null; if (focusSel) focusAfterOpen = focusSel; navDir = 'tab'; go('map', p.id); };
  const card = h('article', { class: 'icard' + (selected ? ' is-selected' : ''), dataset: { id: p.id } },
    h('button', { type: 'button', class: 'icard-open', 'aria-label': (p.name || 'Ohne Namen') + ', ' + (p.status || 'Idee') + ', ' + st.open + ' offen. Öffnen.', onclick: () => open(null) },
      h('span', { class: 'icard-top' }, h('span', { class: 'icard-status', style: { color: tone }, text: p.status || 'Idee' }), mom ? h('span', { class: 'icard-mom' + (mom.hot ? ' is-hot' : ''), text: mom.text }) : null),
      h('span', { class: 'icard-name', text: p.name || 'Ohne Namen' }),
      p.desc ? h('span', { class: 'icard-desc', text: p.desc }) : null,
      st.total ? h('span', { class: 'icard-prog' }, progressBar(st.pct, tone, st.complete), h('span', { class: 'icard-prog-text', text: st.done + ' von ' + st.total })) : null));
  if (next) {
    const info = dueInfo(next.due);
    card.append(h('div', { class: 'icard-next' + (pend ? ' is-checking' : '') },
      checkBtn(pend, 'Als erledigt markieren: ' + next.t, (btn) => {
        const was = ui.pending.has(next.id);
        toggleTodo(next, btn);
        const b = $('.bar', card);
        const txt = $('.icard-prog-text', card);
        const d2 = st.done + (was ? 0 : 1);
        if (b) b.style.setProperty('--p', String(st.total ? d2 / st.total : 0));
        if (txt) txt.textContent = d2 + ' von ' + st.total;
      }, { hi: next.prio === 'hoch' }),
      h('span', { class: 'icard-next-text' }, h('span', { class: 'row-title-text' }, h('span', { class: 'strike', text: next.t })),
        h('span', { class: 'row-meta', text: 'Nächster Schritt' + (info ? ' · ' + info.label : '') + (st.open > 1 ? ' · ' + (st.open - 1) + ' weitere' : '') }))));
  } else {
    card.append(h('button', { type: 'button', class: 'icard-add', onclick: () => open('[data-key="add-' + ctx + '"]') }, icon('plus', 18, 2.2), h('span', { text: st.total ? 'Nächsten Schritt festlegen' : 'Ersten Schritt festlegen' })));
  }
  if (linked.length) card.append(h('div', { class: 'icard-links', text: 'Verbunden mit ' + linked.map((o) => o.name || 'Ohne Namen').join(', ') }));
  return card;
}

function ideaCard(g, mode, i, selected) {
  const p = g.p;
  const list = todosFor('idea:' + p.id);
  const open = list.filter((t) => !t.done).sort(sortOpen);
  const doneN = list.length - open.length;
  const nextN = p.big ? (mode === 'd' ? 3 : 2) : 1;
  const z = 1 + (Number(p.z) || 0);
  const card = h('button', {
    type: 'button',
    class: 'card' + (p.big ? ' is-big' : '') + (selected ? ' is-selected' : ''),
    dataset: { id: p.id },
    'aria-label': (p.name || 'Ohne Namen') + ', ' + p.status + ', ' + open.length + ' offen. Mit Pfeiltasten verschieben.',
    style: { left: g.x + 'px', top: g.y + 'px', width: g.w + 'px', height: g.h + 'px', zIndex: String(z) }
  },
  h('span', { class: 'card-status', style: { color: TONE[p.status] || 'var(--text-2)' }, text: p.status || 'Idee' }),
  h('span', { class: 'card-name', text: p.name || 'Ohne Namen' }),
  p.desc && (mode === 'd' || p.big) ? h('span', { class: 'card-desc', text: p.desc }) : null,
  h('span', { class: 'card-fill' }),
  open.length ? h('span', { class: 'card-next' }, open.slice(0, nextN).map((t) => h('span', { class: 'card-todo' + (t.prio === 'hoch' ? ' is-hi' : '') }, h('span', { class: 'card-ring' }), h('span', { class: 'card-todo-text', text: t.t })))) : null,
  h('span', { class: 'card-foot' },
    list.length ? progressBar(doneN / list.length, TONE[p.status] || 'var(--accent)', !open.length) : null,
    h('span', { class: 'card-count', text: list.length ? (open.length ? doneN + ' von ' + list.length : 'Alles erledigt') : 'Noch keine To-Dos' })));
  card.addEventListener('pointerdown', (e) => cardDown(e, card, p, mode));
  card.addEventListener('touchmove', (e) => { if (drag && drag.active && drag.el === card) e.preventDefault(); }, { passive: false });
  card.addEventListener('contextmenu', (e) => { if (drag && drag.touch) e.preventDefault(); });
  card.addEventListener('click', (e) => {
    if (suppressClick === p.id) { suppressClick = null; e.preventDefault(); return; }
    backFocus = card;
    go('map', p.id);
  });
  card.addEventListener('keydown', (e) => cardKey(e, card, p, mode));
  return card;
}

/* Ziehen: Maus sofort, Finger nach kurzem Halten */
let drag = null;
let suppressClick = null;

function cardDown(e, el, p, mode) {
  if (drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
  const board = el.offsetParent;
  if (!board) return;
  const r = board.getBoundingClientRect();
  const sc = board.offsetWidth ? r.width / board.offsetWidth : 1;
  drag = { id: p.id, el: el, board: board, mode: mode, pid: e.pointerId, sx: e.clientX, sy: e.clientY, ox: el.offsetLeft, oy: el.offsetTop, sc: sc > 0 ? sc : 1, moved: false, touch: e.pointerType !== 'mouse', active: e.pointerType === 'mouse', timer: 0 };
  if (drag.touch) {
    drag.timer = setTimeout(() => {
      if (!drag || drag.el !== el) return;
      drag.active = true;
      try { el.setPointerCapture(drag.pid); } catch (err) { /* ok */ }
      lift(el, true);
    }, 280);
  } else {
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
  }
  window.addEventListener('pointermove', cardMove);
  window.addEventListener('pointerup', cardUp);
  window.addEventListener('pointercancel', cardCancel);
}

function lift(el, on) {
  el.classList.toggle('is-lifted', on);
  const st = $$('.line', el.closest('.board') || document);
  st.forEach((l) => { if (drag && (l.dataset.a === drag.id || l.dataset.b === drag.id)) l.classList.toggle('is-hot', on); });
}

function cardMove(e) {
  const d = drag;
  if (!d || e.pointerId !== d.pid) return;
  const dx = (e.clientX - d.sx) / d.sc;
  const dy = (e.clientY - d.sy) / d.sc;
  if (!d.active) {
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) endDrag(false);
    return;
  }
  if (!d.moved) {
    if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    d.moved = true;
    if (!d.touch) lift(d.el, true);
    d.el.style.zIndex = '500';
  }
  const bw = d.board.clientWidth;
  const bh = d.board.clientHeight;
  d.nx = Math.round(Math.max(0, Math.min(bw - d.el.offsetWidth, d.ox + dx)));
  d.ny = Math.round(Math.max(0, Math.min(bh - d.el.offsetHeight, d.oy + dy)));
  d.el.style.left = d.nx + 'px';
  d.el.style.top = d.ny + 'px';
  updateLines(d.board, d.id);
}

function updateLines(board, id) {
  const cards = {};
  $$('.card', board).forEach((c) => { cards[c.dataset.id] = { x: c.offsetLeft, y: c.offsetTop, w: c.offsetWidth, h: c.offsetHeight }; });
  $$('.line', board).forEach((l) => {
    if (l.dataset.a !== id && l.dataset.b !== id) return;
    const a = cards[l.dataset.a]; const b = cards[l.dataset.b];
    if (a && b) l.setAttribute('d', linePath(a, b));
  });
}

function cardUp(e) {
  const d = drag;
  if (!d || e.pointerId !== d.pid) return;
  endDrag(true);
}
function cardCancel(e) {
  const d = drag;
  if (!d || e.pointerId !== d.pid) return;
  endDrag(d.moved);
}

function endDrag(commit) {
  const d = drag;
  if (!d) return;
  clearTimeout(d.timer);
  window.removeEventListener('pointermove', cardMove);
  window.removeEventListener('pointerup', cardUp);
  window.removeEventListener('pointercancel', cardCancel);
  try { if (d.el.hasPointerCapture && d.el.hasPointerCapture(d.pid)) d.el.releasePointerCapture(d.pid); } catch (err) { /* ok */ }
  drag = null;
  if (d.active) {
    lift(d.el, false);
    if (d.moved || d.touch) { suppressClick = d.id; setTimeout(() => { if (suppressClick === d.id) suppressClick = null; }, 450); }
  }
  if (commit && d.active && d.moved && d.nx !== undefined) {
    const maxZ = ideasList().reduce((m, p) => Math.max(m, Number(p.z) || 0), 0);
    const patch = { pos: {}, z: maxZ + 1 };
    patch.pos[d.mode] = { x: d.nx, y: d.ny };
    save((s) => s.patch('ideas', d.id, patch));
  }
  if (deferredRender) { deferredRender = false; scheduleRender(); }
}

function cardKey(e, el, p, mode) {
  const step = e.shiftKey ? 48 : 12;
  let dx = 0; let dy = 0;
  if (e.key === 'ArrowLeft') dx = -step;
  else if (e.key === 'ArrowRight') dx = step;
  else if (e.key === 'ArrowUp') dy = -step;
  else if (e.key === 'ArrowDown') dy = step;
  else return;
  e.preventDefault();
  const board = el.offsetParent;
  if (!board) return;
  const x = Math.max(0, Math.min(board.clientWidth - el.offsetWidth, el.offsetLeft + dx));
  const y = Math.max(0, Math.min(board.clientHeight - el.offsetHeight, el.offsetTop + dy));
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  updateLines(board, p.id);
  const patch = { pos: {} };
  patch.pos[mode] = { x: x, y: y };
  save((s) => s.patch('ideas', p.id, patch));
}

function freeSpot(mode, w, hh) {
  const geo = geometry(mode);
  const board = $('.board');
  const bw = mode === 'm' ? boardWidthMobile() : Math.max(1060, board ? board.clientWidth : 1060);
  const maxB = geo.reduce((m, g) => Math.max(m, g.y + g.h), 0);
  const bh = mode === 'm' ? Math.max(560, maxB + 24) : Math.max(600, maxB + 40);
  const gap = mode === 'm' ? 10 : 20;
  const step = mode === 'm' ? 16 : 20;
  for (let y = mode === 'm' ? 12 : 24; y + hh <= bh - 8; y += step) {
    for (let x = mode === 'm' ? 12 : 24; x + w <= bw - 8; x += step) {
      const hit = geo.some((c) => x < c.x + c.w + gap && x + w + gap > c.x && y < c.y + c.h + gap && y + hh + gap > c.y);
      if (!hit) return { x: x, y: y };
    }
  }
  return { x: mode === 'm' ? 12 : 24, y: maxB + (mode === 'm' ? 16 : 24) };
}

function newIdea() {
  const id = newId('i');
  const sd = CARD.d.small; const sm = CARD.m.small;
  const maxZ = ideasList().reduce((m, p) => Math.max(m, Number(p.z) || 0), 0);
  const doc = { name: 'Neue Idee', desc: '', status: 'Idee', big: false, z: maxZ + 1, createdAt: Date.now(), pos: { d: freeSpot('d', sd[0], sd[1]), m: freeSpot('m', sm[0], sm[1]) } };
  ui.editingIdea = true;
  editNext = id;
  ui.drafts['idea-name'] = '';
  ui.drafts['idea-desc'] = '';
  save((s) => s.put('ideas', id, doc));
  popId = id;
  focusAfterOpen = '[data-key="idea-name"]';
  go('map', id);
}
let popId = null;
let focusAfterOpen = null;

/* ---------- Panel / Blatt ---------- */

function renderPanel() {
  const panel = $('#panel');
  const scrim = $('#scrim');
  const id = ui.route.view === 'map' ? ui.route.id : null;
  const p = id ? D.ideas[id] : null;
  const open = !!p;
  const wasOpen = panel.classList.contains('is-open');
  const sameIdea = wasOpen && panel.dataset.for === id;
  const oldBody = panel.querySelector('.panel-body');
  const keepScroll = oldBody ? oldBody.scrollTop : 0;
  if (open) {
    panel.replaceChildren(panelContent(id, p));
    panel.dataset.for = id;
    panel.setAttribute('aria-label', p.name || 'Idee');
    const body = panel.querySelector('.panel-body');
    if (body && sameIdea) body.scrollTop = keepScroll;
  }
  panel.classList.toggle('is-open', open);
  scrim.classList.toggle('is-open', open);
  panel.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
  panel.style.removeProperty('--dy');
  if (open && !wasOpen) {
    requestAnimationFrame(() => {
      const target = focusAfterOpen ? $(focusAfterOpen, panel) : $('[data-panel-focus]', panel);
      focusAfterOpen = null;
      if (target) { try { target.focus({ preventScroll: true }); } catch (e) { /* ok */ } }
      if (popId) { const c = $('.card[data-id="' + CSS.escape(popId) + '"], .icard[data-id="' + CSS.escape(popId) + '"]'); popId = null; anim(c, [{ opacity: 0, transform: 'scale(.86)' }, { opacity: 1, transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' }); }
    });
  } else if (open && focusAfterOpen) {
    requestAnimationFrame(() => { const t = $(focusAfterOpen, panel); focusAfterOpen = null; if (t) { try { t.focus({ preventScroll: true }); } catch (e) { /* ok */ } } });
  }
  if (!open && wasOpen) {
    const bf = backFocus; backFocus = null;
    if (bf && bf.isConnected) { try { bf.focus({ preventScroll: true }); } catch (e) { /* ok */ } }
    else if (ui.route.view === 'map' && panel.dataset.for) { const c = $('.card[data-id="' + CSS.escape(panel.dataset.for) + '"], .icard[data-id="' + CSS.escape(panel.dataset.for) + '"] .icard-open'); if (c) { try { c.focus({ preventScroll: true }); } catch (e) { /* ok */ } } }
  }
}

function closePanel() { if (ui.route.view === 'map' && ui.route.id) go('map', null); }

function panelContent(id, p) {
  const ctx = 'idea:' + id;
  const list = todosFor(ctx);
  const open = list.filter((t) => !t.done).sort(sortOpen);
  const done = list.filter((t) => t.done).sort(sortDone);
  const linked = linksList().filter((l) => l.a === id || l.b === id).map((l) => ({ lid: l.id, oid: l.a === id ? l.b : l.a }));
  const linkedIds = linked.map((x) => x.oid);
  const others = ideasList().filter((x) => x.id !== id && linkedIds.indexOf(x.id) < 0);
  const status = p.status || 'Idee';

  const grab = h('div', { class: 'grab', 'aria-hidden': 'true' }, h('span'));
  grab.addEventListener('pointerdown', sheetDown);

  const top = h('div', { class: 'panel-top' },
    h('button', { type: 'button', class: 'status-btn', style: { color: TONE[status] || 'var(--text-2)' }, 'aria-label': 'Status: ' + status + '. Zum Ändern tippen.', onclick: () => save((s) => s.patch('ideas', id, { status: STATUSES[(STATUSES.indexOf(status) + 1) % STATUSES.length] })) },
      h('span', { text: status }), icon('updown', 14, 2.2)),
    h('span', { class: 'grow' }),
    ui.editingIdea ? null : h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Idee bearbeiten', onclick: () => { ui.editingIdea = true; ui.drafts['idea-name'] = p.name || ''; ui.drafts['idea-desc'] = p.desc || ''; focusAfterOpen = '[data-key="idea-name"]'; render(); } }, icon('pencil', 18, 1.9)),
    h('button', { type: 'button', class: 'icon-btn', 'data-panel-focus': '1', 'aria-label': 'Schließen', onclick: closePanel }, icon('close', 18, 2)));

  let head;
  if (ui.editingIdea) {
    const saveIdea = (e) => {
      if (e) e.preventDefault();
      const name = String(ui.drafts['idea-name'] || '').trim().slice(0, 60) || p.name || 'Neue Idee';
      const desc = String(ui.drafts['idea-desc'] || '').trim().slice(0, 160);
      ui.editingIdea = false;
      focusAfterOpen = '[data-panel-focus]';
      save((s) => s.patch('ideas', id, { name: name, desc: desc }));
      render();
    };
    const esc = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); ui.editingIdea = false; focusAfterOpen = '[data-panel-focus]'; render(); } };
    head = h('form', { class: 'idea-form', onsubmit: saveIdea },
      h('label', { class: 'field-label', for: 'f-idea-name', text: 'Name' }),
      h('input', { id: 'f-idea-name', class: 'input input-lg', type: 'text', maxlength: 60, autocomplete: 'off', enterkeyhint: 'done', placeholder: 'Name der Idee', 'data-key': 'idea-name', value: ui.drafts['idea-name'] || '', oninput: draftInput, onkeydown: esc }),
      h('label', { class: 'field-label', for: 'f-idea-desc', text: 'Kurzbeschreibung' }),
      h('input', { id: 'f-idea-desc', class: 'input', type: 'text', maxlength: 160, autocomplete: 'off', enterkeyhint: 'done', placeholder: 'Worum geht es?', 'data-key': 'idea-desc', value: ui.drafts['idea-desc'] || '', oninput: draftInput, onkeydown: esc }),
      h('label', { class: 'toggle-line' }, h('input', { type: 'checkbox', checked: !!p.big, onchange: (e) => save((s) => s.patch('ideas', id, { big: e.target.checked })) }), h('span', { text: 'Als große Karte zeigen' })),
      h('div', { class: 'menu-actions' },
        h('button', { type: 'submit', class: 'btn btn-primary', text: 'Fertig' }),
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => { ui.editingIdea = false; focusAfterOpen = '[data-panel-focus]'; render(); }, text: 'Abbrechen' })));
  } else {
    head = h('div', { class: 'idea-head' },
      h('h2', { class: 'idea-title', text: p.name || 'Ohne Namen' }),
      p.desc ? h('p', { class: 'idea-desc', text: p.desc }) : null,
      h('p', { class: 'idea-progress' },
        list.length ? progressBar(done.length / list.length, TONE[status] || 'var(--accent)', !open.length) : null,
        h('span', { text: list.length ? done.length + ' von ' + list.length + ' erledigt' : 'Noch keine To-Dos' })));
  }

  const body = h('div', { class: 'panel-body' }, top, head,
    addBar('add-' + ctx, { ctx: ctx, placeholder: 'Neues To-Do …' }),
    open.length ? section('Offen · ' + open.length, h('div', { class: 'list list-flat' }, open.map((t, i) => todoRow(t, { index: i })))) : h('p', { class: 'empty', text: list.length ? 'Alles erledigt.' : 'Noch keine To-Dos. Leg oben das erste an.' }),
    done.length ? section('Erledigt · ' + done.length, h('div', { class: 'list list-flat' }, done.slice(0, 12).map((t, i) => todoRow(t, { index: i }))), { muted: true }) : null,
    section('Verbunden mit', h('div', { class: 'links' },
      linked.length ? h('div', { class: 'list list-flat' }, linked.map((x, i) => {
        const o = D.ideas[x.oid];
        return h('div', { class: 'row link-row' + (i ? ' sep' : '') },
          h('a', { class: 'row-btn link-go', href: hrefOf('map', x.oid) }, h('span', { class: 'row-icon', style: { color: TONE[o.status] || 'var(--text-2)' } }, icon('map', 18)), h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: o.name || 'Ohne Namen' })), h('span', { class: 'row-trail' }, icon('chevron', 16, 2))),
          h('button', { type: 'button', class: 'icon-btn icon-btn-quiet', 'aria-label': 'Verbindung zu ' + (o.name || 'Idee') + ' trennen', onclick: () => save((s) => s.remove('links', x.lid)) }, icon('close', 15, 2.2)));
      })) : h('p', { class: 'empty', text: 'Noch keine Verbindungen.' }),
      others.length ? h('div', { class: 'chips' }, others.map((o) => h('button', { type: 'button', class: 'chip', 'aria-label': 'Mit ' + (o.name || 'Idee') + ' verbinden', onclick: () => { const k = [id, o.id].sort().join('|'); save((s) => s.put('links', k, { a: [id, o.id].sort()[0], b: [id, o.id].sort()[1] })); } }, icon('plus', 14, 2.2), h('span', { text: o.name || 'Ohne Namen' })))) : null)),
    h('div', { class: 'danger-zone' }, ui.confirm === 'idea:' + id
      ? h('div', { class: 'menu-card' }, h('p', { class: 'menu-text', text: 'Idee mit allen To-Dos löschen?' }), h('div', { class: 'menu-actions' },
        h('button', { type: 'button', class: 'btn btn-danger', onclick: () => deleteIdea(id), text: 'Löschen' }),
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => { ui.confirm = null; render(); }, text: 'Abbrechen' })))
      : h('button', { type: 'button', class: 'btn btn-danger-plain', onclick: () => { ui.confirm = 'idea:' + id; render(); } }, icon('trash', 18), h('span', { text: 'Idee löschen' }))));

  return h('div', { class: 'panel-inner' }, grab, body);
}

function deleteIdea(id) {
  const ops = [{ op: 'remove', coll: 'ideas', id: id }];
  todosFor('idea:' + id).forEach((t) => ops.push({ op: 'remove', coll: 'todos', id: t.id }));
  linksList().filter((l) => l.a === id || l.b === id).forEach((l) => ops.push({ op: 'remove', coll: 'links', id: l.id }));
  ui.confirm = null;
  ui.editingIdea = false;
  backFocus = null;
  save((s) => s.batch(ops));
  go('map', null);
  toast('Idee gelöscht');
}

/* Blatt am iPhone: nach unten wischen schließt */
let sheet = null;
function sheetDown(e) {
  if (isDesk() || sheet) return;
  const panel = $('#panel');
  sheet = { pid: e.pointerId, sy: e.clientY, dy: 0, panel: panel, el: e.currentTarget };
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
  panel.classList.add('is-dragging');
  e.currentTarget.addEventListener('pointermove', sheetMove);
  e.currentTarget.addEventListener('pointerup', sheetUp);
  e.currentTarget.addEventListener('pointercancel', sheetUp);
}
function sheetMove(e) {
  if (!sheet || e.pointerId !== sheet.pid) return;
  const dy = e.clientY - sheet.sy;
  sheet.dy = dy > 0 ? dy : dy * 0.15;
  sheet.panel.style.setProperty('--dy', sheet.dy + 'px');
  $('#scrim').style.opacity = String(Math.max(0.2, 1 - Math.max(0, sheet.dy) / 500));
}
function sheetUp(e) {
  if (!sheet || e.pointerId !== sheet.pid) return;
  const s = sheet; sheet = null;
  s.el.removeEventListener('pointermove', sheetMove);
  s.el.removeEventListener('pointerup', sheetUp);
  s.el.removeEventListener('pointercancel', sheetUp);
  s.panel.classList.remove('is-dragging');
  $('#scrim').style.opacity = '';
  if (s.dy > 120) closePanel();
  else s.panel.style.removeProperty('--dy');
}

/* ---------- Dokumente ---------- */

function docRow(d, i, opts) {
  const o = opts || {};
  const kind = d.kind || docKind(d.url);
  let host = '';
  try { host = new URL(d.url).hostname; } catch (e) { host = ''; }
  const base = kind === 'sheet' ? 'Google Tabellen' : kind === 'folder' ? 'Google Drive · Ordner' : kind === 'file' ? 'Google Drive' : host;
  const meta = d.note ? (base ? base + ' · ' + d.note : d.note) : base;
  const ic = kind === 'sheet' ? 'sheet' : kind === 'folder' ? 'folder' : kind === 'file' ? 'file' : 'link';
  const safe = cleanUrl(d.url);
  const link = h(safe ? 'a' : 'span', { class: 'row-btn doc-link', href: safe || null, target: safe ? '_blank' : null, rel: safe ? 'noopener noreferrer' : null, 'aria-label': d.title + (meta ? ', ' + meta : '') + ', öffnet in neuem Tab' },
    h('span', { class: 'row-icon doc-icon doc-' + ic }, icon(ic, 22, 1.7)),
    h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: d.title }), meta ? h('span', { class: 'row-meta', text: meta }) : null),
    o.compact ? h('span', { class: 'row-trail' }, icon('ext', 16, 2)) : null);
  if (o.compact) { link.classList.add('row'); if (i) link.classList.add('sep'); return link; }
  const menuKey = 'doc:' + d.id;
  return h('div', { class: 'row doc-row' + (i ? ' sep' : '') },
    link,
    h('button', { type: 'button', class: 'icon-btn icon-btn-quiet', 'aria-label': 'Aktionen für ' + d.title, 'aria-expanded': ui.menu === menuKey ? 'true' : 'false', onclick: () => { ui.menu = ui.menu === menuKey ? null : menuKey; render(); } }, icon('more', 18)),
    ui.menu === menuKey ? h('div', { class: 'row-menu' },
      h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { ui.menu = null; save((s) => s.patch('docs', d.id, { pin: !d.pin })); render(); } }, icon('pin', 16), h('span', { text: d.pin ? 'Vom Start lösen' : 'Auf Start anheften' })),
      h('button', { type: 'button', class: 'btn btn-danger-plain btn-sm', onclick: () => { ui.menu = null; deleteDoc(d); } }, icon('trash', 16), h('span', { text: 'Löschen' }))) : null);
}

function deleteDoc(d) {
  const copy = Object.assign({}, D.docs[d.id]);
  save((s) => s.remove('docs', d.id));
  render();
  toast('Dokument entfernt', () => save((s) => s.put('docs', d.id, copy)));
}

function screenDocs() {
  const docs = docsList();
  const groups = DOC_GROUPS.concat(Array.from(new Set(docs.map((d) => d.group).filter((g) => g && DOC_GROUPS.indexOf(g) < 0))));
  const toggle = h('button', { type: 'button', class: isDesk() ? 'btn btn-primary' : 'icon-btn icon-btn-accent icon-btn-lg', 'aria-expanded': ui.addingDoc ? 'true' : 'false', 'aria-label': ui.addingDoc ? 'Formular schließen' : 'Dokument hinzufügen', onclick: () => { ui.addingDoc = !ui.addingDoc; ui.drafts['doc-error'] = ''; render(); if (ui.addingDoc) { focusLater('#f-doc-title'); requestAnimationFrame(() => anim($('.doc-form'), [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: EASE })); } } },
    h('span', { class: 'plus-rot' + (ui.addingDoc ? ' is-x' : '') }, icon('plus', isDesk() ? 18 : 20, 2.3)), isDesk() ? h('span', { text: ui.addingDoc ? 'Schließen' : 'Dokument hinzufügen' }) : null);
  const view = h('div', { class: 'view view-narrow', dataset: { screen: 'docs' } }, header('Dokumente', 'Budget, Buchhaltung und alles Wichtige an einem Ort', toggle));
  if (ui.addingDoc) {
    if (!ui.drafts['doc-group']) ui.drafts['doc-group'] = 'Sonstiges';
    view.append(h('form', { class: 'doc-form card-form', onsubmit: (e) => { e.preventDefault(); addDoc(); } },
      h('label', { class: 'field-label', for: 'f-doc-title', text: 'Titel' }),
      h('input', { id: 'f-doc-title', class: 'input', type: 'text', maxlength: 120, autocomplete: 'off', enterkeyhint: 'next', placeholder: 'z. B. Mietvertrag', 'data-key': 'doc-title', value: ui.drafts['doc-title'] || '', oninput: draftInput }),
      h('label', { class: 'field-label', for: 'f-doc-url', text: 'Link' }),
      h('input', { id: 'f-doc-url', class: 'input', type: 'url', inputmode: 'url', maxlength: 2000, autocomplete: 'off', enterkeyhint: 'done', placeholder: 'https://…', 'data-key': 'doc-url', value: ui.drafts['doc-url'] || '', oninput: draftInput }),
      h('label', { class: 'field-label', for: 'f-doc-group', text: 'Gruppe' }),
      h('select', { id: 'f-doc-group', class: 'input', 'data-key': 'doc-group', onchange: draftInput }, DOC_GROUPS.map((g) => h('option', { value: g, selected: g === ui.drafts['doc-group'], text: g }))),
      ui.drafts['doc-error'] ? h('p', { class: 'form-error', role: 'alert', text: ui.drafts['doc-error'] }) : null,
      h('div', { class: 'menu-actions' }, h('button', { type: 'submit', class: 'btn btn-primary', text: 'Hinzufügen' }))));
  }
  groups.forEach((g) => {
    const rows = docs.filter((d) => (d.group || 'Sonstiges') === g);
    if (rows.length) view.append(section(g, h('div', { class: 'list' }, rows.map((d, i) => docRow(d, i)))));
  });
  if (!docs.length) view.append(h('p', { class: 'empty empty-loose', text: 'Noch keine Dokumente.' }));
  return view;
}

function addDoc() {
  const title = String(ui.drafts['doc-title'] || '').trim().slice(0, 120);
  const url = cleanUrl(ui.drafts['doc-url']);
  if (!title) { ui.drafts['doc-error'] = 'Bitte einen Titel eingeben.'; render(); return; }
  if (!url) { ui.drafts['doc-error'] = 'Bitte einen gültigen Link mit https:// eingeben.'; render(); return; }
  const group = DOC_GROUPS.indexOf(ui.drafts['doc-group']) >= 0 ? ui.drafts['doc-group'] : 'Sonstiges';
  const order = docsList().reduce((m, d) => Math.max(m, d.order ?? 0), 0) + 1;
  save((s) => s.put('docs', newId('d'), { title: title, url: url, kind: docKind(url), group: group, pin: false, order: order, createdAt: Date.now() }));
  ui.drafts['doc-title'] = ''; ui.drafts['doc-url'] = ''; ui.drafts['doc-error'] = '';
  ui.addingDoc = false;
  render();
  toast('Dokument hinzugefügt');
}

/* ---------- Habits ---------- */

// Verlauf so, als wäre der Klick schon gespeichert
function logWith(key, hid, on) {
  const log = Object.assign({}, D.habitLog);
  const ids = (log[key] && Array.isArray(log[key].ids) ? log[key].ids : []).filter((x) => x !== hid);
  if (on) ids.push(hid);
  log[key] = { ids: ids };
  return log;
}

function habitHeadline(n, total) {
  if (n >= total) return total === 1 ? 'Habit geschafft' : 'Alle Habits geschafft';
  if (n === 0) return total === 1 ? '1 Habit für heute' : total + ' Habits für heute';
  return total - n === 1 ? 'Noch 1 Habit für heute' : 'Noch ' + (total - n) + ' Habits für heute';
}
function habitStreakP(ps) {
  let a; let b = '';
  if (ps.streak > 0) {
    a = plural(ps.streak, 'perfekter Tag', 'perfekte Tage') + ' in Folge.';
    if (ps.best > ps.streak) b = 'Rekord: ' + ps.best + '.';
    else if (ps.streak >= 2) b = 'Das ist dein Rekord.';
    if (!ps.todayPerfect) b = 'Schaff heute alle für Tag ' + (ps.streak + 1) + '.';
  } else {
    a = 'Schaff heute alle.';
    b = ps.best ? 'Dein Rekord: ' + plural(ps.best, 'perfekter Tag', 'perfekte Tage') + '.' : 'Dann startet deine Serie.';
  }
  return h('p', { class: 'hero-streak' }, h('strong', { text: a }), b ? ' ' : null, b ? h('span', { text: b }) : null);
}

function banner(title, text) {
  $$('.banner').forEach((b) => b.remove());
  const el = h('div', { class: 'banner', role: 'status' }, h('div', { class: 'banner-in' },
    h('span', { class: 'banner-mark' }, icon('check', 18, 3)),
    h('span', { class: 'banner-text' }, h('b', { text: title }), text ? h('span', { text: text }) : null)));
  document.body.append(el);
  setTimeout(() => { el.classList.add('is-out'); setTimeout(() => el.remove(), 400); }, 3200);
}

// Konfetti aus einem Element heraus, ohne Vollbild
function burstFrom(node, big) {
  if (reduced()) return;
  const r = node ? node.getBoundingClientRect() : null;
  // Liegt die Quelle außerhalb des Bildes, startet das Konfetti oben in der Mitte.
  const seen = r && r.width > 0 && r.bottom > 40 && r.top < window.innerHeight - 40;
  const x = seen ? r.left + r.width / 2 : window.innerWidth / 2;
  const y = seen ? r.top + r.height / 2 : 110;
  const host = h('div', { class: 'fx-layer', 'aria-hidden': 'true', style: { left: x + 'px', top: y + 'px' } });
  document.body.append(host);
  FX.confetti(host, { burst: big ? 64 : 26, rain: 0, spread: Math.min(big ? 420 : 220, window.innerWidth * 0.5), fall: Math.min(big ? 620 : 380, window.innerHeight * 0.7), delay: 60 });
  setTimeout(() => host.remove(), 4200);
}

function toggleHabit(hid, key, btn) {
  const today = dateKey();
  const on = !habitDone(hid, key);
  const list = habitsList();
  const log = logWith(key, hid, on);
  const isToday = key === today;
  const doneN = list.filter((x) => { const l = log[today]; return l && l.ids.indexOf(x.id) >= 0; }).length;
  const st = G.habitStats(log, hid, today);
  const perfect = on && isToday && list.length > 0 && doneN === list.length;
  // Erst den Neuaufbau aufschieben, dann speichern – der Demo-Speicher meldet sich sofort zurück.
  if (on) holdRender(perfect ? 900 : 620);
  save((s) => s.toggle('habitLog', key, 'ids', hid, on));
  if (btn) {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (btn.classList.contains('check') || btn.classList.contains('day')) btn.classList.toggle('is-on', on);
  }
  if (!on) { if (btn) btn.classList.remove('is-pop'); FX.tick(); habitSync(log, hid); scheduleRender(); return; }
  if (btn) {
    btn.classList.add('is-pop');
    FX.sparks(btn.classList.contains('hchip') ? $('.hchip-ring', btn) : (btn.classList.contains('day') ? $('.day-dot', btn) : btn));
  }
  FX.ping(isToday ? Math.max(0, doneN - 1) : 2, perfect ? 'small' : null);
  FX.buzz(perfect ? 24 : 10);
  habitSync(log, hid);
  const name = (D.habits[hid] && D.habits[hid].name) || 'Habit';
  if (perfect) {
    const ps = G.perfectStreak(list, log, today);
    banner('Perfekter Tag', (list.length === 1 ? 'Dein Habit ist' : 'Alle ' + list.length + ' Habits sind') + ' erledigt' + (ps.streak > 1 ? ' · ' + ps.streak + ' Tage in Folge' : ''));
    burstFrom($('.view-habits .ring') || btn, true);
  } else if (st.hitMilestone && st.doneToday) {
    banner(st.streak + ' Tage in Folge', name + ' · nächstes Ziel: ' + st.next + ' Tage');
    burstFrom(btn, false);
  }
}

// Passt Ring, Zahlen und Kacheln an, ohne die Seite neu aufzubauen.
function habitSync(log, hid) {
  const today = dateKey();
  const list = habitsList();
  const n = list.filter((x) => { const l = log[today]; return l && Array.isArray(l.ids) && l.ids.indexOf(x.id) >= 0; }).length;
  const hero = $('.view-habits .hero');
  if (hero) {
    const ring = $('.ring', hero);
    if (ring && ring._ring && ring._ring.total === list.length) ringSet(ring, n, true);
    const ttl = $('.hero-title', hero);
    const hl = habitHeadline(n, list.length);
    if (ttl && ttl.textContent !== hl) { ttl.textContent = hl; ttl.classList.remove('is-swap'); void ttl.offsetWidth; ttl.classList.add('is-swap'); }
    const sp = $('.hero-streak', hero);
    if (sp) sp.replaceWith(habitStreakP(G.perfectStreak(list, log, today)));
  }
  const card = $('.habit[data-id="' + CSS.escape(hid) + '"]');
  if (card) {
    const st = G.habitStats(log, hid, today);
    card.classList.toggle('is-done', st.doneToday);
    const main = $('.habit-main .check', card);
    if (main) { main.classList.toggle('is-on', st.doneToday); main.setAttribute('aria-pressed', st.doneToday ? 'true' : 'false'); }
    const td = $('.day.is-today', card);
    if (td) { td.classList.toggle('is-on', st.doneToday); td.setAttribute('aria-pressed', st.doneToday ? 'true' : 'false'); }
    const num = $('.habit-streak b', card);
    if (num && num.textContent !== String(st.streak)) {
      num.textContent = String(st.streak);
      const box = num.parentNode;
      $('span', box).textContent = st.streak === 1 ? 'Tag' : 'Tage';
      if (!reduced()) { box.classList.remove('is-pop'); void box.offsetWidth; box.classList.add('is-pop'); }
    }
    const bar = $('.ms .bar', card);
    if (bar) { bar.style.setProperty('--p', String(st.pct)); }
    const mt = $('.ms-text', card);
    if (mt) mt.textContent = msText(st);
    const meta = $('.habit-meta', card);
    if (meta) meta.textContent = habitMeta(st);
  }
  const chipN = $('.hchips-n');
  if (chipN) chipN.textContent = n + ' von ' + list.length;
  const chip = $('.hchip[data-habit="' + CSS.escape(hid) + '"]');
  if (chip) { const on = !!(log[today] && log[today].ids.indexOf(hid) >= 0); chip.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  const nav = $('#sidebar a[href="#/habits"] .nav-count');
  if (nav) nav.textContent = n + '/' + list.length;
}

const msText = (st) => (st.streak ? 'noch ' + plural(st.toNext, 'Tag', 'Tage') + ' bis ' + st.next : 'Erstes Ziel: ' + st.next + ' Tage');
function habitMeta(st) {
  if (!st.total) return 'Heute ist Tag 1';
  if (st.streak === 0) return st.best > 1 ? 'Rekord: ' + st.best + ' Tage · neu starten' : 'Heute neu starten';
  if (!st.doneToday) return 'Serie läuft · heute noch offen';
  return st.best > st.streak ? 'Rekord: ' + st.best + ' Tage' : (st.streak > 1 ? 'Das ist dein Rekord' : 'Tag 1 steht');
}

function screenHabits() {
  const list = habitsList();
  const today = dateKey();
  const n = list.filter((x) => habitDone(x.id, today)).length;
  const view = h('div', { class: 'view view-narrow view-habits', dataset: { screen: 'habits' } });
  const addForm = h('form', { class: 'addbar addbar-single', onsubmit: (e) => {
    e.preventDefault();
    const name = String(ui.drafts['habit-new'] || '').trim().slice(0, 60);
    if (!name) return;
    const order = list.reduce((m, x) => Math.max(m, x.order ?? 0), 0) + 1;
    save((s) => s.put('habits', newId('h'), { name: name, order: order, createdAt: Date.now() }));
    ui.drafts['habit-new'] = '';
    render();
    focusLater('[data-key="habit-new"]');
  } },
  h('div', { class: 'addbar-main' },
    h('label', { class: 'sr-only', for: 'f-habit-new', text: 'Neuer Habit' }),
    h('input', { id: 'f-habit-new', class: 'input', type: 'text', maxlength: 60, autocomplete: 'off', enterkeyhint: 'done', placeholder: 'Neuer Habit …', 'data-key': 'habit-new', value: ui.drafts['habit-new'] || '', oninput: draftInput }),
    h('button', { type: 'submit', class: 'icon-btn icon-btn-accent icon-btn-lg', 'aria-label': 'Habit hinzufügen' }, icon('plus', 20, 2.4))));
  if (!list.length) {
    view.append(header('Habits', 'Tägliche Gewohnheiten abhaken'), addForm,
      h('div', { class: 'empty-card' },
        h('p', { class: 'empty', text: 'Noch keine Habits. Leg oben einen an oder übernimm deine bisherigen aus dem alten Widget.' }),
        h('a', { class: 'btn btn-ghost', href: hrefOf('settings'), text: 'Zu den Einstellungen' })));
    return view;
  }
  const ps = G.perfectStreak(list, D.habitLog, today);
  view.append(h('section', { class: 'hero', 'aria-label': 'Habits heute' },
    h('div', { class: 'hero-glow', 'aria-hidden': 'true' }),
    ringEl(list.length, n, { word: 'heute' }),
    h('h1', { class: 'title hero-title', text: habitHeadline(n, list.length) }),
    habitStreakP(ps)));
  view.append(h('div', { class: 'habit-list' }, list.map((x) => habitRow(x))));
  view.append(h('div', { class: 'sect' }, addForm));
  view.append(section('Monatsübersicht', monthGrid(list, ps.starts)));
  return view;
}

function habitRow(x) {
  const today = dateKey();
  const st = G.habitStats(D.habitLog, x.id, today);
  const done = st.doneToday;
  const menuKey = 'habit:' + x.id;
  const days = [];
  for (let k = 6; k >= 0; k--) {
    const d = new Date(); d.setDate(d.getDate() - k);
    const key = dateKey(d);
    const on = habitDone(x.id, key);
    days.push(h('button', { type: 'button', class: 'day' + (on ? ' is-on' : '') + (k === 0 ? ' is-today' : ''), 'aria-pressed': on ? 'true' : 'false', 'aria-label': x.name + ', ' + d.toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long' }) + (on ? ', erledigt' : ', offen'), onclick: (e) => toggleHabit(x.id, key, e.currentTarget) },
      h('span', { class: 'day-dot' }), h('span', { class: 'day-label', text: WD[d.getDay()] })));
  }
  const card = h('div', { class: 'habit habit-row' + (done ? ' is-done' : ''), dataset: { id: x.id } },
    h('div', { class: 'habit-main' },
      checkBtn(done, (done ? 'Rückgängig: ' : 'Erledigt: ') + x.name, (btn) => toggleHabit(x.id, today, btn), { lg: true }),
      h('button', { type: 'button', class: 'habit-text', 'aria-label': 'Bearbeiten: ' + x.name, 'aria-expanded': ui.menu === menuKey ? 'true' : 'false', onclick: () => { ui.menu = ui.menu === menuKey ? null : menuKey; ui.drafts['habit-rename'] = x.name; render(); if (ui.menu) focusLater('#f-habit-rename'); } },
        h('span', { class: 'habit-name', text: x.name }), h('span', { class: 'habit-meta', text: habitMeta(st) })),
      h('div', { class: 'habit-streak', 'aria-label': plural(st.streak, 'Tag', 'Tage') + ' in Folge' }, h('b', { text: String(st.streak) }), h('span', { text: st.streak === 1 ? 'Tag' : 'Tage' }))),
    h('div', { class: 'habit-foot' },
      h('div', { class: 'week', role: 'group', 'aria-label': 'Letzte 7 Tage, zum Nachtragen antippen' }, days),
      h('div', { class: 'ms' }, h('div', { class: 'bar', style: { '--p': String(st.pct) }, 'aria-hidden': 'true' }, h('span')), h('span', { class: 'ms-text', text: msText(st) }))));
  if (ui.menu === menuKey) {
    card.append(h('form', { class: 'row-menu row-menu-form', onsubmit: (e) => {
      e.preventDefault();
      const nm = String(ui.drafts['habit-rename'] || '').trim().slice(0, 60);
      if (nm) save((s) => s.patch('habits', x.id, { name: nm }));
      ui.menu = null; render();
    } },
    h('label', { class: 'sr-only', for: 'f-habit-rename', text: 'Name' }),
    h('input', { id: 'f-habit-rename', class: 'input input-sm', type: 'text', maxlength: 60, autocomplete: 'off', 'data-key': 'habit-rename', value: ui.drafts['habit-rename'] ?? x.name, oninput: draftInput }),
    h('button', { type: 'submit', class: 'btn btn-primary btn-sm', text: 'Speichern' }),
    h('button', { type: 'button', class: 'btn btn-danger-plain btn-sm', onclick: () => { ui.menu = null; deleteHabit(x); } }, icon('trash', 16), h('span', { text: 'Löschen' }))));
  }
  return card;
}

function deleteHabit(x) {
  const copy = Object.assign({}, D.habits[x.id]);
  save((s) => s.remove('habits', x.id));
  render();
  toast('Habit gelöscht', () => save((s) => s.put('habits', x.id, copy)));
}

function monthGrid(list, starts) {
  const now = new Date();
  if (!ui.month) ui.month = { y: now.getFullYear(), m: now.getMonth() };
  const y = ui.month.y; const m = ui.month.m;
  const first = new Date(y, m, 1);
  const days = new Date(y, m + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const todayKey = dateKey();
  const cells = [];
  ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach((w) => cells.push(h('span', { class: 'mg-head', text: w })));
  for (let i = 0; i < lead; i++) cells.push(h('span', { class: 'mg-cell is-blank', 'aria-hidden': 'true' }));
  let perfect = 0;
  for (let d = 1; d <= days; d++) {
    const k = dateKey(new Date(y, m, d));
    const future = k > todayKey;
    const hd = future ? { ratio: 0, perfect: false } : G.habitDay(list, D.habitLog, k, starts);
    const r = hd.ratio;
    if (hd.perfect) perfect++;
    cells.push(h('span', { class: 'mg-cell' + (k === todayKey ? ' is-today' : '') + (future ? ' is-future' : '') + (r >= 0.75 ? ' is-full' : '') + (hd.perfect ? ' is-perfect' : ''), style: { '--r': String(r) }, title: d + '. – ' + Math.round(r * 100) + ' %', 'aria-label': d + '.: ' + (future ? 'noch offen' : Math.round(r * 100) + ' Prozent') }, h('span', { text: String(d) })));
  }
  const label = first.toLocaleDateString('de-AT', { month: 'long', year: 'numeric' });
  const canNext = y < now.getFullYear() || (y === now.getFullYear() && m < now.getMonth());
  return h('div', { class: 'month' },
    h('div', { class: 'month-head' },
      h('button', { type: 'button', class: 'icon-btn icon-btn-quiet', 'aria-label': 'Vorheriger Monat', onclick: () => { const d = new Date(y, m - 1, 1); ui.month = { y: d.getFullYear(), m: d.getMonth() }; render(); } }, icon('left', 18, 2)),
      h('span', { class: 'month-title', text: label }),
      h('button', { type: 'button', class: 'icon-btn icon-btn-quiet', 'aria-label': 'Nächster Monat', disabled: !canNext, onclick: () => { const d = new Date(y, m + 1, 1); ui.month = { y: d.getFullYear(), m: d.getMonth() }; render(); } }, icon('chevron', 18, 2))),
    h('div', { class: 'mg', role: 'img', 'aria-label': 'Erfüllung pro Tag im ' + label }, cells),
    h('p', { class: 'month-note', text: plural(perfect, 'perfekter Tag', 'perfekte Tage') + ' in diesem Monat' }));
}

/* ---------- Einstellungen ---------- */

function screenSettings() {
  const st = session.status || {};
  const view = h('div', { class: 'view view-narrow', dataset: { screen: 'settings' } }, header('Einstellungen', 'Version ' + VERSION, null, isDesk() ? null : { back: hrefOf('start'), backLabel: 'Heute' }));
  view.append(section('Konto', h('div', { class: 'list' },
    h('div', { class: 'row' }, h('span', { class: 'row-icon' }, icon('person', 22)), h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: (session.user && session.user.email) || '' }), h('span', { class: 'row-meta', text: st.text || '' }))),
    store && store.mode === 'cloud' ? h('button', { type: 'button', class: 'row-btn sep', onclick: async () => { try { await store.signOut(); } catch (e) { toast('Abmelden fehlgeschlagen.'); } } }, h('span', { class: 'row-icon' }, icon('logout', 22)), h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: 'Abmelden' }))) : null)));

  const sw = (label, on, fn, disabled) => h('button', { type: 'button', class: 'switch', role: 'switch', 'aria-checked': on ? 'true' : 'false', 'aria-label': label, disabled: !!disabled, onclick: fn });
  const rowSw = (ic, title, meta, control, sep) => h('div', { class: 'row row-switch' + (sep ? ' sep' : '') }, h('span', { class: 'row-icon' }, icon(ic, 22)), h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: title }), h('span', { class: 'row-meta row-meta-wrap', text: meta })), control);
  const checkOn = LS.get('basis-check', 'on') !== 'off';
  const soundIsOn = FX.soundOn();
  const badge = badgeState();
  view.append(section('Heute', h('div', { class: 'list' },
    rowSw('sun', 'Morgen-Check', 'Zeigt beim ersten Öffnen am Tag, was ansteht', sw('Morgen-Check', checkOn, () => { LS.set('basis-check', checkOn ? 'off' : 'on'); render(); })),
    rowSw('sound', 'Töne', 'Ein Ton je Haken, ein Akkord, wenn der Tag geschafft ist', sw('Töne', soundIsOn, () => { FX.setSound(!soundIsOn); if (!soundIsOn) FX.ping(2); render(); }), true),
    rowSw('badge', 'Zahl am App-Symbol', badge.text, sw('Zahl am App-Symbol', badge.on, onBadgeToggle, !badge.can), true),
    h('button', { type: 'button', class: 'row-btn sep', onclick: () => { ui.check = true; render(); } }, h('span', { class: 'row-icon' }, icon('play', 22)), h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: 'Morgen-Check jetzt ansehen' }))))));

  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'sr-only', id: 'f-import', tabindex: '-1', onchange: onImportFile });
  view.append(section('Daten', h('div', { class: 'list' },
    h('button', { type: 'button', class: 'row-btn', onclick: onExport }, h('span', { class: 'row-icon' }, icon('download', 22)), h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: 'Sicherung herunterladen' }), h('span', { class: 'row-meta', text: 'Alle Daten als JSON-Datei' }))),
    h('label', { class: 'row-btn sep', for: 'f-import' }, h('span', { class: 'row-icon' }, icon('upload', 22)), h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: 'Sicherung einspielen' }), h('span', { class: 'row-meta', text: 'Ersetzt alle aktuellen Daten' })), fileInput),
    store && store.mode === 'cloud' ? h('button', { type: 'button', class: 'row-btn sep', onclick: onMigrate, disabled: !!ui.migrating }, h('span', { class: 'row-icon' }, icon('import', 22)), h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: ui.migrating ? 'Übernehme …' : 'Alte Widget-Daten übernehmen' }), h('span', { class: 'row-meta', text: D.meta && D.meta.app && D.meta.app.legacyImportedAt ? 'Bereits übernommen am ' + new Date(D.meta.app.legacyImportedAt).toLocaleDateString('de-AT') : 'Habits mit Verlauf und To-Dos aus den Notion-Widgets' }))) : null)));

  view.append(section('Als App nutzen', h('div', { class: 'list' },
    h('div', { class: 'row' }, h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: 'iPhone' }), h('span', { class: 'row-meta row-meta-wrap', text: 'In Safari öffnen → Teilen → „Zum Home-Bildschirm“ → „Als Web-App öffnen“ eingeschaltet lassen → Hinzufügen.' }))),
    h('div', { class: 'row sep' }, h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: 'Opera-Startseite' }), h('span', { class: 'row-meta row-meta-wrap', text: 'Opera-Menü → Einstellungen → Grundeinstellungen → „Beim Starten“ → „Eine bestimmte Seite, oder bestimmte Seiten öffnen“ → diese Adresse eintragen.' }))))));
  return view;
}

// Zahl am App-Symbol: am iPhone nur für die App am Home-Bildschirm und erst nach Erlaubnis.
function badgeState() {
  const can = 'setAppBadge' in navigator;
  if (!can) return { can: false, on: false, text: 'Hier nicht verfügbar. Am iPhone geht es, sobald Basis am Home-Bildschirm liegt.' };
  const perm = typeof Notification !== 'undefined' ? Notification.permission : 'granted';
  const want = LS.get('basis-badge', 'on') !== 'off';
  if (perm === 'denied') return { can: false, on: false, text: 'Mitteilungen sind für Basis gesperrt. In den Geräte-Einstellungen erlauben.' };
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (perm === 'default' && standalone) return { can: true, on: false, ask: true, text: 'Einschalten und Mitteilungen erlauben – Basis schickt keine, das iPhone braucht die Erlaubnis für die Zahl.' };
  return { can: true, on: want, text: want ? 'Zeigt die offenen Aufgaben von heute. Aktualisiert sich bei jedem Öffnen.' : 'Ausgeschaltet' };
}
async function onBadgeToggle() {
  const b = badgeState();
  if (b.ask) {
    try { await Notification.requestPermission(); } catch (e) { /* abgelehnt */ }
    LS.set('basis-badge', 'on');
  } else {
    LS.set('basis-badge', b.on ? 'off' : 'on');
  }
  badgeShown = -1;
  render();
}

function onExport() {
  try {
    const json = store.exportAll();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: 'basis-sicherung-' + dateKey() + '.json' });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Sicherung gespeichert');
  } catch (e) { toast('Sicherung fehlgeschlagen.'); }
}

function onImportFile(e) {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) { toast('Die Datei ist zu groß.'); return; }
  const r = new FileReader();
  r.onload = async () => {
    let json;
    try { json = JSON.parse(String(r.result)); } catch (err) { toast('Die Datei ist kein gültiges JSON.'); return; }
    if (!window.confirm('Sicherung einspielen? Alle aktuellen Daten werden ersetzt.')) return;
    try { await store.importAll(json); toast('Sicherung eingespielt'); } catch (err) { toast(err && err.message ? err.message : 'Einspielen fehlgeschlagen.'); }
  };
  r.onerror = () => toast('Die Datei konnte nicht gelesen werden.');
  r.readAsText(f);
}

async function onMigrate() {
  if (ui.migrating) return;
  const done = D.meta && D.meta.app && D.meta.app.legacyImportedAt;
  if (done && !window.confirm('Die alten Widget-Daten wurden schon am ' + new Date(done).toLocaleDateString('de-AT') + ' übernommen. Nochmal übernehmen?\n\nVorhandene Einträge bleiben unverändert. Was du in Basis gelöscht hast, kommt aber zurück.')) return;
  ui.migrating = true;
  render();
  try {
    const c = await store.migrateLegacy();
    toast(c.habits + c.days + c.todos === 0 ? 'Nichts Neues – alles war schon übernommen.'
      : 'Übernommen: ' + plural(c.habits, 'Habit', 'Habits') + ', ' + plural(c.days, 'Tag', 'Tage') + ' Verlauf, ' + plural(c.todos, 'To-Do', 'To-Dos'));
  } catch (e) {
    const code = String((e && (e.code || e.message)) || '');
    toast(/legacy\/empty/.test(code) ? 'Keine alten Widget-Daten gefunden.'
      : /permission|denied/i.test(code) ? 'Alte Daten nicht erreichbar – der alte Pfad ist schon gesperrt.'
      : 'Übernahme fehlgeschlagen. Prüfe deine Verbindung und versuche es erneut.');
  }
  ui.migrating = false;
  render();
}

/* ---------------- Toast ---------------- */

let toastTimer = 0;
function toast(msg, undo) {
  const t = $('#toast');
  if (!t) return;
  clearTimeout(toastTimer);
  t.replaceChildren(h('span', { class: 'toast-text', text: msg }));
  if (undo) t.append(h('button', { type: 'button', class: 'toast-btn', onclick: () => { clearTimeout(toastTimer); t.classList.remove('is-open'); undo(); }, text: 'Rückgängig' }));
  t.classList.add('is-open');
  toastTimer = setTimeout(() => t.classList.remove('is-open'), undo ? 6000 : 3200);
}

/* ---------------- Start ---------------- */

function onData(snap, status) {
  D = snap || emptyData();
  session.status = status || session.status;
  session.loaded = true;
  settlePending();
  scheduleRender();
}

let unsub = null;
async function boot() {
  registerSW();
  window.addEventListener('hashchange', onRoute);
  ui.route = parseHash();
  const onMq = () => { lastScreenKey = ''; render(); };
  if (MQ_DESK.addEventListener) MQ_DESK.addEventListener('change', onMq); else MQ_DESK.addListener(onMq);
  window.addEventListener('online', () => { if (store && store.status) { session.status = store.status(); scheduleRender(); } });
  window.addEventListener('offline', () => { if (store && store.status) { session.status = store.status(); scheduleRender(); } });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    if (ui.party) { e.preventDefault(); closeParty(); return; }
    if (ui.check) { e.preventDefault(); closeCheck(); return; }
    if (ui.route.view === 'map' && ui.route.id) { e.preventDefault(); closePanel(); }
  });
  // Neuer Tag (Mitternacht oder App kommt morgens aus dem Hintergrund): neu aufbauen, Morgen-Check zeigen.
  const dayTick = () => { if (session.phase === 'app' && dayShown && dayShown !== dateKey()) { ui.snoozed = false; ui.showAllRest = false; render(); } };
  setInterval(dayTick, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') dayTick(); });
  window.addEventListener('pageshow', dayTick);
  $('#scrim').addEventListener('click', closePanel);
  render();
  try {
    store = await createStore({ demo: DEMO });
  } catch (e) {
    console.error(e);
    session.phase = 'error';
    session.error = 'Die App konnte keine Verbindung zu Firebase aufbauen. Prüfe dein Internet und versuche es erneut.';
    render();
    return;
  }
  if (DEMO) document.documentElement.classList.add('is-demo');
  store.onAuth((user) => {
    session.user = user;
    session.loaded = false;
    recSig = '';
    badgeShown = -1;
    if (unsub) { unsub(); unsub = null; }
    if (user) {
      session.phase = 'app';
      session.status = store.status ? store.status() : session.status;
      unsub = store.subscribe(onData, user.uid);
      keepStorage();
    } else {
      session.phase = 'login';
      D = emptyData();
      lastScreenKey = '';
      ui.check = false; ui.party = null; ui.snoozed = false;
      ui.pending.clear(); ui.committed.clear();
    }
    render();
  });
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  let wantReload = false;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    if (!reg) return;
    const ask = (w) => {
      toast('Neue Version verfügbar', null);
      const t = $('#toast');
      t.append(h('button', { type: 'button', class: 'toast-btn', onclick: () => { wantReload = true; w.postMessage('skipWaiting'); }, text: 'Neu laden' }));
      clearTimeout(toastTimer);
    };
    if (reg.waiting && navigator.serviceWorker.controller) ask(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) ask(w); });
    });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch((e) => console.warn('Service Worker nicht registriert', e));
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!wantReload) return; wantReload = false; location.reload(); });
}

boot();
