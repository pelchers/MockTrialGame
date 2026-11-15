<!-- plain-speech-ignore-file: this catalogue quotes the tells as examples -->
# Reply-shaped AI tells

The article catalogue at `.adr/orchestration/f3-ai-articles-seo@luke/08_tone-and-anti-ai-speak/`
scans prose. These eight are shaped by the *reply*, not the sentence, so that scanner cannot see
them. Every example below is taken from this repo's own sessions on 2026-10-19 and 2026-10-20, where
the user stopped the work twice to say the output read as machine-written.

---

## 1. The delayed reveal

Holding the fact back so the sentence can spring it.

> ✗ "The row number was in the database the whole time, in `source_refs`."
> ✗ "It had never existed."
> ✗ "That is why `hasSalePrice` kept getting wiped."

> ✓ "The row number is in `source_refs`. Three layers read past it, so the export sent null."

Nobody says "the whole time" to a colleague. Give the fact, then the cause.

## 2. Fragment as drumroll

A sentence fragment used for emphasis carries no information.

> ✗ "Found it." / "Conclusive." / "That is the real bug." / "Two separate causes."

> ✓ "The 36 rows were resolved issues the export was still listing."

## 3. Bolding the punchline in every paragraph

When every paragraph bolds its conclusion, the reader cannot tell which number matters.

> ✗ Four paragraphs, each ending in a bolded clause.
> ✓ One bolded figure in the section, the one they need to carry away.

## 4. A table for two facts

Tables are for data someone will scan or compare across, roughly five rows or more. A three-row
table of before and after is a sentence.

> ✗ A table with rows "Before 94" and "After 58".
> ✓ "Placeholder rows dropped from 94 to 58 once resolved ones stopped being counted."

## 5. Counting findings into a pattern

Tallying separate items into a named category is the invented-taxonomy habit the user's global
CLAUDE.md already bans, with a number attached.

> ✗ "Three bugs this week, all the same shape: a column written and never read."

> ✓ Say it once, where it changes what someone should do: "Worth checking the other reads for the
> same thing, since `source_refs` and `resolved_at` were both written and never read."

## 6. The closing aphorism

A general truth at the end of a section, to land the point.

> ✗ "Nobody finishes a cleanup that looks like it is doing nothing."
> ✗ "A remediation you cannot watch land is one nobody finishes."

> ✓ Stop at the fact: "The count would not have moved, so the sheet owner would have had no way to
> see the fix working."

## 7. Narrating the investigation

The reader wants the state of things, not the sequence of discovery. Include the path only where it
changes what they should do, for example when it means an earlier answer was wrong.

> ✗ "Chasing that, I found…", "The part that actually bothers me is…", "and then it got worse."

> ✓ "My first answer was wrong. They were not waiting for a rebuild. They were resolved issues."

## 8. Headers on a short answer

Four paragraphs do not need five headers. Headers are navigation. If there is nothing to navigate,
they are decoration.

## 9. Self-congratulation about the work

Scoring the work in the same breath as reporting it. The reader decides whether it was worth doing.

> ✗ "That is the argument for the gate you asked for, and it paid for itself on the first run."
> ✗ "the first run of that gate earned its place immediately"
> ✗ "which is the strongest corroboration either could have given"
> ✗ "76 new tests" offered as evidence of care rather than coverage

> ✓ "The gate found a bug on the first run: pressing H2 prefixed the last line."

Caught by the scanner as `self-praise`.

## 10. "That is the whole point"

Telling the reader which part of your own explanation is the important one.

> ✗ "It must never render, and that is the whole property."
> ✗ "That is the whole design." / "That is the whole reason to do it this way."
> ✗ "The refusals matter more than the conversions."

> ✓ "It never renders. No resolver case can emit it, and a test asserts that per block kind."

If a sentence needs to be labelled as the important one, it was not written clearly enough to be
obvious. Caught as `whole-point`.

## 11. Meta-commentary on your own writing

Narrating the decision to write something down, instead of writing it down.

> ✗ "Recorded because the lesson generalises…"
> ✗ "Worth recording because…" / "Said plainly:" / "Named here because…"
> ✗ "and that is not an oversight" / "deliberately, and here is why"

> ✓ Just state it. The ADR is the record; saying so inside it is a sentence doing no work.

Caught as `meta-writing`.

## 12. Pre-empting an objection nobody made

Defending a choice against a reader who has not disagreed yet.

> ✗ "That is not a cosmetic problem."
> ✗ "This is not a style quibble."
> ✗ "and the arrows stay, and that is not an oversight"

> ✓ Give the consequence and let it carry the weight: "An operator reads a past date as
> ‘this already went out’."

Caught as `pre-empt`.

## 13. "worse than" escalation

Already banned in CLAUDE.md. Repeated here because it is the one that survives every edit.

> ✗ "A dead link in a trusted index is worse than no link."
> ✗ "silently dropping it would be worse than refusing."

> ✓ "A refusal says what to fix. A silent drop does not, and the author finds out at send time."

Caught as `worse-than`.

## 14. "which is why" / "which is the" causal chains

Making findings click into place for the reader.

> ✗ "…0 layouts, which is why the fps probe read idle."
> ✗ "…shares one tab param, which is the reason it opened on Details."

> ✓ Two sentences. "… 0 layouts. The fps probe read idle."

Caught as `which-is`.

## 15. The rule-of-three list in prose

Three parallel clauses to sound comprehensive.

> ✗ "No table dropped, no column renamed, no behaviour changed."
> ✓ Say the one that matters, or use a real list.

## 16. Scare-quoting your own earlier wording

> ✗ "the ‘simple’ editor", "what we were calling a template"
> ✓ Use the word, or pick a better one.

---

## The check that catches most of it

Read the draft out loud. Anywhere the voice would naturally fall flat, a colleague would have
written something else. Then search for an em dash, because it survives every other edit.
