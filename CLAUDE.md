---
os-mode: personal-professional
owner: (wird beim Onboarding gesetzt)
updated: 2026-07-13
---

# Second Brain

Personal AI operating system for the owner — work and personal life. This vault is an Obsidian knowledge base AND operating system. All state lives in markdown files you read, write, and maintain.

> [!warning] Not set up yet?
> If `Context/me.md` does not exist, this brain has never been onboarded. Run the `onboarding` skill (`/onboarding`) before doing anything else.

## Language

- Content files (Context, Daily, Projects, notes): **German**.
- System files (CLAUDE.md, SKILL.md, frontmatter keys): **English**.

## Session startup

On first response:
1. Silently read the latest note in `Daily/` for current context.
2. Read the `Context/` files relevant to the task at hand (not all of them).

## Knowledge routing

| Type | Route to |
|---|---|
| Who the owner is, voice, clients, tools, strategy, personal life | `Context/` |
| Daily log, session summaries, open tasks | `Daily/YYYY-MM-DD.md` |
| Active work & personal projects | `Projects/{name}/{name}.md` (folder note = index + hub) |
| Meetings & calls | `Intelligence/meetings/` |
| Decisions worth remembering | `Intelligence/decisions/entscheidungs-log.md` |
| Completed projects | `Intelligence/archive/{name}/` |
| Reusable templates, prompts, checklists, swipe files | `Resources/` |
| Vault workflows & skill notes | `Skills/` |
| Unsorted captures to triage later | `Inbox/` |
| Which tools are connected | `connections.md` |

## Rules

1. Meaningful work gets saved to the right folder automatically. Never ask permission, never write to vault root.
2. Use `[[wikilinks]]` for every person, client, and project mentioned in vault files.
3. Log every real decision (date, decision, reasoning) to `Intelligence/decisions/entscheidungs-log.md`.
4. Every note is standalone and composable.
5. Each note gets frontmatter with at least `type:` and `date:`.
6. Don't update vault files on casual chat.
7. Wikilinks are for vault-internal targets only; external URLs always use `[text](url)`.
8. Highlight key facts with Obsidian callouts (`> [!warning]`, `> [!tip] Titel`, `> [!example]-` foldable) instead of bold paragraphs.
9. Overviews that list other notes (project dashboards, indexes) are `.base` files (Obsidian Bases) driven by frontmatter — never hand-maintained markdown tables that go stale. Existing dashboard: `Projects/projekte.base`.

For Obsidian-specific syntax (wikilinks, embeds, callouts, properties, Bases), the skills `obsidian-markdown` and `obsidian-bases` in `.claude/skills/` are the reference — follow them when writing vault files.

## Anti-patterns

- Don't duplicate the filename as a `# Title` heading.
- Don't create orphan notes — link them from somewhere. New wikilinks either point at an existing note or you create the target as a real hub note — never leave empty stubs.
- Never leave `[bracketed placeholders]` in written files.
