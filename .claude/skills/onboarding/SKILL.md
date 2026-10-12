---
name: onboarding
description: First-time setup of this second brain — interviews the new owner, fills the Context files, personalizes CLAUDE.md and connections.md, writes the first daily note, offers the optional Claude Code mods, and sets up git sync. Use when the user runs /onboarding, when Context/ has no me.md yet, or when someone asks to "set up my brain / richte mein Brain ein".
---

# Onboarding — Brain-Einrichtung

Turn this empty starter vault into the owner's personal second brain. Conversational, in German, warm but efficient. Expect a beginner: no jargon, explain what you're doing as you go.

**Never run this twice blindly** — if `Context/me.md` already exists, ask whether they really want to re-onboard before touching anything.

## Steps (in order)

### 0. Willkommen + Erwartung setzen

Briefly explain (3–4 Sätze): what this vault is, that you'll now do an interview (~15–30 min), and that everything they say lands in local markdown files they own. Honest answers > polished answers.

### 1. Das Interview

Ask in **blocks, one block at a time** — wait for each answer before the next block. Adapt follow-ups to what they say; skip blocks that don't apply. Don't interrogate — this is a conversation, and their phrasing is voice material (Block D).

- **A — Person & Arbeit:** Name? Was machst du beruflich (angestellt/selbstständig, Branche, Rolle)? Wie sieht eine typische Arbeitswoche aus? Wie triffst du Entscheidungen (Bauch/Daten/langsam/schnell)?
- **B — Kunden / Umfeld:** Für wen arbeitest du (Kunden, Team, Chef)? Typische Projekte? Was nervt an der Zusammenarbeit, was läuft gut? *(Angestellte: Kollegen/Stakeholder statt Kunden.)*
- **C — Ziele & Strategie:** Was sind die 2–3 Prioritäten dieses Jahr? Was machst du bewusst NICHT (explizite Nos)?
- **D — Stimme:** Wie klingst du, wenn du schreibst (locker/formell, Emoji, Länge)? Gibt es Texte von dir, die du reinkopieren kannst (Mails, Posts, Bewerbungen)? *(Samples sind Gold — aktiv danach fragen.)*
- **E — Tools & Setup:** Womit arbeitest du täglich (Hardware, Software, Dienste)? Was davon soll das Brain kennen oder später angebunden werden?
- **F — Privat (optional):** Was soll das Brain über dein Leben außerhalb der Arbeit wissen (Routinen, Interessen, Menschen)? Explizit sagen: darf auch leer bleiben.
- **G — Laufende Projekte:** Woran arbeitest du gerade konkret? (2–5 aktive Projekte mit je 2 Sätzen Kontext.)

### 2. Optionale Importe

Offer once, don't push: exports from the Claude app (memories + chats), ChatGPT, or a folder of their own texts. If provided, mine them for durable facts and voice samples; note the ingest in `connections.md`. If not available now, add it as an open task in the daily note.

### 3. Vault füllen

Write files per vault rules (frontmatter `type:`/`date:`, German content, wikilinks, no `[placeholders]`, History-Sektion nicht nötig bei Erstanlage):

1. **`Context/`** — create only files with real content: `me.md`, `work.md`, `clients.md` (falls relevant), `voice.md` (mit Roh-Samples), `strategy.md`, `tools.md`, `personal.md` (falls gewünscht). Adapt names to the profession where obvious (Filmer → `gear.md`). Update the file list in `Context/CLAUDE.md` to match reality.
2. **`Projects/`** — one folder note per active project from Block G (shape per `Projects/CLAUDE.md`).
3. **Root `CLAUDE.md`** — set `owner:` and `updated:` in the frontmatter, replace the intro line with one sentence about who this brain serves, remove the "Not set up yet?" callout. If the owner's content language is not German, change the Language section.
4. **`connections.md`** — fill the table with the tools from Block E (realistic statuses).
5. **`Intelligence/decisions/entscheidungs-log.md`** — first entry: brain set up today, key setup choices (Sprache, Sync, was importiert wurde).
6. **First `Daily/` note** — what happened (onboarding), open tasks (missing imports, GitHub setup if skipped, thin Context files to deepen).

