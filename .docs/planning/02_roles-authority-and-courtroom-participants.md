# Roles, Authority, and Courtroom Participants

## Core Roles
- Judge
- Prosecutor / prosecution team
- Defense attorney / defense team
- Witnesses
- Jurors
- Court staff such as clerk or bailiff
- Spectators
- Teacher / host / coach overlays

## Authority Model
### Judge
Controls rulings, phase approvals, jury instructions, and courtroom order within the simulation.

### Attorneys
Control examinations, arguments, objections, and evidence offers within role permissions.

### Witnesses
Respond to examination prompts and may access only bounded case knowledge.

### Jurors
Observe admitted evidence and testimony, receive instructions, deliberate, and vote.

### Spectators
Observe proceedings and interact in separate learning/reconstruction tools without default authority over the official record.

### Host / Teacher Overlay
May pause, annotate, override, or simplify procedure depending session mode.

## AI Participation Model
Any courtroom seat may be human- or AI-controlled, but the risk profile differs:
- AI judge requires the strongest guardrails
- AI witness requires knowledge-bound behavior
- AI juror requires careful bias and explanation handling
- AI tutor should never silently mutate official state

## Permission Design Implications
The system needs at least four permission axes:
- what a role can see
- what a role can say where
- what state mutations a role may request
- whether an action is currently legal in the phase
