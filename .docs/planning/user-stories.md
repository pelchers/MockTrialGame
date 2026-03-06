# User Stories

## Teachers / Hosts
### Session Setup
- As a teacher, I want to create a trial session with predefined roles so that a class can begin quickly.
  - Acceptance Criteria:
    - I can choose a case/scenario and session mode.
    - I can assign humans and AI participants by role.
    - I can configure whether spectators and private rooms are enabled.

### Session Control
- As a teacher, I want to pause or advance the trial flow so that I can manage classroom pacing.
  - Acceptance Criteria:
    - I can see the current phase and next legal transition points.
    - I can pause the session without data loss.
    - I can override progression when teaching mode is enabled.

### Review
- As a teacher, I want post-session transcripts and event summaries so that I can assess performance.
  - Acceptance Criteria:
    - I can view a chronological event log.
    - I can inspect objections, rulings, and verdict history.
    - I can export review artifacts.

## Students / Participants
### Role Clarity
- As a student attorney, I want to know what actions are available in the current phase so that I do not get lost procedurally.
  - Acceptance Criteria:
    - My interface reflects my role and current trial phase.
    - Available actions are visible and contextual.
    - I receive explanations for disabled actions.

### Evidence Handling
- As a student attorney, I want to introduce or challenge evidence so that I can practice courtroom advocacy.
  - Acceptance Criteria:
    - I can select exhibits and request admission.
    - Opposing counsel can object.
    - The judge can rule and the state updates for everyone.

### Witness Work
- As a witness player or AI witness, I want structured testimony prompts so that my participation aligns with the case record.
  - Acceptance Criteria:
    - Witnesses see only the materials they are permitted to know.
    - Examination turns are tracked.
    - Testimony becomes part of the transcript.

## Jurors
### Deliberation
- As a juror, I want a private deliberation space so that I can discuss the case outside the public courtroom.
  - Acceptance Criteria:
    - Deliberation begins only after instructions are issued.
    - Juror messages are isolated from other roles.
    - Verdict submission follows the configured decision rule.

## Spectators
### Learning and Reconstruction
- As a spectator, I want to explore a reconstruction sandbox so that I can understand competing theories of the case.
  - Acceptance Criteria:
    - I can place and move scene objects or actors.
    - I can compare multiple versions of a scenario.
    - Sandbox changes do not alter official trial state unless submitted through a formal workflow.

## AI-Assisted Users
### Tutor Support
- As a learner, I want an AI side panel that explains procedure and terminology so that I can participate without derailing the session.
  - Acceptance Criteria:
    - I can ask what the current phase means.
    - I can request plain-language explanations of objections and rulings.
    - The assistant distinguishes explanation from legal advice.

## Administrators
### Org and Access Control
- As an administrator, I want organization and classroom controls so that I can manage institutions safely.
  - Acceptance Criteria:
    - I can manage teachers, rosters, and session policies.
    - I can restrict data access by organization.
    - I can audit important administrative actions.
