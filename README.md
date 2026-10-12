# Second Brain — Starter Kit

Ein persönliches **Second Brain** für Claude Code: ein Obsidian-Vault, in dem Claude dein Gedächtnis führt — wer du bist, woran du arbeitest, was entschieden wurde. Jede neue Session startet mit vollem Kontext statt bei null.

Das Kit bringt die komplette Struktur, alle Regeln und die Skills mit. **Deine Inhalte entstehen beim Onboarding** — ein Interview, das Claude mit dir führt.

## Voraussetzungen

- **[Claude Code](https://claude.com/claude-code)** (Terminal, Desktop-App oder VS Code)
- **Git** installiert (unter Windows bringt es Git Bash mit, das brauchen die Start-Hooks)
- Optional: **[Obsidian](https://obsidian.md)** (um den Vault visuell zu durchstöbern) und ein **GitHub-Account** (um zwischen Geräten zu syncen)

## Los geht's (5 Minuten)

1. **Eigene Kopie holen** — auf GitHub oben rechts **„Use this template" → „Create a new repository"** klicken (Repo am besten **privat**, da kommen persönliche Infos rein). Dann dein neues Repo klonen:
   ```
   git clone https://github.com/DEIN-NAME/DEIN-BRAIN.git
   ```
   *Kein GitHub? Einfach „Code → Download ZIP", entpacken.*

2. **Claude Code im Ordner starten:**
   ```
   cd DEIN-BRAIN
   claude
   ```

3. **Onboarding starten** — einfach eintippen:
   ```
   /onboarding
   ```
   Claude führt dich durch ein Interview (wer du bist, was du machst, deine Kunden/Projekte, deine Tools) und füllt daraus den Vault. Dauert 15–30 Minuten, lohnt sich — je ehrlicher und ausführlicher, desto besser wird dein Brain. Am Ende fragt Claude, welche der mitgelieferten Mods du haben willst.

## Oder: Claude richtet es für dich ein

Du willst die drei Schritte nicht von Hand machen? Starte Claude Code in dem Ordner, in dem dein Brain liegen soll, und füge diesen Text ein:

```
Richte mir ein Second Brain aus dem Starter-Kit https://github.com/EmiGross/brain-starter ein.

1. Prüfe mit `git --version`, ob Git installiert ist. Fehlt es, sag mir, was ich installieren muss. Installiere nichts ungefragt.
2. Frag mich, wie der Ordner heißen soll (Vorschlag: brain). Er entsteht im aktuellen Ordner.
3. Hol das Kit mit `git clone https://github.com/EmiGross/brain-starter.git ORDNERNAME` und führe danach in dem neuen Ordner `git remote remove origin` aus, damit nichts an das Starter-Kit zurückgeht.
4. Lies im neuen Ordner `CLAUDE.md` und `.claude/skills/onboarding/SKILL.md` und führe das Onboarding Schritt für Schritt mit mir durch. Alle Dateien entstehen im neuen Ordner.
5. Sag mir am Ende, dass ich Claude Code ab jetzt in diesem Ordner starte, damit Regeln, Skills und Start-Hooks geladen werden.

Regeln: Schreib nur auf, was ich wirklich sage. Lade nichts zu GitHub hoch, ohne mich zu fragen, und lege ein Repo nur privat an. Installiere nur die Mods, die ich auswähle.
```

Claude holt das Kit, führt das Interview und fragt am Schluss, ob dein Brain in ein eigenes privates GitHub-Repo soll. Die Skills, Start-Hooks und Mods sind für Claude Code gebaut. Andere KI-Agenten können den Text und die `SKILL.md` als Anleitung lesen, die Hooks und Mods laufen dort aber nicht.

## Der Arbeitsrhythmus danach

| Wann | Befehl | Was passiert |
|---|---|---|
| Ende jeder Session | `/wrap` | Session wird geloggt, Tasks abgehakt/weitergerollt, committet + gepusht |
| 1× pro Woche | `/audit` | Ehrlicher Lücken-Report: was weiß das Brain nicht, was fehlt? |
| 1× pro Woche | `/level-up` | Kurzes Interview → genau EINE Verbesserung, die direkt gebaut wird |
| Alle 1–2 Wochen | `/optimize` | Aufräumen: kaputte Links, Duplikate, veraltetes Zeug |

Ansonsten: einfach normal mit Claude arbeiten. Alles Wichtige landet automatisch am richtigen Ort — dafür sorgen die Regeln in `CLAUDE.md`.

## Was von selbst läuft

Bei jedem Start von Claude Code im Vault laufen zwei kleine Skripte (Start-Hooks, eingetragen in `.claude/settings.json`):

- **Daily-Kurzfassung:** lädt die neueste Daily-Note gekürzt, damit Claude sofort weiß, wo ihr steht
- **Stand-Check:** nennt höchstens ein Projekt, das auf „aktiv“ steht und seit drei Wochen still ist. Claude fragt dann beiläufig nach

Dazu führt das Brain **offene Schleifen**: Bei Kunden, Firmen und Personen steht in der Notiz, was gerade offen ist und wer dran ist. `Projects/offene-schleifen.base` zeigt alle auf einen Blick.

## Mods (optional)

Mods sind kleine Plugins, die eigene Oberfläche in Claude Code zeichnen. Der Vault bringt fünf mit. Keiner ist vorinstalliert: Beim Onboarding fragt Claude, welche du willst, und du kannst jederzeit welche nachholen oder entfernen.

| Mod | Was er macht |
|---|---|
| `brain-zeile` | Der nächste Termin aus deinen offenen Aufgaben, unter dem Eingabefeld |
| `kontext-anzeige` | Wie voll der Kontext ist, mit rechtzeitigem Rat zu `/wrap` |
| `fortschritt` | Fortschrittsbalken bei Aufgaben mit mehreren Schritten |
| `sprengradius` | Rückfrage vor riskanten Befehlen (Löschen, `git reset --hard`, …) |
| `merker` | Bietet an, deine Korrekturen als dauerhafte Regel zu speichern |

Von Hand installieren, mit dem Pfad zu deinem Vault:

```
claude plugin install fortschritt --marketplace "PFAD/ZU/DEINEM/VAULT"
```

Alles Weitere steht in `Resources/claude-code-mods.md`. Die Mod-Schnittstelle von Claude Code ist noch Early Access und kann sich ändern.

## Struktur

```
CLAUDE.md          ← Betriebssystem: Regeln, Routing (liest Claude jede Session)
connections.md     ← welche Tools angebunden sind
Context/           ← wer du bist: Arbeit, Kunden, Stimme, Ziele, Privates
Daily/             ← ein Log pro Arbeitstag (Kurzzeitgedächtnis)
Projects/          ← ein Ordner pro aktivem Projekt
Intelligence/      ← Meetings, Entscheidungs-Log, Archiv
Resources/         ← wiederverwendbare Templates, Checklisten, Prompts
  scripts/         ← Hilfsskripte und der Quellcode der Mods
Skills/            ← Wissensbasis für Workflows
Inbox/             ← Unsortiertes zum später Einordnen
.claude/skills/    ← die ausführbaren Skills (/wrap, /audit, …)
.claude/           ← dazu die Start-Hooks (settings.json, zwei Skripte)
.claude-plugin/    ← Liste der Mods, aus der Claude Code installiert
```

---

*Struktur & Skills basieren auf Emilianos Brain-Setup (Mix aus Ben-AI- und AIS-OS-Ansatz).*
