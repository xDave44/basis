// Basis – Spiel-Logik: Tagesring, Serie, Habit-Meilensteine, Ideen-Fortschritt.
// Ohne DOM und ohne Zustand, damit sich alles einzeln prüfen lässt.

const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (d) => { const x = d || new Date(); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };
export const parseKey = (k) => { const a = String(k).split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); };
export const isKey = (k) => /^\d{4}-\d{2}-\d{2}$/.test(k || '');
export function addDays(key, n) { const d = parseKey(key); d.setDate(d.getDate() + n); return dateKey(d); }
export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 864e5);

const PRIO_RANK = { hoch: 0, mittel: 1, niedrig: 2 };
const rank = (t) => PRIO_RANK[t.prio] ?? 1;
const has = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);

/* ---------- Tagesring ---------- */

// Wie lange Erledigtes noch sichtbar bleibt, bevor es aus der Liste verschwindet.
export const DONE_VISIBLE_MS = 60000;
export const recentlyDone = (t, now) => !!(t && t.done && t.doneAt && now - t.doneAt < DONE_VISIBLE_MS && now - t.doneAt >= -5000);

// Agenda = alles ohne Datum in einem Bereich. To-Dos von Ideen ohne Datum bleiben auf der Business-Map.
export const isAgenda = (t) => !!t && !isKey(t.due) && String(t.ctx || '').indexOf('area:') === 0;

// Ziel-Datum zuerst (nächstes oben), dann Wichtiges, dann in der Reihenfolge des Anlegens.
export function agendaSort(a, b) {
  const ba = isKey(a.by) ? a.by : '9999-12-31';
  const bb = isKey(b.by) ? b.by : '9999-12-31';
  if (ba !== bb) return ba < bb ? -1 : 1;
  return (rank(a) - rank(b)) || ((a.createdAt || 0) - (b.createdAt || 0)) || (a.id < b.id ? -1 : 1);
}

// Was heute zählt: alles, was heute oder früher fällig und offen ist, plus die heute erledigten To-Dos mit Datum.
// `pending` = gerade abgehakte, noch nicht gespeicherte To-Dos; sie zählen schon als erledigt.
export function daySummary(todos, today, pending) {
  const pend = pending || new Set();
  const tomorrow = addDays(today, 1);
  const items = [];
  const rest = [];
  const agenda = [];
  let tomorrowN = 0;
  let doneSaved = 0;
  let openSaved = 0;
  let lastDoneAt = 0;
  (todos || []).forEach((t) => {
    const due = isKey(t.due) ? t.due : null;
    if (t.done) {
      if (due && t.doneAt && dateKey(new Date(t.doneAt)) === today) {
        items.push(Object.assign({}, t, { isDone: true, late: false }));
        doneSaved++;
        lastDoneAt = Math.max(lastDoneAt, t.doneAt);
      }
      return;
    }
    if (due && due <= today) {
      const p = pend.has(t.id);
      items.push(Object.assign({}, t, { isDone: p, late: due < today }));
      openSaved++;
      return;
    }
    if (due) {
      if (due === tomorrow) tomorrowN++;
      rest.push(t);
    } else if (isAgenda(t)) {
      agenda.push(t);
    }
  });
  // Feste Reihenfolge: Abhaken lässt nichts springen.
  const eff = (t) => (isKey(t.due) && t.due < today ? t.due : today);
  items.sort((a, b) => {
    const ea = eff(a); const eb = eff(b);
    if (ea !== eb) return ea < eb ? -1 : 1;
    return (rank(a) - rank(b)) || ((a.createdAt || 0) - (b.createdAt || 0)) || (a.id < b.id ? -1 : 1);
  });
  rest.sort((a, b) => (a.due < b.due ? -1 : (a.due > b.due ? 1 : 0)) || (rank(a) - rank(b)) || ((a.createdAt || 0) - (b.createdAt || 0)) || (a.id < b.id ? -1 : 1));
  agenda.sort(agendaSort);
  const total = items.length;
  const n = items.filter((x) => x.isDone).length;
  return {
    items: items,
    rest: rest,
    agenda: agenda,
    total: total,
    n: n,
    openN: total - n,
    allDone: total > 0 && n === total,
    tomorrowN: tomorrowN,
    lastDoneAt: lastDoneAt,
    // Gespeicherter Stand ohne „gerade abgehakt“: daran hängt der Tageseintrag.
    doneSaved: doneSaved,
    openSaved: openSaved
  };
}

