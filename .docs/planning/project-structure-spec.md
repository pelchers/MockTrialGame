# Project Structure Spec

## Current Repository Intent
The repository currently acts as a planning-first workspace. It should evolve into a product repository only after architecture selection.

## Proposed Future Structure
```text
/docs
  planning/
  research/
/apps
  web/
  session-service/
  ai-orchestrator/
/packages
  ui/
  trial-domain/
  rule-engine/
  api-contracts/
  shared-types/
/infrastructure
  deployment/
  observability/
/tools
  data-import/
  evaluation/
```

## Domain Package Boundaries
- `trial-domain` - phases, roles, rulings, evidence states, verdict logic
- `rule-engine` - policy packs for objections, admissibility, and jurisdiction overlays
- `api-contracts` - schemas for commands, events, and read models
- `shared-types` - shared DTOs and validation schemas

## Content and Scenario Assets
Case packets, exhibits, witness briefs, and reconstruction templates should eventually live in a structured content area with versioning and publication states.

## Planning Rule
Do not create implementation directories until build execution formally begins. Keep the repo documentation-led until the production build phase starts.
