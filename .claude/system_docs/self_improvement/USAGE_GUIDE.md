# Self-Improvement Logging — usage guide

## Log an outcome
- **Natural:** "log how that went", "record that outcome", "note the learning", "add that to the
  self-improvement log".
- **Command:** `/log-improvement add <topic>` (omit `<topic>` to use the body of work just finished).
- **Automatic nudge:** the PostToolUse(Task) hook reminds you to log a subagent's outcome right after it
  finishes.
- The agent appends a verifiable entry to `.self-improving-ai/log/<feature-or-topic>.md` (one row per
  action, newest at the bottom of its section):

```
| when / what | commit / PR / files | benefit (what worked) | bug / gap (how handled) | verified |
|---|---|---|---|---|
| <date + subagent/phase/decision> | `<sha>` / PR #<n> / `path:line` | <pattern that paid off> | <what broke/missed/deferred + how handled, or "none"> | <real test counts / live CI / re-run> |
```

A one-off action can use a bullet block instead (same five fields: when/what, commit/PR/files, benefit,
bug/gap, verified).

**The verifiable test:** before saving, confirm every field is chaseable to real evidence — shas, paths,
test counts, CI outcome. No vague praise ("went well"). **"none"** is the honest value for a missing
bug/gap; **never fabricate** a benefit or a bug to look thorough or clean.

## Distill a learning (promote)
- `/log-improvement promote <learning>` — move a durable learning from a `log/*.md` into
  `.self-improving-ai/ledger.md`, under the right heading:
  - **Patterns that pay off** — reusable approaches to keep doing.
  - **Recurring bugs / traps** — failure classes to watch for.
  - **Standing rules** — the numbered rules those learnings produced (apply every time).
- Promote once a learning has recurred or is clearly reusable; keep a pointer back to where it was learned.
  Append-only — add alongside existing items, don't rewrite them.

## See current state
- `/log-improvement list` (or `show`) — prints the most recent log entries (or a named topic's timeline) +
  the ledger's standing rules.
- **Automatic:** the SessionStart hook prints a banner each session (even after compaction) that the log is
  active, with the standing-rule count + the newest log topic. Read the ledger before working so the
  standing rules are in force.

## Good vs bad entries
- ✅ "f13 phase 04 read API (`78424590`): closed PII-free DTOs + null-preserving `metricCell`; bug/gap:
  DB smoke drove Drizzle+core not full Fastify (avoided a hang) — hermetic route spec covers HTTP;
  verified: 156 specs incl. PII sweep 0 findings across 7 endpoints." → chaseable, honest, useful.
- ❌ "The analytics agent did a great job on the API." → no sha, no gap, nothing verified; evaporates and
  teaches nothing.

## When NOT to use it
- Routine, no-signal steps (a clean read, a trivial edit) with no benefit, no bug/gap, and nothing
  verified → leave them out; this is a performance ledger, not a transcript.
- Verbatim turn logging → that's `chat-history-convention`'s job.

## Scope + privacy
- `.self-improving-ai/` is **ours and project-local** — never synced, never shipped to the product subtree
  (`CC/`). No secrets, no customer data; reference people by role, not name. Shas/PRs/paths are the evidence.

## Toggles
- `SELF_IMPROVING_AI_SURFACE=off` disables the SessionStart banner.
- `SELF_IMPROVING_AI_REMINDER=off` disables the PostToolUse(Task) reminder.
- (The log + command keep working regardless.)
