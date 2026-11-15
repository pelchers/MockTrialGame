---
name: feature-user-docs
description: Maintains a per-feature `user-docs/` reading map — an OVERVIEW.md that lists the FULL absolute path to every pertinent file for that feature, with one or two sentences per path saying what the file is, what to read in it, and why it matters. Home is `.docs/planning/<feature>/user-docs/`. Use when a feature needs an orientation map, when an ADR phase completes (the hook fires), when a cold reader asks "where do I start on feature X", or on `/feature-user-docs <feature>`.
user_invocable: true
trigger: ADR phase completion for a feature (PostToolUse hook), SessionStart drift check, or explicit /feature-user-docs invocation
---

# Feature User Docs Skill

## Purpose

Every feature folder gets a `user-docs/` subfolder whose job is **orientation, not explanation**. It answers
one question for a reader with zero context: *which files do I open, in what order, and why?*

The deliverable is a **reading map** — not a tutorial, not an architecture essay. Every entry is a real,
verified path plus one or two sentences of orientation.

## Home: `.docs/planning/<feature>/user-docs/`

| Tree | Role | Holds `user-docs/`? |
|---|---|---|
| `.docs/planning/<feature>/` | **Human-facing docs** — README, prd, feature-explained, guides, user-testing-instructions | **YES — this is the home** |
| `.adr/orchestration/<feature>/` | **Phase/implementation record** — prd, technical_requirements, per-phase `primary_task_list.md`, Outcome sections, evidence | No — pointer stub only |

A reading map is human-facing orientation, so it lives in the planning tree alongside the other
human-facing docs (`feature-planning-spec` already owns that tree). The ADR tree is a *record of work
performed*, phase by phase; dropping an orientation doc there would mix audiences.

A 4-line **pointer stub** is written at `.adr/orchestration/<feature>/user-docs/README.md` so an agent
working in the ADR tree still finds the map. The stub contains no content of its own — only the path to
the home.

## Files in a feature's `user-docs/`

| File | Author | Purpose |
|---|---|---|
| `OVERVIEW.md` | **Model** (this skill / the agent) | THE reading map. Grouped, full-path, prose-annotated, start-here-marked. |
| `path-inventory.md` | **Script** (`scripts/feature-user-docs.py scan --write`) | GENERATED raw material + staleness detector. Every candidate path with `VERIFIED` / `MISSING`. Never hand-edit. |

## Hard rules

1. **Never write a path you have not verified exists.** A reading map with a dead path is worse than no
   map. Run `scan` (which checks the filesystem) and `verify` (which re-checks every path the OVERVIEW
   cites) before you call the map done.
2. **Every entry carries BOTH paths** — the full absolute path as it exists on this machine, and the
   repo-relative path. Absolute for "open this now", relative for portability and review.
3. **One or two sentences per entry**, covering three things: *what it is*, *what to read in it*, *why it
   matters*. Not a summary of the whole file.
4. **Mark the "start here" set** — exactly three files, numbered, so a cold reader knows where to begin.
5. **State what is deliberately NOT included and why.** An absent path must read as a decision, not an
   oversight.
6. **Report, don't guess.** Any path named in the planning/ADR docs that does not exist on disk goes in
   the `Mentioned but not verified` section with the doc that named it — never silently into the map.
7. Paths in `CC/` are **read-only** for this skill. The map describes the product subtree; it never edits
   it.

## Workflow

### 1. Resolve the feature

Accept a feature id (`f11-weekly-email-automations-and-article-images@luke`) or a fuzzy prefix (`f11`).
Resolve against `.adr/orchestration/` and `.docs/planning/` — a feature normally exists in both.

```
python .codex/skills/feature-user-docs/scripts/feature-user-docs.py list-features
```

### 2. Generate the path inventory (deterministic)

```
python .codex/skills/feature-user-docs/scripts/feature-user-docs.py scan <feature> --write
```

This writes `.docs/planning/<feature>/user-docs/path-inventory.md`. It:

- walks the ADR feature folder and the planning feature folder;
- regex-extracts every app path **mentioned** in those docs (`apps/…`, `packages/…`, `sql/…`,
  `scripts/…`, `.app-docs/…`) and resolves each against `CC/`;
