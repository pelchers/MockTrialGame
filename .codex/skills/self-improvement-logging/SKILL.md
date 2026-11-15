---
name: self-improvement-logging
description: Record how the agents actually performed on real work — the benefit, the bug/gap, how it was verified, and the commit — so the team and future agents compound. Use after a subagent finishes, after a notable action/decision/bug/fix lands, or when the user says "log the improvement", "log that outcome", "record how that went", "note the learning", "add to the self-improvement log". Appends a minimal-but-verifiable entry to `.self-improving-ai/log/<feature-or-topic>.md`, and promotes durable learnings to `.self-improving-ai/ledger.md`. Companion to `chat-history-convention` (which logs turns verbatim); this logs agent performance.
---

# Self-Improvement Logging

The **compounding** convention. Agents do a lot of real work across a session — subagent runs, remediations,
decisions — and most of what was learned evaporates when the context is summarized or the session ends.
Self-improvement logging is the deliberate, durable record of **how the agents actually performed**: per
meaningful action, the **benefit** (what worked, the pattern to keep), the **bug/gap** (what broke, was
missed, or was deferred, and how it was handled), each tied to a **commit / PR / file** and to **how it was
verified** — so a reader can chase it and future agents start smarter.

> The log lives at **`.self-improving-ai/`** (root-level, like `.docs`/`.adr`) — **project-local, NOT
> synced** (each repo grows its own, like `.chat-history/cycle-back.md` / `pr-watch-log.md`). The
> *component* (this skill, the agent, the command, the two hooks, the docs) IS synced across repos. The
> live format spec + standing rules are in `.self-improving-ai/README.md` + `.self-improving-ai/ledger.md`.
> This folder is **ours** — it is NEVER shipped to the product subtree (`CC/`); it records agent-process
> learnings, not product data.

## When to log an entry

Log the moment an action produces something worth remembering — don't wait until the end and reconstruct:

- **A subagent finished** (the Task tool returned) — record its outcome while it's fresh. The
  `PostToolUse(Task)` hook nudges you to do exactly this.
- **A notable action/decision/bug/fix landed** — a remediation, a non-obvious design call, a trap you hit
  and escaped, a false-green you caught, an honest deferral you chose over a scope-violating shortcut.
- **A phase of an orchestrated build committed** — one row per phase (benefit + bug/gap + verified +
  commit), as in the f13 build log.
- Anything a future agent would do better for having known.

Do NOT log routine, no-signal steps (a clean read, a trivial edit) or anything with no benefit AND no
bug/gap AND nothing verified — that's noise. This is a performance ledger, not a transcript (the transcript
is `chat-history-convention`'s job).

## Entry format

A log entry captures five fields (the primary shape is one table row per action, as the real logs use):

```
| when / what | commit / PR / files | benefit (what worked) | bug / gap (how handled) | verified |
|---|---|---|---|---|
| <date + which subagent/phase/task, or which decision> | `<sha>` / PR #<n> / `path:line` | <the pattern that paid off, 1–2 lines> | <what broke/was missed/was deferred + how handled; "none" is valid> | <independent check: real test counts / live CI / re-run> |
```

For a one-off action a bullet entry is equally valid:

```
### <date> — <action>
- **Commit / PR / files:** `<sha>` · PR #<n> · `path:line`
- **Benefit:** <what worked / the reusable pattern>
- **Bug / gap:** <what broke, was missed, or was deferred, and how handled — or "none">
- **Verified:** <how it was independently checked>
```

**Quality bar — the "verifiable" test:** every line must be *useful* and *checkable*. Real shas, real
paths, real test counts / CI outcomes — never vague praise ("went well", "good job"). An entry a reader
can't chase to the evidence is worse than none. Capture the *benefit AND the bug/gap honestly*: "none" is a
valid, respected value — a bare win with no gap named reads as an incomplete look, not a perfect run.

## Operations

- **add** — append a new entry for the latest subagent/action/decision to the right
  `.self-improving-ai/log/<feature-or-topic>.md` (create that file with a header if the body of work is
  new; newest row at the bottom of its section). Fill all five fields from real evidence; reconstruct the
  outcome from the subagent's report / the diff / the commit, not from memory.
- **promote** — distill a durable learning from a log into `.self-improving-ai/ledger.md` under the right
  heading (**Patterns that pay off** / **Recurring bugs / traps** / **Standing rules**), with a pointer
  back to where it was learned. Promote once a learning has recurred or is clearly reusable. Append-only.
- **list / show** — show the most recent log entries (or a given topic's timeline), and the ledger's
  standing rules, so the user (or a fresh context) sees current state and the rules in force.

## Surfacing (how it stays honest)

Two hooks keep the log paced with the work, not reconstructed after:

- **SessionStart** — `.claude/hooks/scripts/self-improvement-surface.sh` prints a short banner that the log
  is active (standing-rule count + newest log topic), so a fresh or just-compacted session keeps
  documenting. Quiet when the folder is absent. Disable with `SELF_IMPROVING_AI_SURFACE=off`.
- **PostToolUse(Task)** — `.claude/hooks/scripts/self-improvement-log-reminder.sh` fires right after a
  subagent finishes and nudges you to record that subagent's outcome (benefit + bug/gap + verified +
  commit). Advisory only; never blocks. Disable with `SELF_IMPROVING_AI_REMINDER=off`.

(The hooks are already registered — this skill only references them.)

## GUARDRAILS

- The log is **project-local** — never add `.self-improving-ai/` contents to a sync set; each repo grows
  its own (only the component files sync). The folder is **ours** — never ship it to the product subtree.
- **Verifiable or don't write it** — real shas/paths/test-counts, never vague praise. An entry you can't
  chase to evidence is false confidence.
- **Never fabricate a benefit or a bug** — "none" is the honest value when there was none. Do not invent a
  gap to look thorough, and do not hide one to look clean.
- **Append/annotate, don't rewrite history** — the log is a record of what was true when written; correct
  with a new entry, don't silently edit away a past assessment.
- **No secrets, no customer data** — reference people by role, not name; shas/PRs/paths are the evidence.

## Related
- Command `/log-improvement add|promote|list|show` (with `$ARGUMENTS`) · agent `self-improvement-logger-agent`.
- Hooks: `.claude/hooks/scripts/self-improvement-surface.sh` (SessionStart) ·
  `.claude/hooks/scripts/self-improvement-log-reminder.sh` (PostToolUse(Task)).
- Log root + live format/rules: `.self-improving-ai/README.md` · `.self-improving-ai/ledger.md` ·
  `.self-improving-ai/log/<feature-or-topic>.md`.
- Companion: `chat-history-convention` (logs every turn verbatim) · `cycle-back` (parks deferred threads) —
  both project-local logs with a synced component, same split as this one.
