# MANIFEST — `device-branch-routing`

**What it is:** device-aware git branch routing. A single per-branch tracked toggle file
(`device.local.md`, three checkboxes) tells the AI agent which machine it's on; the agent then
commits/pushes to the right branch by default. A `SessionStart` hook reports branch +
ahead/behind-vs-`main` every conversation, and a skill enforces that the work laptop never
auto-pushes to `main`.

**Type:** full component (skill + hook + command + system_docs + runbook + template + convention).

**Self-documenting package contents:**
- `FILE-TREE.md` — every file added/edited in the host repo (the install checklist).
- `artifacts/` — exact copies of the live files.
- `plans/` — the design/decisions planning doc.
- `snippets/` — paste-ready CLAUDE/CODEX block, `settings.json` wiring, `.gitignore` line.
- `NOTES.md` — development context + rationale.

---

## Install into a target repo (file → target path)

| From (this package) | → Target path in destination repo | Action |
|---|---|---|
| `artifacts/SKILL.md` | `.claude/skills/device-branch-routing/SKILL.md` | create |
| `artifacts/SKILL.md` | `.codex/skills/device-branch-routing/SKILL.md` | create (swap `.claude`→`.codex` in the "Related" paths) |
| `artifacts/device-sync-check.sh` | `.claude/hooks/scripts/device-sync-check.sh` | create |
| `artifacts/device-sync-check.sh` | `.codex/hooks/scripts/device-sync-check.sh` | create |
| `artifacts/device.md` | `.claude/commands/device.md` | create |
| `artifacts/device.md` | `.codex/commands/device.md` | create (change header to `Instructions for Codex`, paths `.claude`→`.codex`) |
| `artifacts/system_docs-README.md` | `.codex/system_docs/device_branch_routing/README.md` | create |
| `artifacts/runbook-device-branch-convention.md` | `.docs/runbooks/development/device-branch-convention.md` | create |
| `artifacts/device.local.example.md` | `device.local.example.md` (repo root) | create |
| `plans/2-device-aware-branch-convention.md` | `.docs/planning/plans/<n>-device-aware-branch-convention.md` | create (renumber) |
| `snippets/convention-snippet.md` | append to `CLAUDE.md`, `.claude/CLAUDE.md`, `.codex/CODEX.md`, `.codex/AGENTS.md` | edit |
| `snippets/settings-sessionstart-snippet.json` | merge into `.claude/settings.json` `hooks` | edit |
| `snippets/gitignore-snippet.txt` | **do NOT add to `.gitignore`** (no-ignore policy — read the file) | n/a |

## Per-target adaptation

- **Device names / branches:** edit the device list and branch names in the toggle template,
  skill resolution table, hook (`Asus-Work`, `home-desktop`, etc.), and convention snippet to suit
  the target project's machines. The *shape* is identical; only names change.
- **Main branch name:** if the target's release branch isn't `main`, change `MAIN="main"` in the
  hook and the references in the skill/runbook.

## Post-install validation (run in the target repo)

1. `cp device.local.example.md device.local.md` and tick a device.
2. `bash .claude/hooks/scripts/device-sync-check.sh` → prints a correct banner.
3. `git ls-files device.local.md` → prints the path (tracked per-branch); it is NOT in any `.gitignore`.
4. Confirm `.claude` ⇄ `.codex` parity (`syncing-claude-codex` skill).

## Provenance
- Origin repo: DualLeads, branch `Asus-Work`, machine `asus-laptop` (hostname LUKE).
- Live sources mirror under `.claude/` + `.codex/` + `.docs/` of the origin repo.
