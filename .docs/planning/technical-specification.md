# Technical Specification

## Technical Posture
The system should be planned as a browser-first, real-time, event-driven platform with a clear separation between authoritative trial state, participant communication, AI orchestration, and 3D reconstruction. The stack remains deliberately undecided until the option-comparison phase is reviewed.

## Delivery Posture
- The target is a production-ready build, not an MVP or disposable prototype.
- System planning should assume launch-grade data flows, security boundaries, observability, and operational readiness.
- The planning baseline must not depend on mock-data-first workflows or fake service assumptions.
- Deployment should follow directly after implementation reaches the agreed testing bar.

## Architecture Principles
- **Authoritative session core:** one trusted source of truth for courtroom state, evidence status, and role permissions.
- **Event-first design:** all major courtroom actions should be represented as durable events.
- **Role-aware UX:** the client experience is permissioned by role and session phase.
- **AI as a service layer:** AI actions should read structured state and emit constrained outputs instead of mutating state directly.
- **Modular fidelity:** foundational rules are common; jurisdiction and competition overlays are pluggable.

## Major Subsystems
### 1. Web Client
Responsibilities:
- lobby and session join flows
- courtroom UI and role dashboards
- evidence views and objection controls
- transcript, notes, and deliberation interfaces
- spectator reconstruction sandbox

### 2. Session Orchestrator
Responsibilities:
- manage trial state machine
- validate legal/procedural action availability
- broadcast updates to connected clients
- maintain authoritative timing, permissions, and sequencing

### 3. Realtime Transport Layer
Responsibilities:
- reliable event delivery for trial actions
- presence tracking and reconnection support
- channel segmentation for courtroom, teams, judge, jury, and spectators
- media signaling and participant-state handling for voice/video sessions
- graceful fallback to text-only participation without breaking courtroom state

### 4. Persistence Layer
Responsibilities:
- users, organizations, classes, and sessions
- case materials, exhibits, and witness metadata
- event log, transcript, and verdict records
- AI prompts/results with audit boundaries

### 5. AI Orchestration Layer
Responsibilities:
- route role simulation requests to approved models
- enforce structured prompt and response contracts
- keep tutor/help flows distinct from authoritative rulings
- manage caching, cost controls, and fallback behaviors

### 6. Reconstruction Sandbox Layer
Responsibilities:
- lightweight scene graph and object placement
- timeline snapshots aligned to trial testimony
- spectator-authored reconstructions and demonstratives

## Data Flow
1. User action is issued from a role-aware client.
2. Session orchestrator validates whether the action is allowed in the current phase.
3. If valid, the action is stored as an event and applied to authoritative state.
4. Relevant participants receive realtime updates.
5. AI services can observe structured state and return advisory outputs or simulated role actions.
6. Review systems consume the same event stream for transcript and analytics generation.

## Legal-Rules Modeling Approach
- Start with a domain model, not hardcoded UI branching.
- Represent trial phases, procedural gates, evidence states, and role permissions explicitly.
- Treat jurisdiction-specific rules as overlays or policy packs.
- Distinguish educational simplification from full-fidelity simulation through configurable modes.

## Performance Expectations
- Fast join and reconnect for classroom sessions.
- Sub-second propagation for common text/state actions in healthy network conditions.
- Reconstruction sandbox should remain usable on mainstream school hardware by keeping scene complexity low.
- AI latency must not block authoritative state progression unless an AI role is currently acting.

## Implementation Assumptions for Planning
- TypeScript is the most likely application language due to browser-first delivery and ecosystem fit, but this is not final.
- A relational data model is likely appropriate because sessions, roles, evidence, rulings, and transcripts are highly structured.
- Separate storage strategies will be needed for structured data, transcripts, and larger media assets.
- Voice/video should be decoupled from authoritative trial-state transport even though it is enabled by default in the product experience.
- Planning should assume production integrations and real data contracts from the start rather than a mock-data-first path.

## Decision Inputs Still Needed
- Selected frontend framework
- Selected authoritative realtime server pattern
- Chosen 3D runtime for reconstruction
- Chosen AI deployment strategy and model portfolio
- Final hosting topology and regional data strategy
