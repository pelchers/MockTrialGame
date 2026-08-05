---
name: feature-planning-spec
description: Defines and validates the planning spec every feature folder must meet — README + prd + feature-explained + research + keys-explained + user-testing-instructions + technical_requirements/notes, a guides/ subfolder (one core guide per user story), and a tests/ subfolder (screenshots + user-stories) — and uses that guide set as the basis for browser-walk testing. Use when scaffolding a new feature's planning folder, auditing/updating an existing one to spec on request, or generating the per-user-story guides. Piggybacks pre-planning + the ADR/planning conventions + authoring-runbooks + comprehensive-validation-walk.
---

## Two modes (called on demand — there is no auto-backfill hook)
1. **Scaffold a NEW feature** — the standard step whenever a new feature is in the works: create the folder to
   the full spec below (all root docs + `guides/` + `tests/`), seeded with feature-specific skeletons.
2. **Audit + update an EXISTING feature to spec — on request.** When asked (e.g. "update f3 to the feature spec"),
   audit the folder, report the gaps, and **additively** create only what's missing (never overwrite non-empty
   files without asking). Existing folders are only touched when someone asks — this is a **standard + on-call
   agent**, not a hook that force-backfills every folder.

## Purpose
Every feature planning folder (`.docs/planning/<f#-feature>@<ver>/`) and its ADR (`.adr/orchestration/<feature>/`)
should carry a **known-minimum, expandable** set of artifacts so nothing is missing before development, every
**user story** is documented as a user-facing guide, and those guides double as the **script for browser-walk
testing**. This skill is the single source of truth for that minimum spec + how to organize the content + how to
validate a folder against it.

**Minimum, not maximum.** The spec below is the floor. Features expand it (more research, more sessions, more
guides) — but must never fall below it.

## When to use
- Scaffolding a NEW feature planning folder (create the minimum set).
- Auditing an EXISTING feature folder for completeness (report gaps).
- Generating/refreshing the **core user-story guides**.
- Preparing the **browser-walk test plan** (the guides are its script).
- The user says "feature planning spec", "minimum planning files", "guides for the feature", "validate the planning
  folder", or invokes `/feature-planning-spec`.

## Piggybacks (does not replace)
- **pre-planning** (`.docs/planning/plans/#-*.md` plan files) — the pre-execution plan.
- **adr-setup** — the `.adr/orchestration/<feature>/` session structure (prd/technical_requirements/notes/
  primary_task_list + numbered sessions) is where the *technical* depth lives; this skill governs the *planning
  folder* + *guides* + *user-story coverage*.
- **authoring-runbooks** — operational runbook shape/visual conventions.
- **comprehensive-validation-walk** + **testing-user-stories-validation** — the guides feed the 11-method walk.

---

## THE MINIMUM SPEC

### A. Feature planning folder — `.docs/planning/<f#-feature>@<ver>/`
The folder root carries the README + the corollary standard planning files + these dedicated docs
(all **feature-specific**), plus the `guides/` and `tests/` subfolders:

