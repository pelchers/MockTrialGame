# Sync Strategy

## Sync Scope
This product needs real-time multi-user synchronization for courtroom state, communications, evidence status, and session presence. It does not need broad offline-first sync for all actions.

## Source of Truth
The authoritative source of truth should be server-side session state plus durable event logs. Clients render role-aware read models and submit commands.

## Sync Domains
- Session presence and seat occupancy
- Trial phase and progression state
- Evidence status and rulings
- Channel messages and notes
- Jury deliberation state
- Transcript/event stream
- Spectator sandbox state within its own boundary

## Reconnection Requirements
- Clients must recover current phase and permissions on reconnect.
- Missed events must be replayable or reconstructable from snapshots plus event deltas.
- Jury/private-room visibility must remain intact after reconnect.

## Offline Boundaries
- Full offline participation is not a core requirement.
- Local draft notes may be cached client-side.
- Reconstructions may support local autosave drafts, but official session state remains server-authoritative.

## Recommendation
Use a command-plus-event model with targeted snapshots. Do not rely on peer-to-peer state authority for the courtroom core.
