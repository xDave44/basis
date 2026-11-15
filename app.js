// Basis – persönliche Zentrale (PWA)
import { createStore, newId } from './store.js';

if (window.top !== window.self) {
  document.documentElement.textContent = '';
  throw new Error('Basis darf nicht in fremde Seiten eingebettet werden.');
}

const VERSION = '1.0.1';
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
  map: [['rect', 3.5, 4, 7.5, 6.5, 1.75], ['rect', 13, 13.5, 7.5, 6.5, 1.75], 'M11 7.25h2.25A2.75 2.75 0 0 1 16 10v3.5'],
  doc: ['M6.5 3.5h7l4 4v13h-11z', 'M13.5 3.5v4h4', 'M9.5 12.5h5M9.5 16h5'],
  file: ['M6.5 3.5h7l4 4v13h-11z', 'M13.5 3.5v4h4'],
  sheet: [['rect', 4, 4, 16, 16, 2.5], 'M4 9.5h16M4 14.75h16M10 9.5V20'],
  folder: ['M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z'],
  link: ['M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1', 'M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1'],
  person: [['circle', 12, 8, 3.75], 'M4.5 20.5c1.4-3.8 4.2-5.75 7.5-5.75s6.1 1.95 7.5 5.75'],
  bag: [['rect', 3.5, 7, 17, 13, 2.5], 'M9 7V5.75C9 4.78 9.78 4 10.75 4h2.5c.97 0 1.75.78 1.75 1.75V7', 'M3.5 12.5h17'],
  stack: [['rect', 4, 9, 16, 11, 2.5], 'M6.5 6h11', 'M8.5 3.25h7'],
  habit: ['M17 2.5l3 3-3 3', 'M4 11V9.5a4 4 0 0 1 4-4h12', 'M7 21.5l-3-3 3-3', 'M20 13v1.5a4 4 0 0 1-4 4H4'],
  plus: ['M12 5v14M5 12h14'],
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
    ['rect', { width: 1024, height: 1024, fill: '#1D1D22' }],
    ['rect', { x: 196, y: 196, width: 440, height: 440, rx: 112, fill: '#FF8C42', transform: 'rotate(-9 416 416)' }],
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

/* ---------------- Zustand ---------------- */

let store = null;
let D = emptyData();
const session = { phase: 'boot', user: null, error: '', status: { kind: 'pending', text: 'Verbinde …' } };
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
function importantTodos() {
  return todosList().filter((t) => !t.done && D_ctxExists(t.ctx) && (t.prio === 'hoch' || (isKey(t.due) && dayDiff(t.due) <= 0))).sort((a, b) => {
    const oa = isKey(a.due) && dayDiff(a.due) <= 0 ? 0 : 1;
    const ob = isKey(b.due) && dayDiff(b.due) <= 0 ? 0 : 1;
    return (oa - ob) || sortOpen(a, b);
  });
}
function D_ctxExists(ctx) {
  const [type, id] = String(ctx || '').split(':');
  return (type === 'area' && !!D.areas[id]) || (type === 'idea' && !!D.ideas[id]);
}
const openCount = (ctx) => todosFor(ctx).filter((t) => !t.done).length;

// Habits
const habitDone = (hid, key) => { const l = D.habitLog[key]; return !!(l && Array.isArray(l.ids) && l.ids.indexOf(hid) >= 0); };
function habitStreak(hid) {
  const d = new Date();
  if (!habitDone(hid, dateKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (habitDone(hid, dateKey(d)) && n < 3650) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function dayRatio(key, list) {
  if (!list.length) return 0;
  const l = D.habitLog[key];
  const ids = l && Array.isArray(l.ids) ? l.ids : [];
  return list.filter((x) => ids.indexOf(x.id) >= 0).length / list.length;
}
function perfectWeeks(list) {
  if (!list.length) return 0;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const monday = new Date(t);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - 7);
  let weeks = 0;
  for (let guard = 0; guard < 520; guard++) {
    let ok = true;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      if (dayRatio(dateKey(d), list) < 1) { ok = false; break; }
    }
    if (!ok) break;
    weeks++;
    monday.setDate(monday.getDate() - 7);
  }
  return weeks;
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
function scheduleRender() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => { rafId = 0; render(); });
}

