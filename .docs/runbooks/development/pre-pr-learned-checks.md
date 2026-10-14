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

### Listing feature flags gate at BUILD time → enabling needs a rebuild+redeploy (learned 2026-08-22, PR #93)
- **Symptom:** Reviewer note — a `import.meta.env.VITE_*` (or `import.meta.env.DEV`) listing-side flag is a
  **build-time** constant, not a runtime env read.
- **Root cause:** Vite inlines `import.meta.env.*` at build. Flipping the env var on a running deploy does
  nothing until the listing app is rebuilt.
- **Pre-submit check:** For any listing-side feature flag, state in the PR's rollout/deploy step that
  enabling it requires a **listing rebuild + redeploy**, not just an env change — alongside any other
  prerequisite (e.g. a dependent hardening PR). Backend flags (`process.env`) are runtime; listing
  `VITE_*` flags are build-time — don't conflate them in the rollout instructions.
- **Fix pattern:** No code change — a docs/rollout-note accuracy fix. (If truly runtime toggling is needed,
  the listing flag must come from a server loader value, not `import.meta.env`.)

### Hot-path N+1: per-item await over a full scan (learned 2026-08-24, PR #104)
- **Symptom:** maintainer flagged `selectNextMakeModel` awaiting `newestMakeModelArticle(make, model)` once per pool entry, serially — paid on every rotate run AND every next-target preview AND once per rotate card on admin render (several full scans per page).
- **Root cause:** a lookup inside a loop over an unbounded set (all public make/models) instead of one grouped query.
- **Pre-submit check:** for any selector/preview/list that classifies N rows against the DB, confirm it does ONE grouped/batched query and classifies in memory — never `await lookup(x)` inside a `for` over a table-sized list. Especially in code that a React list mounts once per item.
- **Fix pattern:** add a batched `newestArticlesByMakeModel(): Promise<Map<key,Date>>` (one `groupBy`), fetch once, classify in memory; assert the batch fn is called exactly once in the spec.

### State/cursor advanced AFTER a fallible side-effect can stall (learned 2026-08-24, PR #104)
- **Symptom:** the rotation cursor (`markAutomationTargetUsed`) ran AFTER `enqueueAndRunMakeModel`; a throwing enqueue left the cursor un-advanced → the next run re-picks the same (failing) target → coverage stalls permanently.
- **Pre-submit check:** any "advance a cursor / mark-as-done" that follows a call that can throw must run BEFORE the fallible call or in a `finally`, so progress is durable even on failure. Add a spec that rejects the side-effect and asserts the cursor still advanced.
- **Fix pattern:** persist the cursor before firing (or `try { fire } finally { advance }`).

### Refusal/protected endpoints must return the right HTTP shape (learned 2026-08-24, PR #104)
- **Symptom:** deleting a protected (seeded) row returned `200 {"deleted": false}`; run-now on an event-only card silently did the wrong thing.
- **Pre-submit check:** a refusal is not a success — protected/blocked operations return **409** (or 4xx) with a message, not a `200` with a falsy flag. Guard event-only/seeded rows on EVERY manual action path (delete, run-now), not just the automatic one (the cron tick).
- **Fix pattern:** a distinct error type mapped to 409 in the handler; UI hides the action; spec covers the 409 vs the normal shape.