| # | Artifact (folder root) | Required? | Purpose |
|---|----------|-----------|---------|
| 1 | `README.md` | **REQUIRED** | Overview: purpose, scope, workstreams, non-goals, **status**, **open questions for review**. |
| 2 | `prd.md` | **REQUIRED** | PRD: personas, **user stories (MoSCoW)**, functional + non-functional reqs, data-model sketch, **acceptance criteria**. |
| 3 | `feature-explained.md` | **REQUIRED** | Plain-language narrative — **what this feature IS + how it works** end to end (the human orientation doc). Distinct from the README (status/overview) and the ADR (technical depth). |
| 4 | `research.md` | **REQUIRED** | Grounding research — findings, sources, design implications, decisions. Topic-named variants (`seo-research.md`, `activecampaign-research.md`) MAY supplement it; `research.md` is the canonical entry. |
| 5 | `keys-explained.md` | **REQUIRED** | Every **key / credential / env var / feature flag** the feature needs to run + to activate — where to get each and where it goes (backend env vs `app_settings` vs admin flag). **VALUE-FREE** (names + locations only — never real secrets). |
| 6 | `user-testing-instructions.md` | **REQUIRED** | **Step-by-step, human-in-the-loop** testing walkthrough (do X → *expect* Y), ideally one path per core user story, with the local URLs + what to report. |
| 7 | `technical_requirements.md` + `notes.md` | **REQUIRED** (may live in the ADR + be cross-ref'd) | The corollary standard planning files. Either carry them in the folder or link the ADR copies from the README. |
| 8 | `guides/` (subfolder) | **REQUIRED** | User-facing guides — **one core guide per core user story** + a `README.md` index. See §B. |
| 9 | `tests/` (subfolder) | **REQUIRED** | Test evidence + reports. Contains `tests/screenshots/` + `tests/user-stories/`. See §C-tests. |
| 10 | ADR cross-ref | **REQUIRED** | A link to `.adr/orchestration/<feature>/` (the technical + session detail). |

### B. `guides/` subfolder — one core guide per user story
- `guides/README.md` — index mapping **every user story (US#) → its guide → its browser-walk test id**.
- `guides/<us-slug>.md` — one **core guide per core user story**: a clean, user-facing, step-by-step of how a user
  accomplishes that story (preconditions → steps → what they see → done). Written so it doubles as the **browser-walk
  script** for that story.
- Guides are **synced/mirrored** between the runbook home (`<app>/.app-docs/runbooks/<area>/` — the shipped doc) and
  the planning `guides/` folder (the review copy). Keep them in step; mark the mirror with a "planning/handoff copy"
  banner and name the runbook copy the source of truth.

### C-tests. `tests/` subfolder — evidence + reports
- `tests/screenshots/` — captured screenshots (visual proof per story / breakpoint).
- `tests/user-stories/` — per-user-story validation artifacts (walk reports, spec files, recorded videos —
  e.g. 2× user-story videos — named `<us-id>-<slug>`), one set per core user story.
- `tests/<feature>-test-report.md` (or similar) — the human-readable results summary.
- The `user-testing-instructions.md` (folder root, §A.6) is the **script**; `tests/user-stories/` holds the
  **evidence** that script produced.

### C. Runbooks (operational) — `<app>/.app-docs/runbooks/<area>/` (product) or `.docs/runbooks/` (infra/dev-process)
- At least the operational runbook(s) the feature needs (setup/activation, admin/ops guide). Follow
  **authoring-runbooks** conventions.

### D. ADR — `.adr/orchestration/<f#-feature>@<ver>/` (governed by adr-setup, referenced here)
- Top-level `prd.md` + `technical_requirements.md` + `notes.md` + `primary_task_list.md`, and per-session folders
  each with the same 4 files; a **testing session** whose plan is built from the user-story guides (§E).

---

## VALIDATION — against ALL user stories (the core rule)
A feature planning folder is **spec-complete** only when **every user story in `prd.md` is covered end to end**:

For each `US#` in `prd.md`:
- [ ] It has **acceptance criteria** in `prd.md`.
- [ ] It has a **core guide** in `guides/<us-slug>.md` (and the runbook mirror).
- [ ] It is listed in `guides/README.md` with a **browser-walk test id** (e.g. `BF#`/`UST#`).
- [ ] It appears in the ADR **testing session** as a walk with the 11-method evidence expectation.

The skill's audit **enumerates the user stories, then checks each of the four boxes**, and reports any story missing
any box as a gap. **No user story may be undocumented or untested.** (Must-stories are release gates; Should/Could may
be explicitly deferred with a written reason.)

## GENERATING THE CORE GUIDES (all core user stories)
1. Read `prd.md`; extract every user story + its acceptance criteria.
2. For each, write `guides/<us-slug>.md`: title = the story; sections = **Who it's for · Before you start ·
   Step-by-step · What you'll see · Done / troubleshooting**. Plain language; no internal jargon in user-facing guides.
3. Write/refresh `guides/README.md` — the US# → guide → test-id table.
4. Mirror each guide to the runbook home; add the planning-copy banner to the planning copy.

## BROWSER-WALK TESTING BASIS
The guides ARE the browser-walk script. For each guide/story, the testing session's walk asserts the guide's
**Step-by-step** with the **11 validation methods** (HTTP · API · DOM · text · screenshot · console · network · perf ·
a11y · **DB state** · trace) — see comprehensive-validation-walk. A guide that can't be walked as written is a gap in
the guide, not the test.

## HOW TO ORGANIZE CONTENT (quick map)
```
.docs/planning/<f#-feature>@<ver>/
  README.md                     # overview + status + open questions
  prd.md                        # user stories + AC
  feature-explained.md          # NARRATIVE — what it is + how it works (plain language)
  research.md                   # grounding research (+ optional <topic>-research.md)
  keys-explained.md             # keys/creds/env/flags to run + activate (VALUE-FREE)
  user-testing-instructions.md  # step-by-step human-in-the-loop testing
  technical_requirements.md     # (or cross-ref the ADR copy)
  notes.md                      # (or cross-ref the ADR copy)
  guides/
    README.md                   # US# -> guide -> browser-walk id
    <us-slug>.md                # one core guide per core user story (mirrors the runbook copy)
  tests/
    screenshots/                # visual proof
    user-stories/               # per-story walk evidence / specs / videos
    <feature>-test-report.md    # results summary
<app>/.app-docs/runbooks/<area>/   # shipped operational + user guides (source of truth)
.adr/orchestration/<f#-feature>@<ver>/   # technical + session detail (adr-setup); testing session <- guides
```

## Rules
- The spec is a **floor** — never ship a feature folder below it; expanding is expected.
- **Every user story → a guide → a browser-walk id.** Enumerate + check; report gaps; never leave one undocumented.
- Keep the planning `guides/` copy and the runbook copy **in sync**; runbook = source of truth.
- User-facing guides are **plain-language** (no code/table internals); technical depth lives in the ADR.
- This skill governs *structure + coverage*; adr-setup governs the ADR internals; authoring-runbooks governs runbook
  shape; pre-planning governs the plan file. Compose, don't duplicate.
- Present an **audit summary** (per-story coverage table + gaps) after running.

## References
- `references/minimum-spec-checklist.md` — the copy-paste audit checklist.