function render() {
  if (drag && drag.active) { deferredRender = true; return; }
  const a = document.activeElement;
  const key = a && a.dataset ? a.dataset.key : null;
  let sel = null;
  try { sel = key && typeof a.selectionStart === 'number' ? [a.selectionStart, a.selectionEnd] : null; } catch (e) { sel = null; }
  if (session.phase !== 'app') renderGate();
  else renderApp();
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
    h('button', { type: 'button', class: 'btn btn-plain', onclick: onReset, text: 'Passwort vergessen?' }));
  g.replaceChildren(form);
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
  renderSidebar();
  renderTabbar();
  renderScreen();
  renderPanel();
}

/* ---------- Navigation ---------- */

function navLink(view, label, ic, count, id) {
  const r = ui.route;
  const active = r.view === view && (view !== 'area' || r.id === id);
  return h('a', { class: 'nav-item' + (active ? ' is-active' : ''), href: hrefOf(view, id), 'aria-current': active ? 'page' : null },
    h('span', { class: 'nav-icon' }, icon(ic, 20)),
    h('span', { class: 'nav-label', text: label }),
    count !== '' && count != null ? h('span', { class: 'nav-count', text: String(count) }) : null);
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
      navLink('start', 'Start', 'home', importantTodos().length),
      navLink('map', 'Business-Map', 'map', ideasList().reduce((n, p) => n + openCount('idea:' + p.id), 0)),
      navLink('habits', 'Habits', 'habit', hl.length ? doneToday + '/' + hl.length : ''),
      navLink('docs', 'Dokumente', 'doc', docsList().length)),
    h('h2', { class: 'side-label', text: 'Bereiche' }),
    h('nav', { class: 'side-nav', 'aria-label': 'Bereiche' },
      areas.map((a) => navLink('area', a.title, a.icon || 'folder', openCount('area:' + a.id), a.id)),
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

const TABS = [['start', 'Start', 'home'], ['map', 'Ideen', 'map'], ['areas', 'Bereiche', 'stack'], ['habits', 'Habits', 'habit'], ['docs', 'Dokumente', 'doc']];
function renderTabbar() {
  const tb = $('#tabbar');
  if (!tb.dataset.built) {
    tb.dataset.built = '1';
    tb.append(h('span', { class: 'tab-lens', 'aria-hidden': 'true' }));
    TABS.forEach((t) => tb.append(h('a', { class: 'tab', href: hrefOf(t[0]), dataset: { tab: t[0] } }, icon(t[2], 24), h('span', { text: t[1] }))));
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

/* ---------- Start ---------- */

function screenStart() {
  const imp = importantTodos();
  const todayN = imp.filter((t) => isKey(t.due) && dayDiff(t.due) === 0).length;
  const overdueN = imp.filter((t) => isKey(t.due) && dayDiff(t.due) < 0).length;
  let dl = '';
  try { dl = new Date().toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { dl = dateKey(); }
  const subParts = [];
  subParts.push(imp.length ? (imp.length === 1 ? '1 wichtiges To-Do offen' : imp.length + ' wichtige To-Dos offen') : 'Alles Wichtige ist erledigt');
  if (todayN) subParts.push(todayN + ' davon heute');
  if (overdueN) subParts.push(overdueN + ' überfällig');
  const gear = isDesk() ? null : h('a', { class: 'icon-btn', href: hrefOf('settings'), 'aria-label': 'Einstellungen' }, icon('gear', 20));
  const head = isDesk() ? header(dl, subParts.join(', ')) : header('Heute', dl, gear);

  const impList = h('div', { class: 'list' }, imp.map((t, i) => todoRow(t, { meta: ctxName(t.ctx), index: i, showCtxLink: true })));
  if (!imp.length) impList.append(h('p', { class: 'empty', text: 'Nichts Dringendes. Neue To-Dos landen hier, wenn sie wichtig oder fällig sind.' }));

  const left = h('div', { class: 'col col-main' },
    addBar('add-start', { selectCtx: true, placeholder: 'Neues To-Do …' }),
    section('Wichtig', impList, { aside: isDesk() ? null : subParts.slice(1).join(' · ') || null }));

  const right = h('div', { class: 'col col-side' });
  const hl = habitsList();
  if (hl.length) {
    const today = dateKey();
    const n = hl.filter((x) => habitDone(x.id, today)).length;
    right.append(section('Habits heute', h('div', { class: 'list' }, hl.map((x, i) => habitQuickRow(x, i)), h('a', { class: 'row-btn row-link', href: hrefOf('habits') }, h('span', { text: 'Alle Habits' }), h('span', { class: 'row-trail' }, icon('chevron', 16, 2)))), { aside: n + ' von ' + hl.length }));
  }
  const pins = docsList().filter((d) => d.pin);
  right.append(section('Schnellzugriff', h('div', { class: 'list' }, pins.map((d, i) => docRow(d, i, { compact: true })), h('a', { class: 'row-btn row-link', href: hrefOf('docs') }, h('span', { text: 'Alle Dokumente' }), h('span', { class: 'row-count', text: String(docsList().length) }), h('span', { class: 'row-trail' }, icon('chevron', 16, 2))))));
  const steps = ideasList().map((p) => ({ p: p, t: todosFor('idea:' + p.id).filter((t) => !t.done).sort(sortOpen)[0] })).filter((x) => x.t);
  if (steps.length) {
    right.append(section('Nächste Schritte', h('div', { class: 'list' }, steps.map((x, i) => h('a', { class: 'row-btn step' + (i ? ' sep' : ''), href: hrefOf('map', x.p.id) },
      h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: x.t.t }), h('span', { class: 'row-meta', style: { color: TONE[x.p.status] || 'var(--text-3)' }, text: x.p.name })),
      h('span', { class: 'row-trail' }, icon('chevron', 16, 2)))))));
  }
  const st = session.status || {};
  const notice = st.kind === 'error' ? h('div', { class: 'notice', role: 'alert' }, icon('cloudOff', 20), h('span', { text: st.text + (st.keep ? '. Deine Änderungen bleiben auf diesem Gerät gespeichert.' : '.') })) : null;
  return h('div', { class: 'view view-start', dataset: { screen: 'start' } }, head, notice, h('div', { class: 'cols' }, left, right));
}

function habitQuickRow(x, i) {
  const key = dateKey();
  const done = habitDone(x.id, key);
  const s = habitStreak(x.id);
  return h('div', { class: 'row' + (i ? ' sep' : '') + (done ? ' is-done-habit' : '') },
    checkBtn(done, (done ? 'Rückgängig: ' : 'Erledigt: ') + x.name, (btn) => toggleHabit(x.id, key, btn)),
    h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: x.name }), h('span', { class: 'row-meta', text: s ? plural(s, 'Tag in Folge', 'Tage in Folge') : 'Heute noch offen' })));
}

