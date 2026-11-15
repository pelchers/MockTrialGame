# Lane Forward-Integration — pre/post lane-switch convention

**Run this whenever you switch between feature lanes, and ALWAYS right after fixing an
earlier lane.** It keeps the newest lane the single furthest-forward point, so a fix made
on an older lane is never silently lost when you move on.

Companion to `pre-pr-checklist.md`. Same idea (a repeatable gate), different trigger:
that one fires before a PR; this one fires around **lane switches**.

---

## The principle
Our feature lanes are **stacked/sequential** off a common base: e.g.
`f1 → f2 → f5 → …`, each branch cut from the previous lane's tip. A later lane is meant
to contain **everything** in the earlier lanes plus its own work.

So when you go BACK to an earlier lane to fix something (a PR review, a CI failure, a bug),
that fix lives only on the earlier lane until you **forward-integrate** it. If you then
keep building on the later lane, or promote it, the later lane is missing the fix and is no
longer the furthest-forward point.

**Rule: an earlier-lane change must be merged forward into every later dependent lane before
that later lane is next built on or promoted.** The newest lane is always the superset.

## When to forward-integrate (triggers)
- [ ] **Immediately after committing fixes on an earlier lane** (e.g. PR review fixes on `f2`) → merge that lane forward into each later lane (`f5`, …).
- [ ] **Before switching TO a later lane to do new work** — first pull the earlier lanes forward so you build on the superset, not a stale base.
- [ ] **Before promoting a later lane** (its own PR) — confirm it already contains every earlier lane's latest fixes, or the PR will regress things the earlier lane already fixed.
- [ ] **At wind-down** — the device lane / `main` sync should reflect the furthest-forward lane, not a mid-stack one.

## The mechanic (merge forward, never rebase-drop)
Forward-integrate with a **merge** (preserves history, no force-push), earlier → later:
```
git checkout <later-lane>            # e.g. f5-cross-feature-gap-remediation@luke
git merge <earlier-lane> --no-edit   # e.g. f2-affiliate-commission-tracking-and-editing@luke
# resolve any conflicts by UNIONING (both lanes' additive edits) — never drop either side
```
Then validate on the merged later lane BEFORE pushing:
- [ ] `turbo run typecheck` (backend + admin) green
- [ ] the affected test suites green
- [ ] `CONTRIBUTOR_PUSH_OK=1 git push origin <later-lane>` to CC-Local

Do NOT rebase the later lane onto the earlier one if either is already pushed/shared —
rebase rewrites history and forces a force-push. Merge forward instead.

## Direction rules (don't mix them up)
- **Forward-integrate = earlier → later** (`git merge f2` while on `f5`). ✅ Keeps the superset current.
- **Never** merge a later lane back into an earlier one to "sync" it — that pollutes the earlier lane (and its PR) with unrelated later-lane work. ❌
- A fix that logically belongs to the earlier lane's feature is committed on the **earlier** lane first, then forward-integrated — not authored on the later lane.

## Lane-state table → now the Feature-Lane Registry (canonical)
The per-lane state (base, forward-integration status, furthest-forward) is tracked in the **canonical
Feature-Lane Registry** in the status board `.adr/current/development-progress.md` (see the multi-device
contract §1.5). Update THAT table on every forward-integration; don't duplicate it here. The row marked
the integration tip is the branch that gets built on, savepointed, and synced to `main`/device lane at
wind-down. There is **no fixed owner** — whichever device is at the convergence/promotion point performs
the forward-merge and records it in the registry's "Last advanced by" column.

> Direction unchanged: forward-integrate **earlier → later** with a merge (never rebase a shared lane);
> `pull --rebase` the feature branch before pushing so single-branch pushes stay fast-forward-only.

---
### Quick recall
> Fixed an older lane? Merge it forward into the newest lane **now**, validate, push — before you
> build on or promote anything. The newest lane is always the superset.
