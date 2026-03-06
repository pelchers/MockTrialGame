# Data Model and API Blueprint

## Core Entities
- User
- Organization
- Classroom / cohort
- Session
- SessionSeat
- Case
- CaseRole
- WitnessProfile
- Exhibit
- EvidenceMotion
- TrialEvent
- TranscriptSegment
- JuryInstruction
- VerdictRecord
- SandboxScene
- AIInteraction

## Event Categories
- session lifecycle events
- role assignment events
- trial progression events
- evidence offer/ruling events
- message/channel events
- jury events
- sandbox events
- audit/admin events

## API Surface Areas
### Session APIs
- create session
- join session
- assign role
- advance/pause phase
- fetch current state snapshot

### Case APIs
- list cases
- load case packet
- fetch role briefs
- fetch exhibits and witness metadata

### Trial Command APIs
- submit examination prompt
- offer exhibit
- object
- rule on objection
- submit closing
- issue instruction
- submit verdict

### AI APIs
- tutor explain request
- simulated role action request
- transcript summary request
- feedback generation request

## Modeling Notes
- Commands should be validated against both role permissions and phase legality.
- Read models should be shaped differently for judge, attorney, witness, juror, and spectator views.
- Transcript generation should be a product of event flow plus submitted speech content, not a separate parallel truth source.
