# OVERVIEW.md — required shape

Copy this structure. Replace every `<…>`. Delete a group only when the feature genuinely has nothing
in it; never leave an empty heading.

The one rule that outranks all the others: **every path below must have been verified to exist.** Run
`feature-user-docs.py verify <feature>` before you call the map done.

---

```markdown
# Reading map — <feature id>

> **What this is.** A reading map for `<feature id>`: which files to open, in what order, and why.
> Orientation only — the explanations live in the files themselves and in the feature's prd /
> technical_requirements.
>
> - Feature: `<feature id>`
> - Generated: <YYYY-MM-DD> · Phases complete: <n>/<total>
> - Machine-checked path ledger: `./path-inventory.md` (generated — every path `stat`-ed)
> - ADR record: `<full path to .adr/orchestration/<feature>>`
> - Planning folder: `<full path to .docs/planning/<feature>>`

## Start here

Three files, in this order. After these you know what the feature does, how it is shaped, and where
its entry point is.

1. **`<full absolute path>`**
   `<repo-relative path>`
   <One or two sentences: what it is · what to read in it · why it is first.>

2. **`<full absolute path>`**
   `<repo-relative path>`
   <…>

3. **`<full absolute path>`**
   `<repo-relative path>`
   <…>

## <Group name — e.g. Backend module>

<One line framing the group: what this set of files collectively is.>

- **`<full absolute path>`**
  `<repo-relative path>`
  <What it is. What to read in it. Why it matters.>

- **`<full absolute path>`**
  `<repo-relative path>`
  <…>

## Deliberately not included

| Not included | Why |
|---|---|
| <thing> | <reason> |

## Mentioned but not verified

Paths named in this feature's planning or ADR docs that do **not** exist on disk. Listed so the gap is
visible rather than silently dropped — do not treat these as live files.

| Path | Named in | Likely reason |
|---|---|---|
| `<path>` | `<doc>` | <reason> |
```

---

## Group order (the reading narrative)

Order the groups so that reading top-to-bottom tells the feature's story:

1. **Start here** — the three-file orientation set
2. **Backend module** — the feature's own core logic (pure/compute first, then orchestration, then data)
3. **Admin UI** / **Storefront UI** — the surfaces that drive it
4. **Schema + migrations** — the tables it owns
5. **Wiring + config** — flags, registration, scheduler start
6. **Tests** — what is actually guaranteed
7. **ADR record** — the phase-by-phase history and its Outcome sections
8. **Planning docs** — prd / technical_requirements / notes / research
9. **Conventions + runbooks** — the standards this feature must keep obeying
10. **Evidence** — screenshots and validation artifacts
11. **Deliberately not included**
12. **Mentioned but not verified**

## Annotation rules

- Two sentences maximum per entry. One is often right.
- Say what a *reader* gets, not what the code *is*: "read the `CAMPAIGN_DEFS` table — it is where
  each email's subject, layout and copy actually live" beats "exports CAMPAIGN_DEFS".
- Name the symbol or section worth jumping to when there is one.
- Flag the traps: a pure vs impure boundary, a file that must NOT be edited, a flag that gates
  everything, an uncommitted/in-flight file.
- Never annotate a file you did not open. If you read only part, say which part.

## Things that must appear if they exist

- The flag(s) that gate the feature, and the file they are declared in.
- The registration point (where the module is wired into the app).
- The migration + its `db:ensure-*` script and npm script name.
- Any file the feature's own docs say must NOT be modified.
- Any file that is new and uncommitted (in-flight work a cold reader would otherwise miss).
