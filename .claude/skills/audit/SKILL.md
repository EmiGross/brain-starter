---
name: audit
description: Weekly gap report for the second brain. Checks the four layers — Context (does the brain know enough?), Connections (which tools are wired up?), Capabilities (which workflows exist as skills?), Cadence (what runs on a rhythm?) — and reports the biggest gaps. Use when the user runs /audit or asks for a vault health check.
---

# Weekly Audit — Four-Cs Gap Report

Produce a short, honest gap report across four layers. Output in German, direct tone, no fluff.

## Procedure

1. **Context.** Read `Context/` and the last 7 `Daily/` notes. Which questions came up this week that the vault couldn't answer? Which Context files are thin, stale (see Age decay below), or contradict each other? Did durable knowledge get stuck in `Daily/` without being promoted?
2. **Connections.** Read `connections.md`. Which tools did the owner mention this week (in Daily notes or chat) that are still `manual` or missing from the table? Flag the one connection that would save the most time.
3. **Capabilities.** Read `Skills/` and `.claude/skills/`. Which workflow did the owner do by hand 2+ times this week that should become a skill?
4. **Cadence.** What ran on a rhythm this week (audit, level-up, optimize, daily notes)? What was skipped?

## Age decay

Knowledge expires at different rates depending on where it lives (principle from the [Cerebras knowledge-base post](https://www.cerebras.ai/blog/how-we-built-our-knowledge-base)). Check `updated:` (fallback `date:`) frontmatter against these thresholds:

| Folder | Threshold | Action when exceeded |
|---|---|---|
| `Context/` | 4 weeks | Warn in the report **and ask the owner directly** what the current state is (per file, concrete question — not "is this stale?") |
| `Projects/{name}/` (active) | 4 weeks without note update AND no mention in Daily notes | Ask the owner for a project status update |
| `connections.md` | 4 weeks | Warn — tool landscape drifts silently |
| `Resources/`, `Skills/`, `Intelligence/archive/` | exempt | Timeless or deliberately frozen — never flag for age alone |

Stale is a signal, not a verdict: a file can be old AND correct. The questions to the owner go into the chat report (not just the saved file), so they can answer them on the spot.

## Output format

```markdown
# Audit YYYY-MM-DD

## Context — Note: x/10
(2-4 findings, each with file path)

## Connections
(gaps in connections.md)

## Capabilities
(repeated manual work that should be a skill)

## Cadence
(what ran, what was skipped)

## Top 3 Empfehlungen
1. ... (highest leverage first)
```

Save the report to `Intelligence/decisions/audit-YYYY-MM-DD.md` and give the user the Top 3 in chat. Maximum 3 recommendations — this is a focus tool, not a backlog generator.