/* ---------- To-Dos ---------- */

function checkBtn(on, label, onclick, opts) {
  return h('button', { type: 'button', class: 'check' + (on ? ' is-on' : '') + (opts && opts.hi ? ' is-hi' : ''), 'aria-label': label, 'aria-pressed': on ? 'true' : 'false', onclick: (e) => onclick(e.currentTarget) },
    h('span', { class: 'check-ring' }, icon('check', 13, 3.4)));
}

function todoRow(t, opts) {
  const o = opts || {};
  if (ui.edit === t.id) return todoEditor(t, o);
  const pend = ui.pending.has(t.id);
  const done = !!t.done;
  const info = dueInfo(t.due);
  const metaParts = [];
  if (o.meta) metaParts.push(o.meta);
  if (t.tag) metaParts.push(t.tag);
  if (done && t.doneAt) metaParts.push('erledigt ' + fmtDay(new Date(t.doneAt)));
  return h('div', { class: 'row todo' + (o.index ? ' sep' : '') + (pend ? ' is-checking' : '') + (done ? ' is-done' : ''), dataset: { id: t.id } },
    checkBtn(done || pend, (done ? 'Wieder öffnen: ' : 'Als erledigt markieren: ') + t.t, (btn) => toggleTodo(t, btn), { hi: t.prio === 'hoch' }),
    h('button', { type: 'button', class: 'row-text row-edit', 'aria-label': 'Bearbeiten: ' + t.t, onclick: () => { ui.edit = t.id; ui.drafts['edit-t-' + t.id] = t.t; ui.drafts['edit-due-' + t.id] = t.due || ''; ui.drafts['edit-prio-' + t.id] = t.prio || 'mittel'; render(); focusLater('[data-key="edit-t-' + CSS.escape(t.id) + '"]'); } },
      h('span', { class: 'row-title-text', text: t.t }),
      metaParts.length ? h('span', { class: 'row-meta', text: metaParts.join(' · ') }) : null),
    info && !done ? h('span', { class: 'due' + (info.tone ? ' due-' + info.tone : ''), text: info.label }) : null);
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
    ui.drafts[kd] = '';
    ui.drafts[kp] = 'mittel';
    save((s) => s.put('todos', newId('t'), { t: title, ctx: ctx, due: due, prio: prio, tag: '', done: false, doneAt: null, createdAt: Date.now() }));
    render();
    focusLater('[data-key="' + key + '"]');
  };
  return h('form', { class: 'addbar', onsubmit: submit },
    h('div', { class: 'addbar-main' },
      h('label', { class: 'sr-only', for: 'f-' + key, text: 'Neues To-Do' }),
      h('input', { id: 'f-' + key, class: 'input', type: 'text', maxlength: 140, autocomplete: 'off', enterkeyhint: 'done', placeholder: o.placeholder || 'Neues To-Do …', 'data-key': key, value: ui.drafts[key] || '', oninput: draftInput }),
      h('button', { type: 'submit', class: 'icon-btn icon-btn-accent icon-btn-lg', 'aria-label': 'To-Do hinzufügen' }, icon('plus', 20, 2.4))),
    h('div', { class: 'addbar-opts' },
      o.selectCtx && targets.length ? h('label', { class: 'pill-field' }, h('span', { class: 'sr-only', text: 'Ziel' }),
        h('select', { class: 'pill-input', 'data-key': kc, onchange: draftInput }, targets.map((t) => h('option', { value: t[0], selected: t[0] === ui.drafts[kc], text: t[1] })))) : null,
      dateField(kd, 'Fällig am'),
      prioField(kp)));
}

