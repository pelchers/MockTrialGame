# Codex setup for this repo

This repository uses Codex repo-scoped skills and agents. Place skills in `./.codex/skills/<skill-name>/SKILL.md` and agents in `./.codex/agents/<agent-name>/AGENT.md` so they travel with the repo.

## Skill format (Codex)

- Each skill is a folder with a required `SKILL.md`.
- `SKILL.md` uses YAML front matter with `name` and `description`, plus optional Markdown instructions in the body.
- Optional folders: `scripts/`, `references/`, `assets/`.

## How to create or install skills

- Use `$skill-creator` inside Codex to scaffold a new skill.
- Use `$skill-installer` to install curated skills if needed.

## Reference source for corollary skills

Use the Claude workspace at `<PROJECT_ROOT>/.claude` as a reference for creating corollary Codex skills. Port concepts from that folder into Codex-style skills here (one folder per skill with `SKILL.md` plus optional `scripts/`, `references/`, `assets/`), adapting content to Codex conventions rather than copying wholesale.
