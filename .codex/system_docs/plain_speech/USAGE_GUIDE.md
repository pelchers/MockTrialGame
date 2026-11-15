# Plain Speech, usage

## The 20-second check

Before sending anything substantial:

1. Search the draft for an em dash. If one is there, the draft is unedited. Replace every one.
2. Read the first sentence of each paragraph. Does it state a fact, or build toward one?
3. Count the bolded phrases. More than one per section means none of them register.
4. Any table under five rows is a sentence.

## Rewriting an explanation

Say it the way you would standing at a colleague's desk.

1. Lead with the plain answer. "The 36 rows were problems already fixed that the export still
   listed."
2. Give the cause in connected sentences. "The issues table records whether an issue is still open.
   Both read paths ignored that column, so everything ever flagged came back as outstanding."
3. Say what it means and what is left. "Fixing a cell would not have moved the number on screen.
   One filter in each read path fixes it. No vehicle figure changed."

Numbers stay inline unless there are more than about five.

## Before and after, from a real session

> ✗ "**Found it.** The row number was in the database **the whole time**, in `source_refs`. Three
> layers each dropped it. **That is why** the export reported null."

> ✓ "The row number is in `source_refs`, written by the normalizer as `tab!rowN`. Three layers read
> past it: the normalizer never copied it into `detail`, `listIssues` did not select the column, and
> `issueToRecord` discarded it before the parser saw it. The export sent null for every row."

Same facts, one more `file`-level detail, no drumroll.

## When to run the agent instead of eyeballing it

- Long reports and ADRs, where a tell survives the read-through.
- Anything going to a third party, such as the contributor reply files.
- When the operator has just said the output sounds like AI. Run it rather than guessing at what
  they meant.

`/plain-speech <path>` returns offenders with line numbers, a fact inventory, the rewrite, and a
confirmation that every fact survived.

## What not to touch

Quoted user words, code, log output, API responses and test names stay verbatim. Audit the prose
around them. The article gate code (`prompt-templates.ts`, `ai-speak.ts`) is a separate system with
its own tests and is not in scope.

## Failure mode to watch for

Smoothing a correction while making it sound natural. "I was wrong about X" must stay blunt. If a
rewrite turns it into "it turned out to be slightly different", the rewrite is worse than the
original.
