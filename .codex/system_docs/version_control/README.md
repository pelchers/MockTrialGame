# Version Control System

## Purpose

This documentation covers the Git workflow conventions and branching strategies used
by Claude Code agents in this project. Two skills govern version control behavior:
`managing-git-workflows` for day-to-day commit discipline, and `savepoint-branching`
for creating milestone snapshots.

## Skill Locations

| Component              | Path                                               |
|------------------------|----------------------------------------------------|
| Git workflows skill    | `.codex/skills/managing-git-workflows/SKILL.md`   |
| Savepoint skill        | `.codex/skills/savepoint-branching/SKILL.md`       |
| Git workflow agent     | `.codex/agents/git-workflow-agent/AGENT.md`        |
| Savepoint agent        | `.codex/agents/savepoint-agent/AGENT.md`           |

## Core Principles

1. **Atomic commits** -- One logical change per commit, easy to review and revert.
2. **Conventional commit messages** -- Typed prefixes (`feat`, `fix`, `docs`, etc.)
   for consistent, parseable history.
3. **Agent attribution** -- Autonomous commits include `Co-Authored-By` trailer.
4. **Progress logging** -- Each commit updates `logs/development-progress.md`.
5. **Savepoints** -- Named branches for milestone snapshots, never destructive.

## Workflow Summary

```
  Feature Work
      |
      v
  Atomic Commits (one per task)
      |
      v
  Progress Log Update
      |
      v
  Savepoint Branch (on milestone)
      |
      v
  Push to Remote (HTTPS)
```

## Related Documentation

- [Commit Conventions](./commit-conventions.md) -- Message format, types, scoping, examples
- [Savepoint Workflow](./savepoint-workflow.md) -- Naming, steps, guardrails

## Remote Handling

- Always use the repo's configured remote.
- Use HTTPS remotes, never SSH.
- Do not hardcode repository URLs.

## Best Practices

1. Commit early, commit often -- small focused commits.
2. Write clear messages -- explain "why" not "what".
3. Review before committing -- use `git diff` to check changes.
4. Use branches for experiments -- keep main stable.
5. Pull before push -- stay in sync with remote.
6. Never commit secrets -- use `.gitignore` and env files.
