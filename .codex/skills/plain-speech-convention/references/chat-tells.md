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

---

## The check that catches most of it

Read the draft out loud. Anywhere the voice would naturally fall flat, a colleague would have
written something else. Then search for an em dash, because it survives every other edit.
