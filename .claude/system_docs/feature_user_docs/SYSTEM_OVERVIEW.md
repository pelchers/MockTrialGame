# System Overview: Feature User Docs

## What it is

A per-feature **reading map**. For any feature in `.adr/orchestration/` or `.docs/planning/`, it
produces one document that tells a reader with zero context which files to open, in what order, and
why — each entry carrying the full absolute path as it exists on this machine, the repo-relative path,
and one or two sentences of orientation.

It exists because a feature's implementation is scattered across a product subtree (`CC/apps/backend`,
`CC/apps/admin-panel`, `CC/apps/listing`, `CC/packages`), an ADR phase record, and a planning folder —
and nothing connects them. After a context compaction, a device switch, or a month away, there is no
entry point. This is that entry point.

## Component map

```
.claude/
├── agents/feature-user-docs-agent/AGENT.md       # prose author; hard constraints
├── skills/feature-user-docs/
│   ├── SKILL.md
│   ├── references/{overview-template,adr-pointer-stub,sync-manifest}.md
│   └── scripts/feature-user-docs.py              # scan | verify | status | list-features
├── hooks/scripts/feature-user-docs-detect.sh     # PostToolUse + SessionStart
└── commands/feature-user-docs.md                 # /feature-user-docs $ARGUMENTS

.docs/planning/<feature>/user-docs/               # OUTPUT (home)
├── OVERVIEW.md                                   #   the reading map
└── path-inventory.md                             #   generated path ledger

.adr/orchestration/<feature>/user-docs/README.md  # OUTPUT (pointer stub only)
```

## Where it lives, and the decision behind it

**Home: `.docs/planning/<feature>/user-docs/`.** The planning tree is this project's human-facing docs
tree — README, prd, feature-explained, guides, user-testing-instructions — already governed by
`feature-planning-spec`. A reading map is human-facing orientation, so it belongs there.

The ADR tree is the *phase/implementation record*: per-phase task lists, `## Outcome` sections,
evidence. An orientation doc there would mix audiences and duplicate the job the Outcome sections
already do.

The ADR tree gets a **pointer stub** (`user-docs/README.md`, 4 lines) so the map is discoverable from
either side. Content is never duplicated — two copies drift, and drift is the exact failure mode this
component prevents.

## When to use vs alternatives

| Scenario | Use this | Alternative |
|---|---|---|
| "Where do I start on feature X?" | Yes — the map's whole purpose | Read the prd and guess |
| Cold resume after compaction / device switch | Yes | `HANDOFF.md` (session state, not file orientation) |
| Onboarding someone to one feature's code | Yes | `CC/.app-docs/runbooks/` (operational, not a reading order) |
| "What did phase 05 actually deliver?" | No | The phase's `## Outcome` section |
| End-user product documentation | No | `user_docs` system → `.appdocs/` (screenshots, HTML viewers) |
| "What should I work on next?" | No | `todo_tracker` → `TODO.md` |
| A parked thread to resume | No | `cycle_back` → `.chat-history/cycle-back.md` |

## Relationship to the `user_docs` system

Two similarly-named, non-overlapping systems:

| | `feature_user_docs` (this) | `user_docs` |
|---|---|---|
| Documents | A feature's **source tree** | The **product**, for its end users |
| Audience | A developer or agent reading code | A non-technical user |
| Output | `.docs/planning/<feature>/user-docs/OVERVIEW.md` | `.appdocs/user/`, `.appdocs/developer/` |
| Method | Path discovery + `stat` + prose annotation | Playwright screenshots + guides + HTML viewers |
| Agent | `feature-user-docs-agent` | `user-dev-docs-agent` |

## The honest auto-fire story

This is the part most likely to be misremembered, so it is stated the same way everywhere:

| Half | Automatic? | Why |
|---|---|---|
| `path-inventory.md` regenerated on phase completion | **YES** | Walk + regex + `stat` is deterministic; a shell hook can do it with no model. |
| `OVERVIEW.md` prose refreshed | **NO** | Each entry is "what this file is and why it matters", which requires reading the file. The hook detects the drift, names the added/removed paths, and instructs the agent. |

Claude Code hooks fire on **events** (`SessionStart`, `PostToolUse`, `Stop`, …), never on arbitrary repo
state. "On ADR phase completion" therefore means "on the event that carried the completion" — a
`PostToolUse` edit to a `primary_task_list.md` — plus a `SessionStart` sweep to catch completions no
hook saw (another device, a `sed` through Bash, a merge).

**Do not describe the overview as self-regenerating.**

## Quick command reference

| Command | Action |
|---|---|
| `/feature-user-docs <feature>` | Build or refresh one map |
| `/feature-user-docs --all` | Every feature |
| `/feature-user-docs --verify <feature>` | Path check only; exit 1 on a dead path |
| `/feature-user-docs --status` | Completed-phases-but-no-map report |
| `/feature-user-docs --scan <feature>` | Regenerate the ledger only |

## Design decisions

**Why a script rather than letting the model assemble the path list?**
The map's one unforgivable failure is a dead path — it sends a reader to a file that is not there and
destroys trust in everything else on the page. Discovery and existence checking are mechanical, so they
are deterministic Python. The model is left with the part only a model can do.

**Why both an absolute and a repo-relative path per entry?**
Absolute is what you paste into an editor on this machine, which is the actual act the map is for.
Repo-relative is what survives review, diffs, and another checkout. Neither alone is sufficient.

**Why exactly three "start here" files?**
A cold reader needs a bounded commitment. Two is usually not enough to convey what a feature does *and*
how it is shaped; five is a reading list, not a starting point.

**Why is `## Deliberately not included` mandatory?**
Without it, every absence reads as an oversight and the reader re-derives the exclusions by hand. Naming
`node_modules`, generated artifacts, and the large pre-existing module turns silence into a decision.

**Why does the hook fingerprint into `.git/` rather than a tracked file?**
Phase-completion state is per-clone and worthless to another device — the same pattern as
`.git/component-sync-pending`. It also keeps the hook from producing a tracked diff on every edit.

**Why is the stem probe worth a full subtree walk?**
Because citation misses what convention finds. `use-email-campaigns-mutations.ts` is named by no
planning doc and sits in a 37-file directory too large to expand — yet it holds the feature's write
path. The walk costs ~0.15s and is the only mechanism that reaches files like it.

## Constraints

- Writes ONLY to `.docs/planning/<feature>/user-docs/` and `.adr/orchestration/<feature>/user-docs/`.
- `CC/` is read-only — described, never edited.
- Never commits, never pushes, never touches a git remote.
- `path-inventory.md` is generated; hand edits are overwritten.
- Per-feature maps are **project-local and never synced**; only the component travels.
- One portability constant: `APP_SUBTREE` in the script (set to `""` where the app is at the repo root).
