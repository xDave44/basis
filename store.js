// Basis – Datenschicht
// Cloud: Firebase Auth (E-Mail/Passwort) + Firestore mit Offline-Speicher.
// Lokal: Demo-Modus (?demo=1), Daten nur in diesem Browser.

// Firebase-Projekt „basis“ (Anmeldung + Firestore).
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyD42EF40rpOc0t0sv7Kq3KQtRrhqJ7KeEU',
  authDomain: 'basis-99824.firebaseapp.com',
  projectId: 'basis-99824',
  storageBucket: 'basis-99824.firebasestorage.app',
  messagingSenderId: '999530712914',
  appId: '1:999530712914:web:e1fbbf1b28edcb8f86348b'
};

// Altes Projekt der Notion-Widgets (Realtime Database). Wird nur für die Übernahme gelesen.
const LEGACY_CONFIG = {
  apiKey: 'AIzaSyAot00pxNmylzEI-tBRsPpak5YwI-BbbuA',
  projectId: 'notion-widgets-14888',
  databaseURL: 'https://notion-widgets-14888-default-rtdb.europe-west1.firebasedatabase.app',
  appId: '1:537954094678:web:34a6ffeb4766a73d96f5f7'
};
// Die Widgets haben je nach Stand an zwei Orten gespeichert. Beide werden gelesen und zusammengeführt.
const LEGACY_SOURCES = [
  { habits: 'habits/main', todos: 'todos/main' },
  { habits: 'u/r_1UVQoGwOhcZI73X6LLNR1ZYwZ3CJ9N/habits', todos: 'u/r_1UVQoGwOhcZI73X6LLNR1ZYwZ3CJ9N/todos' }
];

// Führt mehrere Widget-Stände zusammen: Habits und To-Dos je ID nur einmal, Verlauf je Tag vereint.
function mergeLegacy(sources) {
  const H = { habits: [], history: {} };
  const T = { todos: [] };
  const seenH = {};
  const seenT = {};
  sources.forEach((s) => {
    listOf(s.H && s.H.habits).forEach((h) => {
      if (!h || !h.id || seenH[h.id]) return;
      seenH[h.id] = true;
      H.habits.push(h);
    });
    const hist = (s.H && s.H.history) || {};
    Object.keys(hist).forEach((k) => { H.history[k] = (H.history[k] || []).concat(listOf(hist[k])); });
    listOf(s.T && s.T.todos).forEach((t) => {
      const k = t && (t.id || String(t.createdAt || '') + '|' + t.title);
      if (!t || !k || seenT[k]) return;
      seenT[k] = true;
      T.todos.push(t);
    });
  });
  return { H: H, T: T };
}

const SDK = 'https://www.gstatic.com/firebasejs/13.2.0/';

export const COLLS = ['todos', 'ideas', 'links', 'areas', 'docs', 'habits', 'habitLog', 'meta'];
const LOCAL_KEY = 'basis-demo-v1';