// Vorschläge für den Morgen-Check: bald Fälliges (7 Tage), danach die Agenda.
export function planCandidates(sum, today, max) {
  const week = addDays(today, 7);
  const soon = sum.rest.filter((t) => t.due <= week);
  return soon.concat(sum.agenda).slice(0, max || 6);
}

// Wie weit ein Ziel-Datum weg ist: { n: Tage, late: überschritten }
export function targetInfo(by, today) {
  if (!isKey(by)) return null;
  const n = daysBetween(today, by);
  return { n: n, late: n < 0 };
}

// Fälligkeiten aller offenen, datierten To-Dos (für die Lücken-Bewertung der Serie).
export function openDues(todos) {
  return (todos || []).filter((t) => !t.done && isKey(t.due)).map((t) => t.due);
}

/* ---------- Serie ---------- */

// rec = { ok: { 'YYYY-MM-DD': Anzahl | null }, best: Zahl }
// Zahl = Tag geschafft (0 = nichts fällig), null = App war offen, Tag blieb unfertig.
// Tage ohne Eintrag (App nicht geöffnet) gelten als geschafft, wenn nichts Fälliges liegen blieb.
function dayJudge(rec, dues) {
  const ok = (rec && rec.ok && typeof rec.ok === 'object') ? rec.ok : {};
  const keys = Object.keys(ok).filter(isKey).sort();
  const first = keys[0] || null;
  let minOpen = null;
  (dues || []).forEach((d) => { if (isKey(d) && (!minOpen || d < minOpen)) minOpen = d; });
  return {
    ok: ok,
    keys: keys,
    first: first,
    last: keys[keys.length - 1] || null,
    gapOk: (k) => !(minOpen && minOpen <= k),
    was(k) {
      if (has(ok, k)) return typeof ok[k] === 'number';
      if (!first || k <= first) return false;
      return this.gapOk(k);
    }
  };
}

export function streakInfo(rec, today, todayOk, dues) {
  const j = dayJudge(rec, dues);
  let before = 0;
  let k = addDays(today, -1);
  while (before < 3650 && j.was(k)) { before++; k = addDays(k, -1); }
  const current = before + (todayOk ? 1 : 0);
  const prevBest = Math.max(0, Math.floor(Number(rec && rec.best) || 0));
  return { before: before, current: current, prevBest: prevBest, best: Math.max(prevBest, current), todayOk: !!todayOk };
}

// Was gespeichert werden muss: heutiger Stand, eingefrorene Lücken-Tage, Rekord.
// `withGaps` nur, wenn die Daten sicher aktuell sind (sonst würde ein alter Zwischenstand festgeschrieben).
export function dayRecordPatch(rec, today, sum, dues, withGaps) {
  const j = dayJudge(rec, dues);
  const patch = {};
  let changed = false;
  const want = sum.openSaved === 0 ? sum.doneSaved : null;
  const cur = has(j.ok, today) ? j.ok[today] : undefined;
  if (cur !== want) { patch[today] = want; changed = true; }
  if (withGaps && j.first) {
    let k = addDays(today, -1);
    let guard = 0;
    while (k > j.first && guard < 400) {
      if (!has(j.ok, k)) { patch[k] = j.gapOk(k) ? 0 : null; changed = true; }
      k = addDays(k, -1);
      guard++;
    }
  }
  const merged = { ok: Object.assign({}, j.ok, patch), best: rec && rec.best };
  const info = streakInfo(merged, today, want !== null, dues);
  const out = {};
  if (changed) out.ok = patch;
  if (info.current > info.prevBest) out.best = info.current;
  return (out.ok || out.best !== undefined) ? out : null;
}

const WD2 = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
// Montag bis Sonntag der laufenden Woche.
export function weekDots(rec, today, todayOk, dues) {
  const j = dayJudge(rec, dues);
  const t = parseKey(today);
  const monday = addDays(today, -((t.getDay() + 6) % 7));
  const out = [];
  for (let i = 0; i < 7; i++) {
    const k = addDays(monday, i);
    const d = parseKey(k);
    let state = 'miss';
    if (k > today) state = 'future';
    else if (k === today) state = todayOk ? 'today-ok' : 'today';
    else if (j.was(k)) state = 'ok';
    out.push({ key: k, label: WD2[d.getDay()], state: state });
  }
  return out;
}

/* ---------- Habits ---------- */

export const MILESTONES = [3, 7, 14, 21, 30, 50, 66, 100, 150, 200, 300, 365, 500, 730, 1000];

