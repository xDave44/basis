# Basis

Persönliche Zentrale für To-Dos, Ideen (Business-Map), Habits und Dokumente.
Läuft im Browser und als App am iPhone, synchronisiert über Firebase und funktioniert auch offline.

Adresse: https://xdave44.github.io/basis/

## Heute, Serie und Belohnung

- **Heute** zeigt alles, was heute oder früher fällig ist, als Ring: ein Teil je Aufgabe.
- **Morgen-Check:** beim ersten Öffnen am Tag (auch am PC) steht da, was ansteht. „Auf morgen“ verschiebt, „Heute“ holt Offenes dazu.
- **Serie:** ein Tag zählt, wenn am Ende nichts Fälliges offen ist. Verschieben zählt, ein Tag ohne Fälliges auch.
  Der Stand liegt in `users/{UID}/meta/days` (`ok` je Tag, `best` = Rekord) und wird nur mit bestätigten Server-Daten fortgeschrieben.
- **Tag geschafft:** nach dem letzten Haken – Ring, Konfetti, Serie, Wochenleiste. Töne lassen sich in den Einstellungen abschalten.
- **Zahl am App-Symbol:** offene Aufgaben von heute. Aktualisiert sich beim Öffnen der App; am iPhone nur für die App am Home-Bildschirm und nach erlaubten Mitteilungen.
- **Habits:** Ring für heute, Serie und Rekord je Habit, Ziele (3, 7, 14, 21, 30 … Tage), „Perfekter Tag“, wenn alle erledigt sind.
- **Ideen:** am Handy als Liste mit Fortschritt, nächstem Schritt und Hinweis auf stille Ideen; das Board bleibt per Umschalter.

## Dateien

`index.html`, `app.css`, `app.js` (Oberfläche), `store.js` (Firebase und Demo-Speicher), `game.js` (Ring, Serie, Meilensteine – ohne Oberfläche, einzeln prüfbar),
`fx.js` (Töne, Konfetti), `sw.js` (Offline), `fonts/` (Schibsted Grotesk, SIL Open Font License, Lizenztext liegt bei).

## Aufbau

- **Firebase-Projekt „basis“** (`basis-99824`)
  - Anmeldung: E-Mail/Passwort. Selbst-Registrierung ist aus („Erstellen aktivieren (Registrierung)“ abgehakt). Neue Konten nur über Authentication → Nutzer → „Nutzer hinzufügen“.
  - Firestore (Standard, `(default)`, europe-west3 Frankfurt). Regeln: `firestore.rules`.
  - Daten liegen unter `users/{UID}/…`. Nur das eigene Konto kommt an seine Daten.
- **Altes Projekt „Notion Widgets“** (`notion-widgets-14888`): wird nur für die einmalige Übernahme gelesen.
- **Hosting:** GitHub Pages, Branch `main`, Ordner `/ (root)`.

## Alte Widget-Daten übernehmen

App öffnen, anmelden → **Einstellungen** → **Alte Widget-Daten übernehmen**.
Vorhandenes wird dabei nie überschrieben, der Habit-Verlauf wird ergänzt. Ein zweiter Lauf holt nur Neues dazu.
Danach den alten Pfad sperren: Projekt „Notion Widgets“ → **Realtime Database** → **Regeln** → Inhalt von `database.rules.json` einfügen → **Veröffentlichen**.
Die alten Notion-Widgets funktionieren danach nicht mehr, sie sind durch die App ersetzt.

## iPhone
Safari → Adresse öffnen → **Teilen** → **Zum Home-Bildschirm** → „Als Web-App öffnen“ eingeschaltet lassen → **Hinzufügen**. Einmal anmelden.

## Opera als Startseite
Opera-Menü → **Einstellungen** → **Grundeinstellungen** → **Beim Starten** → **Eine bestimmte Seite, oder bestimmte Seiten öffnen** → Adresse eintragen.

## Sicherheit
- Der Firebase-API-Schlüssel im Code ist laut Firebase öffentlich gedacht. Schutz kommt über Anmeldung und Regeln.
- Eingaben werden nur als Text angezeigt (kein HTML). Links werden nur mit `https://` angenommen.
- Content-Security-Policy im `index.html`, die App lässt sich nicht in fremde Seiten einbetten.
- Optional zusätzlich: Google Cloud Console → APIs & Dienste → Anmeldedaten → Browser-Schlüssel → Website-Einschränkung auf
  `https://xdave44.github.io/*` und `https://basis-99824.firebaseapp.com/*`.

## Sicherung
Einstellungen → **Sicherung herunterladen** (JSON). Einspielen ersetzt alle aktuellen Daten.

## Testen ohne Konto
`https://xdave44.github.io/basis/?demo=1` – Demo-Modus, Daten nur in diesem Browser.

## Neue Version veröffentlichen
In `sw.js` die Konstante `VERSION` und in `app.js` `VERSION` erhöhen. Geöffnete Apps zeigen dann „Neue Version verfügbar – Neu laden“.
Neue Dateien zusätzlich in `sw.js` in die Liste `SHELL` eintragen, sonst fehlen sie offline.