export function newId(prefix) {
  let r = '';
  try { r = crypto.randomUUID().replace(/-/g, '').slice(0, 16); } catch (e) { r = Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
  return (prefix || '') + r;
}

const emptyData = () => {
  const d = {};
  COLLS.forEach((c) => { d[c] = {}; });
  return d;
};

export function seedData() {
  const now = Date.now();
  const d = emptyData();
  d.areas = {
    privat: { title: 'Privat', icon: 'person', order: 0, createdAt: now },
    arbeit: { title: 'Arbeit', icon: 'bag', order: 1, createdAt: now + 1 }
  };
  d.ideas = {
    wf: { name: 'wettfakten.com', desc: 'Wettanbieter-Vergleich für Deutschland, Österreich und die Schweiz', status: 'Im Aufbau', big: true, createdAt: now, pos: { d: { x: 36, y: 36 }, m: { x: 14, y: 16 } } },
    fl: { name: 'Freelance & Profile', desc: 'Fiverr, Freelancermap und david-reicht.at', status: 'Laufend', big: false, createdAt: now + 1, pos: { d: { x: 430, y: 40 }, m: { x: 192, y: 214 } } },
    web: { name: 'Website-Pakete', desc: 'Websites für lokale Betriebe ab 1.490 €', status: 'Akquise', big: false, createdAt: now + 2, pos: { d: { x: 770, y: 170 }, m: { x: 190, y: 398 } } },
    tk: { name: 'Textkompass', desc: 'Günstige Alternative zu SurferSEO', status: 'Idee', big: false, createdAt: now + 3, pos: { d: { x: 450, y: 330 }, m: { x: 18, y: 296 } } },
    kd: { name: 'ki-detektor.com', desc: 'KI-Text-Erkennung für den DACH-Raum', status: 'Pausiert', big: false, createdAt: now + 4, pos: { d: { x: 100, y: 372 }, m: { x: 22, y: 448 } } }
  };
  d.links = {
    'tk|wf': { a: 'tk', b: 'wf' },
    'kd|tk': { a: 'kd', b: 'tk' },
    'fl|web': { a: 'fl', b: 'web' }
  };
  d.docs = {
    d1: { title: 'Budget 2026', kind: 'sheet', group: 'Finanzen', pin: true, order: 0, url: 'https://docs.google.com/spreadsheets/d/1gZADYSkZc75E0K27mFp5ZCiX1VnH-2NOTkSWy-zINjE/edit' },
    d2: { title: 'Buchhaltung 2026', note: 'Stand 31. Oktober', kind: 'sheet', group: 'Finanzen', pin: true, order: 1, url: 'https://docs.google.com/spreadsheets/d/1ezYXb7ux4hUxeLPNrGnW0qifDtYN5bagc4V7TbAlmHA/edit' },
    d3: { title: 'Ordner Buchhaltung', kind: 'folder', group: 'Finanzen', pin: false, order: 2, url: 'https://drive.google.com/drive/folders/1tvQ0XvJxu1hm766gyOif9W96UxPob6zu' },
    d4: { title: 'Buchhaltung Selbständigkeit 2025', kind: 'file', group: 'Finanzen', pin: false, order: 3, url: 'https://drive.google.com/file/d/1dwV2lFuRt_RC5Yt5du1OTgn39ts9smVc/view' },
    d5: { title: 'Buchmacher-Datenbank', note: 'wettfakten.com', kind: 'sheet', group: 'Projekte', pin: false, order: 4, url: 'https://docs.google.com/spreadsheets/d/12S7i4w-n9bTntBTsfRHu9GfRxDIy2bmWlB4jmXcazZk/edit' }
  };
  d.meta = { app: { seeded: now, v: 1 } };
  return d;
}

const clone = (o) => JSON.parse(JSON.stringify(o));
const safeId = (s) => String(s == null ? '' : s).replace(/[\/\s]+/g, '-').replace(/^\.+/, '').slice(0, 120) || newId('x');
const isDateKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const listOf = (v) => (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v) : []));

function deepMerge(target, src) {
  Object.keys(src).forEach((k) => {
    const v = src[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) {
      deepMerge(target[k], v);
    } else {
      target[k] = v;
    }
  });
  return target;
}

// Prüft eine Export-Datei grob, bevor sie importiert wird.
export function validateExport(json) {
  if (!json || typeof json !== 'object' || json.app !== 'basis' || !json.data || typeof json.data !== 'object') {
    throw new Error('Das ist keine Basis-Sicherung.');
  }
  const out = emptyData();
  COLLS.forEach((c) => {
    const m = json.data[c];
    if (m && typeof m === 'object' && !Array.isArray(m)) {
      Object.keys(m).forEach((id) => { if (m[id] && typeof m[id] === 'object') out[c][safeId(id)] = m[id]; });
    }
  });
  return out;
}

