# Planning Visual Creative Orchestrator

Orchestrates visual/creative concept generation across 3 domains (data-vis, animation, graphic-design) with multiple styles per domain, dispatching isolated Claude Code Task agents per pass, then running Playwright visual validation.

## Agent Definition
See `planning-visual-creative-orchestrator/AGENT.md` for the full agent behavior specification.

## Skill Definition
See `.codex/skills/planning-visual-creative-orchestrator/SKILL.md` for the detailed workflow.

## Config
- `.codex/skills/planning-visual-creative-orchestrator/references/style-config.json`

## Output
- `.docs/design/concepts/data-vis/`
- `.docs/design/concepts/animation/`
- `.docs/design/concepts/graphic-design/`
