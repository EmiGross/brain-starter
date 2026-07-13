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
---
## Überblick
## Status
## Nächste Schritte
- [ ] schritt
```

Lead with a one-paragraph `## Überblick` (the big picture, so the file works as the hub), then the operative sections. Keep it one file — promote durable facts to `Context/`, not to a second project note.

## Rules

- The project's main note is `{name}.md`, never `README.md` (so Obsidian links resolve and no orphan stub gets created).
- Don't pre-create subfolders.
- Completed projects move to `Intelligence/archive/{name}/`.
- `projekte.base` in this folder is the auto-generated project dashboard (Obsidian Bases). It reads the folder-note frontmatter — keep `status`, `client`, `updated` accurate and the dashboard stays accurate for free. Never build a hand-maintained overview table next to it.
