# Feature planning — minimum-spec audit checklist

Copy this into a review note and tick per feature. **Minimum = floor; expand freely above it.**

## Planning folder root `.docs/planning/<f#-feature>@<ver>/`
- [ ] `README.md` — purpose, scope, workstreams, non-goals, **status**, **open questions for review**.
- [ ] `prd.md` — personas, **user stories (MoSCoW)**, functional + non-functional reqs, data-model sketch, **AC**.
- [ ] `feature-explained.md` — plain-language **what it is + how it works** (distinct from README/ADR).
- [ ] `research.md` — grounding research (+ optional `<topic>-research.md`).
- [ ] `keys-explained.md` — keys/creds/env/flags to run + activate, **value-free** (names + locations only).
- [ ] `user-testing-instructions.md` — step-by-step **human-in-the-loop** testing (do X → expect Y).
- [ ] `technical_requirements.md` + `notes.md` — present, or cross-ref'd from the ADR in the README.
- [ ] `guides/` subfolder exists.
- [ ] `tests/` subfolder exists → `tests/screenshots/` + `tests/user-stories/`.
- [ ] ADR cross-ref link present (to `.adr/orchestration/<feature>/`).

## `guides/` subfolder
- [ ] `guides/README.md` index: table of **US# → guide file → browser-walk id**.
- [ ] One `guides/<us-slug>.md` **per core user story** (plain-language, step-by-step).
- [ ] Each guide **mirrors** the runbook copy; planning copy carries the "planning/handoff copy" banner.

## `tests/` subfolder
- [ ] `tests/screenshots/` — visual proof per story/breakpoint.
- [ ] `tests/user-stories/` — per-story walk evidence / spec files / videos (`<us-id>-<slug>`).
- [ ] `tests/<feature>-test-report.md` — results summary.

## Runbooks `<app>/.app-docs/runbooks/<area>/`
- [ ] Operational runbook(s) (setup/activation, admin/ops) — authoring-runbooks conventions.
- [ ] User-facing guide(s) = source of truth for the planning `guides/` mirror.

## ADR `.adr/orchestration/<f#-feature>@<ver>/`
- [ ] Top-level `prd.md` + `technical_requirements.md` + `notes.md` + `primary_task_list.md`.
- [ ] Per-session folders each with the 4 files (adr-setup).
- [ ] A **testing session** whose walks are built from the user-story guides (11-method evidence).

## User-story coverage matrix (the core gate) — fill one row per US#
| US# | AC in prd? | guide in guides/? | in guides/README (test id)? | in ADR testing session? | Must/Should/Could | Gap? |
|-----|-----------|-------------------|-----------------------------|-------------------------|-------------------|------|
|     |           |                   |                             |                         |                   |      |

**Pass = every Must-story has all four boxes; Should/Could either covered or explicitly deferred with a reason.**
