---
name: feature-planning-spec
description: Scaffold/audit a feature planning folder against the FULL spec (README/prd/feature-explained/research/keys-explained/user-testing-instructions + guides/ + tests/) + generate per-user-story guides
invocable: true
---

# Feature Planning Spec (/feature-planning-spec)

Bring a feature's planning folder up to the **full planning spec** and make sure **every user story** has a
core guide and a browser-walk test basis. Runs the `feature-planning-spec` skill (via the
`feature-planning-spec-agent`). Default = scaffold a new feature; on request it audits/updates an existing
folder (no auto-backfill).

## Usage
```
/feature-planning-spec f3-ai-articles-seo@luke        # audit + fill this feature to spec
/feature-planning-spec f3-ai-articles-seo@luke audit  # audit only — report the coverage matrix + gaps
/feature-planning-spec f3-ai-articles-seo@luke guides # (re)generate the per-user-story guides
/feature-planning-spec                                # infer the feature from current context
```

## What it does
1. Resolves `.docs/planning/<feature>/`, `.adr/orchestration/<feature>/`, and the runbook home.
2. Reads `prd.md`, enumerates every user story + acceptance criteria.
3. Audits the full spec — root docs (README · prd · **feature-explained** · **research** · **keys-explained** ·
   **user-testing-instructions** · technical_requirements/notes) · `guides/` · **`tests/{screenshots,user-stories}/`**
   · ADR cross-ref — and, per user story, the four coverage boxes (AC · guide · guides/README test-id · ADR walk).
4. Additively fills gaps: creates any missing root docs as feature-specific skeletons, `guides/` + index,
   `tests/screenshots/` + `tests/user-stories/`, and a `guides/<us-slug>.md` per uncovered core user story
   (mirrored to the runbook home); notes each browser-walk id.
5. Reports the **user-story coverage matrix** + a per-artifact present/missing list + remaining gaps (Must = blocking).

## Output
- `.docs/planning/<feature>/` root docs + `guides/README.md` + `guides/<us-slug>.md` per story + `tests/` subfolders.
- Runbook mirrors under `<app>/.app-docs/runbooks/<area>/`.
- A coverage-matrix report in chat.

## Notes
- Additive/non-destructive; asks before overwriting non-empty files. Existing folders update **on request only**.
- The spec is a **floor** — expand freely above it.
- Guides double as the **browser-walk script** (see `comprehensive-validation-walk`).

$ARGUMENTS