const logHas = (log, key, hid) => { const l = log && log[key]; return !!(l && Array.isArray(l.ids) && l.ids.indexOf(hid) >= 0); };

export function habitStats(log, hid, today) {
  let streak = 0;
  let k = logHas(log, today, hid) ? today : addDays(today, -1);
  while (streak < 3650 && logHas(log, k, hid)) { streak++; k = addDays(k, -1); }
  const days = Object.keys(log || {}).filter((d) => isKey(d) && d <= today && logHas(log, d, hid)).sort();
  let best = 0; let run = 0; let prev = null;
  days.forEach((d) => {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  });
  best = Math.max(best, streak);
  const next = MILESTONES.find((m) => m > streak) || (Math.floor(streak / 500) + 1) * 500;
  const prevMs = MILESTONES.filter((m) => m <= streak).pop() || 0;
  return {
    streak: streak,
    best: best,
    total: days.length,
    doneToday: logHas(log, today, hid),
    first: days[0] || null,
    next: next,
    prevMs: prevMs,
    toNext: next - streak,
    // Fortschritt bis zum nächsten Meilenstein (0..1)
    pct: next > 0 ? Math.min(1, streak / next) : 0,
    hitMilestone: MILESTONES.indexOf(streak) >= 0
  };
}

// Ab wann ein Habit zählt: Anlage-Datum oder erster Eintrag, je nachdem, was früher liegt.
function habitStarts(habits, log) {
  const starts = {};
  (habits || []).forEach((x) => { starts[x.id] = x.createdAt ? dateKey(new Date(x.createdAt)) : '0000-01-01'; });
  Object.keys(log || {}).forEach((d) => {
    if (!isKey(d)) return;
    const l = log[d];
    (l && Array.isArray(l.ids) ? l.ids : []).forEach((id) => { if (has(starts, id) && d < starts[id]) starts[id] = d; });
  });
  return starts;
}

// Anteil der an diesem Tag fälligen Habits, die erledigt wurden. due = 0 → kein Habit existierte.
export function habitDay(habits, log, key, starts) {
  const st = starts || habitStarts(habits, log);
  const due = (habits || []).filter((x) => st[x.id] <= key);
  const done = due.filter((x) => logHas(log, key, x.id)).length;
  return { due: due.length, done: done, ratio: due.length ? done / due.length : 0, perfect: due.length > 0 && done === due.length };
}

export function perfectStreak(habits, log, today) {
  const st = habitStarts(habits, log);
  const todayP = habitDay(habits, log, today, st).perfect;
  let streak = 0;
  let k = todayP ? today : addDays(today, -1);
  while (streak < 3650 && habitDay(habits, log, k, st).perfect) { streak++; k = addDays(k, -1); }
  const first = Object.keys(st).map((id) => st[id]).filter(isKey).sort()[0];
  let best = 0; let run = 0;
  if (first) {
    let d = first; let guard = 0;
    while (d <= today && guard < 3650) {
      run = habitDay(habits, log, d, st).perfect ? run + 1 : 0;
      if (run > best) best = run;
      d = addDays(d, 1); guard++;
    }
  }
  return { streak: streak, best: Math.max(best, streak), todayPerfect: todayP, starts: st };
}

/* ---------- Ideen ---------- */

export function ideaStats(todos, now, createdAt) {
  const list = todos || [];
  const open = list.filter((t) => !t.done);
  const done = list.filter((t) => t.done);
  const weekAgo = now - 7 * 864e5;
  const week = done.filter((t) => (t.doneAt || 0) >= weekAgo).length;
  let last = Number(createdAt) || 0;
  list.forEach((t) => { last = Math.max(last, t.createdAt || 0, t.doneAt || 0); });
  const quiet = last ? Math.max(0, Math.floor((now - last) / 864e5)) : 0;
  open.sort((a, b) => {
    const da = isKey(a.due) ? a.due : '9999-12-31';
    const db = isKey(b.due) ? b.due : '9999-12-31';
    if (da !== db) return da < db ? -1 : 1;
    return (rank(a) - rank(b)) || ((a.createdAt || 0) - (b.createdAt || 0));
  });
  return {
    total: list.length,
    done: done.length,
    open: open.length,
    pct: list.length ? done.length / list.length : 0,
    next: open[0] || null,
    week: week,
    quietDays: quiet,
    complete: list.length > 0 && open.length === 0
  };
}
