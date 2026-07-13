# Español Coach — Spanisch-Lern-App mit Jarvis-Sprachmodus

Wissenschaftlich fundierte Full-Stack-Sprachlern-App (Next.js + Neon-Postgres).
Umsetzung des Masterprompts: aktiver Abruf, Spacing, Mastery-Stufen, kritische
Bewertung, Fehlergedächtnis, Bildlernen, Aussprache-/Shadowing-Training und ein
kontinuierlicher Jarvis-Live-Sprachmodus.

> **Sprache der App:** Oberfläche Deutsch, Lernsprache Spanisch.

---

## 1. Die „Anatomie" — wie alles zusammenhängt

```
                 ┌────────────────────────────────────────────┐
   Browser  ◀──▶ │  Next.js Frontend (React, Tailwind)         │
  (Mikrofon,     │  Module: Vokabeln, Bilder, Aussprache,      │
   Lautsprecher) │  Shadowing, Jarvis, Hören, Satzbau, Prüfung │
                 └───────────────┬────────────────────────────┘
                                 │  (nur relative /api-Aufrufe, KEINE Keys im Client)
                 ┌───────────────▼────────────────────────────┐
   API-Keys ───▶ │  Next.js API-Routen (Server, /src/app/api)  │
  (nur hier!)    │  Auth · Vokabel-/Attempt-Logik · Coach ·    │
                 │  TTS-Proxy (mit Cache) · Aussprache · Progress
                 └───────┬───────────────────────┬────────────┘
                         │                        │
         ┌───────────────▼──────┐      ┌──────────▼───────────────┐
         │  Neon Postgres (DB)  │      │  Externe Dienste (optional)│
         │  via Prisma ORM      │      │  Anthropic/OpenAI (Coach)  │
         │  alle Entitäten      │      │  ElevenLabs/Azure/Google   │
         └──────────────────────┘      │  (menschliche Stimme, TTS) │
                                        └────────────────────────────┘
```

**Wichtig:** Der Browser ruft ausschließlich deine eigenen `/api`-Routen auf.
Alle geheimen Keys liegen serverseitig in Umgebungsvariablen (Vercel) und werden
nie an den Client gegeben. So bleibt die App auch mit Premium-Diensten sicher.

---

## 2. Voraussetzungen

- Node.js ≥ 18.18
- Ein kostenloses **GitHub**-Konto (Code-Ablage)
- Ein kostenloses **Vercel**-Konto (Hosting/Server)
- Ein kostenloses **Neon**-Konto (Postgres-Datenbank)

---

## 3. Schritt-für-Schritt: Deployen — OHNE GitHub, Neon direkt aus Vercel

Du brauchst **kein GitHub** und musst **nicht auf neon.tech** gehen. Wir deployen
direkt vom Rechner per Vercel-CLI und legen die Datenbank aus dem Vercel-Dashboard an.

### 3.1 Vercel-CLI installieren & anmelden
```bash
npm i -g vercel
vercel login
```

### 3.2 Projekt zu Vercel verknüpfen (ohne Git)
```bash
cd spanisch-lernapp
npm install
vercel link          # legt/verknüpft ein Vercel-Projekt an
```

### 3.3 Neon-Datenbank DIREKT in Vercel anlegen
1. Vercel-Dashboard → dein Projekt → Reiter **Storage** → **Create Database**.
2. **Neon (Postgres)** wählen, Region z. B. Frankfurt, **Create**.
3. **Connect Project** → dein Projekt + Umgebungen (Production/Preview/Development).

Vercel setzt jetzt **automatisch** `DATABASE_URL` und `DATABASE_URL_UNPOOLED`
in deinem Projekt — du kopierst nichts von Hand.

### 3.4 Auth-Secret ergänzen
Im Dashboard → **Settings → Environment Variables** eine Variable hinzufügen:
`AUTH_SECRET` = Ausgabe von `openssl rand -base64 32`.
(TTS-/KI-Keys aus `.env.example` sind optional — die App läuft auch ohne.)