### Seeded/default rows must be editable through the same write validation (learned 2026-08-24, PR #104)
- **Symptom:** the seeded default card was un-editable — `cadence='event'` was rejected by the write Zod enum, and an omitted `targetMode` defaulted a `make_model` card to `fixed` → required make/model the seeded row didn't have → 422. A "control surface" that can't be saved.
- **Pre-submit check:** if you seed a default row with any value outside the normal create path (a special enum, a null required-for-others field), confirm that row round-trips through UPDATE: (a) partial-update-preserve (merge over the existing row, validate the MERGED values — don't re-default omitted fields), (b) exempt the seeded/special row from field requirements that don't apply to it, (c) allow its special enum value through the write schema. Add a spec that edits the seeded row (enable/tone) and asserts success + field preservation.
- **Fix pattern:** merge-then-validate in the updater; validate() takes an `{ isSeeded }`/mode context; widen the write enum to include the seeded value.

### Outcome/skip reasons must be accurate (learned 2026-08-24, PR #104)
- **Symptom:** an empty/all-fresh rotate skip returned `reason: "duplicate_skipped"` — nothing was a duplicate; it misleads whoever later debugs a quiet card from run history.
- **Pre-submit check:** each terminal/skip branch reports a reason that actually describes it; don't reuse a nearby enum value for a different cause. Add a new reason value when the cause is new.
- **Fix pattern:** distinct `no_rotation_target` reason; spec asserts it.

### Type known-union fields as unions at API boundaries, not bare `string` (learned 2026-08-24, PR #104)
- **Pre-submit check:** when a field has a known finite set (a `target_mode`, a `trigger_source`) and you already export the union, type the DTO field as the union — not `string`. Cheap, catches typos, documents the contract.

### A behaviour change broke an existing spec that asserted the OLD behaviour (learned 2026-08-26, WS09 / #110-class)
- **Symptom:** relaxing the content-edit lock so PUBLISHED articles are editable broke `admin-edit.gaps.spec.ts`'s `"REFUSES editing a published article"` — the spec still asserted the pre-change refusal. Caught only by running the suite (not typecheck).
- **Root cause:** a behaviour change flips an assertion somewhere; the diff doesn't surface the now-stale test.
- **Pre-submit check:** for ANY behaviour change, grep the specs for assertions of the OLD behaviour (`grep -rn "REFUSES\|rejects\|throws" <module>` + the changed symbol) and update them, AND run the FULL module suite — never trust typecheck alone. (This is the #110-class: an untested/mis-tested behaviour change is the #1 maintainer kickback.)
- **Fix pattern:** rewrite the stale assertion to the new behaviour + add a positive test for it (published edit → 200, audited published→published).

### A value threaded for one branch is silently DROPPED for a sibling branch (learned 2026-08-26, WS09)
- **Symptom:** the free-text `angle` / automation `seedContent` reached evergreen generation but was **silently dropped for make/model** (`enqueueAndRunMakeModel` never forwarded it) — the box "worked" in the UI but did nothing for make/model.
- **Pre-submit check:** when one input flows through a `category`/`type`/`kind` switch, confirm EVERY branch forwards it (grep the branches for the field). A field that only some branches read is a silent no-op for the rest.
- **Fix pattern:** thread the field through each branch's call; add a spec asserting the previously-dropped branch forwards it.

### Adding a DB read to a shared helper breaks specs whose db-mock only stubs the old calls (learned 2026-08-26, WS09)
- **Symptom:** adding `db.select(...)` inside `failJob` reddened `generation-retry.spec.ts` — its hermetic db stub mocked only `update` (the call failJob previously made): `TypeError: db.select is not a function`.
- **Pre-submit check:** before adding a NEW query to a shared helper, prefer PASSING the needed value in from the caller (which already has it) over re-reading from the DB — fewer round-trips AND no spec-mock churn. If you must add the query, update every spec's db stub that exercises the helper.
- **Fix pattern:** pass `attempt` into `failJob` from the caller's `input.attempt`; delete the added select.

### An unordered SELECT feeding a "representative sample / first-N" is arbitrary AND pins the same item (learned 2026-08-26, WS09)
- **Symptom:** `getMakeModelStock` ran a `SELECT` with **no `ORDER BY`** then `rows.slice(0,6)` — the featured make/model car was "whatever Postgres returned first," identical every regeneration until inventory membership changed.
- **Pre-submit check:** any `slice(0,N)` / "representative"/"featured" pick off a `SELECT` MUST have a deterministic `ORDER BY`. If variety across runs is wanted, add an explicit rotation offset — don't rely on natural row order (it neither rotates nor is stable).
- **Fix pattern:** `ORDER BY` a stable key + a caller-supplied rotation offset; feature the rotated pick.

### A fallible event trigger that logs-and-drops leaves the work permanently unproduced (learned 2026-08-26, WS09 R3)
- **Symptom:** a new-inventory article generation that FAILED was logged and dropped — the car never got an article unless another stock event coincidentally re-fired. Scheduled runs also marked the period done on failure (unconditional `markScheduleRan`), so the failed period was never retried.
- **Pre-submit check:** an unattended trigger/scheduler whose work can FAIL must have a bounded, backed-off RETRY (a sweep that re-drives failed rows) — not a log-and-drop. Confirm nothing marks a period "done" unconditionally on failure, and that SOMETHING reads `status='failed'` to re-attempt. Add a spec that fails once then asserts a re-drive.
- **Fix pattern:** persist `attempt`/`next_attempt_at`; schedule a backed-off retry on fail (under a cap); a tick sweep re-drives due failed jobs until produced.

### A strict quality gate a model persistently near-misses defeats "always produce" even WITH retries (learned 2026-08-26, WS09 R3 — E2E finding)
- **Symptom:** with a bounded retry in place, the local model still produced NO article for a make/model: attempts yielded 483 → 695 → **699** words against a **700-word** gate — the retry converged but never crossed the floor, so it kept failing `thin_output`.
- **Root cause:** the retry re-attempts, but a fixed strict gate (min word count / zero-AI-speak-score) that the model consistently just-misses is the real blocker — "retry until produced" ≠ "produced" if every attempt fails the SAME gate.
- **Pre-submit check:** when a bounded retry feeds a strict content gate, either (a) tune the gate to the model in that env (e.g. `ARTICLES_GEN_MIN_WORD_COUNT` for the local model), or (b) on the FINAL attempt relax the gate to a floor (accept the best near-miss draft) so it ALWAYS produces something rather than giving up empty. Test the last-attempt path.
- **Fix pattern:** add a last-ditch attempt that lowers the word floor / accepts the highest-scoring draft; surface the near-miss in the generation log so an operator can tune the gate.

### A gated dev affordance vanishes when a relaunch omits its VITE_ env var (learned 2026-08-26, session)
- **Symptom:** relaunching the admin Vite dev server without `VITE_DEV_ADMIN_TOKEN` silently removed the "Dev login" button (its render gate is `import.meta.env.DEV && VITE_DEV_ADMIN_TOKEN`), leaving no way to sign in.
- **Pre-submit check:** dev affordances gated on a `VITE_*` (build-time) var disappear if a relaunch forgets it — Vite bakes `import.meta.env.*` at server start. Document the FULL dev env (incl. `VITE_DEV_ADMIN_TOKEN` matching the backend `DEV_ADMIN_BYPASS_TOKEN`) in the run/launch command; a relaunch must include every gating var.
- **Fix pattern:** relaunch with the complete env; record the launch command (with all VITE_ vars) in the runbook/handoff.

### turbo-typecheck-cache-misses-build-emit-tsc  (learned 2026-08-28, from PR #120)
- **Symptom:** local `pnpm exec turbo run typecheck` reports GREEN, but the CI **Build** step (`tsc` emit) fails with real TS errors (e.g. TS2345/TS2353) in the same files.
- **Root cause:** the `typecheck` and `build` turbo tasks can resolve/caches differently; a cached or `--noEmit` typecheck pass does not guarantee the emit-build passes. CI gates on **build**.
- **Pre-submit check:** run the actual **build** the CI runs — `pnpm exec turbo run build --filter=!collectibleclassics` (or `pnpm --filter <app> build`) — not just typecheck, before pushing a promotion/remediation.
- **Fix pattern:** reproduce the build in the fresh clone; fix the emit error additively; re-run build green.

### fastify-plugin-not-on-dev-route-config-type-error  (learned 2026-08-28, from PR #120)
- **Symptom:** `config: { rateLimit: {...} }` (or any plugin-augmented route `config`) → TS2353 "does not exist in type 'FastifyContextConfig'" on the dev base, even though it typechecks in our tree.
- **Root cause:** the type augmentation comes from a plugin (`@fastify/rate-limit`) that OUR baseline registers but the upstream `development` base does NOT depend on — a divergence gap. The config is also inert at runtime there (no plugin to read it).
- **Pre-submit check:** for any route `config`/decorator/augmentation our feature relies on, confirm the providing plugin is in the DEV base's `package.json` (not just ours). If absent, don't ship the augmented config.
- **Fix pattern:** drop the plugin-dependent bit from the PR (keep the feature's core, here the reCAPTCHA gate) and note it as a separate follow-up that would add the plugin; or add the plugin+registration as its own scoped change.

### async-retry-reuses-global-flags-not-persisted-decision  (learned 2026-08-28, from PR #120)
- **Symptom:** a retry/re-drive of a job replaces the ORIGINAL run's decision (auto-publish, angle, tone) with current global flags → a hold-for-review item can publish live after a retry.
- **Root cause:** the retry read `env.ARTICLES_AUTOPOST_*` instead of the decision the job was created with; the decision was never persisted on the job row.
- **Pre-submit check:** any async retry/re-drive must PERSIST the original run's decisions on the row and REUSE them on retry — never re-derive from global flags. Grep the retry path for `env.*ENABLED`/flag reads that should be per-row values.
- **Fix pattern:** add nullable columns for the decisions (idempotent `ADD COLUMN IF NOT EXISTS`), persist at create, read on retry; legacy rows fall back to the SAFE posture (no auto-publish).

### claim-clears-retry-marker-strands-on-failure  (learned 2026-08-28, from PR #120)
- **Symptom:** a sweep "claims" a due job by clearing its retry marker (`next_attempt_at = null`) BEFORE firing; if the fire throws or is refused (e.g. rate-limited) before a successor is durably created, the job is stranded (never re-claimed).
- **Root cause:** claim-then-clear with no restore path on the unhappy branch.
- **Pre-submit check:** for any claim that clears a retry/lease marker up-front, ensure it is RESTORED unless a durable successor/side-effect is created. Test the throw/refusal branch explicitly.
- **Fix pattern:** wrap the fire; if no durable successor (exception, or a refusal with no successor row), reschedule the marker with the existing backoff.

### strip-advertised-feature-to-pass-ci  (learned 2026-08-28, from PR #120)
- **Symptom:** a type error from a plugin the DEV base lacks was cleared by REMOVING the PR-advertised feature (rate-limit) rather than adding the missing infra → maintainer flags the dropped promise.
- **Root cause:** treating a divergence-gap type error as "delete the feature" instead of "add the dependency the dev base is missing."
- **Pre-submit check:** if a feature the PR advertises trips a missing-plugin/type error on the dev base, ADD + register the plugin (with lockfile) rather than stripping the feature — or explicitly descope it in the PR body with the maintainer's agreement.
- **Fix pattern:** add the dep to package.json, `pnpm install` to regenerate the lockfile, register the plugin (`global:false` for opt-in), restore the route/feature config.

### modal-edit-form-not-reset-on-reopen + clickable-row-mouse-only  (learned 2026-08-28, from PR #120)
- **Modal reset:** a dialog edit form seeded via `useState(source.*)` keeps discarded edits across close→reopen — add a `useEffect` that re-seeds from the latest source when the dialog opens.
- **Row a11y:** a clickable `<tr>`/`<div>` with only `onClick` is mouse-only — add `role="button"` + `tabIndex={0}` + Enter/Space `onKeyDown` + a visible focus ring (or use a real link).

### rate-limit-or-ip-logging-behind-proxy-needs-trustProxy  (learned 2026-08-28, refined 2026-08-29, from PR #120)
- **Symptom (round 1):** a "per-IP" rate limit (or any `request.ip` use — reCAPTCHA remoteip, audit logs) behind an edge proxy (Railway/Cloudflare) actually keys on ONE shared address for every visitor → a per-IP 5/min becomes a global 5/min (a bot denies the endpoint site-wide — worse than no limit).
- **Symptom (round 4, SECURITY):** `trustProxy: true` makes rate-limit bypassable and corrupts IP audit — the client can spoof `X-Forwarded-For: 1.2.3.4` to get a fresh bucket per request; signing IP becomes attacker-supplied (useless evidence). `proxy-addr` with `true` trusts ALL hops and resolves to the LEFT-MOST entry (caller-written), not Railway's appended real IP.
- **Root cause:** Fastify's `request.ip` is the socket peer (the proxy) unless `trustProxy` is set to read `X-Forwarded-For`. BUT `trustProxy: true` means "trust ALL addresses," which walks the chain to the end and returns the FIRST (spoofable) entry.
- **Pre-submit check:** any IP-derived behaviour (rate-limit keyGenerator, remoteip, geo, audit) added to a service deployed behind a proxy → use `Fastify({ trustProxy: 1 })` (or the explicit hop count) to trust ONLY the last hop (the proxy's appended entry), NOT `true`. `true` = trust all hops = insecure. Verify on staging behind the real proxy; a local run won't reproduce it.
- **Fix pattern:** `Fastify({ ..., trustProxy: 1 })`. If the deployment ever fronts the backend with a second proxy, bump the count to match rather than going back to `true`.

### claim-clear-retry-marker-must-bound-and-terminalize-skips  (learned 2026-08-28, from PR #120)
- **Symptom:** (extends the round-1 strand fix) — the restore-on-no-successor path rewrote `next_attempt_at` WITHOUT incrementing the bound counter, and treated a benign SKIP (duplicate/fresh/no-target) as retryable → a persistently-skipping job re-drives + rewrites the row every backoff forever; run history never converges.
- **Root cause:** reschedule left `attempt` unchanged (so `attempt < MAX` stayed true) and had no terminal branch for legitimate skips / permanent refusals.
- **Pre-submit check:** any bounded retry that reschedules on the unhappy path must (a) INCREMENT the bound counter on reschedule, and (b) treat legitimate skips + permanent refusals as TERMINAL (leave the marker null). Add a test that runs the sweep against a persistently-skipping re-drive and asserts it stops.
- **Fix pattern:** terminal = skip | permanent-refusal → leave null; transient → reschedule with `attempt+1`, only while `attempt+1 < MAX`.

### editable-published-slug-breaks-live-url  (learned 2026-08-28, from PR #120)
- **Symptom:** allowing a published article's slug to change 404s the live URL, drops inbound links, and moves the canonical while the old URL stays indexed — an SEO-visible break a warning banner does not mitigate.
- **Root cause:** the edit path dropped the published-refusal but the listing resolves purely by current slug with no slug-history + 301.
- **Pre-submit check:** if an edit exposes a URL-key (slug/handle) for a PUBLISHED/public entity, make it immutable once published OR persist the old key + 301. A warning is not mitigation.
- **Fix pattern:** ignore slug changes server-side when `status === "published"` + disable the field client-side; keep content editable.

### bounded-retry-lt-not-lte-loses-final-relaxed-attempt  (learned 2026-08-29, from PR #120)
- **Symptom:** a bounded retry with `if (nextAttempt < MAX)` stops at attempt 4 (with default MAX=5), never running the attempt-5 re-drive where `isLastAttempt` relaxes the quality gate (word floor, ai-speak reject) — the attempt most likely to produce. Jobs that fail through the reschedule path (exception/skip) differ from jobs that fail through `failJob` (which includes attempt 5).
- **Root cause:** the reschedule guard uses strict `<` instead of `<=`, excluding the final bounded attempt.
- **Pre-submit check:** when a bounded retry has a RELAXED final attempt (lower gates/thresholds on `isLastAttempt`), the reschedule guard must use `<=` so the exception/skip path includes the final relaxed attempt and aligns with the `failJob` path. Grep for `< MAX` and confirm the final attempt is reached on both paths.
- **Fix pattern:** `if (nextAttempt <= env.ARTICLES_GEN_MAX_ATTEMPTS)` + a test that asserts a persistently-failing/skipping job reaches attempt 5 and terminates.

### retry-guard-sweep-predicate-mismatch-dangling-rows  (learned 2026-08-30, from PR #120 round 5)
- **Symptom:** relaxing a retry reschedule guard from `<` to `<=` created dangling rows: a job at attempt=MAX-1 gets rewritten to attempt=MAX with next_attempt_at non-null, but the sweep predicate `lt(attempt,MAX)` (strict `<`) can never select `attempt=MAX` again → the final attempt never runs and the row stays "retry pending" forever.
- **Root cause:** the reschedule WRITE bound (`nextAttempt <= MAX` allows writing attempt=MAX) mismatched the sweep READ predicate (`lt(attempt,MAX)` never selects attempt=MAX). The write guard allowed a state the read predicate can't consume.
- **Pre-submit check:** when adding or changing a bounded retry's reschedule guard (the WRITE side), confirm the sweep/tick SELECT predicate (the READ side) can still select rows at the new boundary. If the sweep is `lt(attempt,MAX)` (strict `<`), the reschedule guard must use strict `<` as well (`nextAttempt < MAX`) — never `<=` — or the sweep will strand rows at attempt=MAX. Add a boundary test that asserts a job at attempt=MAX-1 stays cleanly terminal (no dangling next_attempt_at) after an exception/skip.
- **Fix pattern:** match the reschedule guard to the sweep predicate (both `<` or both `<=`); add a spec that runs the sweep on a job at attempt=MAX-1 and asserts it terminates cleanly (single `db.update` call = claim only, no reschedule).

### windows-quoted-glob-breaks-tsx-test-local-repro  (learned 2026-08-31, f3 unification promotion)
- **Symptom:** reproducing CI on Windows, `pnpm exec turbo run test --filter=… --continue` fails **all five**
  test tasks in ~1.6s — including packages the patch never touches. Direct run shows:
  `Could not find 'C:\...\apps\backend\'src\**\*.test.ts''` (note the doubled quotes in the path).
- **Root cause:** every backend-ish package's test script is `tsx --test 'src/**/*.test.ts'`. On Linux CI the
  shell strips the single quotes and tsx expands the glob; on Windows the quotes are passed through literally,
  so tsx looks for a file whose NAME contains them. Purely environmental — it is not a code failure and it is
  not caused by the patch.
- **Pre-submit check:** on Windows, do NOT read a red `turbo run test` as a real failure until you have run the
  runners directly. Reproduce as: `npx tsx --test $(find src -name '*.test.ts' | tr '\n' ' ')` then
  `npx vitest run`, with the CI env exported. Both must be green. Confirm the failing set includes packages
  your patch does not touch — that is the tell.
- **Fix pattern:** none in the repo (CI is green as-is). It is a local-repro technique, not a code change.
  Do not "fix" the package.json globs to satisfy a Windows box — that would change every package's test script
  for no CI benefit.

---

## An additive merge can silently drop additions that live INSIDE existing function bodies

**Found:** 2026-09-15, on PR #215 (Content Studio backend). Flagged by the repo's Codex bot; confirmed
real and ours.

**The failure.** When promoting, we take upstream's newer version of a shared file and re-apply our
additions to it — the right approach, and the one that preserves their work. The scan that drives it
looks for what is *missing*: absent files, absent blocks, absent interface fields, absent exports. That
scan is blind to an addition that is an **argument added to a call upstream already has**.

Concretely: `runAutomationCard` gained `card: cardFromAutomation(card)` on three existing calls
(`enqueueAndRunMakeModel` ×2, `runEvergreenCategory`). The merge carried the import, the new digest
branch, the interface fields and the `toValues` mapping — everything block-shaped — and dropped all
three arguments. `job-service` only invokes `distributeArticleSafely` when that field is present, so an
`industry` / `buying_tips` / `make_model` card with `distribution: "email"` or `"both"` published its
article and then **silently created no campaign draft**. It typechecked, because the field is optional.

**Why it is worth a standing check.** The symptom is absence. The run succeeds, the article appears, and
the missing email reads as an outreach problem rather than a dropped argument three modules away. No
test caught it because the test asserted the *old* call shape and therefore passed.

**The check — run it in the promotion clone before opening any PR:**

For every file merged additively (as opposed to copied wholesale), diff at the level of CODE LINES, not
files or blocks — list every non-comment line present in our tree and absent from the branch, then
triage each one as either (a) superseded by upstream's newer version, or (b) a genuine miss:

```python
def code(path):
    return [l.strip() for l in open(path, encoding="utf-8")
            if l.strip() and not l.strip().startswith(("//", "*", "/*", "*/"))]
only = [l for l in code(OURS) if l not in set(code(BRANCH))]
```

Most hits are (a) and must be left alone — that is the point of merging additively. The signal to look
for is a hit that is *part of a call* rather than a whole construct: a named argument, a spread, a
property inside an object literal.

**Fix pattern:** restore the argument at every call site, and make the test assert it explicitly rather
than loosening to `expect.objectContaining` — dropping the argument IS the regression, so the assertion
should fail if it ever goes missing again.

## A stacked PR's head must never end up inside its own base

**Found:** 2026-09-15. Self-inflicted, recovered, but unrecoverable in one respect.

A commit was made while the wrong branch of a three-PR stack was checked out, then pushed to the branch
below it. That put the upper PR's head commit inside the lower PR's branch — which is also the upper
PR's **base**. GitHub reads "every commit of the head is in the base" as merged and **auto-closes the
PR**. A merged PR cannot be reopened; the only recovery is a replacement PR with a new number.

**The check:** in a stacked promotion, print the checked-out branch immediately before committing AND
immediately before pushing:

```bash
git -C <clone> branch --show-current
```

Cheap, and it is the only thing standing between a mis-`checkout` and a dead PR number. Nothing about
the commit or the push will warn you — both succeed.

**Recovery, if it happens:** cherry-pick the intended commit onto the correct (clean) branch,
`--force-with-lease` both branches back to their intended shapes, rebase the upper branch onto the
corrected lower one, and open a replacement PR that explains the closure. Then verify the shared dev
branch contains none of your commits — `git merge-base --is-ancestor <sha> origin/development` per
branch — because that is the question a maintainer will actually care about.

---

## Editing a PR body right after pushing SILENTLY KILLS that push's CI run

**Observed:** 2026-09-17, on `fmchisti/collectibleclassics` #214 and #230. Both were pushed with a
remediation commit, then had their bodies corrected ~1-3 minutes later with `gh pr edit --body-file`.
Both ended the day with **no green check on the remediated head** — and neither reported a failure.
The run list told the story:

```
319d069c  pull_request  cancelled  19:20:27Z   <- the PUSH run, killed mid-flight
319d069c  pull_request  skipped    19:23:29Z   <- the BODY-EDIT run, skipped by design
```

**Why.** Two `ci.yml` features are individually correct and compose into a trap:

```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true          # (1) keyed on the PR NUMBER, not the sha

jobs:
  ci:
    if: github.event_name != 'pull_request' || github.event.action != 'edited' || github.event.changes.base != null
                                      # (2) skip title/body-only edits
```

A body edit fires `pull_request: edited`. Because the concurrency group is keyed on the PR number
rather than the head sha, that event's run **cancels the still-running `synchronize` run for the same
PR** — and then (2) correctly skips the job it just cancelled everything for. Net effect: the push's
CI is destroyed and replaced by nothing.

**This is invisible in the obvious places.** `gh pr checks` prints `skipping`, which reads like
"nothing to do" rather than "your CI was cancelled". `gh pr view` shows `mergeable=MERGEABLE`. Only
`gh run list` shows the cancelled run.

**The check** — after any push to a PR branch, and ALWAYS after editing the body:

```bash
gh run list --limit 5 \
  --json headSha,event,status,conclusion,createdAt \
  -q '.[] | .headSha[0:8] + " " + .event + " " + (.conclusion//.status)'
```

A `cancelled` on your head sha with no later `success` means the PR has no CI. Do not rely on
`gh pr checks` alone.

**The fix:** re-run the cancelled run — it re-runs against the same head sha, so it needs no new
commit and does not churn the branch:

```bash
gh run rerun <cancelled-run-id>
```

**The habit that avoids it entirely:** get the PR body right BEFORE pushing the code, or wait for the
push's run to finish before editing. Body edits are free once CI is green; they are destructive while
it is running.

> A related, benign case worth not confusing with this one: a stacked PR whose base is another feature
> branch reports **"no checks reported"**, because `ci.yml` filters `pull_request` on base
> `development`/`main`. That is by design and resolves when the PR is retargeted as the stack merges —
> it is not a cancelled run.

### db-ensure-script-not-registered-in-migration-manifest (learned 2026-09-27, from PR #256)
- **Symptom:** CI "Build, lint, typecheck, test" failed at its FIRST step, "Check migration manifest (backend)", with: `"db:ensure-investor-portal" is in neither ENSURE_SCRIPTS (scripts/migrate-live-production-schema.ts) nor RELEASE_EXEMPT — db:migrate-live-production would report success without running it`. All later steps (build/lint/typecheck/test) were CANCELLED by that early failure — they never ran, so they are UNVERIFIED on CI until the manifest is fixed.
- **Root cause:** A new `db:ensure-*` migration script was added to `apps/backend/package.json` (and its corresponding implementation file in `scripts/`) but was not registered in the `ENSURE_SCRIPTS` array in `apps/backend/scripts/migrate-live-production-schema.ts`. The manifest check gates on this — package.json registration alone is not enough. Without it, the live migrator would skip the script and report success, deploying a backend that expects tables/columns that don't exist.
- **Pre-submit check:** For ANY new `db:ensure-*` script added to `apps/backend/package.json`, add its name to the `ENSURE_SCRIPTS` array in `scripts/migrate-live-production-schema.ts` (or add it to `RELEASE_EXEMPT` if it is NOT meant to run on live — rare; almost all idempotent migrations go in ENSURE_SCRIPTS). Run `pnpm --filter collectibleclassics-backend check:migration-manifest` and confirm it prints "migration manifest OK" before opening the PR.
- **Fix pattern:** Append the script name to the `ENSURE_SCRIPTS` array, matching the file's exact quoting/indentation/trailing-comma style. If there are MULTIPLE new `db:ensure-*` scripts for the feature, add each one. Place it logically (near related migrations if possible; at the end is safe). If the script is idempotent (`CREATE ... IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`) and must run on live for the feature to work, it belongs in ENSURE_SCRIPTS.

### db-integration-specs-gating-on-boolean-database-url-run-on-ci-no-db (learned 2026-09-27, from PR #256)
- **Symptom:** CI "Test (backend, listing, scrapper-backend)" failed with 4 f10 DB-integration specs hitting `ECONNREFUSED ::1:5432` and `127.0.0.1:5432` (connection refused). Tests: `rebuild-ledger.spec.ts`, `rate-card/upsert.spec.ts`, `rate-card/rate-changes/project-rate-changes.spec.ts`, `rate-card/snapshot/capture.spec.ts`. The BUILD/MANIFEST step passed; this failure is in the TEST step.
- **Root cause:** Upstream CI's "Test" step (`.github/workflows/ci.yml` on `development`) sets `DATABASE_URL=postgresql://ci:ci@localhost:5432/ci` and `NODE_ENV=test`, but runs **NO Postgres service** — the connection is REFUSED. There is NO database on CI at all. These 4 specs gate ONLY on `HAS_DB = Boolean(process.env.DATABASE_URL)` (`describe.skipIf(!HAS_DB)`), so on CI they **RUN** (DATABASE_URL is set) but the connection fails. They are the ONLY DB-integration specs in the whole backend (every other backend spec is a no-DB unit test). Self-provisioning the schema is IMPOSSIBLE (you can't `CREATE TABLE` in a database that doesn't exist).
- **Pre-submit check:** For any DB-integration spec that gates on `Boolean(DATABASE_URL)` and touches feature-specific tables, gate the suite on a **CI-absent opt-in flag** so it skips on CI (which has no DB) but still runs locally when a developer opts in: `const HAS_DB = process.env.DATABASE_URL != null && process.env.RUN_INVESTOR_DB_TESTS === "1";`. On CI (`DATABASE_URL` set to a dead URL, `RUN_INVESTOR_DB_TESTS` unset) the `describe.skipIf(!HAS_DB)` blocks **SKIP** — no connection attempt, no ECONNREFUSED. Locally, a developer runs them with `RUN_INVESTOR_DB_TESTS=1` against a migrated dev DB. Reproduce on CI-exact condition (dead `DATABASE_URL`, flag unset) before opening the PR: `DATABASE_URL=postgresql://ci:ci@localhost:5432/ci NODE_ENV=test pnpm exec turbo run test --filter=collectibleclassics-backend`. The 4 specs must SKIP cleanly (0 failed suites, no ECONNREFUSED).
- **Fix pattern:** Changed `HAS_DB` from `Boolean(process.env.DATABASE_URL)` to `process.env.DATABASE_URL != null && process.env.RUN_INVESTOR_DB_TESTS === "1"` in all 4 specs. Updated file-header comments to document the opt-in flag. On CI the specs SKIP; locally with `RUN_INVESTOR_DB_TESTS=1` + a migrated dev DB they RUN + pass. Strictly additive.

### New user roles must be declared in the shared taxonomy (learned 2026-09-28, from PR #256)
- **Symptom:** Maintainer review requested moving enum value from feature SQL to shared migrator, adding role to USER_ROLES + USER_ROLE_LABELS + capability tier (TOOL_ONLY_ROLES or STAFF_ROLES).
- **Root cause:** A new role (`investor`) was added to the feature migration SQL (`sql/add_investor_portal.sql`) but NOT to the shared schema taxonomy (`packages/schema/src/user-roles.ts` + `role-capabilities.ts`). This left the role absent from both user editors (admin panel + mobile app), absent from the shared capability predicates, and not classified in the STAFF vs TOOL_ONLY split — the parity tripwire test in `ensure-deal.test.ts:456-464` enforces that USER_ROLES = STAFF_ROLES ∪ TOOL_ONLY_ROLES, so the PR would have failed that assertion.
- **Pre-submit check:** Before opening a PR that adds a new user role:
  1. Add the role to `packages/schema/src/user-roles.ts` (`USER_ROLES` array + `USER_ROLE_LABELS` record)
  2. Add to EITHER `packages/schema/src/role-capabilities.ts` `TOOL_ONLY_ROLES` (tool/portal-scoped, no general staff shell) OR the role implicitly lands in `STAFF_ROLES` (USER_ROLES − TOOL_ONLY_ROLES)
  3. Add to `apps/backend/scripts/ensure-user-role-enum-values.ts` `NEW_ROLES` array (the shared enum migrator, already in the migration manifest)
  4. Do NOT add `ALTER TYPE user_role ADD VALUE` in a feature migration SQL — the shared migrator handles it
  5. If the role is tool-only, add a comment to `TOOL_ONLY_ROLES` explaining its scope
  6. Run `pnpm exec turbo run typecheck test --filter=collectibleclassics-backend` and verify the `ensure-deal.test.ts` parity assertion passes with the updated taxonomy
- **Fix pattern:** Move the enum-value creation from feature SQL to the shared migrator (`scripts/ensure-user-role-enum-values.ts`), add the role to `USER_ROLES` + `USER_ROLE_LABELS`, classify it (add to `TOOL_ONLY_ROLES` or leave it to implicitly land in `STAFF_ROLES`), update the parity test assertion if needed (assert the new role is/isn't in STAFF_ROLES), and add any required predicates (e.g., `isInvestorOnlyRoles` mirroring `isAffiliatePortalRoles`).

### Adding a role to USER_ROLES breaks Record<UserRoleValue> across apps (learned 2026-09-28, from PR #256 round-5)
- **Symptom:** CI typecheck failed at `apps/mobile-app/app/(tabs)/users/index.tsx:929`: `Property 'investor' is missing in type '{ admin: { color: "#8B5CF6"; }; ... }' but required in type 'Record<UserRoleValue, RoleTone>'`. Round-4 added `investor` to `packages/schema/src/user-roles.ts` `USER_ROLES`, which updated the `UserRoleValue` union type. Any `Record<UserRoleValue, SomeType>` declaration in the codebase now requires an entry for `investor`, or it fails typecheck. Round-4 wrongly dismissed local test failures as "pre-existing Google Maps" when they were actually THIS typecheck regression (round-3 was CI-GREEN).
- **Root cause:** Adding a role to the shared `USER_ROLES` array updates the exported `UserRoleValue` type. Any exhaustive `Record<UserRoleValue, T>` (role tones, role permissions, role-to-X mappings) across ALL apps now expects the new role as a key. The failure is NOT in the shared schema package (that typechecks fine) — it's in CONSUMING apps that map over all roles. The mobile app's `roleTones` object (for badge colors) is a `Record<UserRoleValue, RoleTone>`, so TypeScript enforces completeness.
- **Pre-submit check:** After adding a role to `packages/schema/src/user-roles.ts`, grep the ENTIRE monorepo (all apps: backend, mobile-app, admin-panel, listing, bat, packages) for `Record<.*UserRole` and `Record<UserRoleValue` — find every exhaustive role mapping. Update each with an entry for the new role, matching the role's classification (tool-only roles like `affiliate` and `investor` get similar neutral tones; staff roles get distinct colors). Run the FULL typecheck (`pnpm exec turbo run typecheck --continue`) and confirm every app passes, not just backend. The mobile app typecheck often catches this when backend does not.
- **Fix pattern:** Add the new role to every `Record<UserRoleValue, T>` declaration:
  - `apps/mobile-app/app/(tabs)/users/index.tsx` `roleTones` object: `investor: { color: colors.statusNeutralText }` (same slate as `affiliate` for tool-only roles)
  - `apps/admin-panel/.../users.tsx` or similar if it has a role-to-X mapping (check for `Record<UserRole`)
  - Any role-permissions / role-hierarchy exhaustive maps (backend's `ROLE_HIERARCHY` already had it in this case)
  Verify typecheck green across all 23 tasks.

### Client-side role "bounce" guard placed inside the layout that also hosts the bounce destination (learned 2026-09-28, from PR #256 round-6)
- **Symptom:** An investor-only account got a BLANK page instead of the portal. A confinement guard added to `AuthenticatedLayout.tsx` (`if (isInvestorOnly(user)) return <Navigate to="/investor"/>`) returned BEFORE `<Outlet/>` — but `/investor` is a CHILD route of that same layout, so the destination view (`InvestorRoute` → `InvestorLayout`) never mounts. With react-router 7.14 the `<Navigate>` effect deps are stable, so it doesn't loop — it just renders `null` forever (blank), which is arguably worse (silent).
- **Root cause:** A redirect guard that fires for a role must EXEMPT that role's own destination path, or it prevents the destination from ever rendering when the destination lives under the same layout. The sibling guards self-terminated (`isRestrictedRoute` goes false at the destination; tool-only bounce checks `pathname === "/"`); the new one had no such terminator.
- **Second, independent dead-end (same PR):** adding the role to `TOOL_ONLY_ROLES` made `isToolOnlyUser()` true for it, so `canAccessAdminRoute()` routed it into the tool-only branch whose fallthrough is `return false` for any path not explicitly allowed — denying `/investor` and bouncing via `isRestrictedRoute` to `homeForUser` (= `/investor`) = same blank end, reached even if the layout guard is fixed. Fixing ONE does not fix the other.
- **Pre-submit check:** For any new client-side role confinement, trace BOTH paths for the confined role: (1) the layout `<Navigate>` guard must include `&& !pathname.startsWith(HOME)` so the destination renders; (2) `canAccessAdminRoute` (or equivalent allowlist) must have an explicit ALLOW arm for the role's route patterns inside whatever branch the role now falls into (tool-only, etc.) BEFORE that branch's `return false`. Manually load the portal AS the confined role (or an admin impersonating it) — do not assume the backend allowlist is the whole story.
- **Also:** an all-of "is-only" predicate (`isInvestorOnlyRoles`) returns false for a `["visitor", <role>]` set (visitor can't be removed via the editor, so public-signup accounts always have it) → the account slips past every bounce into the staff shell. Make the predicate TOLERATE `visitor`, or gate the staff shell on the positive `isStaffRoles` allowlist. Test `["visitor", role]`, `[role]`, `[role, staffRole]`, `["visitor"]`.

### drizzle-orm `postgres-js` delete/update result has `.count`, not `.rowCount` (learned 2026-09-28, from PR #256 round-6)
- **Symptom:** A maintainer suggestion to replace `.returning({ id })` (which materialises every deleted row just to count them) with `res.rowCount` would FAIL backend typecheck.
- **Root cause:** This repo's backend uses the `drizzle-orm/postgres-js` driver, whose delete/update result is typed `RowList<Row[]>` — it exposes affected-row count as `.count` (via `ResultMeta`) and has NO `.rowCount`. `.rowCount` is the `node-postgres` (`pg`) driver's property, not postgres-js.
- **Pre-submit check:** Before reading an affected-row count off a drizzle mutation result, confirm the driver: postgres-js → `result.count`; node-postgres → `result.rowCount`. Run `tsc --noEmit` on the backend to confirm.
- **Fix pattern:** Drop the `.returning(...)` (avoids materialising rows), read `const n = result.count ?? 0;`, and leave a comment noting `.rowCount` is the node-postgres equivalent for future readers.

## f10 #288 (2026-10-04) — promotion/rename: install deps before trusting typecheck
- **Class:** A promotion or shepherd agent that typechecks a FRESH upstream clone WITHOUT running `pnpm install` gets false-green: workspace packages (e.g. `@collectibleclassics/schema`) and devDeps (e.g. `vitest`) don't resolve, so tsc either bails or the agent discounts the errors — and a genuinely broken change ships to CI. ALWAYS `pnpm install` in the clone, then run the SAME build/typecheck CI runs, before pushing.
- **Rename-specific:** a symbol rename (e.g. InfoTip→MetricInfoTip) must update BOTH imports AND every usage, and then grep the whole app for stale references of the old name AND any transitional name. A renamed import with un-renamed usages is TS2304 (cannot find name) + TS6133 (unused import) — exactly the #288 round-1 failure.
- **Admin spec build:** `apps/admin-panel/tsconfig.app.json` must `exclude` `**/*.spec.ts`/`**/*.test.ts` (as the backend tsconfig does) so the app BUILD never type-checks a vitest-importing spec (TS2307 Cannot find module 'vitest'). Specs are type-checked by the test config, not the app build.

## Lane↔upstream divergence + patch hygiene (learned 2026-10-12, during the f10 Sheet remediation prep)

### A lane file can be AHEAD and BEHIND upstream at the same time — never port by copying files
- **Symptom:** `git hash-object` says a lane file differs from `origin/development`, and the naive readings are both wrong. Copying the lane file over development's DELETES upstream work; taking development's file DISCARDS ours.
- **Root cause:** A long-lived lane accumulates our unpromoted work (lane-ahead) while upstream accumulates merged PRs and maintainer remediations in the SAME module (lane-behind). Measured in `apps/backend` on 2026-10-12: `investor-ledger/tab-allowlist.ts` was lane-ahead by our new work, while in the same sweep `investor-ledger/persist/upsert-units.ts` was lane-BEHIND by 67 lines, `investor-analytics/dto.spec.ts` by 48, `scripts/check-live-merge-readiness.ts` by 250, and `scripts/migrate-live-production-schema.ts` by 144. A directory-level copy in either direction loses real code.
- **Pre-submit check:** Never build a promotion patch from a lane↔upstream file diff. Build it from **our own delta** — the uncommitted working-tree diff, or the diff of our feature commits against their own base — and apply it with `git apply --3way` onto a fresh clone of the CURRENT upstream base. Then diff the result against upstream to confirm the ONLY changes are the intended ones, and that no upstream line was removed.
- **Fix pattern:** `git diff -- <scope> > feature.patch` in the lane (our delta only) → fresh clone of `development` → `git apply --3way feature.patch` → `pnpm install` → typecheck → `git diff origin/development --stat` and read every file in the list. Any file you did not mean to touch is a lost-upstream-work bug, not noise.

### "Is our work promoted?" cannot be answered by commit subject — upstream squash-merges
- **Symptom:** Grepping `origin/development` for our commit subjects reported five f10 commits as absent, implying a large unpromoted backlog. They were in fact fully merged.
- **Root cause:** The upstream PR was SQUASH-merged, so the merge commit carries the PR title and none of the branch's individual commit subjects survive. A subject-based ancestry test therefore reports false "not promoted" for everything that actually landed.
- **Pre-submit check:** Test promotion by **content**, never by subject or sha: pick distinctive symbols the commit introduced (`git show <sha> | grep '^+export '`) and `git grep` them in the upstream base. Present ⇒ promoted. Also check for the file itself when the commit added one.
- **Fix pattern:** `git show <sha> | grep "^+export " | sort -u` → for each symbol, `git grep -l "<symbol>" origin/development -- 'apps/**'`.

### A raw control byte turns a .ts into a "binary" file — unreviewable and un-3-way-mergeable
- **Symptom:** `git diff --stat` reports `Bin 11957 -> 21479 bytes` for a TypeScript file instead of a line count.
- **Root cause:** The source contained 2 literal NUL (U+0000) bytes, used as composite-key separators inside template literals (`` `${tab}<NUL>${rowNumber}` ``) instead of the `\u0000` escape. Git's binary heuristic trips on a NUL in the first 8000 bytes. The file was otherwise valid UTF-8 and compiled.
- **Why it's gating, not cosmetic:** (1) GitHub shows no diff, so the maintainer is asked to approve an opaque blob; (2) `git apply --3way` cannot merge a binary hunk, so the promotion port fails; (3) editors and text tooling may silently drop or mangle a bare control byte.
- **Pre-submit check:** `git diff --stat | grep -i " Bin "` must be empty for source files, and scan touched files directly: `for f in $(git diff --name-only); do [ -f "$f" ] && grep -qP '\x00' "$f" && echo "NUL: $f"; done`.
- **Fix pattern:** Keep the NUL separator (a tab title or spreadsheet id cannot contain U+0000, so it is collision-proof where `:` or `|` is not — a tab really can be named `Q1: Sales`) but write it as the escape `\u0000`. The runtime string is identical; the file becomes text. Comment each site so a later reader doesn't "simplify" it to a colon.

### A non-zero `tsc` exit in a stale lane is not evidence of your own regression
- **Symptom:** `tsc -b --noEmit` in the lane failed with `broadcast.ts(39,3): TS2305: Module '"../outreach/campaign-service"' has no exported member 'assertPushable'` and a missing-`replyTo` TS2345 — in a file the current task never touched, prompting an agent to consider "fixing" another feature's in-flight work.
- **Root cause:** The lane's `CC/` was ~220 commits behind `origin/development`. `assertPushable` and the draft type's `replyTo` field exist in `development` (`campaign-service.ts:515` and `:117`/`:135`) but not in the lane's older copy, while the newer f11 `broadcast.ts` was authored against `development`. The PR branch for that feature typechecked clean and upstream CI was green — the breakage existed ONLY in the lane.
- **Pre-submit check:** Before treating a whole-project typecheck failure as yours, (1) confirm the erroring file is in your change set, and (2) check whether the missing symbol exists in the upstream base (`git grep '<symbol>' origin/development`). If it exists upstream and not in the lane, it is lane staleness — record it and move on. Verify your own work with a typecheck scoped to your files plus the module's vitest run, and treat upstream CI on the PR branch as the authoritative signal.
- **Fix pattern:** Do not patch the stale file in the lane; that change would be a no-op or a conflict at promotion. Note the pair of expected errors, diff any new error list against that known pair, and escalate only genuinely new entries.

### A defect found in a stale lane may already be fixed UPSTREAM, at a different layer (learned 2026-10-12, from PR #319 round-1)
- **Symptom:** A subagent found a real landmine in the lane — `scripts/seed-investor-portal-full.ts` created its ledger source with `sync_enabled = false` while `rebuildAllLedgerSources` filtered `sync_enabled = true`, so a fresh database landed raw rows, built zero units, and printed success. It fixed the seed (flip the flag, warn on an existing disabled source) and wrote a DB-gated spec. All correct **for the lane**. On `development` the change was redundant AND harmful, and its spec failed a real assertion.
- **Root cause:** `development` had already fixed the same defect at a better layer, in a file **absent from the lane**: `investor-ledger/active-sources.ts` defines `activeLedgerSourceWhere()` as "sync-enabled OR an upload" and both call sites use it (`persist/rebuild-ledger.ts:149`, `investor-analytics/repository.ts:304`). Its header documents the identical symptom — "an upload is not scheduled, so it is legitimately `sync_enabled = false` … the dev seed and `xlsx-import.ts` both hit it". The lane predates that commit, so it still carried the pre-fix `.where(eq(syncEnabled, true))` and the defect was genuinely live there.
- **Why keeping it would have been worse than redundant:** (1) it set `sync_enabled = true` on an `xlsx-upload` source, when upstream's definition is that the flag means "is this source in the SCHEDULED sheet read" and an upload never is — mislabelling the source; (2) its operator warning said the rebuild "will SKIP it and the portal will show zero seeded units" and suggested `UPDATE investor_ledger_sources SET sync_enabled = true`, which on `development` is false and would send someone to make a pointless, semantically wrong write. A fix aimed at the wrong layer does not just fail to help — it ships misinformation to an operator.
- **Pre-submit check:** before building a fix for any defect found in a lane that is behind upstream, confirm the defect still EXISTS on the current upstream base. Read the upstream version of the file you are about to change and of the consumer that exhibits the symptom; `git log --oneline -S"<the predicate you are fixing>" origin/development -- <path>` finds the commit that already changed it. If upstream has a module the lane lacks (here `active-sources.ts`), read it before assuming the behaviour it governs. Then run the new spec against the upstream base, not only against the lane.
- **Fix pattern:** revert the change to the upstream version (`git checkout upstream/development -- <path>`), delete the spec that encoded the lane's old behaviour, and confirm the rest of the work never imported either. Shrinking the PR is the right outcome; say plainly in the PR why the scope dropped.

### A DB-gated spec must gate on the opt-in var, not on DATABASE_URL alone (re-learned 2026-10-12, PR #319 round-1 — see also the 2026-09-27 PR #256 entry)
- **Symptom:** CI's test step reported exactly one failure — a brand-new spec dying on `connect ECONNREFUSED 127.0.0.1:5432` — while every sibling DB spec in the same module skipped cleanly. 191 passed, 1 failed.
- **Root cause:** the new spec used `const HAS_DB = Boolean(process.env.DATABASE_URL)`. CI **does** set `DATABASE_URL` (to `localhost:5432/ci`, visible in the job env) while running **no** postgres service, so that predicate is truthy on the runner. Every existing investor DB spec uses `process.env.DATABASE_URL != null && process.env.RUN_INVESTOR_DB_TESTS === "1"` — the second var is the opt-in that asserts a database is actually listening. It passed locally only because it was run with `DATABASE_URL` exported by hand, which hides the difference.
- **Pre-submit check:** grep a sibling spec in the same module for its `HAS_DB` line and copy it verbatim; never invent a gate. Then prove BOTH directions: with the opt-in var unset the file must report `skipped` (this is CI's shape, since CI sets `DATABASE_URL`), and with both vars set against the local dev DB it must pass. A spec that was only ever run one way has not been gated, only configured.
- **Note for delegated work:** this class was already in this runbook from PR #256 and a subagent reproduced it anyway. When delegating spec-writing, name the gating idiom in the brief rather than trusting the runbook to be read.

### A placeholder `.env` does NOT reproduce CI's env, so DB-gate behaviour differs silently (learned 2026-10-12, from PR #319 round-1)
- **Symptom:** A local full-suite run was green (191 files passed, 4 skipped, 2294 tests, zero failures) and the same commit failed in CI on one spec with `connect ECONNREFUSED`. The local run had `DATABASE_URL` set too — so the pre-push verification looked equivalent and was not.
- **Root cause:** `apps/backend/src/config/env.ts` starts with `import "dotenv/config"`, so a `.env` FILE is loaded only once something imports `config/env`. A spec that reads `process.env.DATABASE_URL` at MODULE TOP LEVEL (to compute its `HAS_DB` gate) evaluates that line before any such import has necessarily run in its vitest worker — so the var reads `undefined` and the suite SKIPS. CI sets the same variable as a real SHELL variable in the workflow env, where it is defined unconditionally, so the gate is truthy and the suite RUNS — into a database CI does not actually host. Same commit, same variable name, opposite behaviour, decided purely by whether the value arrives from a file or the environment.
- **Pre-submit check:** to replicate CI locally, **export the variables in the shell** for the run, never rely on a `.env` file: CI's `passThroughEnv` set is `NODE_ENV`, `DATABASE_URL`, `BACKEND_URL`, `SIGNING_LINK_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `SCRAPPER_SERVICE_KEY`, `GOOGLE_DRIVE_API_KEY`. Note that CI points `DATABASE_URL` at `localhost:5432/ci` while hosting **no** postgres service, so the faithful local shape is "these vars exported, nothing listening on 5432". A spec whose skip/run decision flips between those two shapes is mis-gated.
- **Also:** any gate computed at module top level from `process.env` is load-order sensitive by construction. Prefer reading it inside the `describe`/`beforeAll`, or gate on the explicit opt-in var (`RUN_INVESTOR_DB_TESTS === "1"`) which is only ever set deliberately in a shell and therefore behaves the same both ways.

### Editing a PR body while CI is running CANCELS the real run and leaves a "skipped" check (learned 2026-10-12, from PR #319)
- **Symptom:** After pushing a fix, a `gh pr edit --body-file` to correct the description produced a second workflow run that completed "skipped" in 34s and **cancelled the in-progress real run**. The PR then showed `mergeStateStatus: CLEAN` with checks reading CANCELLED and SKIPPED — no green run anywhere, and nothing blocking a merge.
- **Root cause:** `.github/workflows/ci.yml` lists `edited` in its `pull_request` `types` (so that retargeting a stacked PR's base fires CI), and the job is guarded on `github.event.changes.base != null`. A body-only edit therefore satisfies the trigger but fails the guard: the job skips, and because it belongs to the same concurrency group it supersedes and cancels the run that was actually testing the code.
- **Pre-submit check:** finish the CI observation BEFORE touching the PR body or title. If the description must be corrected after a push, either do it before pushing the commit, or accept that you must re-run CI afterwards. Never read `mergeStateStatus: CLEAN` as "CI passed" — a skipped check does not block a merge; look at the run's own `conclusion`.
- **Fix pattern:** re-run the cancelled run rather than pushing an empty commit, after confirming its `headSha` equals the branch tip (`gh run view <id> --json headSha` vs `git ls-remote <remote> <branch>`): `gh run rerun <id>`. Then watch that run id directly — the PR check rollup still carries the skipped entry and is misleading.
