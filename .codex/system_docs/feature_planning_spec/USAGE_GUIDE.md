# Feature Planning Spec — Usage Guide

## When to use it
- **Starting a new feature** → scaffold its planning folder to the full spec before development.
- **An existing feature folder feels incomplete** → audit it and additively fill the gaps (on request).
- **Preparing browser-walk testing** → the `guides/` are the walk script; the audit confirms every user story is
  covered before you test.

## How to invoke
- **Scaffold / fill:** `/feature-planning-spec <feature>` (e.g. `/feature-planning-spec f3-ai-articles-seo@luke`).
- **Audit only (no writes):** `/feature-planning-spec <feature> audit`.
- **Regenerate guides:** `/feature-planning-spec <feature> guides`.
- **Bare:** `/feature-planning-spec` — infers the feature from context.
- Or ask the **`feature-planning-spec-agent`** directly ("scaffold f6 to the feature spec" / "audit f4 to spec").

## The per-doc content contract (what each root doc must contain)
| Doc | Contract |
|---|---|
| `README.md` | Purpose, scope, workstreams, non-goals, **current status**, **open questions for review**. |
| `prd.md` | Personas, **user stories (MoSCoW)**, functional + non-functional reqs, data-model sketch, **acceptance criteria** per story. |
| `feature-explained.md` | Plain-language **what it is + how it works** end to end — the human orientation doc. No secret values; light on internal jargon (that's the ADR). |
| `research.md` | Grounding research: findings, sources, the decisions they drove, design implications. Topic-named variants (`seo-research.md`, …) supplement it. |
| `keys-explained.md` | Every **key / credential / env var / feature flag** to run **and** to activate — where to get each, where it goes (backend env vs `app_settings` vs admin flag), and what's optional. **VALUE-FREE.** |
| `user-testing-instructions.md` | **Step-by-step human-in-the-loop** testing — one path per core user story where possible: *do X → expect Y*, the local URLs, and "what to report." |
| `technical_requirements.md` + `notes.md` | The corollary standard planning files — carried in the folder or cross-ref'd from the README to the ADR copies. |

## The subfolders
- `guides/` — `README.md` index (US# → guide → browser-walk id) + one `guides/<us-slug>.md` per core user story
  (plain-language step-by-step; mirrors the runbook copy which is the source of truth).
- `tests/` — `screenshots/` (visual proof) + `user-stories/` (per-story walk evidence / spec files / videos,
  named `<us-id>-<slug>`) + a `<feature>-test-report.md` results summary.

## What "done" looks like (the audit gate)
Every root doc + subfolder present, and for **every** user story in `prd.md`: acceptance criteria ✔ · a guide ✔ ·
a browser-walk id in `guides/README.md` ✔ · a walk in the ADR testing session ✔. Must-stories block release;
Should/Could may be deferred **with a written reason**. The agent prints the coverage matrix + a per-artifact
present/missing list.

## Rules that matter
- **Additive / non-destructive** — never overwrite non-empty content without asking; fill gaps + generate missing
  guides only.
- **On-request for existing folders** — there is no auto-backfill hook; existing folders change only when asked.
- **Compose, don't duplicate** — ADR internals belong to `adr-setup`; runbook shape to `authoring-runbooks`; the
  plan file to `pre-planning`; the walk to `comprehensive-validation-walk`. This component governs *structure +
  coverage*.
- **Value-free keys** — `keys-explained.md` lists names + locations, never real secrets.

## Sync behavior
- The **component** (agent/skill/references/command/system_docs, `.claude/` + `.codex/`) syncs to `SYNC-REPOS.md`
  targets via `/sync-component` → `/sync-flush`.
- The **feature content it produces** (the planning folders) is **project-local** — never synced.

## Troubleshooting
| Symptom | Fix |
|---|---|
| A root doc missing on audit | The agent creates a feature-specific skeleton; fill it in. |
| Existing folder not updated | Updates are on request — run `/feature-planning-spec <feature>`. |
| Guide can't be walked as written | That's a gap in the guide, not the test — tighten the step-by-step. |
| Component not in another repo | `/sync-component` then `/sync-flush` from this repo (after approval). |
