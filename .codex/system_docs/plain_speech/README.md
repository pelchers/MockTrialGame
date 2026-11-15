# Plain Speech

Every reply, report, ADR and commit message written for a human reader must read as a person wrote
it, and must not lose a fact in the process.

## Why this exists

On 2026-10-19 and again on 2026-10-20 the operator stopped work to say the output read as machine
written:

> "you speak like ai. i need things explained humanly - make this a standard"

> "still sounds like ai... nobody sis this was here 'the whole time' and things like that"

> "we already well documented ai patterns by the way in several files in this repo"

The third message is the important one. A catalogue already existed, built in 2026 for the f3
article generator, and nothing was pointing chat output at it. This component closes that gap rather
than starting a second list.

## Components

| Kind | Path |
|---|---|
| Skill | `.claude/skills/plain-speech-convention/SKILL.md` |
| Reference | `.claude/skills/plain-speech-convention/references/chat-tells.md` |
| Agent | `.claude/agents/plain-speech-agent/AGENT.md` |
| Command | `.claude/commands/plain-speech.md` |
| Rule | Root `CLAUDE.md` → "Explain Like A Person, Not Like A Report (Required)" |
| Mirror | `.codex/skills/`, `.codex/agents/`, `.codex/commands/` |

## Source of truth

`.adr/orchestration/f3-ai-articles-seo@luke/08_tone-and-anti-ai-speak/ai-speak-convention-reference.md`

129 lines, zero tolerance, backed by `AI_SPEAK_WORDS` / `AI_SPEAK_PHRASES` / `AI_SPEAK_PATTERNS` in
`prompt-templates.ts` and scanned by `scanAiSpeak`. Written for articles, applies in full to chat.
Its automotive carve-outs are for car copy only.

## The two layers

**Layer 1, mechanical.** Em dash, en dash, curly quotes, unicode arrows, ellipsis, non-breaking
space. `normalizeProse` strips these in the article pipeline. In chat they are a reliable signal
that a draft was never edited. Searching a draft for an em dash catches most unedited output in one step.

**Layer 2, shape.** Eight tells the prose scanner cannot see because they are shaped by the reply
rather than the sentence: delayed reveal, fragment as drumroll, bolded punchline every paragraph,
table for two facts, findings counted into a pattern, closing aphorism, narrated investigation,
headers on a short answer. Examples in `references/chat-tells.md`, all drawn from real sessions here.

## The constraint that makes it safe

Rewriting for voice must not cost the reader a fact. The agent takes an inventory of every number,
`file:line`, correction and open item before rewriting and checks them back in afterwards. A draft
that reads well and drops a figure has failed the convention.

## Usage

`/plain-speech` audits the reply just written. `/plain-speech <path>` audits a file.
`/plain-speech check <path>` reports offenders without rewriting. `/plain-speech rules` prints the
convention.

See `USAGE_GUIDE.md`.