### 3.5 Env-Variablen lokal holen & Datenbank befüllen
```bash
vercel env pull .env.local     # holt DATABASE_URL* automatisch auf deinen Rechner
npm run db:push                # erstellt alle Tabellen in Neon
npm run db:seed                # lädt Kern-Vokabeln + Szenarien
```

### 3.6 Deployen
```bash
vercel --prod
```
Alternativ Seeding nach dem Deploy im **Admin**-Bereich der App per Button
„Seed ausführen" (oder `POST https://DEINE-APP/api/seed`).

Fertig — App-URL öffnen, registrieren, Einstufung machen, lernen.

> **Möchtest du später doch Git?** Ein **privates** Repo geht genauso (nicht
> öffentlich publishen). Dann in Vercel das Repo importieren statt der CLI — der
> Rest (Neon über Storage) bleibt identisch.

---

## 4. Menschlich klingende Stimme (TTS) — ohne teuer zu werden

Die App nutzt eine **austauschbare Sprach-Schicht** (`src/lib/speech/`). Du wählst
den Anbieter per Umgebungsvariable; ohne Key läuft automatisch der Browser-Modus.

| Stufe | Anbieter | Kosten | Qualität | Env-Variablen |
|------|----------|--------|----------|----------------|
| Sofort | **Browser** (Web Speech) | kostenlos | gut, wenn Chrome/Edge (Online-Neural). eSpeak vermeiden | keine |
| Gratis+ | **Google Cloud TTS** | **1 Mio. Zeichen/Monat gratis** | sehr natürlich | `GOOGLE_TTS_API_KEY` |
| Gratis+ | **Azure Speech (F0)** | 500k Zeichen/Monat gratis | sehr natürlich | `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` |
| Günstig | **OpenAI TTS** | Cent-Beträge/Session | sehr natürlich | `OPENAI_API_KEY` |
| Premium | **ElevenLabs** | begrenzt gratis, dann bezahlt | am ausdrucksstärksten | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` |

**Warum das Kontingent kaum verbraucht wird:** Der TTS-Endpunkt
(`/api/tts`) **cached** jede erzeugte Audiodatei pro Satz. Vokabeln, Phrasen und
Szenario-Sätze wiederholen sich beim Lernen ständig — jeder Satz wird also nur
**einmal** synthetisiert. Damit reicht selbst ein kleines Gratis-Kontingent für
einen einzelnen Lerner praktisch unbegrenzt.

> Der Roboter-/„Wall-E"-Klang stammt von **Offline**-Browserstimmen. Die App
> bevorzugt automatisch Online-Neural-Stimmen und meidet eSpeak. Für garantiert
> menschlichen Klang trage einen der obigen Keys ein — mehr ist nicht nötig.

### Google-TTS-API-Key holen (WaveNet, menschliche Stimme, ~1 Mio. Zeichen gratis)
1. Auf https://console.cloud.google.com einloggen und oben ein **Projekt anlegen**
   (z. B. „espanol-coach").
2. **APIs & Dienste → Bibliothek** → nach **„Cloud Text-to-Speech API"** suchen →
   **Aktivieren**. (Einmalig musst du in der Cloud Console ein Abrechnungskonto
   hinterlegen; der WaveNet-Free-Tier von 1 Mio. Zeichen/Monat bleibt kostenlos.)
3. **APIs & Dienste → Anmeldedaten → Anmeldedaten erstellen → API-Schlüssel**.
   Schlüssel kopieren. (Empfohlen: unter „API-Schlüssel einschränken" nur die
   *Cloud Text-to-Speech API* erlauben.)
4. In Vercel unter **Settings → Environment Variables** setzen:
   - `GOOGLE_TTS_API_KEY` = dein Schlüssel
   - `GOOGLE_TTS_VOICE` = `es-ES-Wavenet-B` (oder z. B. `es-ES-Wavenet-C`,
     `es-US-Wavenet-B`). **Wichtig:** Genau eine WaveNet-Stimme eintragen, damit
     nicht die Standard-/Basisstimme genutzt wird.
5. Neu deployen. Die App nutzt jetzt automatisch die WaveNet-Stimme; der
   Audio-Cache sorgt dafür, dass das Kontingent kaum verbraucht wird.

> Der `GOOGLE_TTS_VOICE`-Wert IST der „Pfad" zum Modell: Alles mit `-Wavenet-`
> nutzt WaveNet, `-Neural2-` nutzt Neural2. Ohne diese Variable nimmt die App
> bereits standardmäßig `es-ES-Wavenet-B`.

**Persistenter Audio-Cache (optional, empfohlen bei viel Nutzung):** aktuell
cached der Server im Arbeitsspeicher. Für dauerhaftes Caching über Deploys hinweg
kann man in `src/app/api/tts/route.ts` statt der `Map` z. B. Vercel Blob oder S3
verwenden (Kommentar im Code weist die Stelle aus).

---

## 5. KI-Coach (Jarvis) — Stimme + Intelligenz

- **Ohne KI-Key:** Ein deterministischer **Regel-Coach** führt durch die Szenarien,
  prüft Zielphrasen und gibt knappes Feedback. Alles funktioniert offline.
- **Mit `ANTHROPIC_API_KEY`** (oder `OPENAI_API_KEY`): natürliche, adaptive
  Gesprächsführung, echte Korrekturen und Erklärungen. Der Key liegt nur im Server
  (`src/lib/ai/coach.ts`).

Der Jarvis-Modus (`/jarvis`) bietet: animierten Reaktorkern, kontinuierliche
spanische Erkennung, **Barge-in** (Unterbrechen), Live-Transkript, Zustände
(listening/thinking/speaking/interrupted/error) und einen Conversation-Memory-Layer.

---

## 6. Sehr großer Wortschatz — bis muttersprachlich

Es gibt **drei Stufen** — von „sofort da" bis „zehntausende Wörter":

**Stufe A — schon eingebaut (~275 Wörter, geprüft).**
Ein handgepflegter Grundwortschatz mit korrekter deutscher Bedeutung steckt in
`src/data/vocabulary.ts`. Er landet mit **`npm run db:seed`** (oder Admin-Button
„Seed ausführen") in der App. Kein Download nötig.

**Stufe B — ~21.000 Wörter mit deutscher Übersetzung (einmalig, dann dauerhaft).**

*Am einfachsten:* nach dem Deploy in der App auf **Admin → „21.000 Wörter
importieren"** klicken. Ein Fortschrittsbalken lädt das freie FreeDict-Wörterbuch
und schreibt es **dauerhaft in deine Neon-Datenbank**. Das machst du **nur ein
einziges Mal** — danach sind die Wörter für immer da, du klickst nie wieder.

*Oder per Terminal:*
```bash
npm run import:woerter
```
Beides lädt automatisch das **freie, handgeschriebene FreeDict-Wörterbuch
Spanisch→Deutsch** (~21.353 Stichwörter) und importiert es — inklusive
Qualitätsfilter (nur echte spanische Wörter mit sinnvoller Bedeutung). Läuft der
Download nicht, lade `spa-deu.tei` einmal von https://freedict.org/downloads/:
```bash
npm run import:woerter -- pfad/zur/spa-deu.tei
```

> **Wichtig — wo liegt was:** Der **Code** liegt in GitHub/Vercel, die **Wörter
> und dein Speicherstand** liegen in **Neon (Datenbank)**. Deshalb importierst du
> die Wörter einmal in Neon (Button/Befehl), nicht in GitHub. Dein Lernfortschritt
> (Mastery, Wiederholungen, Fehler, Skill-Bänder) wird bei jeder Übung automatisch
> in Neon gespeichert und ist nach erneutem Login überall wieder da.

**Stufe C — bis 50.000 Wörter nach Häufigkeit (optional).**
```bash
npm run import:haeufigkeit -- pfad/zur/es_50k.txt
# mit KI-Beispielen (braucht ANTHROPIC_API_KEY):
ENRICH=1 npm run import:haeufigkeit -- pfad/zur/es_50k.txt
```
Frequenzliste frei z. B. bei `hermitdave/FrequencyWords` (Datei `es_50k.txt`).

**Freischaltung nach Niveau:** Über `src/lib/vocabBands.ts` wird gesteuert, welche
Wörter bei welcher Sprachklasse eingeführt werden — von „Novice" bis „Highly
reliable" (muttersprachlich). So wirst du nicht mit 21.000 Wörtern erschlagen,
sondern bekommst passend zu deinem (streng vergebenen) Niveau immer neue dazu.

**Qualität & Recht:** FreeDict ist ein kuratiertes, von Menschen geschriebenes
freies Wörterbuch (kein Maschinen-Müll, keine Urheberrechtsprobleme). Der Import
filtert zusätzlich unsaubere Einträge heraus.

---

## 7. Kritische Bewertung (nicht geschönt)

- **Mastery** (`src/lib/mastery.ts`): Ein Wort gilt erst als stabil, wenn mehrere
  Nachweise in verschiedenen Kontexten vorliegen (erkannt → verstanden → wiedergegeben
  → im Satz → im Dialog → verzögert abgerufen → transferiert). Ein Einzelerfolg reicht nie.
- **Skill-Bänder** (`src/lib/scoring.ts`): 10 interne Klassen, strenger als CEFR.
  Das schwächste Kernfeld und die Stabilität bremsen die Gesamtklasse — rezeptive
  Stärke verdeckt keine produktive Schwäche. Scores können **sinken**.
- **Spacing** (`src/lib/srs.ts`): erweitertes SM-2 mit Sicherheit + Reaktionszeit.
- **Fehlergedächtnis** (`src/lib/errors.ts`): 12 Fehlerkategorien, steuern
  Wiederholung, Mini-Drills und Prüfungshärte.

---

## 8. Projektstruktur

```
prisma/schema.prisma      Datenmodell (alle Entitäten der Spezifikation)
prisma/seed.ts            Seed: Vokabeln + Szenarien
scripts/importFrequency.ts Massen-Import großer Wortlisten
src/data/                 Kern-Vokabeln, Szenarien
src/lib/                  Lernlogik: srs, mastery, scoring, errors, vocabBands
src/lib/ai/coach.ts       KI-Coach (Anthropic/OpenAI/Regel-Fallback)
src/lib/speech/           TTS-Server-Schicht + Client-STT/TTS
src/app/api/              Backend-Routen (Auth, Attempt, Conversation, TTS, ...)
src/app/*/page.tsx        Module-UI
src/middleware.ts         Routen-Schutz
```

## 9. Befehle

```bash
npm run dev        # lokal starten (http://localhost:3000)
npm run build      # Produktions-Build (Vercel führt das automatisch aus)
npm run db:push    # Schema in Neon anlegen
npm run db:seed    # Kern-Vokabeln/Szenarien laden
npm run db:studio  # Prisma Studio (DB inspizieren)
npm test           # Selbsttests der Lernlogik (16 Checks)
```

## 10. Umsetzungsphasen (Stand & nächste Schritte)

- ✅ **Phase 1** Auth, Datenmodell, Dashboard, Vokabelmodus, Review-Scheduler, Fortschritt
- ✅ **Phase 2** Bildmodus, Satzbau, Prüfmodus, Fehlergedächtnis
- ✅ **Phase 3** Aussprache, Shadowing, Speech-Pipeline, Live-Transkript
- ✅ **Phase 4** Jarvis-Live-Modus, Barge-in, Conversation-Memory, Analytik, Admin
- 🔜 **Phase 5 / Ausbau:** Wortschatz per Import auf mehrere Tausend erweitern,
  persistenter Audio-Cache (Blob/S3), serverseitige Whisper-STT als Browser-Alternative,
  E2E-Tests (Playwright), Datenexport/-löschung im Nutzerprofil (DSGVO).

## 11. Hinweise

- **Spracherkennung** (Web Speech API) läuft am besten in **Chrome/Edge** (Desktop
  und Android). Safari/iOS ist eingeschränkt — dort funktionieren alle Text-/Hör-/
  Bildmodule; für Sprechen ggf. serverseitige STT (Phase 5) nachrüsten.
- **HTTPS nötig** fürs Mikrofon — auf Vercel automatisch gegeben, lokal via `localhost`.
