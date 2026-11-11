# Basis

Persönliche Zentrale für To-Dos, Ideen (Business-Map), Habits und Dokumente.
Läuft im Browser und als App am iPhone, synchronisiert über Firebase und funktioniert auch offline.

Adresse: https://xdave44.github.io/basis/

## Einrichtung (einmalig)

### 1. Firebase: Anmeldung
Firebase-Konsole → Projekt `notion-widgets-14888` → **Authentication** → **Anmeldemethode** → **E-Mail/Passwort** aktivieren.
Dann **Nutzer** → **Nutzer hinzufügen** → deine E-Mail und ein starkes Passwort.

### 2. Firebase: Datenbank
**Firestore Database** → **Datenbank erstellen** → Edition **Standard** → Standort **europe-west3 (Frankfurt)** → **Produktionsmodus**.
Danach Reiter **Regeln** → Inhalt von `firestore.rules` einfügen → **Veröffentlichen**.

### 3. GitHub Pages
Repo **Settings** → **Pages** → Source **Deploy from a branch** → Branch **main**, Ordner **/ (root)** → **Save**.
Nach ca. 1 Minute ist die App unter der Adresse oben erreichbar.

### 4. Erste Anmeldung und alte Daten
App öffnen, anmelden → **Einstellungen** → **Alte Widget-Daten übernehmen**.
Prüfen, ob Habits und To-Dos da sind. Danach den alten Pfad sperren:
Firebase-Konsole → **Realtime Database** → **Regeln** → Inhalt von `database.rules.json` einfügen → **Veröffentlichen**.
Die alten Notion-Widgets funktionieren danach nicht mehr – sie sind durch die App ersetzt.

### 5. iPhone
Safari → Adresse öffnen → **Teilen** → **Zum Home-Bildschirm** → „Als Web-App öffnen“ eingeschaltet lassen → **Hinzufügen**. Einmal anmelden.

### 6. Opera als Startseite
Opera-Menü → **Einstellungen** → **Grundeinstellungen** → **Beim Starten** → **Eine bestimmte Seite, oder bestimmte Seiten öffnen** → Adresse eintragen.

## Sicherheit
- Daten liegen unter `users/{deine UID}` in Firestore. Die Regeln erlauben nur deinem Konto Zugriff.
- Der Firebase-API-Schlüssel im Code ist laut Firebase öffentlich gedacht. Schutz kommt über Anmeldung und Regeln.
- Eingaben werden nur als Text angezeigt (kein HTML). Links werden nur mit `https://` angenommen.
- Content-Security-Policy im `index.html`, die App lässt sich nicht in fremde Seiten einbetten.
- Optional zusätzlich: Google Cloud Console → APIs & Dienste → Anmeldedaten → Browser-Schlüssel → Website-Einschränkung auf
  `https://xdave44.github.io/*` und `https://notion-widgets-14888.firebaseapp.com/*`.

## Sicherung
Einstellungen → **Sicherung herunterladen** (JSON). Einspielen ersetzt alle aktuellen Daten.

## Testen ohne Konto
`https://xdave44.github.io/basis/?demo=1` – Demo-Modus, Daten nur in diesem Browser.

## Neue Version veröffentlichen
In `sw.js` die Konstante `VERSION` erhöhen. Geöffnete Apps zeigen dann „Neue Version verfügbar – Neu laden“.
