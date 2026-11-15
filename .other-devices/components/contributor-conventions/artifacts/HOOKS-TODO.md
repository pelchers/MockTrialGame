# HOOKS-TODO — contributor-conventions

> **The orchestrator owns the hook scripts + their `settings.json` registration (safety-critical).**
> This component was built **without** creating either hook script and **without** editing
> `settings.json` (`.claude/settings.json` or `.codex/hooks/settings.json`). The two hooks are
> **specified precisely below** so the orchestrator can build, register, and test them. Until then, the
> skill + declaration file govern behavior; the hooks are the automated assurance layer that backs them.

## Left for the orchestrator

1. **Build `contributor-repo-check.sh`** (SessionStart) — spec below.
2. **Build `contributor-push-guard.sh`** (PreToolUse on Bash/PowerShell) — spec below.
3. **Register both in `settings.json`** (`hooks.SessionStart` + `hooks.PreToolUse`), `.claude` and its
   `.codex` mirror.
4. **Test** both (banner prints on a contributor repo; guard blocks an upstream push lacking
   `CONTRIBUTOR_PUSH_OK=1` and allows working-remote pushes + marked upstream pushes).
5. **Mirror** the finished scripts `.claude/hooks/scripts/` ⇄ `.codex/hooks/scripts/`.

---

## Hook 1 — `contributor-repo-check.sh` (SessionStart)

**Trigger:** SessionStart.
**Reads:** `repo.local.md` at the repo root.
**Behavior:**
- If Section 1 = **`contributor`**, print exactly:
  ```
  CONTRIBUTOR repo — default push = <working_remote>; upstream <upstream_repo_id> is PR-only into <upstream_base>; run /promote-pr.
  ```
  substituting `working_remote`, `upstream_repo_id`, and `upstream_base` parsed from `repo.local.md`.
- If Section 1 = **`owner`**, print nothing (or a single quiet informational line) — the conventions are
  inert.
- If `repo.local.md` is missing/ambiguous, optionally print a one-line nudge to run `/declare-repo`
  (fail-safe = treat as contributor). Never error the session.

**Exit:** always success (informational only; never blocks session start).

---

## Hook 2 — `contributor-push-guard.sh` (PreToolUse, Bash/PowerShell)

**Trigger:** PreToolUse on the Bash and PowerShell tools.
**Disposition:** **FAIL-OPEN** — any uncertainty, parse failure, or missing data → **allow**.
**Block the command IFF ALL of the following hold:**
1. the command contains **`git push`**, AND
2. `repo.local.md` Section 1 = **`contributor`**, AND
3. the push **target matches the upstream** — either the `upstream_remote` URL (substring match) OR a
   git remote **named** `upstream` / `prod` / `production`, AND
4. the command **lacks** the marker **`CONTRIBUTOR_PUSH_OK=1`**.

**Never block:**
- working-remote pushes (target = `working_remote`, or any remote that is not the upstream) — always allow;
- any push carrying `CONTRIBUTOR_PUSH_OK=1` (the sanctioned promotion escape hatch) — always allow;
- anything on an **`owner`** repo — always allow;
- any case where ownership/target can't be determined with confidence — **allow** (fail-open).

**On block:** emit a short message explaining that upstream pushes on a contributor repo go through
`/promote-pr` (which sets `CONTRIBUTOR_PUSH_OK=1`), then deny the tool call.

**Rationale:** the guard is the *last* safety net, not the *only* one. Failing open keeps it narrow — it
only ever intervenes on a high-confidence upstream match — so it can never break the fast working-remote
flow. The declaration file, SessionStart banner, and skill carry the everyday intent.

---

## Registration sketch (orchestrator applies to settings.json — NOT done by this component)

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

> This block is a **sketch for the orchestrator**, not an applied change. This component did not modify
> `settings.json`.
