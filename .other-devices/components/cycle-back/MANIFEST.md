# MANIFEST — `cycle-back`

**What it is:** the **anti-forgetting** convention — a durable, resume-complete record of conversation
topics/decisions we deliberately **park** to revisit later, engineered to survive context **compaction**.
Writes to a project-local `.chat-history/cycle-back.md`; a SessionStart hook re-surfaces open items every
session so deferred threads re-enter context even after the working memory is summarized.

**Type:** component — skill + agent + command + SessionStart hook + system_docs + runbook + a managed
convention block. General-purpose (applies to any repo). Companion to `chat-history-convention` (the
transcript layer beneath it); generalizes the parked-state precedent set by `pr-shepherd`'s
`pr-watch-log.md`.

**Self-documenting package contents:**
- `MANIFEST.md` — this install map (file → target path).
- `FILE-TREE.md` — every file added/edited in the host repo (install checklist + counts).
- `artifacts/` — exact copies of the live files (skill, agent, command, hook, system_docs, runbook, log template).
- `snippets/` — the paste-ready managed convention block for the instruction files.
- `NOTES.md` — rationale + gotchas.

---

## Install into a target repo (file → target path)

| From (this package) | → Target path in destination repo | Action | Adaptation |
|---|---|---|---|
| `artifacts/SKILL.md` | `.claude/skills/cycle-back/SKILL.md` | create | — |
| `artifacts/SKILL.md` | `.codex/skills/cycle-back/SKILL.md` | create (mirror) | byte-identical |
| `artifacts/AGENT.md` | `.claude/agents/cycle-back-agent/AGENT.md` | create | — |
| `artifacts/AGENT.md` | `.codex/agents/cycle-back-agent/AGENT.md` | create (mirror) | byte-identical |
| `artifacts/cycle-back-command.md` | `.claude/commands/cycle-back.md` | create | — |
| `artifacts/cycle-back-command.md` | `.codex/commands/cycle-back.md` | create (mirror) | change ONLY `## Instructions for Claude` → `## Instructions for Codex` |
| `artifacts/cycle-back-surface.sh` | `.claude/hooks/scripts/cycle-back-surface.sh` | create | — |
| `artifacts/cycle-back-surface.sh` | `.codex/hooks/scripts/cycle-back-surface.sh` | create (mirror) | byte-identical |
| `artifacts/README.md` | `.claude/system_docs/cycle_back/README.md` | create | — |
| `artifacts/README.md` | `.codex/system_docs/cycle_back/README.md` | create (mirror) | identical |
| `artifacts/USAGE_GUIDE.md` | `.claude/system_docs/cycle_back/USAGE_GUIDE.md` | create | — |
| `artifacts/USAGE_GUIDE.md` | `.codex/system_docs/cycle_back/USAGE_GUIDE.md` | create (mirror) | identical |
| `artifacts/runbook-cycle-back.md` | `.docs/runbooks/development/cycle-back.md` | create | runbook lives ONLY in `.docs/` — do NOT mirror into `.codex` |
| `artifacts/cycle-back-log-template.md` | `.chat-history/cycle-back.md` | create ONLY IF ABSENT (header template) | **project-local — never synced**; each repo grows its own |
| `snippets/convention-snippet.md` | append the managed `cycle-back` block to `CLAUDE.md`, `.claude/CLAUDE.md`, `.codex/CODEX.md`, `.codex/AGENTS.md` | edit (idempotent) | append AFTER the last managed block; guard on the "Cycle-Back convention" marker — do NOT duplicate |

## Install steps that are edits to shared wiring

1. **SessionStart hook registration** — add a command entry to `.claude/settings.json` under
   `hooks.SessionStart[].hooks[]`:
   `{ "type": "command", "command": "bash .claude/hooks/scripts/cycle-back-surface.sh", "description": "cycle-back: surface OPEN/BLOCKED parked topics …" }`.
2. **Sync array** — add the component's paths to the PATHS array in `.claude/hooks/scripts/sync-flush.sh`
   (skill, agent, command, hook, both system_docs, runbook, portable package, and every `.codex` mirror) —
   **but NOT** `.chat-history/cycle-back.md` (project-local).
3. **Master system_docs index** — add a `cycle_back/` block to the File Tree + a System Overview row
   (1 agent · 1 skill · `/cycle-back`) in both `.claude/system_docs/README.md` and `.codex/system_docs/README.md`.
4. **`SYNC-REPOS.md`** — register `cycle-back` under "What to sync" (name its file classes; note the log is project-local).

## Per-target adaptation
- None functionally — the component is general-purpose. Only the command header differs (`.codex`).
- The log path is fixed at `.chat-history/cycle-back.md`; if a target keeps chat-history elsewhere, adjust
  the path in the hook + skill accordingly.

## Post-install validation (in the target repo)
1. `bash .claude/hooks/scripts/cycle-back-surface.sh` runs clean and is quiet with no log/entries.
2. `.claude` ⇄ `.codex` parity for skill, agent, command (command differs only in the header), hook.
3. Runbook exists under `.docs/runbooks/development/`; NOT mirrored into `.codex`.
4. `settings.json` parses and the SessionStart entry is present exactly once.
5. `/cycle-back add` writes a resume-complete entry; `/cycle-back list` prints it; `/cycle-back resolve` marks it (doesn't delete).
6. The managed `cycle-back` block is present exactly once in each of the four instruction files.

## Provenance
- Origin repo: CC-Local (`C:\Work\App\CC-Local`), lane `Asus-Work`, machine asus-laptop.
- Modeled structurally on `pr-shepherd` / `device-sync-protocol`.
- Live sources under `.claude/` + `.codex/` + `.docs/`; the log is project-local in `.chat-history/cycle-back.md`.
