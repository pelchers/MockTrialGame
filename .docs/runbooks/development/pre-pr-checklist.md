# Pre-PR Checklist — contributions to `fmchisti/collectibleclassics`

**Run this EVERY time before opening or updating an upstream PR.** Goal: **zero maintainer/admin
errors — approve on the first or second pass, never a preventable CI-red or "sent back."** It bundles
the default engineering checks with the SPECIFIC things the maintainer (**Fahim / `fmchisti`**) has
sent PRs back for, or that failed CI, on prior rounds. Every item below is tied to the PR it bit us on.

**Evidence base (our PRs to date):** #9/#10 **CLOSED — wrong base** (`website@dev`) · #11 (3 review
rounds: accrual-sync, fail-closed, stale schema types) · #12 **superseded** (DB-confirm + emailRedirect)
→ #13 · #28 (mid-file imports, `type="button"`, CI-didn't-fire-on-retarget) · #48 (**CI-red: vitest
`.test.ts`**, ops-notes-in-body) · #62/#65 (missing-deal robustness). Automated reviewers: **Copilot**
(`copilot-pull-request-reviewer`, #26 BugsFinder) on every PR. Attribution convention: **#21**.

Working remote = `pelchers/CC-Local` (all dev/testing). Upstream = `fmchisti/collectibleclassics`
(PR-only). Only the **`CC/` subtree** is product-relevant. Promotion runs via `/promote-pr`
(the `contributor-promotion-agent`) — see `contributor-conventions.md` + `.claude/commands/promote-pr.md`.

---

## Purpose — why this checklist exists + why we run it EVERY promotion (read first)

**This file is the distilled, accumulated record of every gate the maintainer (`fmchisti` / Fahim) has
enforced on our PRs — CI reds, review kickbacks, and hard pre-merge requirements — across the entire PR
history to date.** It is not generic best-practice boilerplate: **every single item below cost us at least
one round-trip, a CI-red, or a CLOSED PR at some point.** It is re-derived and refined from the actual
maintainer feedback + PR review threads (Fahim by hand, Copilot, the BugsFinder agent) after each PR.

**Why an agent must run ALL of it, every time, before opening/updating an upstream PR:**
- The maintainer reviews **adversarially by hand** and merges on his own schedule — a preventable miss
  doesn't just cost time, it can get the PR **closed** (see #9/#10, closed for the wrong base).
- CI + Copilot run on every PR; a `.test.ts`-imports-vitest slip (#48/#62) or a mid-file import (#28)
  reds the build before a human even looks.
- The goal is **approve on the first or second pass, never a preventable bounce.** Front-loading these
  fixes here is cheaper than a review round-trip on a repo where we are a guest contributor.

**For a future agent:** do NOT skip an item as "probably fine." Each is here because assuming "probably
fine" is exactly what bit us. If you discover a NEW gate from a fresh maintainer comment, add it here (and
to `pre-pr-learned-checks.md`) so it never costs a round-trip again — that is how this file stays
"precisely optimized based on the feedback continually sent from the repo admin." Keep this file and
`repo.local.md` in agreement (the base branch especially — see §1).

---

## 0. Gate (must all be true before starting)
- [ ] `repo.local.md` declares this repo `contributor`, and the user **explicitly** asked to promote/"push the PR" in this session.
- [ ] The feature is complete + validated locally (typecheck, tests, browser walk where relevant).
- [ ] Branch name follows `<feature-id>@<handle>` (e.g. `f2-affiliate-commission-tracking-and-editing@luke`).

## 1. Base branch — target `development`, open it DIRECTLY
- [ ] Target base is **`development`** (it carries the affiliate/wallet/f2/f5 subsystem). `website@dev` has **zero** affiliate code and is stale — #9/#10 were **CLOSED** for targeting it.
- [ ] ✅ `repo.local.md` `upstream_base` is now set to **`development`** (corrected 2026-08-27; it historically read `website@dev`, which got #9/#10 CLOSED). `development` is confirmed to exist upstream (`git ls-remote`). If ever ambiguous, pass the base **explicitly** to `/promote-pr` and don't rely on the config default.
- [ ] **Open the PR DIRECTLY against `development`** — do NOT open against another base then retarget. CI (`pull_request` types incl. `edited`) is guarded `... || github.event.changes.base != null`, and Fahim confirmed twice (#28, #11): a **retarget/edit does not reliably fire CI**. If CI didn't run, **push a fresh commit** to the branch to trigger it. **Never let a PR sit with no CI run.**
- [ ] We **never** merge — a PR proposes; Fahim opens `development → main` himself.

## 2. CI parity — reproduce CI EXACTLY (the #1 source of "sent back")
Status check = **"CI / Build, lint, typecheck, test"** (`.github/workflows/ci.yml`). It runs on
`push` to protected branches + `pull_request [opened, synchronize, reopened, edited]`. Reproduce ALL of
it against the **current** base before pushing:
- [ ] **Fresh-clone the current `development`** (never diff against our clone) and apply the patch onto it — base drift (a column that's `varchar`/`string|null` on his base but `number|null` on ours) only surfaces there. (Fahim's classic #11 finding: `AffiliateSubmissionStatusRow.year/mileage`.)
- [ ] **pnpm 9.15.9** + `pnpm install --frozen-lockfile` — **the lockfile MUST be in sync.** If the patch touches any `package.json`, regenerate + include `pnpm-lock.yaml`, or frozen-lockfile fails install before any test runs.
- [ ] Build: `pnpm exec turbo run build --filter=!collectibleclassics` — green (builds backend, admin-panel, listing, scrapper-ui, scrapper-backend, bat; the shared packages build FIRST — that's why "the 27 specs are green under the official path after the shared package build").
- [ ] Lint: `pnpm exec turbo run lint --filter=!collectibleclassics --continue` — 0 new errors. (`--continue` means CI reports ALL failures, not just the first — fix them all.)
- [ ] Typecheck: `pnpm exec turbo run typecheck --filter=!collectibleclassics --continue` — green.
- [ ] Test: `pnpm exec turbo run test --filter=collectibleclassics-backend --filter=listing --filter=scrapper-backend … --continue` with **`NODE_ENV=test`** — green. See §3 (the recurring CI-red). The official one-app path is `pnpm --filter collectibleclassics-backend test`.

## 3. ⛔ Vitest naming — `*.spec.ts`, NEVER `*.test.ts` (recurring CI RED: #48, #62)
Backend `test` script runs **`tsx --test 'src/**/*.test.ts' && vitest run`**. Node's `tsx --test`
picks up every `*.test.ts`; a suite that `import`s vitest throws and reds CI:
> `Error: Vitest cannot be imported in a CommonJS module using require(). Please use "import"`
- [ ] Every **vitest** suite in the patch is named **`*.spec.ts`**. Every **node:test** suite (`import test from "node:test"`) stays **`*.test.ts`**. (Both runners collect `.spec` for vitest / `.test` for node:test respectively.)
- [ ] Grep before pushing — must be EMPTY for shipped files: `for f in $(find CC/apps/*/src -name '*.test.ts'); do grep -lE 'from "vitest"' "$f"; done`
- [ ] Reproduce on the applied patch: `pnpm --filter collectibleclassics-backend test` → node:test suite passes, THEN vitest run includes the renamed specs. **No CJS throw.**
- [ ] Renaming is content-preserving (`git mv`, keep the vitest imports/`vi.mock`). Fahim's preferred fix is the rename, not a node:test rewrite.

## 4. Ops documentation IN THE PR BODY (HARD — #48 blocked on this)
Fahim will NOT approve without deploy ops in the body — "so preview/Live deploy is not guesswork." The body MUST spell out:
- [ ] **DB:** every `db:ensure-*` script to run, in order (e.g. `pnpm --filter collectibleclassics-backend db:ensure-outreach-tables`) — all idempotent/additive.
- [ ] **Env vars:** every new var + its default + whether required in prod (name must match code ↔ docs exactly).
- [ ] **Feature flags:** every flag this PR adds + its default (OFF where sensitive) + what flipping it does.
- [ ] **Post-deploy smoke-check (#28):** a short numbered checklist to verify on the **development environment** (not just local) after deploy — the exact pages/actions + expected result.
- [ ] Point the reviewer to the real integration/keys guide under `CC/.app-docs/` (see §6).

## 5. Additive / non-breaking (C7) — Fahim's hardest rule
- [ ] Prefer NEW tables/modules. **No** delete/rename/reformat/destructive `ALTER` of existing tables, columns, enums, APIs, routes, behavior.
- [ ] Additive changes to an EXISTING table only where **absolutely necessary** and strictly additive: a **nullable** column, `ADD VALUE IF NOT EXISTS`, or `CREATE [UNIQUE] INDEX IF NOT EXISTS`. When in doubt, separate table. Call out every existing-table touch in the PR body.
- [ ] Migrations are idempotent `db:ensure-*` (`CREATE … IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`) — never `DROP`/destructive `ALTER`. No one-off SQL outside an ensure script.
- [ ] Back-compat honored in READS (e.g. `coalesce(status,'paid') = …`, "NULL = legacy/paid").

## 6. Subtree scoping — what ships and what NEVER ships
- [ ] Patch contains **only `CC/`** content. Root `.adr/`, `.docs/`, `.chat-history/`, `.railway-docs/`, `device.local.md`, `.mcp.json`, and the `.docs/pr/<feature>/` kit **never** ship upstream.
- [ ] Anything the maintainer must READ (activation/keys/integration/user guides) is REAL content under **`CC/.app-docs/`** so it travels in the patch; the `.docs/pr/` kit only points to it.

## 7. Commit hygiene + attribution (#21 — maintainer convention)
- [ ] Upstream-facing commits carry **NO AI/tool co-author or marketing trailers** — strip `Co-Authored-By: Claude …` and any `Generated with … Claude Code` lines. Fahim's `.githooks/prepare-commit-msg` strips Cursor/AI co-author + marketing lines and appends a `Made-by: FahimCode` trailer; don't fight it. (Our CC-Local commits may keep the trailer; the **promoted patch/commits must not**.)
- [ ] Commit messages are clean, conventional (`feat(...)/fix(...)/chore(...)`), and describe the additive change.

## 8. Security + prod-config parity (Fahim reviews adversarially, by hand)
- [ ] Every NEW public/admin endpoint + auth-link flow: authn/authz present, not spoofable, no IDOR/enumeration, input validated. **Fail CLOSED in prod when a secret/env is unset** (#11: `NODE_ENV==="production"` + secret unset → 401; dev/local stays open).
- [ ] **Wire new logic into EVERY call site** — #11's High: deal updates synced staff commissions but never called `syncAffiliateAccrualForDeal`; the fix wired it at **all four** deal write sites. Grep for sibling calls and match them.
- [ ] **Return a success status only AFTER the DB write is confirmed** (#12: return `portalAccount:"created"` only after `affiliates.user_id` is linked; else keep `"unavailable"` + **log a warning**). Idempotent + first-touch-only where money/links are involved.
- [ ] Prod-vs-dev parity: our dev runs `DEV=true` + flags ON, which can hide prod behavior (e.g. delete=archive only under `NODE_ENV=production`). Verify the PROD-config path, not just dev.
- [ ] Feature flags default OFF where sensitive; note any flag whose default this PR flips.

## 9. Reviewer nits that get a PR sent back (Copilot + Fahim, recurring)
- [ ] **Imports at the TOP of the file — never mid-file** (#28: mid-file import → lint/build failure).
- [ ] **Non-submit buttons get an explicit `type="button"`** (#28) — otherwise they submit the enclosing form. **Scope:** this only bites a `<button>`/`<Button>` that is genuinely INSIDE a `<form>`. The admin panel's convention is to OMIT `type=` on shadcn `<Button>` in portaled dialogs with no form (≈550 without vs ≈14 with) — do NOT mass-add `type=` to form-less buttons (churn + inconsistent). Verify: for each NEW interactive component, `grep -c '<form'` — if 0, the nit is N/A; if >0, every non-submit button in that form needs `type="button"`.
- [ ] **No `window.location.replace` during render** — use a `useEffect` (an approved-with-nit in #28).
- [ ] Edit dialogs SEED from real stored values (fetch the field, pass it in) — never seed `null` then overwrite.
- [ ] Pagination `total` matches the FILTERED set (post-filter total, or paginate the filtered set).
- [ ] List/search endpoints search ALL fields the UI implies (handle/email/method/reference), not one.
- [ ] Concurrency: check-then-insert with no unique constraint = race → add the index + `onConflictDoNothing`.
- [ ] `updateX` handle/slug edits reuse the same normalize/reserved/min-length rules as create.
- [ ] Money stays in cents until display; toast verbs match the action; env-var names match code ↔ docs; labels disambiguate (#28: "Purchase" vs "Purchased").

## 10. Automated reviewers + benign noise (don't get tripped up)
- [ ] **Copilot** auto-reviews every PR. If it says "🟡 Not ready to approve," address each nit, then **re-request a Copilot review** — Fahim reads it even though it "doesn't count toward merge requirements."
- [ ] The **Supabase bot** comment ("ignored … no changes detected in `supabase` directory") is **benign noise** — we don't touch `supabase/`. Ignore it; it is NOT a failure.
- [ ] The **BugsFinder** agent (#26) may also comment — treat like Copilot.

## 11. Promotion mechanics (the flow `/promote-pr` runs)
- [ ] Build the `CC/`-relative **additive patch** under `.docs/pr/<feature>/` (subtree only).
- [ ] Clone upstream FRESH into a scratch dir; `git checkout development` → `git checkout -b <feature>@<handle>` (or check out the existing PR branch to UPDATE it).
- [ ] `git apply --3way <patch>`; resolve conflicts by **UNIONING** the additive edits — never delete/reformat upstream. (On a box lacking base blobs, `git fetch` CC-Local objects into the clone first.)
- [ ] Any no-op shim for a not-yet-upstream dependency (e.g. an outreach shim while f4 isn't on `development`) STAYS and is **documented in the body** — it's not a bug.
- [ ] Run §2 + §3 green **in the clone**; fill §12.
- [ ] Push the feature branch only, with **`CONTRIBUTOR_PUSH_OK=1`** (the `contributor-push-guard` hook blocks otherwise). **Never** push to `development`/`website@dev`/`website@live`.
- [ ] To UPDATE an open PR (review round): fast-forward a follow-up commit onto the SAME feature branch — CI re-runs; do NOT open a new PR (#12 → #13 was avoidable noise).
- [ ] `gh` authenticated as `pelchers`; if unavailable, surface the compare URL for one-click open.
- [ ] Open/leave the PR into `development`; body = §4 ops + integration guide link. **Stop — do not merge.**

## 12. Per-PR run log (fill in each round)

**PR #121** — Unify article schedules into automation cards + granular cadence (`f3-articles-unified-automations@luke` → `development`).
| Round | Date | Base commit | install(frozen) | Build | Lint | Typecheck | Test (spec naming) | Ops-in-body | Attribution clean | Copilot addressed | Pushed |
|-------|------|-------------|-----------------|-------|------|-----------|--------------------|-------------|-------------------|-------------------|--------|
| 1 | 2026-08-31 | `92b6b41` (development) | ✅ frozen | ✅ 13/13 | ✅ 0 err | ✅ 22/22 | ✅ node:test 177, vitest 399 (`.spec.ts`) | ✅ DB+env+flags+smoke | ✅ no AI trailers | pending (queued) | ✅ PR #121 |

## 13. Learned checks (grows over time) + after-submit shepherding
- [ ] Read **`pre-pr-learned-checks.md`** (this folder) before opening the PR — the append-only companion of
  concrete pre-submit checks the **PR Shepherd** distilled from past gating failures (divergence gaps, CI-env,
  vitest naming, …). Each entry is a thing to verify so a known failure class never costs a round-trip again.
- [ ] After opening the PR, hand it to the shepherd: **`/pr-watch add <#N> <branch>`** (auto-invoked by
  `/promote-pr`). It watches CI + the maintainer's comments and auto-remediates each gating failure additively
  on the feature branch until the PR merges. When it hits a NOVEL failure, it appends a new entry above and
  syncs it across repos. Skill `pr-shepherd` · runbook `pr-shepherd.md`.

---
### Source references
- `.docs/runbooks/development/contributor-conventions.md` · `.claude/commands/promote-pr.md` · `repo.local.md` · root `CLAUDE.md` (convention blocks)
- Worked examples: `.docs/pr/f2-affiliate-mgmt-tiers@luke/PR-DESCRIPTION.md`, `.docs/pr/f2-affiliate-commission-tracking-and-editing@luke/PR-DESCRIPTION.md`
- Upstream CI: `fmchisti/collectibleclassics` → `.github/workflows/ci.yml` (status check "CI / Build, lint, typecheck, test").
- Live review history (read the actual threads): our PRs **#11, #28, #48, #62** on `fmchisti/collectibleclassics` — `gh pr view <n> --repo fmchisti/collectibleclassics --json reviews,comments`.
