# Production Frontend System

System documentation for the production-quality frontend generation agents and skills.

## Purpose

Generates a production-quality frontend prototype from actual application requirements — real data models, user stories, and interactivity specs — using a chosen design direction. Unlike the general/exploration agent which creates many divergent concepts, this system creates one convergent, fully functional frontend ready for framework migration.

## Documentation

| Document | Description |
|----------|-------------|
| [architecture.md](architecture.md) | Two-tier agent architecture, data flow, file locations |
| [schema-inference.md](schema-inference.md) | 5-layer multi-source schema inference pipeline |
| [component-reconciliation.md](component-reconciliation.md) | Pre-registration + post-generation component verification |
| [input-modes.md](input-modes.md) | Three source modes (style transfer, template basis, custom direction) + iteration support |

## Quick Reference

**Invoke the orchestrator** with one of:
- Style transfer: point to an external website URL
- Template basis: point to an existing concept pass folder
- Custom direction: describe the desired visual direction

**Output location**: `.docs/production/frontend/` (configurable)

**Key output files**:
- HTML pages (1 per route) with component boundary comments
- `style.css` + `app.js` (shared across pages)
- `validation/transfer-manifest.json` — maps every component to target framework
- `validation/user-story-checklist.json` — tracks story coverage
- `validation/component-reconciliation.json` — verifies nothing was missed
- `schema-inference-report.json` — shows where each data field came from

## Agent & Skill Locations

| Component | Claude Path | Codex Path |
|-----------|-------------|------------|
| Orchestrator Agent | `.claude/agents/production-frontend-orchestrator/agent.md` | `.codex/agents/production-frontend-orchestrator/AGENT.md` |
| Orchestrator Skill | `.claude/skills/production-frontend-orchestrator/SKILL.md` | `.codex/skills/production-frontend-orchestrator/SKILL.md` |
| Spec Template | `.claude/skills/production-frontend-orchestrator/references/production-spec-template.md` | `.codex/skills/production-frontend-orchestrator/references/production-spec-template.md` |
| Subagent Agent | `.claude/agents/production-frontend-subagent/agent.md` | `.codex/agents/production-frontend-subagent/AGENT.md` |
| Subagent Skill | `.claude/skills/production-frontend-subagent/SKILL.md` | `.codex/skills/production-frontend-subagent/SKILL.md` |
| Library Catalog | `.claude/skills/production-frontend-subagent/references/library-catalog.json` | `.codex/skills/production-frontend-subagent/references/library-catalog.json` |
| Validation Script | `.claude/skills/production-frontend-subagent/scripts/validate-production-playwright.mjs` | `.codex/skills/production-frontend-subagent/scripts/validate-production-playwright.mjs` |