function toggleTodo(t, btn) {
  if (t.done) {
    save((s) => s.patch('todos', t.id, { done: false, doneAt: null }));
    return;
  }
  if (ui.pending.has(t.id)) {
    ui.pending.delete(t.id);
    const row = btn && btn.closest('.row');
    if (row) row.classList.remove('is-checking');
    if (btn) { btn.classList.remove('is-on'); btn.setAttribute('aria-pressed', 'false'); }
    return;
  }
  ui.pending.add(t.id);
  const row = btn && btn.closest('.row');
  if (row) row.classList.add('is-checking');
  if (btn) { btn.classList.add('is-on'); btn.setAttribute('aria-pressed', 'true'); }
  setTimeout(() => {
    if (!ui.pending.has(t.id)) return;
    ui.pending.delete(t.id);
    save((s) => s.patch('todos', t.id, { done: true, doneAt: Date.now() }));
    scheduleRender();
  }, reduced() ? 150 : 560);
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
    h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: a.title })),
    h('span', { class: 'row-count', text: String(openCount('area:' + a.id)) }),
    h('span', { class: 'row-trail' }, icon('chevron', 16, 2)))), areaAdder('list'));
  return h('div', { class: 'view', dataset: { screen: 'areas' } }, header('Bereiche', plural(areas.length, 'Bereich', 'Bereiche') + ' · ' + total + ' offen'), list);
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

