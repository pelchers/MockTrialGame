# Product Requirements Document

## Product Summary
MockTrial.app is a browser-based multiplayer simulation platform for mock trials, courtroom education, and legal-skills training. It supports hosted sessions, human and AI role participation, rules-aware trial flow, jury systems, and an interactive spectator reconstruction environment.

## Problem Statement
Existing mock trial experiences are usually fragmented across classroom handouts, video calls, static scripts, or narrowly scoped educational tools. They rarely combine realistic courtroom flow, multiplayer orchestration, structured evidence handling, AI augmentation, and spectator learning tools in one system. MockTrial.app aims to close that gap.

## Objectives
- Make courtroom procedure explorable in a browser-based, multiplayer format.
- Support both instructional use and more open-ended game-like participation.
- Provide a role-flexible system where seats can be filled by humans or AI agents.
- Create a reusable courtroom simulation engine that can support multiple educational and training scenarios.
- Produce a planning blueprint strong enough to support implementation without premature stack lock-in.

## Success Criteria
- A teacher can host a structured trial session and assign roles within minutes.
- A student can understand where the trial is in the process and what actions are available.
- AI seats can substitute for missing participants without breaking the session structure.
- A spectator can learn from the trial and interact with reconstructions without disrupting the courtroom flow.
- The documentation supports informed architecture selection after comparative review.

## Users
### Teachers / Professors
Need predictable session setup, classroom controls, role assignment, pacing tools, and review artifacts.

### Students / Trainees
Need clear action prompts, procedure guidance, legal terminology support, and a fair multiplayer environment.

### Independent Players
Need lightweight session creation, flexible role mixes, and approachable onboarding.

### Spectators / Reviewers
Need observational tools, transcripts, timeline views, and reconstruction interactivity.

## Functional Requirements
### 1. Session Creation and Hosting
- Create hosted sessions with lobby codes or invite links.
- Configure case type, participant count, AI seat usage, and audience permissions.
- Allow private team rooms and observer access settings.

### 2. Role Assignment and Permissions
- Assign or reassign judge, prosecution, defense, witness, juror, bailiff/clerk, and spectator roles.
- Support AI control for any role where simulation is enabled.
- Enforce role-specific actions and view permissions.

### 3. Case and Pretrial Management
- Load case packets, witness lists, exhibits, timelines, and stipulations.
- Track motions, witness preparation, and exhibit readiness.
- Support teacher-authored or platform-authored scenarios.

### 4. Trial Flow Engine
- Guide the session through voir dire, openings, examinations, objections, closings, instructions, deliberation, verdict, and selected post-trial branches.
- Allow the judge or host to advance, pause, or branch the session.
- Maintain a full event transcript and action timeline.

### 5. Evidence and Objection Workflow
- Present evidence admission requests with provenance and visibility controls.
- Offer objection categories, timing windows, and ruling paths.
- Track admitted, excluded, demonstrative, and challenged items.

### 6. Jury System
- Provide juror note-taking, instruction viewing, deliberation rooms, and verdict entry.
- Allow configurable jury modes: individual votes, unanimity, supermajority, advisory verdict, or coach-led simplified mode.

### 7. Communication Channels
- Provide courtroom-wide, team-private, judicial, jury, and spectator communication spaces.
- Support voice, video, and text together by default during live sessions.
- Allow participants to fall back to text-only or selectively disable audio/video when needed.
- Preserve auditable records where appropriate.

### 8. AI Assistance and Role Simulation
- Offer a side-panel assistant that explains procedure and terminology.
- Simulate missing participants with role-specific AI behavior.
- Provide structured feedback after a session for educational review.

### 9. Spectator Reconstruction Sandbox
- Allow spectators to reconstruct scenes, position objects/actors, compare testimony, and generate demonstrative visuals.
- Keep sandbox output separate from official evidence unless explicitly submitted.

### 10. Review and Analytics
- Export transcripts, event timelines, rulings, and verdict outcomes.
- Provide teacher-facing review summaries and student feedback hooks.

## Non-Functional Requirements
- Browser-first and responsive on desktop and tablet; limited mobile spectator support acceptable in early phases.
- Real-time latency should feel immediate for courtroom actions under classroom conditions.
- Session state must remain authoritative and auditable.
- The system must support graceful degradation when AI services are unavailable.
- The system must degrade gracefully from voice/video+tandem text to text-only participation when bandwidth, hardware, privacy, or accessibility needs require it.
- Privacy controls must account for minors, classrooms, and sensitive educational data.

## Open Product Questions
- How much jurisdiction-specific realism should be exposed in beginner mode?
- Should case authoring be part of phase one planning or a later platform layer?
- How much freedom should spectators have before sandbox actions risk distracting from the trial?