// Wandelt die alten Widget-Daten in Schreibvorgänge um.
// `have` = aktueller Bestand: Vorhandenes wird nie überschrieben, der Verlauf wird zusammengeführt.
function legacyToOps(H, T, have) {
  const now = Date.now();
  const ops = [];
  const has = (coll, id) => !!(have && have[coll] && Object.prototype.hasOwnProperty.call(have[coll], id));
  let found = 0;
  let habits = 0;
  let days = 0;
  let todos = 0;
  listOf(H && H.habits).forEach((h, i) => {
    if (!h || !h.id) return;
    found++;
    const id = safeId(h.id);
    if (has('habits', id)) return;
    ops.push({ op: 'put', coll: 'habits', id: id, data: { name: String(h.name || h.id).slice(0, 60), order: i, createdAt: now + i } });
    habits++;
  });
  const hist = (H && H.history) || {};
  Object.keys(hist).forEach((k) => {
    if (!isDateKey(k)) return;
    const ids = listOf(hist[k]).filter(Boolean).map(safeId);
    if (!ids.length) return;
    found++;
    const cur = have && have.habitLog && have.habitLog[k] && Array.isArray(have.habitLog[k].ids) ? have.habitLog[k].ids : [];
    const add = ids.filter((x, i) => cur.indexOf(x) < 0 && ids.indexOf(x) === i);
    if (!add.length) return;
    ops.push({ op: 'union', coll: 'habitLog', id: k, field: 'ids', values: add });
    days++;
  });
  listOf(T && T.todos).forEach((t) => {
    if (!t || !t.title) return;
    found++;
    const id = t.id ? safeId(t.id) : 'legacy-' + safeId(String(t.createdAt || '') + '-' + t.title).slice(0, 80);
    if (has('todos', id)) return;
    const p = String(t.priority || 'Mittel').toLowerCase();
    const cat = String(t.category || 'Sonstiges');
    ops.push({
      op: 'put', coll: 'todos', id: id,
      data: {
        t: String(t.title).slice(0, 140),
        prio: p === 'hoch' || p === 'niedrig' ? p : 'mittel',
        due: isDateKey(t.dueDate) ? t.dueDate : null,
        ctx: cat === 'Arbeit' ? 'area:arbeit' : 'area:privat',
        tag: cat === 'Arbeit' || cat === 'Sonstiges' ? '' : cat,
        done: false, doneAt: null,
        createdAt: Number(t.createdAt) || now
      }
    });
    todos++;
  });
  if (found) ops.push({ op: 'patch', coll: 'meta', id: 'app', data: { legacyImportedAt: now } });
  return { ops: ops, found: found, counts: { habits: habits, days: days, todos: todos } };
}

function codedError(code, msg) {
  const e = new Error(msg);
  e.code = code;
  return e;
}

function withTimeout(p, ms) {
  let t = 0;
  const limit = new Promise((resolve, reject) => { t = setTimeout(() => reject(codedError('legacy/timeout', 'Zeitüberschreitung')), ms); });
  return Promise.race([p, limit]).finally(() => clearTimeout(t));
}

/* ---------------- Lokal (Demo) ---------------- */

class LocalStore {
  constructor() {
    this.mode = 'local';
    this.listeners = new Set();
    let d = null;
    try { d = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'); } catch (e) { d = null; }
    this.data = d && d.areas ? Object.assign(emptyData(), d) : seedData();
    this.user = { uid: 'demo', email: 'Demo-Modus' };
    this._save();
  }
  async init() { return this; }
  onAuth(cb) { setTimeout(() => cb(this.user), 0); return () => {}; }
  async signIn() { return this.user; }
  async signOut() {}
  async resetPassword() {}
  subscribe(cb) {
    this.listeners.add(cb);
    setTimeout(() => cb(this.snapshot(), this.status()), 0);
    return () => this.listeners.delete(cb);
  }
  unsubscribeAll() { this.listeners.clear(); }
  snapshot() { return clone(this.data); }
  status() { return { kind: 'local', text: 'Demo-Modus · nur auf diesem Gerät', ready: true, synced: true }; }
  _save() { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(this.data)); } catch (e) { /* voll oder gesperrt */ } }
  _emit() {
    this._save();
    const snap = this.snapshot();
    const st = this.status();
    this.listeners.forEach((cb) => { try { cb(snap, st); } catch (e) { console.error(e); } });
  }
  _apply(op) {
    const c = this.data[op.coll] || (this.data[op.coll] = {});
    if (op.op === 'put') c[op.id] = clone(op.data);
    else if (op.op === 'patch') c[op.id] = deepMerge(c[op.id] || {}, clone(op.data));
    else if (op.op === 'remove') delete c[op.id];
    else if (op.op === 'toggle') {
      const doc = c[op.id] || (c[op.id] = {});
      const arr = Array.isArray(doc[op.field]) ? doc[op.field].slice() : [];
      const i = arr.indexOf(op.value);
      if (op.on && i < 0) arr.push(op.value);
      if (!op.on && i >= 0) arr.splice(i, 1);
      doc[op.field] = arr;
    } else if (op.op === 'union') {
      const doc = c[op.id] || (c[op.id] = {});
      const arr = Array.isArray(doc[op.field]) ? doc[op.field].slice() : [];
      op.values.forEach((v) => { if (arr.indexOf(v) < 0) arr.push(v); });
      doc[op.field] = arr;
    }
  }
  put(coll, id, data) { this._apply({ op: 'put', coll, id, data }); this._emit(); return Promise.resolve(); }
  patch(coll, id, data) { this._apply({ op: 'patch', coll, id, data }); this._emit(); return Promise.resolve(); }
  remove(coll, id) { this._apply({ op: 'remove', coll, id }); this._emit(); return Promise.resolve(); }
  toggle(coll, id, field, value, on) { this._apply({ op: 'toggle', coll, id, field, value, on }); this._emit(); return Promise.resolve(); }
  batch(ops) { ops.forEach((o) => this._apply(o)); this._emit(); return Promise.resolve(); }
  exportAll() { return { app: 'basis', version: 1, exportedAt: new Date().toISOString(), data: this.snapshot() }; }
  async importAll(json) {
    const d = validateExport(json);
    this.data = d;
    this._emit();
  }
  async migrateLegacy() { throw new Error('Im Demo-Modus nicht verfügbar. Melde dich mit deinem Konto an.'); }
}

