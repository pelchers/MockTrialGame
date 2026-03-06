# Visual Creative Subagent

Generates one isolated visual/creative concept pass (data-vis, animation, or graphic-design) as a self-contained browser-renderable HTML/CSS/JS showcase. Each pass is written from scratch by the AI agent, not stamped from a template.

## Agent Definition
See `visual-creative-subagent/AGENT.md` for the full agent behavior specification.

## Skill Definition
See `.codex/skills/visual-creative-subagent/SKILL.md` for the detailed workflow.

## Domains
- **data-vis**: Interactive charts, dashboards, statistical graphics
- **animation**: Motion graphics, physics simulations, animated scenes
- **graphic-design**: Generative art, 3D renders, illustrations

## Output
- `.docs/design/concepts/<domain>/<style>/pass-<n>/`
