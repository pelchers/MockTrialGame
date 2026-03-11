# Trial Session State Machine

## Top-Level Session States
1. Draft setup
2. Lobby / role assignment
3. Pretrial preparation
4. In-court proceedings
5. Jury deliberation
6. Verdict and outcome review
7. Post-session debrief
8. Archived session

## In-Court Substates
- Call to order
- Preliminary matters
- Voir dire
- Opening statements
- Prosecution presentation
- Defense presentation
- Rebuttal / surrebuttal if enabled
- Closing arguments
- Jury instructions
- Deliberation release

## Command Categories
- administrative commands
- courtroom speech/actions
- evidence commands
- objection commands
- ruling commands
- jury commands
- spectator sandbox commands

## State-Design Rules
- Only one authoritative courtroom phase is active at a time.
- Private channels can remain active across phases but must honor role visibility.
- Sandbox activity is parallel but never authoritative to the courtroom record by default.
- Overrides must be traceable in the event log.

## Important Edge Cases
- participant disconnect during active examination
- AI fallback for absent humans
- mistrial branch
- jury deadlock
- judge or host override under facilitation settings
- late evidence dispute
