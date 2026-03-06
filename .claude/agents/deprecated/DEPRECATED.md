# Deprecated Agents

Items in this folder have been superseded by newer implementations.

| Deprecated Agent | Replaced By | Date |
|-----------------|-------------|------|
| `planning-frontend-design-orchestrator` | `general-frontend-design-orchestrator` | 2026-02-28 |
| `frontend-design-subagent` | `general-frontend-design-subagent` | 2026-02-28 |

## Why Deprecated

The "planning" frontend design agents were the first generation of the concept generation system. They were replaced by the "general" frontend design agents which added:

- Adaptive style parsing (any style family, not just the original 5)
- Two-tier uniqueness flags (orchestrator-assigned + subagent-assigned)
- Directed reference discovery via WebSearch
- Configurable passes per style
- Improved anti-convergence enforcement
- Mandatory self-validation loops

## Migration

No migration needed. The general agents read the same style-config.json format and produce the same output structure. Simply use the general agents for all new concept generation work.