/* ---------------- Cloud (Firebase) ---------------- */

class CloudStore {
  constructor() {
    this.mode = 'cloud';
    this.cache = emptyData();
    this.meta = {};
    this.unsubs = {};
    this.errors = {};
    this.writeError = null;
    this.timers = new Set();
    this.seedTimer = 0;
    this.seeded = false;
    this.seeding = false;
    this.uid = null;
  }

  async init() {
    const mods = await Promise.all([
      import(SDK + 'firebase-app.js'),
      import(SDK + 'firebase-auth.js'),
      import(SDK + 'firebase-firestore.js')
    ]);
    const appMod = mods[0];
    this.appMod = appMod;
    this.A = mods[1];
    this.F = mods[2];
    this.app = appMod.initializeApp(FIREBASE_CONFIG);
    // Anmeldung dauerhaft merken. localStorage zuerst: In iPhone-Home-Bildschirm-Apps verliert IndexedDB
    // nach dem Neustart manchmal die Verbindung, localStorage ist dort zuverlässiger. Eine bestehende
    // Anmeldung aus IndexedDB übernimmt Firebase dabei automatisch.
    this.auth = this.A.initializeAuth(this.app, { persistence: [this.A.browserLocalPersistence, this.A.indexedDBLocalPersistence] });
    this.auth.languageCode = 'de';
    try {
      this.db = this.F.initializeFirestore(this.app, { localCache: this.F.persistentLocalCache({ tabManager: this.F.persistentMultipleTabManager() }) });
    } catch (e) {
      console.warn('Offline-Speicher nicht verfügbar, nutze Arbeitsspeicher.', e);
      this.db = this.F.getFirestore(this.app);
    }
    return this;
  }

  onAuth(cb) {
    return this.A.onAuthStateChanged(this.auth, (u) => cb(u ? { uid: u.uid, email: u.email || '' } : null));
  }
  signIn(email, pw) { return this.A.signInWithEmailAndPassword(this.auth, email, pw); }
  async signOut() { this.unsubscribeAll(); await this.A.signOut(this.auth); }
  resetPassword(email) { return this.A.sendPasswordResetEmail(this.auth, email); }

  ref(coll, id) { return this.F.doc(this.db, 'users', this.uid, coll, id); }

  subscribe(cb, uid) {
    this.unsubscribeAll();
    this.uid = uid;
    this.cache = emptyData();
    this.meta = {};
    this.errors = {};
    this.writeError = null;
    this.seeded = false;
    this.seeding = false;
    this.cb = cb;
    COLLS.forEach((c) => this._listen(c, 0));
    this._seed(0);
    return () => this.unsubscribeAll();
  }

