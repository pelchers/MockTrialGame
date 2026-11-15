---
name: feature-user-docs
description: Build or refresh a feature's `user-docs/` reading map — an OVERVIEW.md listing the FULL absolute path to every pertinent file for that feature, each annotated with what it is, what to read in it, and why it matters. Verifies every path exists before writing it.
invocable: true
---

# /feature-user-docs — per-feature reading map

Runs the `feature-user-docs` component (skill `feature-user-docs`, agent `feature-user-docs-agent`)
against a feature's folders, producing the orientation doc a cold reader needs: which files to open, in
what order, and why.

**Home:** `.docs/planning/<feature>/user-docs/OVERVIEW.md` (the planning tree holds human-facing docs;
the ADR tree gets a pointer stub only).

`$ARGUMENTS` selects the operation:

- `/feature-user-docs <feature>` — build or refresh the map for one feature. Accepts a fuzzy prefix
  (`f11`) or the full id (`f11-weekly-email-automations-and-article-images@luke`).
- `/feature-user-docs --all` — every feature with an ADR or planning folder. Refreshes existing maps and
  creates missing ones; report per feature.
- `/feature-user-docs --verify <feature>` (or `--verify --all`) — path check only, **no writes**. Exits
  non-zero and names every dead path.
- `/feature-user-docs --status` — phase-completion + map-staleness report across all features; names
  which features have completed phases but no map.
- `/feature-user-docs --scan <feature>` — regenerate only the deterministic `path-inventory.md`
  (no prose work).

With no arguments, run `--status` and ask which feature to map.

## Instructions for Claude

1. Invoke the **`feature-user-docs`** skill and follow it. For a build/refresh, hand off to the
   **`feature-user-docs-agent`**; `--verify`, `--status` and `--scan` are script calls you can run
   inline.

2. Always start from the deterministic scan — never hand-assemble a path list:

   ```
   python .codex/skills/feature-user-docs/scripts/feature-user-docs.py scan <feature> --write
   ```

3. **Read every file you annotate.** Header comment + exported symbols at minimum. Never write a
   sentence about a file you did not open.

4. **Verify before reporting done.** A non-zero exit means the map is not finished:

   ```
   python .codex/skills/feature-user-docs/scripts/feature-user-docs.py verify <feature>
   ```

5. Write the ADR pointer stub at `.adr/orchestration/<feature>/user-docs/README.md`.

6. Report: paths mapped, the three start-here files, and **any path you could not verify** with the doc
   that named it. Never silently drop an unverifiable path, and never guess one into the map.

## Constraints

- Writes ONLY to `.docs/planning/<feature>/user-docs/` and `.adr/orchestration/<feature>/user-docs/`.
- `CC/` (the product subtree) is **read-only** — describe it, never edit it.
- Never commit, never push, never touch a git remote.
- `path-inventory.md` is generated; never hand-edit it.

## Notes

- The **PostToolUse hook** (`.codex/hooks/scripts/feature-user-docs-detect.sh`) regenerates
  `path-inventory.md` automatically when an ADR phase is marked complete, and then **instructs** a
  refresh of the prose `OVERVIEW.md` — which is not automatic, because annotating files requires
  reading them. The **SessionStart** registration (`--session-scan`) reports missing and stale maps.
- Kill switches: `FEATURE_USER_DOCS=off` (whole hook), `FEATURE_USER_DOCS_AUTOGEN=off` (inventory write
  only).
- The per-feature maps are **project-local — never synced**; only the component travels. See
  `.codex/skills/feature-user-docs/references/sync-manifest.md`.
- Worked example:
  `.docs/planning/f11-weekly-email-automations-and-article-images@luke/user-docs/OVERVIEW.md`.

$ARGUMENTS
