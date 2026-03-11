# Launch Scope and Audience Model

## Decision Summary
MockTrial.app should be treated as one core platform serving multiple audiences:
- schools and classrooms
- mock-trial competition users
- independent and informal users

These are audience overlays, not separate core product modes. The shared core should remain:
- hosted session and role system
- trial-state engine
- evidence and objection workflow
- jury and verdict workflow
- voice/video/text communications
- AI side-panel and AI seat support
- spectator reconstruction environment

## Narrow Overlays That May Differ
Only these areas should vary by audience unless a real procedural difference requires more:
- coaching visibility and host overrides
- scoring or evaluation rubrics
- time limits and pacing controls
- rule-pack selection
- spectator permissions
- institutional roster/admin requirements

## Launch-Scope Boundary
The launch build should include:
- authoritative multiplayer session hosting
- core criminal-trial baseline flow
- evidence offer, objection, ruling, and transcript capture
- jury instructions, deliberation, and verdict capture
- voice/video/text by default with text-only fallback
- at least one usable reconstruction flow for spectators
- teacher/host controls and institutional account support
- a small canonical case library with real content

The launch build should not depend on:
- separate code paths for classroom versus competition versus open-play
- fake data or placeholder-only content
- unconstrained AI control of official court state

## Immediate Decision Docket
1. What exact launch roles are mandatory on day one?
2. What exact trial phases are mandatory on day one?
3. What is the first concrete legal rule pack?
4. What is the first canonical case library size?
5. Which AI roles are allowed at launch versus advisory-only?
6. What are the hard launch-gate tests for legal flow, media, and reliability?