function screenMap() {
  const mode = isDesk() ? 'd' : 'm';
  const geo = geometry(mode);
  const byId = {};
  geo.forEach((g) => { byId[g.id] = g; });
  const openId = ui.route.id;
  const total = geo.reduce((n, g) => n + openCount('idea:' + g.id), 0);
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

  const sub = plural(geo.length, 'Idee', 'Ideen') + ' · ' + (total === 1 ? '1 offenes To-Do' : total + ' offene To-Dos') + (isDesk() ? ' · Karten lassen sich frei verschieben' : ' · halten und ziehen zum Ordnen');
  const newBtn = isDesk()
    ? h('button', { type: 'button', class: 'btn btn-primary', onclick: newIdea }, icon('plus', 18, 2.2), h('span', { text: 'Neue Idee' }))
    : h('button', { type: 'button', class: 'icon-btn icon-btn-accent icon-btn-lg', 'aria-label': 'Neue Idee', onclick: newIdea }, icon('plus', 20, 2.4));
  return h('div', { class: 'view view-map', dataset: { screen: 'map' } },
    header(isDesk() ? 'Business-Map' : 'Ideen', sub, newBtn),
    h('div', { class: 'board-wrap' }, board));
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
  h('span', { class: 'card-count', text: list.length ? (open.length ? open.length + ' offen' + (doneN ? ' · ' + doneN + ' erledigt' : '') : 'Alles erledigt') : 'Noch keine To-Dos' }));
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
      if (popId) { const c = $('.card[data-id="' + CSS.escape(popId) + '"]'); popId = null; anim(c, [{ opacity: 0, transform: 'scale(.86)' }, { opacity: 1, transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' }); }
    });
  } else if (open && focusAfterOpen) {
    requestAnimationFrame(() => { const t = $(focusAfterOpen, panel); focusAfterOpen = null; if (t) { try { t.focus({ preventScroll: true }); } catch (e) { /* ok */ } } });
  }
  if (!open && wasOpen) {
    const bf = backFocus; backFocus = null;
    if (bf && bf.isConnected) { try { bf.focus({ preventScroll: true }); } catch (e) { /* ok */ } }
    else if (ui.route.view === 'map' && panel.dataset.for) { const c = $('.card[data-id="' + CSS.escape(panel.dataset.for) + '"]'); if (c) { try { c.focus({ preventScroll: true }); } catch (e) { /* ok */ } } }
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
      h('p', { class: 'idea-progress', text: list.length ? done.length + ' von ' + list.length + ' erledigt' : 'Noch keine To-Dos' }));
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

function toggleHabit(hid, key, btn) {
  const on = !habitDone(hid, key);
  if (btn) { btn.classList.toggle('is-on', on); btn.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  save((s) => s.toggle('habitLog', key, 'ids', hid, on));
}

function screenHabits() {
  const list = habitsList();
  const today = dateKey();
  const n = list.filter((x) => habitDone(x.id, today)).length;
  const pw = perfectWeeks(list);
  const sub = list.length ? 'Heute ' + n + ' von ' + list.length + (pw ? ' · ' + plural(pw, 'perfekte Woche', 'perfekte Wochen') + ' in Folge' : '') : 'Tägliche Gewohnheiten abhaken';
  const view = h('div', { class: 'view view-narrow', dataset: { screen: 'habits' } }, header('Habits', sub));
  view.append(h('form', { class: 'addbar addbar-single', onsubmit: (e) => {
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
    h('button', { type: 'submit', class: 'icon-btn icon-btn-accent icon-btn-lg', 'aria-label': 'Habit hinzufügen' }, icon('plus', 20, 2.4)))));
  if (!list.length) {
    view.append(h('div', { class: 'empty-card' },
      h('p', { class: 'empty', text: 'Noch keine Habits. Leg oben einen an oder übernimm deine bisherigen aus dem alten Widget.' }),
      h('a', { class: 'btn btn-ghost', href: hrefOf('settings'), text: 'Zu den Einstellungen' })));
    return view;
  }
  view.append(section('Heute', h('div', { class: 'list' }, list.map((x, i) => habitRow(x, i)))));
  view.append(section('Monatsübersicht', monthGrid(list)));
  return view;
}

function habitRow(x, i) {
  const today = dateKey();
  const done = habitDone(x.id, today);
  const s = habitStreak(x.id);
  const menuKey = 'habit:' + x.id;
  const days = [];
  for (let k = 6; k >= 0; k--) {
    const d = new Date(); d.setDate(d.getDate() - k);
    const key = dateKey(d);
    const on = habitDone(x.id, key);
    days.push(h('button', { type: 'button', class: 'day' + (on ? ' is-on' : '') + (k === 0 ? ' is-today' : ''), 'aria-pressed': on ? 'true' : 'false', 'aria-label': x.name + ', ' + d.toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long' }) + (on ? ', erledigt' : ', offen'), onclick: (e) => toggleHabit(x.id, key, e.currentTarget) },
      h('span', { class: 'day-label', text: WD[d.getDay()] })));
  }
  const row = h('div', { class: 'row habit-row' + (i ? ' sep' : '') },
    checkBtn(done, (done ? 'Rückgängig: ' : 'Erledigt: ') + x.name, (btn) => toggleHabit(x.id, today, btn)),
    h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: x.name }), h('span', { class: 'row-meta', text: s ? plural(s, 'Tag in Folge', 'Tage in Folge') : 'Noch keine Serie' })),
    h('div', { class: 'week', role: 'group', 'aria-label': 'Letzte 7 Tage, zum Nachtragen antippen' }, days),
    h('button', { type: 'button', class: 'icon-btn icon-btn-quiet', 'aria-label': 'Aktionen für ' + x.name, 'aria-expanded': ui.menu === menuKey ? 'true' : 'false', onclick: () => { ui.menu = ui.menu === menuKey ? null : menuKey; ui.drafts['habit-rename'] = x.name; render(); } }, icon('more', 18)));
  if (ui.menu !== menuKey) return row;
  return h('div', { class: 'habit-wrap' + (i ? ' sep' : '') }, row, h('form', { class: 'row-menu row-menu-form', onsubmit: (e) => {
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

function deleteHabit(x) {
  const copy = Object.assign({}, D.habits[x.id]);
  save((s) => s.remove('habits', x.id));
  render();
  toast('Habit gelöscht', () => save((s) => s.put('habits', x.id, copy)));
}

function monthGrid(list) {
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
    const r = future ? 0 : dayRatio(k, list);
    if (!future && r === 1) perfect++;
    cells.push(h('span', { class: 'mg-cell' + (k === todayKey ? ' is-today' : '') + (future ? ' is-future' : '') + (r >= 0.75 ? ' is-full' : ''), style: { '--r': String(r) }, title: d + '. – ' + Math.round(r * 100) + ' %', 'aria-label': d + '.: ' + (future ? 'noch offen' : Math.round(r * 100) + ' Prozent') }, h('span', { text: String(d) })));
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
  const view = h('div', { class: 'view view-narrow', dataset: { screen: 'settings' } }, header('Einstellungen', 'Version ' + VERSION, null, isDesk() ? null : { back: hrefOf('start'), backLabel: 'Start' }));
  view.append(section('Konto', h('div', { class: 'list' },
    h('div', { class: 'row' }, h('span', { class: 'row-icon' }, icon('person', 22)), h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: (session.user && session.user.email) || '' }), h('span', { class: 'row-meta', text: st.text || '' }))),
    store && store.mode === 'cloud' ? h('button', { type: 'button', class: 'row-btn sep', onclick: async () => { try { await store.signOut(); } catch (e) { toast('Abmelden fehlgeschlagen.'); } } }, h('span', { class: 'row-icon' }, icon('logout', 22)), h('span', { class: 'row-text' }, h('span', { class: 'row-title-text', text: 'Abmelden' }))) : null)));

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
    if (e.key === 'Escape' && ui.route.view === 'map' && ui.route.id && !e.defaultPrevented) { e.preventDefault(); closePanel(); }
  });
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
    if (unsub) { unsub(); unsub = null; }
    if (user) {
      session.phase = 'app';
      session.status = store.status ? store.status() : session.status;
      unsub = store.subscribe(onData, user.uid);
    } else {
      session.phase = 'login';
      D = emptyData();
      lastScreenKey = '';
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
