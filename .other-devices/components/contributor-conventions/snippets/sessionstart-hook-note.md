# The two hooks — ORCHESTRATOR-OWNED (this component does NOT build them or edit settings.json)

This component ships the **skill, commands, agent, declaration file, runbook, and system_docs** — but
**not** the two hook scripts and **not** any `settings.json` change. The hooks are **safety-critical**,
so the **orchestrator** builds the scripts, registers them in `settings.json`, and tests them. This
component only **specifies** them (full spec: `../artifacts/HOOKS-TODO.md` and the system_docs
`HOOKS-TODO.md`).

## What the orchestrator must build + wire

### Hook 1 — `contributor-repo-check.sh` (SessionStart)
- Reads `repo.local.md`.
- On `contributor`, prints:
  ```
  CONTRIBUTOR repo — default push = <working_remote>; upstream <upstream_repo_id> is PR-only into <upstream_base>; run /promote-pr.
  ```
- On `owner` (or no contributor declaration), prints nothing / a quiet line. Never errors the session.

### Hook 2 — `contributor-push-guard.sh` (PreToolUse, Bash/PowerShell) — FAIL-OPEN
- Block a command **iff ALL**: it contains `git push` AND `repo.local.md` = `contributor` AND the target
  matches the `upstream_remote` URL (substring) or a remote named `upstream`/`prod`/`production` AND the
  command **lacks** `CONTRIBUTOR_PUSH_OK=1`.
- **Any uncertainty → allow.** Never touches working-remote pushes. Never blocks a push carrying
  `CONTRIBUTOR_PUSH_OK=1` (the sanctioned promotion escape hatch) or anything on an `owner` repo.

## Registration sketch (orchestrator applies to settings.json — NOT applied here)

```jsonc
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command",
        "command": "bash .claude/hooks/scripts/contributor-repo-check.sh",
        "description": "Announce contributor repo + safe default push target (contributor-conventions)" } ] }
    ],
    "PreToolUse": [
      { "matcher": "Bash|PowerShell", "hooks": [ { "type": "command",
        "command": "bash .claude/hooks/scripts/contributor-push-guard.sh",
        "description": "Fail-open guard: block accidental upstream push on a contributor repo (contributor-conventions)" } ] }
    ]
  }
}
```

> Reminder: this is a **sketch for the orchestrator**, not an applied change. The component's install
> **must not** create the hook scripts or edit `settings.json`.
