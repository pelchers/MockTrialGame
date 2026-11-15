<!-- Paste-ready managed block. Append (idempotently) to CLAUDE.md, .claude/CLAUDE.md, .codex/CODEX.md,
     .codex/AGENTS.md — after the last existing managed block. Guard on the "Cycle-Back convention" marker;
     do NOT duplicate. -->

## Cycle-Back — never lose a deliberately-parked topic (Required)
- When a thread is **deferred rather than finished** — the user says "circle back / come back to this
  later / park this", OR you decide to defer (e.g. "give the admin time, work on X meanwhile") — record it
  with **`/cycle-back add`** (skill `cycle-back`, agent `cycle-back-agent`). It writes a **resume-complete**
  entry to the project-local **`.chat-history/cycle-back.md`**: where-in-chat pointer, why parked, resume
  trigger, exact state to rehydrate, next action.
- **Why:** long sessions get **compacted** and open threads can silently drop. A SessionStart hook
  (`cycle-back-surface.sh`) re-surfaces OPEN/BLOCKED items every session, so parked threads re-enter context
  even after compaction. Enforce the **cold-resume test** (a zero-memory reader could continue) on every
  entry — real shas/URLs/paths + decisions already made, no "see above".
- **Non-destructive:** `/cycle-back resolve` marks `RESOLVED ✓` (never deletes); `/cycle-back list` shows
  open threads; `/cycle-back check` tests whether a resume-trigger is now met. The **log is project-local
  (never synced)**; only the component syncs. Full protocol: `.docs/runbooks/development/cycle-back.md`.
