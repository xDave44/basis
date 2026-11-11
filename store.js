// Basis – Datenschicht
// Cloud: Firebase Auth (E-Mail/Passwort) + Firestore mit Offline-Speicher.
// Lokal: Demo-Modus (?demo=1), Daten nur in diesem Browser.

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAot00pxNmylzEI-tBRsPpak5YwI-BbbuA',
  authDomain: 'notion-widgets-14888.firebaseapp.com',
  databaseURL: 'https://notion-widgets-14888-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'notion-widgets-14888',
  storageBucket: 'notion-widgets-14888.firebasestorage.app',
  messagingSenderId: '537954094678',
  appId: '1:537954094678:web:34a6ffeb4766a73d96f5f7'
};

const SDK = 'https://www.gstatic.com/firebasejs/13.2.0/';
// Alter Widget-Pfad (Realtime Database). Wird nur für die einmalige Übernahme gelesen.
const LEGACY_PATH = 'u/r_1UVQoGwOhcZI73X6LLNR1ZYwZ3CJ9N';

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

function legacyToOps(H, T) {
  const now = Date.now();
  const ops = [];
  let habits = 0;
  let days = 0;
  let todos = 0;
  listOf(H && H.habits).forEach((h, i) => {
    if (!h || !h.id) return;
    ops.push({ op: 'put', coll: 'habits', id: safeId(h.id), data: { name: String(h.name || h.id).slice(0, 60), order: i, createdAt: now + i } });
    habits++;
  });
  const hist = (H && H.history) || {};
  Object.keys(hist).forEach((k) => {
    if (!isDateKey(k)) return;
    const ids = listOf(hist[k]).filter(Boolean).map(safeId);
    if (!ids.length) return;
    ops.push({ op: 'put', coll: 'habitLog', id: k, data: { ids: ids } });
    days++;
  });
  listOf(T && T.todos).forEach((t) => {
    if (!t || !t.title) return;
    const p = String(t.priority || 'Mittel').toLowerCase();
    const cat = String(t.category || 'Sonstiges');
    ops.push({
      op: 'put', coll: 'todos', id: safeId(t.id || newId('t')),
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
  ops.push({ op: 'patch', coll: 'meta', id: 'app', data: { legacyImportedAt: now } });
  return { ops: ops, counts: { habits: habits, days: days, todos: todos } };
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
  status() { return { kind: 'local', text: 'Demo-Modus · nur auf diesem Gerät' }; }
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
    this.unsubs = [];
    this.error = null;
    this.uid = null;
  }

  async init() {
    const mods = await Promise.all([
      import(SDK + 'firebase-app.js'),
      import(SDK + 'firebase-auth.js'),
      import(SDK + 'firebase-firestore.js')
    ]);
    const appMod = mods[0];
    this.A = mods[1];
    this.F = mods[2];
    this.app = appMod.initializeApp(FIREBASE_CONFIG);
    this.auth = this.A.initializeAuth(this.app, { persistence: [this.A.indexedDBLocalPersistence, this.A.browserLocalPersistence] });
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
    this.error = null;
    this.cb = cb;
    COLLS.forEach((c) => {
      const q = this.F.collection(this.db, 'users', uid, c);
      const un = this.F.onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
        const m = {};
        snap.forEach((d) => { m[d.id] = d.data(); });
        this.cache[c] = m;
        this.meta[c] = { fromCache: snap.metadata.fromCache, pending: snap.metadata.hasPendingWrites };
        this.error = null;
        cb(this.snapshot(), this.status());
      }, (err) => {
        console.error('Sync-Fehler', c, err);
        this.error = err;
        cb(this.snapshot(), this.status());
      });
      this.unsubs.push(un);
    });
    this.ensureSeed();
    return () => this.unsubscribeAll();
  }

  unsubscribeAll() {
    this.unsubs.forEach((u) => { try { u(); } catch (e) { /* schon beendet */ } });
    this.unsubs = [];
  }

  snapshot() { return clone(this.cache); }

  status() {
    if (this.error) {
      const denied = this.error && this.error.code === 'permission-denied';
      return { kind: 'error', text: denied ? 'Keine Berechtigung – Regeln prüfen' : 'Sync-Fehler – wird erneut versucht' };
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
    this.error = err;
    if (this.cb) this.cb(this.snapshot(), this.status());
  }

  put(coll, id, data) { return this.F.setDoc(this.ref(coll, id), data).catch((e) => this._fail(e)); }
  patch(coll, id, data) { return this.F.setDoc(this.ref(coll, id), data, { merge: true }).catch((e) => this._fail(e)); }
  remove(coll, id) { return this.F.deleteDoc(this.ref(coll, id)).catch((e) => this._fail(e)); }
  toggle(coll, id, field, value, on) {
    const v = on ? this.F.arrayUnion(value) : this.F.arrayRemove(value);
    return this.F.setDoc(this.ref(coll, id), { [field]: v }, { merge: true }).catch((e) => this._fail(e));
  }

  async batch(ops) {
    for (let i = 0; i < ops.length; i += 400) {
      const b = this.F.writeBatch(this.db);
      ops.slice(i, i + 400).forEach((o) => {
        const r = this.ref(o.coll, o.id);
        if (o.op === 'put') b.set(r, o.data);
        else if (o.op === 'patch') b.set(r, o.data, { merge: true });
        else if (o.op === 'remove') b.delete(r);
      });
      await b.commit();
    }
  }

  async ensureSeed() {
    let snap = null;
    try { snap = await this.F.getDocFromServer(this.ref('meta', 'app')); } catch (e) { return false; }
    if (!snap || snap.exists()) return false;
    const seed = seedData();
    const ops = [];
    COLLS.forEach((c) => Object.keys(seed[c]).forEach((id) => ops.push({ op: 'put', coll: c, id: id, data: seed[c][id] })));
    try { await this.batch(ops); return true; } catch (e) { this._fail(e); return false; }
  }

  exportAll() { return { app: 'basis', version: 1, exportedAt: new Date().toISOString(), data: this.snapshot() }; }

  async importAll(json) {
    const d = validateExport(json);
    const ops = [];
    COLLS.forEach((c) => Object.keys(this.cache[c] || {}).forEach((id) => ops.push({ op: 'remove', coll: c, id: id })));
    COLLS.forEach((c) => Object.keys(d[c]).forEach((id) => ops.push({ op: 'put', coll: c, id: id, data: d[c][id] })));
    await this.batch(ops);
  }

  async migrateLegacy() {
    const dbMod = await import(SDK + 'firebase-database.js');
    const rtdb = dbMod.getDatabase(this.app);
    const res = await Promise.all([
      dbMod.get(dbMod.ref(rtdb, LEGACY_PATH + '/habits')),
      dbMod.get(dbMod.ref(rtdb, LEGACY_PATH + '/todos'))
    ]);
    const conv = legacyToOps(res[0].val(), res[1].val());
    await this.batch(conv.ops);
    return conv.counts;
  }
}

export async function createStore(opts) {
  const store = opts && opts.demo ? new LocalStore() : new CloudStore();
  await store.init();
  return store;
}

// Für Tests: Umwandlung der alten Widget-Daten ohne Netzwerk prüfen.
export const _legacyToOps = legacyToOps;
