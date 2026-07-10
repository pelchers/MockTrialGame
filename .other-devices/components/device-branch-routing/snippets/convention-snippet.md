<!-- Paste this block into the target repo's CLAUDE.md / .claude/CLAUDE.md (Markdown)
     and adapt the heading depth for .codex/CODEX.md (####) and .codex/AGENTS.md (##).
     Adjust the device list + branch names to the target project. -->

### Device Branch Convention (PRIMARY)
- **Active device, default target, and release method are read from `device.local.md`** (repo
  root, tracked per-branch (committed; no-ignore policy) — copy `device.local.example.md` on a new machine). This is the ONLY file you
  edit to change git behavior per device.
- Resolution + push-gate logic: skill `device-branch-routing`. New-device setup: runbook
  `.docs/runbooks/development/device-branch-convention.md`.
- Defaults: 🖥 `home-desktop` → `Home-Work`; 💻 `asus-laptop` → `Asus-Work`; `main` =
  handoff/savepoint/stable/prod synced at wind-down. Release method default: `direct-push`.
- A `SessionStart` hook reports branch + ahead/behind-vs-`main` every conversation.
- If `device.local.md` is missing or ambiguous, STOP and ask — never guess a push target.
