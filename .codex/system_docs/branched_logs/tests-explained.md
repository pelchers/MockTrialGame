# Branched Logs + Device Sync — Tests Explained & Success Metrics

This is the definition-of-done for the device-sync + branched-log system, and the map of the automated
tests that prove it. All tests are **real** (real git repos, a real local bare remote, the real hook
scripts and engine, real assertions) — no mocks, no fake passes.

## Success metrics (what "flawless" means)

| # | Metric | How it's proven |
|---|---|---|
| **M1** | **Get the latest updates from EACH device** — after a pull, this machine holds both devices' most-recent work (component work here + app work + savepoints there). | `run-tests.sh` G/H (disjoint union on branch + on `main`); `test-log-pull.sh` (laptop's log entries absorbed). |
| **M2** | **Agent ingest fires perfectly** — the returning agent can state exactly where each device left off, what's next, and blockers, from `HANDOFF.md` + the unioned chat history ("I'm back — what's the state?"). | `/pickup` step 8 reads the unioned `HANDOFF.md`; `test-log-pull.sh` asserts the other device's handoff text is present and readable. |
| **M3** | **0 chat-history loss** — no entry from either device is ever dropped, duplicated, or reordered wrongly, through any number of merges/pulls. | `test-logs.sh` (0-loss, dedup, idempotent, corruption-recovery, tie-timestamps); real-repo migration verified 231/231 chat + 39/39 HANDOFF lines preserved. |
| **M4** | **Multimodal merge by user prompt** — `both` (default, merge most recent from both), `theirs` ("did work on the laptop, pull full from there, ignore here"), `ours` ("ignore the laptop, keep home"). In every mode the **logs still union** (M3 holds) and the other device's handoff is still read. | `/pickup` step 2 mode table + step 6 (code per mode) + step 7 (logs always union). |
| **M5** | **Never break the history by mistake** — a bad merge, a git-bash path quirk, a Windows encoding issue, or an identity clobber must not corrupt logs or push a wrong device identity. | `run-tests.sh` E/F/J (identity heal + post-merge auto-heal); engine forces UTF-8 + `MSYS_NO_PATHCONV=1`; merged views are `merge=ours` + regenerated (never git-line-merged). |

## Test suites (in `C:/Work/App/ds-testlab/`)

### `run-tests.sh` — device-sync edge cases (30 assertions)
- **A** HANDOFF concurrent append → `merge=union`, no conflict.
- **B** genuinely divergent lanes → banner reports `DIVERGED`.
- **C** wind-down when `main` moved → non-ff push correctly rejected (forces `/pickup`).
- **D** idle monitor re-run → single-fire, no duplicate handoff.
- **E** identity heal with no source of truth → warns, does not guess.
- **F** new-device setup → trusted identity capture.
- **G** BOTH updated, disjoint areas → clean union, no loss, identity preserved.
- **H** both advance `main` → 2nd push rejected → pickup → union on `main`.
- **I** both edit the SAME file → conflict surfaced (STOP + reconcile), never silently lost.
- **J** pickup the other device's work, wind down same session → identity never pushed wrong.

### `test-logs.sh` — branched-log engine unit tests (21 assertions)
- **L1** migrate legacy chat (no per-entry device) → device segment + merged view, header preserved, 0 loss.
- **L2** idempotency — re-merge = byte-identical.
- **L3** absorb the other device's legacy file → shared deduped, laptop-only added, chronological, 0 loss.
- **L4** corrupt the merged view → regenerate → losslessly recovered from segments.
- **L5** re-absorb the same source → no duplication.
- **L6** identical timestamps from both devices → BOTH survive.
- **L7** HANDOFF (desc, newest-on-top) — device parsed from the `##` header.

### `test-log-pull.sh` — live-pull integration (15 assertions) — THE dress rehearsal
Home runs the branched-log system; the laptop's remote carries **old-format** logs with its own entries
(laptop hasn't adopted the system). Home fetches + `absorb-all` + `merge-all`:
- laptop's chat + HANDOFF entries absorbed into laptop segments; shared history deduped;
- merged views carry ALL entries (0 loss), chronological, newest-on-top for HANDOFF;
- laptop's handoff text present (M2 — agent can read where the laptop left off);
- idempotent on re-run.

## Run them
```bash
cd /c/Work/App/ds-testlab
bash run-tests.sh        # device-sync edge cases        → expect 30/30
bash test-logs.sh        # branched-log engine           → expect 21/21
bash test-log-pull.sh    # live-pull integration         → expect 15/15
```

## Current status
| Suite | Result |
|---|---|
| `run-tests.sh` | **30 / 30** |
| `test-logs.sh` | **21 / 21** |
| `test-log-pull.sh` | **15 / 15** |
| real-repo migration 0-loss | chat **231/231**, HANDOFF **39/39**, sync-log untouched |

## The live test (gated — run only when the user directs)
Metric of success for the live pull on **this** repo: the system pulls the laptop's push from `main`,
unions both devices' work + logs with 0 loss, and the `/pickup` ingest lets the agent state exactly where
each device left off and what's next — under the user-chosen merge mode (`both` default). A savepoint
branch is pushed BEFORE the pull so the pre-pull state is always recoverable.