  // Ein Listener je Sammlung. Bricht Firestore einen Listener ab (z. B. Regeln oder Datenbank fehlen),
  // wird er mit wachsendem Abstand neu gestartet, bis es wieder klappt.
  _listen(c, attempt) {
    const uid = this.uid;
    const q = this.F.collection(this.db, 'users', uid, c);
    this.unsubs[c] = this.F.onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
      const m = {};
      snap.forEach((d) => { m[d.id] = d.data(); });
      this.cache[c] = m;
      this.meta[c] = { fromCache: snap.metadata.fromCache, pending: snap.metadata.hasPendingWrites };
      delete this.errors[c];
      attempt = 0;
      if (!snap.metadata.fromCache && !this.seeded) this._seed(0);
      this._emit();
    }, (err) => {
      console.error('Sync-Fehler', c, err);
      this.errors[c] = err;
      this._emit();
      this._later(() => { if (this.uid === uid) this._listen(c, attempt + 1); }, Math.min(60000, 5000 * Math.pow(2, attempt)));
    });
  }

  _later(fn, ms) {
    const t = setTimeout(() => { this.timers.delete(t); fn(); }, ms);
    this.timers.add(t);
    return t;
  }

  unsubscribeAll() {
    Object.keys(this.unsubs).forEach((c) => { try { this.unsubs[c](); } catch (e) { /* schon beendet */ } });
    this.unsubs = {};
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this.seedTimer = 0;
    this.uid = null;
  }

  _emit() { if (this.cb) this.cb(this.snapshot(), this.status()); }

  snapshot() { return clone(this.cache); }

  // ready = alle Sammlungen einmal geladen (auch aus dem Offline-Speicher);
  // synced = Stand kommt sicher vom Server. Nur dann wird die Serie fortgeschrieben.
  status() {
    const s = this._status();
    const vals = Object.values(this.meta);
    s.ready = vals.length >= COLLS.length;
    s.synced = s.ready && !vals.some((m) => m.fromCache) && Object.keys(this.errors).length === 0;
    return s;
  }

  _status() {
    const err = Object.values(this.errors)[0] || this.writeError;
    if (err) {
      const code = String(err.code || '');
      if (code === 'permission-denied' || code === 'unauthenticated') return { kind: 'error', keep: false, text: 'Keine Berechtigung – Firestore-Regeln prüfen' };
      if (code === 'not-found' || code === 'failed-precondition') return { kind: 'error', keep: false, text: 'Datenbank nicht gefunden – Firestore in Firebase anlegen' };
      if (code === 'resource-exhausted') return { kind: 'error', keep: false, text: 'Tageslimit von Firebase erreicht – morgen geht es weiter' };
      return { kind: 'error', keep: true, text: 'Sync-Fehler – wird erneut versucht' };
    }
    const vals = Object.values(this.meta);
    const pending = vals.some((m) => m.pending);
    const fromCache = vals.length < COLLS.length || vals.some((m) => m.fromCache);
    const online = typeof navigator === 'undefined' || navigator.onLine !== false;
    if (!online) return { kind: 'offline', text: pending ? 'Offline – Änderungen werden später übertragen' : 'Offline – gespeicherte Daten' };
    if (pending) return { kind: 'pending', text: 'Wird synchronisiert …' };
    if (fromCache) return { kind: 'pending', text: 'Verbinde …' };
    return { kind: 'ok', text: 'Synchronisiert' };
  }

  _fail(err) {
    console.error('Speichern fehlgeschlagen', err);
    this.writeError = err;
    this._emit();
  }

  _done() {
    if (!this.writeError) return;
    this.writeError = null;
    this._emit();
  }

  // Schreibt nur, solange jemand angemeldet ist. Fehler landen in der Statuszeile statt als Absturz.
  _write(fn) {
    if (!this.uid) return Promise.resolve();
    let p;
    try { p = fn(); } catch (e) { this._fail(e); return Promise.resolve(); }
    return p.then(() => this._done(), (e) => this._fail(e));
  }

  put(coll, id, data) { return this._write(() => this.F.setDoc(this.ref(coll, id), data)); }
  patch(coll, id, data) { return this._write(() => this.F.setDoc(this.ref(coll, id), data, { merge: true })); }
  remove(coll, id) { return this._write(() => this.F.deleteDoc(this.ref(coll, id))); }
  toggle(coll, id, field, value, on) {
    return this._write(() => this.F.setDoc(this.ref(coll, id), { [field]: on ? this.F.arrayUnion(value) : this.F.arrayRemove(value) }, { merge: true }));
  }

  async batch(ops) {
    for (let i = 0; i < ops.length; i += 400) {
      const b = this.F.writeBatch(this.db);
      ops.slice(i, i + 400).forEach((o) => {
        const r = this.ref(o.coll, o.id);
        if (o.op === 'put') b.set(r, o.data);
        else if (o.op === 'patch') b.set(r, o.data, { merge: true });
        else if (o.op === 'union') b.set(r, { [o.field]: this.F.arrayUnion.apply(null, o.values) }, { merge: true });
        else if (o.op === 'remove') b.delete(r);
      });
      await b.commit();
    }
  }

  // Legt beim ersten Anmelden die Startdaten an. Klappt das nicht (offline, Regeln fehlen),
  // versucht es die App später erneut – nie doppelt, weil die IDs fest sind.
  async _seed(attempt) {
    if (this.seeded || this.seeding || !this.uid) return;
    const uid = this.uid;
    this.seeding = true;
    let ok = false;
    try {
      const snap = await this.F.getDocFromServer(this.ref('meta', 'app'));
      if (this.uid === uid && !snap.exists()) {
        const seed = seedData();
        const ops = [];
        COLLS.forEach((c) => Object.keys(seed[c]).forEach((id) => ops.push({ op: 'put', coll: c, id: id, data: seed[c][id] })));
        await this.batch(ops);
      }
      ok = this.uid === uid;
    } catch (e) {
      console.warn('Startdaten noch nicht angelegt', e);
    }
    this.seeding = false;
    if (ok) { this.seeded = true; return; }
    if (this.uid !== uid) return;
    if (this.seedTimer) { clearTimeout(this.seedTimer); this.timers.delete(this.seedTimer); }
    this.seedTimer = this._later(() => { this.seedTimer = 0; this._seed(attempt + 1); }, Math.min(300000, 10000 * Math.pow(2, attempt)));
  }

  exportAll() { return { app: 'basis', version: 1, exportedAt: new Date().toISOString(), data: this.snapshot() }; }

  async importAll(json) {
    const d = validateExport(json);
    const ops = [];
    COLLS.forEach((c) => Object.keys(this.cache[c] || {}).forEach((id) => ops.push({ op: 'remove', coll: c, id: id })));
    COLLS.forEach((c) => Object.keys(d[c]).forEach((id) => ops.push({ op: 'put', coll: c, id: id, data: d[c][id] })));
    await this.batch(ops);
  }

  // Liest die alten Widget-Daten aus dem alten Projekt und übernimmt sie.
  // Bereits vorhandene Habits und To-Dos bleiben unverändert, der Verlauf wird ergänzt.
  async migrateLegacy() {
    const dbMod = await import(SDK + 'firebase-database.js');
    const A = this.appMod;
    const prev = A.getApps().find((a) => a.name === 'legacy');
    if (prev) { try { await A.deleteApp(prev); } catch (e) { /* schon weg */ } }
    const legacy = A.initializeApp(LEGACY_CONFIG, 'legacy');
    try {
      // Nur WebSocket: der Long-Polling-Ersatz würde Skripte nachladen, die die CSP sperrt.
      if (typeof dbMod.forceWebSockets === 'function') dbMod.forceWebSockets();
      const rtdb = dbMod.getDatabase(legacy);
      const once = (path) => new Promise((resolve, reject) => {
        dbMod.onValue(dbMod.ref(rtdb, path), (snap) => resolve(snap.val()), reject, { onlyOnce: true });
      });
      const reads = [];
      LEGACY_SOURCES.forEach((s) => { reads.push(once(s.habits), once(s.todos)); });
      const res = await withTimeout(Promise.all(reads), 20000);
      const merged = mergeLegacy(LEGACY_SOURCES.map((s, i) => ({ H: res[i * 2], T: res[i * 2 + 1] })));
      const conv = legacyToOps(merged.H, merged.T, this.cache);
      if (!conv.found) throw codedError('legacy/empty', 'Keine alten Daten gefunden.');
      await this.batch(conv.ops);
      return conv.counts;
    } finally {
      try { await A.deleteApp(legacy); } catch (e) { /* egal */ }
    }
  }
}

export async function createStore(opts) {
  const store = opts && opts.demo ? new LocalStore() : new CloudStore();
  await store.init();
  return store;
}

// Für Tests: Umwandlung der alten Widget-Daten ohne Netzwerk prüfen.
export const _legacyToOps = legacyToOps;
export const _mergeLegacy = mergeLegacy;
