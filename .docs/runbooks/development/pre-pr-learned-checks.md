# Pre-PR Learned Checks — companion to the pre-PR checklist

Append-only companion to `pre-pr-checklist.md`. The **PR Shepherd** (`pr-shepherd` skill / `/pr-watch`)
appends an entry here every time it remediates a **novel** gating failure on an upstream PR — a class the
main checklist did not already cover. Each entry becomes a **pre-submit check** so the same class never
costs a round-trip again, and the file is **synced across all repos** (`SYNC-REPOS.md` →
`/sync-component pr-shepherd` → `/sync-flush`) so every project inherits the lesson.

> Read this alongside `pre-pr-checklist.md` §2 (CI parity) and §3 (vitest naming) before opening a PR.
> Entry format: `### <signature> (learned <date>, PR #<N>)` → Symptom · Root cause · **Pre-submit check** ·
> Fix pattern.

---

### Cross-repo divergence gap: a symbol our code calls is missing on the dev branch (learned 2026-08-22, PR #93)
- **Symptom:** CI `admin-panel:build` failed —
  `src/hooks/queries/use-visitors-queries.ts(68,15): error TS2339: Property 'createUser' does not exist on type 'AuthApi'`.
- **Root cause:** Our feature code called `authApi.createUser`, a method that exists in OUR CC-Local repo
  (added by earlier f2/f6 admin work) but was NOT on the upstream **dev branch's** `AuthApi` and was not
  carried by the PR. Our clone is behind dev and shares no git ancestry, so a method our new code depends on
  can be silently absent on the base.
- **Pre-submit check:** For any NEW file that references a shared service/util/type on the base
  (`AuthApi`, `env`, schema exports, `API_ENDPOINTS`, etc.), confirm every referenced symbol EXISTS on the
  fresh `development` clone — not just in our repo. Reproduce the FULL CI build against a fresh dev clone
  (`turbo run build --filter=!collectibleclassics`) before opening the PR; do not trust our-repo typecheck
  alone, because our repo has the symbol and dev may not.
- **Fix pattern:** Add the missing member ADDITIVELY on the PR branch (here: the `createUser` method on
  `AuthApi`, `POST /api/auth/users`), self-contained so it introduces no further missing deps. Never delete
  or rename the caller to work around it.

### CI env: importing `config/env` validates process.env at load; specs fail without the full CI env set (learned 2026-08-22, PR #93)
- **Symptom:** Backend specs failed locally with `Invalid environment variables: BACKEND_URL / SIGNING_LINK_SECRET ...`
  even though the code was correct.
- **Root cause:** Any spec that transitively imports `src/config/env.ts` runs zod validation at module load;
  a fresh clone has no `.env`, so validation throws. This is environmental, not a code bug — CI provides
  placeholder env vars in the workflow's test step.
- **Pre-submit check:** When reproducing backend tests against a fresh clone, export the SAME placeholder
  env the CI workflow sets (see the CI env block in `pr-shepherd.md` / the workflow's Test step), or specs
  will spuriously "fail" on env validation and mask the real result.
- **Fix pattern:** No code change — set the CI env for the local repro. (If a spec should be hermetic and
  must not need env, `vi.mock("../../config/env", ...)`.)

### Vitest naming: `*.test.ts` importing vitest reds `tsx --test` (reinforced 2026-08-22; original PRs #48, #62)
- **Symptom:** CI test step throws `Vitest cannot be imported in a CommonJS module using require()` — the
  `tsx --test 'src/**/*.test.ts'` step collects a vitest suite misnamed `*.test.ts`.
- **Pre-submit check:** grep the changeset — `for f in $(find CC/apps/*/src -name '*.test.ts'); do grep -l 'from "vitest"' "$f"; done` MUST be empty. Vitest suites are `*.spec.ts`; node:test suites stay `*.test.ts`.
- **Fix pattern:** `git mv` the vitest suite `*.test.ts` → `*.spec.ts` (content-preserving).