### 4. Mods anbieten (optional)

Mods are small plugins that draw their own interface into Claude Code. The vault ships five of them in `Resources/scripts/claude-code-mods/`; `Resources/claude-code-mods.md` describes each one. **None is installed by default — the owner decides which ones they need.**

1. Explain in two sentences what a mod is, then list the five, one line each, in plain German (take the wording from the table in `Resources/claude-code-mods.md`):
   - `brain-zeile` — der nächste Termin aus den offenen Aufgaben, unter dem Eingabefeld
   - `kontext-anzeige` — wie voll der Kontext ist, mit Rat zu `/wrap`
   - `fortschritt` — Fortschrittsbalken bei Aufgaben mit mehreren Schritten
   - `sprengradius` — Rückfrage vor riskanten Befehlen (Löschen, `git reset --hard`, …)
   - `merker` — bietet an, Korrekturen als dauerhafte Regel zu speichern
2. Ask which ones they want: any selection, all, or none (a multi-select question if the tool is available). Don't push and don't pick for them. "Keine" and "später" are full answers; in that case skip to step 5 and note it as an open task in the daily note.
3. Install each chosen mod from the vault folder (absolute path of the vault root):
   ```
   claude plugin install <mod> --marketplace "<vault path>"
   ```
   The first call registers the vault as the marketplace `brain-starter`; after that `claude plugin install <mod>@brain-starter` works too. For `brain-zeile`, `kontext-anzeige` and `fortschritt` add `--config position=unten` (or `oben` if they prefer it above the prompt).
4. If an install command is refused (permission mode, or the safety check treats it as installing code): don't work around it. Give the owner the line to type themselves at the prompt: `/plugin install <mod> --marketplace <vault path>`.
5. Tell them: the mods show after `/reload-plugins` or the next start, they are read straight from the vault folder (moving the vault means reinstalling), and `claude plugin uninstall <mod>@brain-starter` removes one again.
6. Record the outcome: set the `Claude-Code-Mods` row in `connections.md` to `connected` and name the installed mods there (or leave it `planned`), and add the choice to the setup entry in the decisions log.

### 5. Git + Sync

1. `git init` if needed (a template clone already has git — then just commit).
2. First commit, message: `Brain aufgesetzt — Onboarding`.
3. Offer GitHub sync (recommended, **private** repo — personal data!). If they have `gh`: `gh repo create <name> --private --source . --push`. If not, give them the 3 manual steps or park it as a task.
4. **Wichtig, kurz erklären:** if this vault was cloned from the starter template, the remote may still point at the template repo — check with `git remote -v` and repoint to their own repo.

### 6. Abschluss

Short report in chat: welche Dateien angelegt wurden, was importiert wurde, welche Mods installiert sind, was offen ist. Mention once that two start hooks now run by themselves at every session start: the latest daily note is loaded in short form, and now and then one quiet project gets asked about. Then explain the rhythm in 4 lines:

- **`/wrap`** am Ende jeder Session — loggt alles und synct.
- **`/audit`** 1× pro Woche — findet Lücken.
- **`/level-up`** 1× pro Woche — baut genau eine Verbesserung.
- **`/optimize`** alle 1–2 Wochen — räumt auf.

End with the first real test: "Frag mich in einer neuen Session einfach mal: *Wer bin ich?*"

## Rules

- One block at a time. Never dump the whole interview as one wall of questions.
- Write only what was actually said — never invent facts to fill a file. Thin file > fake file.
- Everything stays local until the owner explicitly agrees to push to GitHub.
- Mods are the owner's choice. Never install one they did not name.
