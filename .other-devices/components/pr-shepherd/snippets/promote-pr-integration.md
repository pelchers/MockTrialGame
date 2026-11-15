# `/promote-pr` integration — one line to auto-register the opened PR

The PR Shepherd is designed to pick up **automatically** the moment `/promote-pr` opens a PR: in the
normal flow the user never calls `/pr-watch add` by hand. To wire that, add **one step** to the tail of
the `/promote-pr` command flow (both `.claude/commands/promote-pr.md` and `.codex/commands/promote-pr.md`),
right after step 10 ("Report + stop") where the PR/compare URL is known.

> **This package does NOT edit `/promote-pr` itself** — the command file is owned by the
> `contributor-conventions` component. This snippet only *describes* the one-line step to add there; the
> operator applies it.

## The step to add (after "Open the PR" / "Report")

```
11. **Hand off to the PR Shepherd.** On a `contributor` repo, once the PR is open, auto-register it for
    watching: `/pr-watch add <#N> <feature>@<handle>` (records the head sha as baseline and starts the
    ~20-min in-session watcher). From here the `pr-shepherd` loop remediates each CI/maintainer gating
    failure additively on the feature branch until the PR merges into the dev branch. See the `pr-shepherd`
    skill + `.docs/runbooks/development/pr-shepherd.md`.
```

## Notes
- Keep it **additive** — do not alter steps 1–10 of `/promote-pr`; append this as the final step.
- Mirror the identical line into the `.codex/commands/promote-pr.md` copy (its body is byte-identical to
  the `.claude` copy except the `## Instructions for Codex` header).
- Idempotent: if a `/pr-watch add` hand-off step is already present, do not duplicate it.
- Gate is inherited from `/promote-pr`: the hand-off only fires on a `contributor` repo with an actually
  opened PR; on an `owner` repo `/promote-pr` refuses before ever reaching this step.
