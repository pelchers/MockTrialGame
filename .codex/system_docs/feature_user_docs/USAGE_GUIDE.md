# Usage Guide: Feature User Docs

## Quick Start

```
/feature-user-docs f11                 # build or refresh one feature's reading map
/feature-user-docs --all               # every feature with an ADR or planning folder
/feature-user-docs --verify f11        # path check only, no writes (exit 1 on a dead path)
/feature-user-docs --status            # which features have completed phases but no map
/feature-user-docs --scan f11          # regenerate path-inventory.md only (no prose)
```

With no arguments it runs `--status` and asks which feature to map.

## The two output files

```
.docs/planning/<feature>/user-docs/
├── OVERVIEW.md         ← THE reading map. Model-authored prose. Read this.
└── path-inventory.md   ← GENERATED path ledger. Never hand-edit.

.adr/orchestration/<feature>/user-docs/
└── README.md           ← 4-line pointer to the planning-tree home.
```

## Detailed usage

### First map for a feature

```
/feature-user-docs f12-programmatic-lifecycle-engine@luke
```

The agent:

1. resolves the feature (fuzzy prefix is fine — `f12`);
2. runs `scan --write` to produce `path-inventory.md` (every path `stat`-ed);
3. **opens every file** it will annotate;
4. writes `OVERVIEW.md` grouped start-here → backend → UI → schema → wiring → tests → ADR → planning →
   conventions → evidence;
5. runs `verify` (non-zero = not done);
6. writes the ADR pointer stub.

### Refresh after a phase completes

Usually you do not invoke this — the hook tells you. When it does:

```
MANDATORY — feature-user-docs: an ADR phase for 'f12-…@luke' was just marked COMPLETE.
  phase now complete: .adr/orchestration/f12-…/05_confidence-gate-and-approval/primary_task_list.md
  REGENERATED (automatic, deterministic): .docs/planning/f12-…/user-docs/path-inventory.md  [41 -> 58 verified paths]
  NOT automatic — refresh the PROSE reading map now …
```

Then edit **incrementally** — add entries for the new paths to the right groups. Do not rewrite the
whole map; the curated prose is the expensive part.

### Direct script use

```
python .codex/skills/feature-user-docs/scripts/feature-user-docs.py list-features
python .codex/skills/feature-user-docs/scripts/feature-user-docs.py scan f11 --write
python .codex/skills/feature-user-docs/scripts/feature-user-docs.py scan f11 --json
python .codex/skills/feature-user-docs/scripts/feature-user-docs.py scan f11 --expand-cap 60
python .codex/skills/feature-user-docs/scripts/feature-user-docs.py verify f11
python .codex/skills/feature-user-docs/scripts/feature-user-docs.py verify --all
python .codex/skills/feature-user-docs/scripts/feature-user-docs.py status
```

Add `--repo-root <path>` to run against another checkout.

## What a good entry looks like

Both paths, then two sentences at most — what it is, what to read, why it matters.

```markdown
- **`C:\Work\App\CC-Local\CC\apps\backend\src\modules\email-campaigns\inventory-picker.ts`**
  `CC/apps/backend/src/modules/email-campaigns/inventory-picker.ts`
  The rotation/cooldown selector (pure, over injected inputs). Read `selectCampaignCars`: eligible =
  publicly listable + has an inventory number + has ≥1 photo; prefer cars not featured within the
  cooldown; backfill least-recently-featured rather than ever failing for lack of fresh stock.
```

Weak vs strong annotation:

| Weak | Strong |
|---|---|
| "Exports `CAMPAIGN_DEFS`." | "Read the `CAMPAIGN_DEFS` table — each campaign owns its own subject, copy and `buildBody`, which is why the three emails are genuinely distinct." |
| "Scheduler file." | "Read the semantics block: the run-claim makes it at-most-once-per-period and `campaignIsDueNow` is catch-up-safe after a restart." |

## Hook behaviour

| Event | Registration | Does what |
|---|---|---|
| `PostToolUse` (`Edit\|Write`) | `bash .codex/hooks/scripts/feature-user-docs-detect.sh` | On an edit to a feature's `primary_task_list.md` that grew the complete-phase set: **writes** `path-inventory.md`, prints prose-refresh instructions. Fires once per transition. |
| `SessionStart` | `… feature-user-docs-detect.sh --session-scan` | Reports features with completed phases but no map, and maps whose inventory is newer than their overview. Primes the fingerprints. |

Registered in both `.codex/settings.json` (the live file) and `.codex/hooks/settings.json` (the
hooks-module file the pipeline documents).

### Kill switches

| Variable | Effect |
|---|---|
| `FEATURE_USER_DOCS=off` | Disables the hook entirely, both modes. |
| `FEATURE_USER_DOCS_AUTOGEN=off` | Keeps detection + instructions, suppresses the `path-inventory.md` write. |

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `verify` reports a dead path | A file moved or was renamed after the map was written | Re-run `scan --write`, fix the entry, or move it to `## Mentioned but not verified`. |
| `ERROR: 'f2' is ambiguous — matches: …` | Two features share the prefix (`f2-affiliate-…`, `f2-quality-of-life-…`) | Pass the full feature id. The script never guesses. |
| Hook silent after a phase was marked done | Fingerprint already recorded that phase, or the edit went through a tool the hook does not see (`sed` via Bash) | `rm .git/feature-user-docs/<feature>.state`, or just run `/feature-user-docs <feature>`. |
| A file you know matters is absent from `path-inventory.md` | No doc names it and its directory exceeded the expand cap | Raise `--expand-cap`, or add it to `OVERVIEW.md` by hand (the prose map is yours; only the ledger is generated). |
| Inventory lists a huge pre-existing module as "NOT expanded" | Working as designed | Read that module selectively; only the cited files belong in the map. |
| `path-inventory.md` has mojibake | Something wrote it without UTF-8 | Only the script should write it — re-run `scan --write`. It forces `encoding='utf-8'` on read and write. |
| Map exists but `--status` shows `stale YES` | Inventory regenerated after the last prose edit | Refresh `OVERVIEW.md`, then it clears. |

## Constraints

- Writes ONLY to `.docs/planning/<feature>/user-docs/` and `.adr/orchestration/<feature>/user-docs/`.
- `CC/` (the product subtree) is **read-only**.
- Never commits, never pushes, never touches a git remote.
- `path-inventory.md` is generated — hand edits are overwritten on the next scan.

## Worked example

`.docs/planning/f11-weekly-email-automations-and-article-images@luke/user-docs/OVERVIEW.md` — 121 cited
paths, 0 dead, 3 reported as mentioned-but-not-verified (all belonging to an unbuilt expansion).
