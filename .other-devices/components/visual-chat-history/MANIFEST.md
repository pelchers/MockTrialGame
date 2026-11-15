# MANIFEST: `visual-chat-history`

**What it is:** a local web viewer for a repo's `.chat-history/`: a clickable tab per session,
sort, filters, fuzzy search with highlighting, deep links and live updates (Server-Sent Events)
while the conversation goes on, plus a one-file static export. Node built-ins only, no install
step, no CDN. Reads the history and never writes it.

**Type:** component: skill (with scripts) + agent + command + system_docs + runbook. No hook and
no settings change. Depends on `chat-history-convention`'s `scripts/split-sessions.mjs` (shared
parser and session rule), which is shipped here too.

**Package contents:**
- `MANIFEST.md`: this install map.
- `FILE-TREE.md`: every file the component adds in a host repo, with counts.
- `NOTES.md`: design decisions and gotchas.
- `artifacts/`: exact copies of the live files.
- `snippets/chat-history-sessions-section.md`: the "Sessions folder" section appended to the end of
  `chat-history-convention/SKILL.md`.

---

## Install into a target repo (file to target path)

| From (this package) | Target path in the destination repo | Action | Adaptation |
|---|---|---|---|
| `artifacts/SKILL.md` | `.claude/skills/visual-chat-history/SKILL.md` | create | none |
| `artifacts/SKILL.md` | `.codex/skills/visual-chat-history/SKILL.md` | create (mirror) | byte-identical |
| `artifacts/scripts/viewer.mjs` | `.claude/skills/visual-chat-history/scripts/viewer.mjs` | create | none |
| `artifacts/scripts/viewer.mjs` | `.codex/skills/visual-chat-history/scripts/viewer.mjs` | create (mirror) | byte-identical |
| `artifacts/scripts/app/index.html` | `.claude/skills/visual-chat-history/scripts/app/index.html` | create | none |
| `artifacts/scripts/app/app.css` | `.claude/skills/visual-chat-history/scripts/app/app.css` | create | none |
| `artifacts/scripts/app/app.js` | `.claude/skills/visual-chat-history/scripts/app/app.js` | create | none |
| `artifacts/scripts/app/*` | `.codex/skills/visual-chat-history/scripts/app/*` | create (mirror) | byte-identical |
| `artifacts/AGENT.md` | `.claude/agents/visual-chat-history-agent/AGENT.md` | create | none |
| `artifacts/AGENT.md` | `.codex/agents/visual-chat-history-agent/AGENT.md` | create (mirror) | byte-identical |
| `artifacts/visual-chat-history-command.md` | `.claude/commands/visual-chat-history.md` | create | none |
| `artifacts/visual-chat-history-command.md` | `.codex/commands/visual-chat-history.md` | create (mirror) | change ONLY `## Instructions for Claude` to `## Instructions for Codex` |
| `artifacts/README.md`, `USAGE_GUIDE.md`, `ARCHITECTURE.md` | `.claude/system_docs/visual_chat_history/` | create | none |
| same three | `.codex/system_docs/visual_chat_history/` | create (mirror) | identical |
| `artifacts/runbook-visual-chat-history.md` | `.docs/runbooks/development/visual-chat-history.md` | create | runbook lives ONLY in `.docs/`; its validation section describes CDP's run |
| `artifacts/scripts/split-sessions.mjs` | `.claude/skills/chat-history-convention/scripts/split-sessions.mjs` and the `.codex` mirror | create or replace | part of `chat-history-convention`; required by the viewer |
| `snippets/chat-history-sessions-section.md` | end of `.claude/skills/chat-history-convention/SKILL.md` and the `.codex` mirror | APPEND only, if the file has no `## Sessions folder` heading | never change or reorder existing lines |

## Shared wiring

1. **Sync lists:** add every path above to `FILES` in `.claude/hooks/scripts/sync-component.sh` and
   to `PATHS` in `.claude/hooks/scripts/sync-flush.sh` (and the `.codex` copies), plus this
   package folder. Never add `.chat-history/sessions/`, `.chat-history/exports/` or any
   `user-messages*` file.
2. **`SYNC-REPOS.md`:** register `visual-chat-history` under "What to sync", noting chat contents
   and generated HTML stay project-local.
3. **Master system_docs index** (optional): a `visual_chat_history/` block in
   `.claude/system_docs/README.md` and `.codex/system_docs/README.md`.
4. The viewer adds no hook. The sessions folder it shows is kept current by
   `chat-history-convention`'s hook `.claude/hooks/scripts/chat-history-sessions-sync.sh` (copy in
   `artifacts/hooks/`), registered in `.claude/settings.json` on PostToolUse (Edit|Write), Stop and
   SessionStart (added 2026-11-15).

## Per-target adaptation

None. The code has no project names or paths: it finds `.chat-history/` from the folder it runs
in, reads `user-messages.md`, `user-messages.log`, any `user-messages*.md` segment and
`sessions/*.md`, and picks port 4700 unless told otherwise. If 4700 is used by a repo's own app,
document a different port in that repo (`VISUAL_CHAT_HISTORY_PORT`).

## Post-install validation (in the target repo)

1. `node .claude/skills/visual-chat-history/scripts/viewer.mjs summary` lists the history files and
   sessions without errors.
2. `node .claude/skills/chat-history-convention/scripts/split-sessions.mjs --check` runs (exit 0 or
   1; 1 only means `sessions/` has not been generated yet).
3. `start`, open `http://127.0.0.1:4700/`, see the tabs, then `stop`.
4. `.claude` and `.codex` copies match (the command differs only in the header line).

## Provenance

- Origin repo: CDP (`C:\App\CDP`), branch `main`, host VENGEANCE, 2026-11-15.
- Validation evidence: CDP `.docs/runbooks/development/visual-chat-history/` (4 screenshots) and the
  runbook's Validation section.
