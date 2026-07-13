---
name: wrap
description: Session-Abschluss für das Brain — fasst die Session zusammen, schreibt die Daily-Note, hakt erledigte Tasks ab, rollt offene weiter, promotet Dauerhaftes und committet + pusht. Use when the user runs /wrap, says the session is over, or asks to "alles im Brain notieren / vermerken damit wir im neuen Chat weitermachen können".
---

# Wrap — Session-Abschluss

One command at the end of a session: log everything, close the loop on tasks, sync. Report in German, kurz.

## Steps (in order)

### 1. Session Revue passieren lassen

Go through the whole conversation and collect:
- **Done:** what was actually built, fixed, decided, configured, delivered (per project).
- **Decisions:** real decisions with reasoning → these go to `Intelligence/decisions/entscheidungs-log.md` (newest on top, `## YYYY-MM-DD — Titel` / **Entscheidung** / **Warum** / **Betrifft**).
- **Durable facts:** new client/life/tool/project facts → promote to the matching `Context/` or `Projects/{name}/{name}.md` file now (History-Eintrag bei ersetzten Aussagen in Context-Dateien). The daily note keeps only the log line.
- **Open ends:** anything started but not finished, or promised for later.

### 2. Daily-Note schreiben

`Daily/YYYY-MM-DD.md` (create or append, Format siehe `Daily/CLAUDE.md`):
- `## Heute passiert` — one bullet per work block, wikilinks für Projekte/Personen.
- `## Entscheidungen` — one line per decision, → [[entscheidungs-log]].
- `## Tasks` — see step 3.
- If the note already has content from earlier today (other device / earlier session): **merge, never overwrite**.

### 3. Task-Abgleich (der wichtige Teil)

Goal: no task stays open that is actually done, and open tasks live in exactly one place — today's note.

1. Collect open tasks: today's note + the most recent previous daily note + `grep "^- \[ \]" Daily/*.md` for stragglers.
2. For each open task, check against this session (and obvious evidence in files/repos): done? → tick `[x]` **in its original note** with a short italic annotation `*(erledigt DD.MM. — …)*`.
3. Genuinely still open? → make sure it appears in **today's** `## Tasks` (once), tick the old instance with `*(→ heute gerollt)*`. Superseded/parked? → tick with reason.
4. When unsure whether something is done, ask the owner in the final summary instead of guessing.

### 4. Commit + Push

In the vault root:
1. `git add -A && git commit` — message: one line, German, what the session did.
2. `git pull --no-rebase` — if another device pushed, merge; resolve daily-note conflicts by merging both contents (never drop either side).
3. `git push` (skip pull/push if no remote is configured — just commit).

### 5. Kurz-Report im Chat

3–6 Zeilen: was geloggt wurde, welche Tasks abgehakt/gerollt, was promotet, Commit gepusht ✅. Plus: offene Fragen aus Schritt 3 (falls vorhanden) und der eine wichtigste nächste Schritt für die nächste Session.

## Rules

- Alle Brain-Regeln gelten (Routing, Wikilinks, Frontmatter, kein Vault-Root).
- Nichts löschen, nur abhaken/annotieren.
- Wenn die Session nichts Brain-Würdiges enthielt: sag das ehrlich statt Pseudo-Einträge zu erzeugen.
