---
name: qna-logger
description: Logs substantive question→answer exchanges into .chat-history/qna.md with markdown visuals (mermaid/tables/callouts) where applicable, newest-on-top, plus a MANDATORY verbatim capture of the user's question exactly as typed (recoverable from the session transcript JSONL), then syncs the qna-logger component to SYNC-REPOS.md. Use when the user asks a substantive question that gets answered, or invokes /log-qna.
---

# Q&A Logger

Use this skill when the user asks a **substantive question** that gets answered, or when they invoke
`/log-qna`. It appends a structured Q&A entry to `.chat-history/qna.md` with markdown visuals where they help.

## Purpose
- Keep a durable, re-findable log of decisions and answers (infra, GitHub/prod-flow, feature behavior,
  trade-offs, "do we have / how do I" questions).
- Enforce a consistent entry format with **question + answer + visual (where applicable)**.
- Sync the **qna-logger component** (not the log contents) to all repos in `SYNC-REPOS.md`.

## Log file
`.chat-history/qna.md` — append-only, **newest entry on top** (below the header block). Create the file with
the header/template if missing. **Contents are project-local — never cross-repo synced** (only the component
is).

## Entry format
```markdown
## <YYYY-MM-DD> · <short question title>
**Tags:** `tag1`, `tag2` · **Category:** <infra | github | feature | process | data | testing | …>

**Verbatim Q:** (MANDATORY) — the user's question EXACTLY as typed (raw, unedited, typos and all), placed
inside its own fenced code block. If it was not captured live, recover it from the session transcript JSONL.

**Q:** <the same question, lightly cleaned for readability — keep it faithful>

**A:** <condensed but complete answer — self-contained, no need to re-read the chat>

<VISUAL — include where it aids understanding; omit if it would just add noise>

**Decision / follow-up:** <the resulting decision, next action, or "none">

---
```

## Visual rules (markdown visuals where applicable)
Pick the lightest visual that clarifies. Always fence mermaid with ```mermaid.

| Answer shape | Visual |
|---|---|
| A process, dependency, or decision path | `flowchart LR/TD` or `stateDiagram-v2` |
| A request/response or multi-actor flow (PR review, auth) | `sequenceDiagram` |
| An either/or comparison (mode A vs B, option table) | a **markdown table** |
| A key fact / caveat / standing decision | a `>` **callout** |
| A hierarchy / relationship | `graph`/`flowchart` |

- Keep mermaid diagrams small (≤ ~8 nodes) and readable.
- A comparison table is often clearer than a diagram — prefer it for "X vs Y".
- Not every entry needs a diagram; a table or callout counts as the visual. Omit entirely only when the
  answer is a single plain fact.

## Workflow
1. If `.chat-history/qna.md` does not exist, create it with the header + template block.
2. Compose the entry: faithful question, condensed answer, the right visual, and the decision/follow-up.
3. **Insert it at the TOP** (newest-on-top), directly under the header block's closing `---`.
4. Redact secrets — log the *location/shape* of a key, never its value.
5. Sync the **component** to `SYNC-REPOS.md` targets (see below).

## Verbatim capture (MANDATORY)
Every Q&A entry MUST record a **Verbatim Q** — the user's question EXACTLY as typed (raw, unedited, with
typos/casing/punctuation/whitespace preserved) — in a fenced code block, IN ADDITION to the
readability-cleaned `**Q:**` line. Example:

```text
how do i get the required keys for f4 to acrtually test functionality
```

- Source of truth = the raw prompt as the user typed it. If it was not captured live, recover the verbatim
  text from the session transcript JSONL (`~/.claude/projects/<project-slug>/<session-id>.jsonl`) — the same
  mechanism the `chat-history-convention` skill uses (genuine `"type":"user"` turns with plain-string
  `content`; exclude tool_result / `<system-reminder>` / `<command-*>` wrappers and auto-generated control
  markers).
- Redact only secret VALUES (keys/tokens) — keep everything else verbatim.

## What NOT to log
- Secret values (keys/tokens/passwords). Log where/what shape they are, never the value.
- Trivial confirmations or pure instructions with no informational answer.
- Anything the user asked to keep out of the log.

## Sync step (component, not contents)
After writing the entry, propagate the **qna-logger component files** to every repo in `SYNC-REPOS.md`:
- `.claude/agents/qna-logger/AGENT.md`, `.claude/skills/qna-logger/SKILL.md`,
  `.claude/commands/log-qna.md`, `.claude/system_docs/qna_logger/**`
- the `.codex/` mirrors of each

Prefer `/sync-component` (copy-out) then `/sync-flush` (commit+push). The **`.chat-history/qna.md` contents
are project-local and are NOT synced** — each repo grows its own log. Report per-repo results; flag failures.

## Typical trigger phrases
- "do we have…", "how do I…", "can we…", "what's the difference between…", "which should…"
- decision/clarification questions whose answer is worth keeping
- `/log-qna`
