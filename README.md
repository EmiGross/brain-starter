# Second Brain — Starter Kit

Ein persönliches **Second Brain** für Claude Code: ein Obsidian-Vault, in dem Claude dein Gedächtnis führt — wer du bist, woran du arbeitest, was entschieden wurde. Jede neue Session startet mit vollem Kontext statt bei null.

Das Kit bringt die komplette Struktur, alle Regeln und die Skills mit. **Deine Inhalte entstehen beim Onboarding** — ein Interview, das Claude mit dir führt.

## Voraussetzungen

- **[Claude Code](https://claude.com/claude-code)** (Terminal, Desktop-App oder VS Code)
- **Git** installiert
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
   Claude führt dich durch ein Interview (wer du bist, was du machst, deine Kunden/Projekte, deine Tools) und füllt daraus den Vault. Dauert 15–30 Minuten, lohnt sich — je ehrlicher und ausführlicher, desto besser wird dein Brain.

## Der Arbeitsrhythmus danach

| Wann | Befehl | Was passiert |
|---|---|---|
| Ende jeder Session | `/wrap` | Session wird geloggt, Tasks abgehakt/weitergerollt, committet + gepusht |
| 1× pro Woche | `/audit` | Ehrlicher Lücken-Report: was weiß das Brain nicht, was fehlt? |
| 1× pro Woche | `/level-up` | Kurzes Interview → genau EINE Verbesserung, die direkt gebaut wird |
| Alle 1–2 Wochen | `/optimize` | Aufräumen: kaputte Links, Duplikate, veraltetes Zeug |

Ansonsten: einfach normal mit Claude arbeiten. Alles Wichtige landet automatisch am richtigen Ort — dafür sorgen die Regeln in `CLAUDE.md`.

## Struktur

```
CLAUDE.md          ← Betriebssystem: Regeln, Routing (liest Claude jede Session)
connections.md     ← welche Tools angebunden sind
Context/           ← wer du bist: Arbeit, Kunden, Stimme, Ziele, Privates
Daily/             ← ein Log pro Arbeitstag (Kurzzeitgedächtnis)
Projects/          ← ein Ordner pro aktivem Projekt
Intelligence/      ← Meetings, Entscheidungs-Log, Archiv
Resources/         ← wiederverwendbare Templates, Checklisten, Prompts
Skills/            ← Wissensbasis für Workflows
Inbox/             ← Unsortiertes zum später Einordnen
.claude/skills/    ← die ausführbaren Skills (/wrap, /audit, …)
```

---

*Struktur & Skills basieren auf Emilianos Brain-Setup (Mix aus Ben-AI- und AIS-OS-Ansatz).*