- **expands every discovered backend/frontend module directory** so sibling files the docs never named
  are still surfaced (this is how `campaign-blocks.ts` gets found);
- stats every candidate and marks it `VERIFIED` or `MISSING`;
- groups by role (start-here candidates, backend module, admin UI, storefront, schema + migrations,
  wiring + config, tests, ADR phase docs, planning docs, conventions + runbooks, evidence).

### 3. Read enough to annotate honestly

For each `VERIFIED` path, read enough to write its two sentences truthfully — usually the first 40-60
lines plus any exported symbol list. **Do not annotate a file you did not open.** If a file is too large
to read fully, say what you read ("read the exported `CAMPAIGN_DEFS` table at the top").

### 4. Write `OVERVIEW.md`

Follow `references/overview-template.md` exactly. Order the groups so the reading order is the narrative
order: start-here → the core module → the surfaces → the data layer → the record → the evidence.

### 5. Verify

```
python .codex/skills/feature-user-docs/scripts/feature-user-docs.py verify <feature>
```

Exits non-zero and names every dead path. **A non-zero verify means the map is not done.** Fix the path
or move it to `Mentioned but not verified`.

### 6. Write the ADR pointer stub

`.adr/orchestration/<feature>/user-docs/README.md` — see `references/adr-pointer-stub.md`.

## Auto-fire: what is real and what is a prompt

Claude Code hooks fire on **events** (`SessionStart`, `PostToolUse`, `Stop`, …), never on arbitrary repo
state. So "regenerate on ADR phase completion" is implemented honestly as two halves:

| Half | Mechanism | Genuinely automatic? |
|---|---|---|
| `path-inventory.md` refresh | `PostToolUse(Edit\|Write)` → `feature-user-docs-detect.sh` runs the scanner and **writes the file** | **YES — a real file write, no model involved** |
| `OVERVIEW.md` prose refresh | the same hook prints MANDATORY instructions naming the newly-complete phase and the added/removed paths | **NO — detect-and-instruct.** The prose needs a model. |

The hook also runs in `--session-scan` mode on `SessionStart` to catch completions that happened outside a
hook-visible edit (another device, a `sed` through Bash, a merge).

**Never claim the overview auto-regenerates.** It is refreshed by the agent when the hook tells it to.

### Completion signal (how the hook knows a phase finished)

A phase folder's `primary_task_list.md` is COMPLETE when **either**:

1. its leading blockquote matches `> **STATUS: [CORE|BACKEND|PARTIAL] (DONE|COMPLETE)` — the repo's
   established marker (`> **STATUS: DONE (2026-10-05) — …**`), **or**
2. its `## Outcome` section is filled in — heading carries a date (`## Outcome (2026-10-04)`) or the body
   is something other than the scaffold placeholder `_(filled in on completion …)_`.

Not complete: `PLANNED`, `APPROVED FOR BUILD`, `IN PROGRESS`, `BLOCKED`, `DEFERRED`, `NOT STARTED`,
`SCAFFOLDED`.

The fingerprint of complete phases per feature is cached in `.git/feature-user-docs/<feature>.state`
(untracked, same pattern as `.git/component-sync-pending`) so the hook fires **once per transition**, not
on every edit.

## Invocation

```
/feature-user-docs f11                 # refresh one feature's map
/feature-user-docs --all               # every feature that has a planning or ADR folder
/feature-user-docs --verify f11        # path check only, no writes
/feature-user-docs --status            # phase-completion + map-staleness report
```

## Scope

- Writes ONLY to `.docs/planning/<feature>/user-docs/` and the ADR pointer stub.
- Never edits `CC/` (the product subtree), never commits, never pushes.
- Reads `.adr/orchestration/<feature>/**`, `.docs/planning/<feature>/**`, and `CC/**`.

## References

- `references/overview-template.md` — the required OVERVIEW.md shape
- `references/adr-pointer-stub.md` — the 4-line ADR cross-link
- `references/sync-manifest.md` — exactly which files this component syncs
- `scripts/feature-user-docs.py` — `scan` / `verify` / `status` / `list-features`
- Worked example: `.docs/planning/f11-weekly-email-automations-and-article-images@luke/user-docs/OVERVIEW.md`
- Sibling convention: `.codex/skills/feature-planning-spec/SKILL.md` (owns the rest of the planning tree)
