# Projects/

One folder per active project — client work and personal projects alike.

## Layout

Day one = a **folder note** named after the project: `Projects/{name}/{name}.md` (kebab-case, **not** `README.md`). This one file is both the index **and** the hub — it is what `[[{name}]]` links resolve to in Obsidian. No separate hub/overview note: a project never gets a second file for the same thing. Subfolders appear on demand:

- `briefs/` — briefs, requirements, specs
- `drafts/` — drafts, outlines, working versions
- `research/` — references, moodboards, competitor material
- `notes/` — working scratch notes
- `feedback/` — feedback, revision rounds

## Folder-note shape

```markdown
---
type: project
status: active | planning | on-hold | completed
client: [[Name]]
date: YYYY-MM-DD
updated: YYYY-MM-DD
last_contact: YYYY-MM-DD        # optional, the four keys below: see "Open loops"
open_loop: "ein deutscher Satz"
loop_owner: ich | sie
loop_due: YYYY-MM-DD
---
## Überblick
## Status
## Nächste Schritte
- [ ] schritt
## Verlauf
- **YYYY-MM-DD:** was passiert ist (Quelle)
```

Lead with a one-paragraph `## Überblick` (the big picture, so the file works as the hub), then the operative sections. Keep it one file — promote durable facts to `Context/`, not to a second project note.

## Status and Verlauf

The hub answers "what is true now" at the top and "how did we get here" at the bottom.

- Exactly one status section (`## Status`). It opens with `Stand DD.MM.YYYY.`, holds only what is true now and is rewritten in place. No dated siblings like `## Status (17.07.2026)`.
- What a rewrite replaces moves to `## Verlauf`, always the last section: one line per event, newest on top, `- **YYYY-MM-DD:** …`. Lines there are never edited afterwards, only added.
- Lessons that stay valid (gotchas, pricing rules) are not history. They stay above, e.g. under `## Stolperfallen (gelernt)`.

## Open loops

Four optional frontmatter keys on any note that stands for a counterpart: a project hub with a client, a note about a company, a `type: person` note.

| Key | Meaning |
|---|---|
| `last_contact` | Date of the last real exchange, in either direction |
| `open_loop` | The one thing that is open between the owner and them, one German sentence |
| `loop_owner` | `ich` or `sie`: who has to move next |
| `loop_due` | Date by which it should happen. With `sie` it is the day the owner follows up |

- One loop per note, the most pressing one. Everything else stays a task in `Daily/`.
- Nothing open: delete the three loop keys instead of leaving them empty. `last_contact` stays.
- Only write what a note or the owner confirms. An unknown `last_contact` stays out.
- `offene-schleifen.base` in this folder lists every note in the vault that has `open_loop`. Never keep a second list by hand.

## Rules

- The project's main note is `{name}.md`, never `README.md` (so Obsidian links resolve and no orphan stub gets created).
- Don't pre-create subfolders.
- Completed projects move to `Intelligence/archive/{name}/`.
- `projekte.base` in this folder is the auto-generated project dashboard (Obsidian Bases). It reads the folder-note frontmatter — keep `status`, `client`, `updated` accurate and the dashboard stays accurate for free. Never build a hand-maintained overview table next to it.
- In a `.base` file's `properties:` block, note fields need the `note.` prefix (`note.loop_due`, not `loop_due`). Without it Obsidian ignores the `displayName` and shows the raw key. In `order:`, `sort:` and filters the bare key works.
