---
name: optimize
description: Vault maintenance for the second brain. Finds and fixes broken wikilinks, contradictions, duplicates, stale routing tables, bloated system files, and knowledge stuck in Daily notes. Use when the user runs /optimize or asks to clean up the vault.
---

# Optimize — Vault Maintenance

Keep the vault lean and truthful. Run weekly or bi-weekly. Report in German.

## Checks (in order)

1. **Routing truth.** Does every row in the root `CLAUDE.md` routing table point to a folder that exists and actually contains what the row claims? Fix descriptions that drifted.
2. **Broken wikilinks.** Grep all `[[links]]`, verify each target file exists. Repoint or flag.
3. **Contradictions & duplicates.** Compare `Context/` files for facts that disagree, and files with heavy overlap. Propose the canonical version.
4. **Promotion.** Scan `Daily/` notes older than 7 days for durable knowledge (decisions, client facts, lessons) that never made it to `Context/` or `Intelligence/`. Promote it; leave a one-line log entry in the daily note.
5. **Bloat.** Check root `CLAUDE.md` and per-folder `CLAUDE.md` files: every line must pass the pruning test ("would removing this line make Claude mess up?"). Trim what fails.
6. **Hygiene.** Missing `type:`/`date:` frontmatter, H1s duplicating the filename, files sitting in vault root.
7. **Empty files — never just delete; understand them first.** A 0-byte note is almost always a signal, not trash. Obsidian auto-creates an empty note when someone clicks a `[[wikilink]]` whose target doesn't resolve — so the empty file is *evidence of an unmet link*. Procedure:
   - **Find the cause.** Grep for `[[<filename>]]` across the vault. Who points at it, and what did they expect to find there?
   - **Check for a name collision.** If a real note already covers that topic (often via an `aliases:` entry), the empty file is *shadowing* it — Obsidian resolves links to the literal filename over an alias, so every link silently lands on the empty stub instead of the real note. That's the trap to catch.
   - **Then pick the fit, don't default to delete:**
     - *Rename/collapse* — if a real note exists, make it own the name directly (`git mv` the real note to the linked filename, drop the now-redundant alias, repoint the few `[[old-name]]` links). Stops Obsidian from ever re-creating the empty stub, because the link now resolves to a real file. Usually the cleanest.
     - *Re-link* — if the empty file is just a typo'd or stale link target, fix the links to point at the right existing note, then delete the stub.
     - *Make it a hub* — if the links genuinely expect a note that doesn't exist yet and the topic deserves one, fill the empty file into a real hub note (frontmatter + links out to the related notes) instead of deleting it.
   - Only delete outright if nothing links to it *and* it duplicates no real note — a true orphan stub.
8. **Archive.** Projects with `status: completed` still in `Projects/` → move to `Intelligence/archive/`.

## How to apply fixes

- **Mechanical fixes** (frontmatter, H1s, archiving): apply directly, list them in the summary.
- **Semantic fixes** (merges, repointed links, contradiction resolution, routing rewrites): walk through them with the owner one by one before applying.
- Never delete content — merge losers get moved to `Intelligence/archive/`.

## Output

Short summary in chat: what was fixed automatically, what needs the owner's call, rough tokens saved on system files. No HTML reports.
