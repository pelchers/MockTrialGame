---
name: plain-speech-convention
description: How to write every chat reply, report, ADR and commit message so it reads as a person wrote it. Enforces the repo's existing zero-tolerance AI-speak catalogue (f3 phase 08) plus the reply-shaped tells that catalogue cannot see. Use before sending any substantive reply, when explaining a finding, writing a report for a human reader, or when the user says output "sounds like AI".
---

<!-- plain-speech-ignore-file: this skill names the tells it bans -->

# Plain Speech Convention

Applies to every reply, report, ADR, commit message and document written for a human reader.

Standing instruction, 2026-10-20: *"you speak like ai. i need things explained humanly"*, followed by
*"we already well documented ai patterns by the way in several files in this repo"*.

## The catalogue already exists. Do not write a second one.

`.adr/orchestration/f3-ai-articles-seo@luke/08_tone-and-anti-ai-speak/ai-speak-convention-reference.md`

129 lines, zero tolerance, with code behind it: `AI_SPEAK_WORDS` / `AI_SPEAK_PHRASES` /
`AI_SPEAK_PATTERNS` in `prompt-templates.ts`, scanned by `scanAiSpeak`, auto-stripped by
`normalizeProse`. It was built to gate generated articles. **Every section of it applies to chat.**

| Section | Covers |
|---|---|
| §1 | ~140 banned words (delve, leverage, robust, seamless, pivotal, crucial, moreover, …) |
| §2 | Banned phrases, openers and closers ("it's worth noting", "at its core", "here's the thing") |
| §3 | 11 structural constructions (negative parallelism, not-only-but-also, self-answered question, tricolon overuse) |
| §4 | Punctuation tells (em dash, en dash, curly quotes, unicode arrows, ellipsis) |
| §5 | Formatting tells (signposting, bolded lead-in on every bullet, moralising endings) |

The automotive carve-outs in that file exist for car copy. They do not apply to chat.

## The one that leaks most

**Em dashes.** `normalizeProse` strips them as a 100% mechanical tell, and unedited output puts one
in nearly every sentence. Use a comma, a full stop, or brackets. Same for en dashes, curly quotes,
unicode arrows and the ellipsis character.

A quick self-check before sending: search the draft for an em dash. If one is there, the draft has
not been edited.

## Reply-shaped tells the article gate cannot see

See [`references/chat-tells.md`](references/chat-tells.md) for the full list with examples drawn
from this repo's own sessions. The short form:

1. **The delayed reveal.** "It was in the database the whole time." State the fact, then the cause.
2. **Fragment as drumroll.** "Found it." "Conclusive." Write the sentence.
3. **Bolding the punchline every paragraph.** One bolded item per section at most.
4. **A table for two facts.** Tables are for five-plus rows someone will scan or compare.
5. **Counting findings into a pattern.** "Three bugs this week, all the same shape."
6. **The closing aphorism.** End when the information ends.
7. **Narrating the investigation.** Report what is true now.
8. **Headers on a four-paragraph answer.**

## How to write the explanation instead

Say it the way you would standing at someone's desk.

1. Lead with the plain answer in an ordinary sentence.
2. Give the cause in sentences that connect: "It happened because X, which meant Y."
3. Say what it means for the reader and what is left to do.
4. Keep a handful of numbers inline in prose. Reach for a table only past five rows.
5. Prefer the shortest true sentence. Cut any clause that only adds drama.

## What must not be lost

Plain-spoken is not vague. Keep:

- `file:line` references and exact figures
- explicit "I was wrong about X" corrections
- what was verified and what was not
- the open items and who owns them

Changing the delivery must not cost the reader a single fact. A reply that reads well and drops a
number has failed this convention, not satisfied it.

## Workflow

1. Write the reply for content first.
2. Search it for an em dash. Replace every one.
3. Read it against §1 to §5 of the article catalogue and the eight tells above.
4. Ask: would I say this sentence out loud to a colleague? If not, rewrite it.
5. Check no fact was lost in the edit.

`/plain-speech <text|path>` runs this as an audit via `plain-speech-agent`.

## Related

- `.adr/.../08_tone-and-anti-ai-speak/`: the source catalogue, its effectiveness report and notes
- Root `CLAUDE.md` → "Explain Like A Person, Not Like A Report (Required)"
- User global `CLAUDE.md` → banned constructions (antithesis, "worse than" escalation, invented taxonomy)
- `authoring-runbooks` and `creating-project-documentation`: the same voice applies there

## Run the check, do not remember it

```
node scripts/plain-speech-scan.mjs <file...>     # markdown, ts, tsx
node scripts/plain-speech-scan.mjs --staged      # everything staged
git log -1 --format=%B | node scripts/plain-speech-scan.mjs -   # a commit message
```

Exit code 1 when it finds anything, so a hook or a pre-commit can gate on it. A `PostToolUse` hook
in `.claude/settings.json` runs it on every `.md`/`.ts`/`.tsx` write and prints hits to stderr
without blocking.

**Why this exists on top of the article scanner.** `CC/apps/backend/src/modules/articles/ai-speak.ts`
scans generated ARTICLES, and its patterns are marketing tells: "not only X but also Y", "whether
you are a X or a Y", "everything from X to Y". None of those appear in explanation. The tells that
do appear in a chat reply, an ADR entry, a commit message or a code comment were not being checked
by anything, and the operator stopped the work three times over them. The third time named the gap:
the convention was a document to remember rather than a check to run.

What it catches, beyond the mechanical punctuation: `self-praise`, `whole-point`, `meta-writing`,
`pre-empt`, `worse-than`, `which-is`, `not-x-but-y`, `intensifier`. Tells 9 to 16 in
`references/chat-tells.md` explain each with examples from this repo's own output.

**One rule it deliberately does not apply to code.** The ellipsis character is banned in prose and
correct in a UI label ("Saving...", "Rendering..."), so `ellipsis-in-prose` only fires in markdown
and in comments. A rule that fights the UI is a rule that gets ignored.

**A warning from fixing the first batch.** A blanket em-dash replacement across source files broke
`splitRunKeyName`, whose regex and test data contain a literal em dash because the generator emits
one. Two tests caught it. Where a banned character is DATA, write it as `—` so a prose pass
cannot eat it.
