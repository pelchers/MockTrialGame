---
name: plain-speech
description: Audit a draft reply, report, ADR or commit message for AI-speak and rewrite it to read as a person wrote it, without losing any facts. Scans the repo's zero-tolerance catalogue (f3 phase 08) plus the eight reply-shaped tells.
invocable: true
---

# /plain-speech: make it read as a person wrote it

Runs the `plain-speech-convention` skill via `plain-speech-agent` over a draft, reports the
offenders with line references, and returns a rewritten version that loses no facts.

`$ARGUMENTS` selects what to audit:

- `/plain-speech` audits the reply just written, or the one about to be sent.
- `/plain-speech <path>` audits a file (a report, ADR, runbook, handoff entry).
- `/plain-speech <text>` audits the text given inline.
- `/plain-speech check <path>` reports offenders only, and does not rewrite.
- `/plain-speech rules` prints the convention and the eight chat tells without auditing anything.

## What it scans

1. **Mechanical tells**, always wrong: em dash, en dash, curly quotes, unicode arrows, ellipsis
   character, non-breaking space. `normalizeProse` strips these in the article pipeline for the same
   reason.
2. **The repo catalogue**:
   `.adr/orchestration/f3-ai-articles-seo@luke/08_tone-and-anti-ai-speak/ai-speak-convention-reference.md`:
   ~140 banned words, the phrase list, 11 structural constructions, formatting tells.
3. **The eight reply-shaped tells**:
   `.claude/skills/plain-speech-convention/references/chat-tells.md`: delayed reveal, fragment as
   drumroll, bolded punchline, table for two facts, counted taxonomy, closing aphorism, narrated
   investigation, headers on a short answer.

## What it will not do

It takes an inventory of every number, `file:line`, correction and open item before rewriting, and
checks them all back in afterwards. A rewrite that reads better and drops a figure is a failure, not
a success. It will not add hedging, soften a correction, or touch quoted user words, code or log
output.

## Related

- Skill: `plain-speech-convention`
- Agent: `plain-speech-agent`
- Root `CLAUDE.md` → "Explain Like A Person, Not Like A Report (Required)"
