# ADR pointer stub

The reading map has ONE home: `.docs/planning/<feature>/user-docs/`.

Because an agent (or a person) working in the ADR tree will reasonably look for `user-docs/` *there*,
write this pointer-only stub at `.adr/orchestration/<feature>/user-docs/README.md`. It holds no content
of its own — duplicating the map would guarantee the two copies drift.

## Template

```markdown
# user-docs — pointer

The reading map for `<feature id>` lives in the **planning** tree, not here:

- `<full absolute path to .docs/planning/<feature>/user-docs/OVERVIEW.md>`
- repo-relative: `.docs/planning/<feature>/user-docs/OVERVIEW.md`

Why there: the planning tree holds this project's human-facing docs (README, prd, feature-explained,
guides, user-testing-instructions); the ADR tree holds the phase/implementation record. A reading map is
human-facing orientation, so it lives with the other human-facing docs. Maintained by the
`feature-user-docs` component — do not add content to this stub.
```

## Rules

- Pointer only — never copy map content into the ADR tree.
- Both the absolute and the repo-relative path, so it works whether the reader is pasting into an
  editor or reviewing a diff.
- One stub per feature, written/refreshed whenever the map is refreshed.
