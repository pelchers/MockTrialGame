# Risks and Decisions

## Active Decisions
- **Planning mode:** research-first before stack selection
- **Legal baseline:** broad foundational U.S. criminal-trial flow first, then overlays
- **Product posture:** educational and game-like, with educational integrity taking priority
- **Participation model:** both human and AI participants are first-class
- **Spectator role:** interactive, not passive

## Key Risks
### Legal Fidelity Risk
The product could oversimplify or misrepresent real procedure.
Mitigation:
- Separate foundational rules from jurisdiction overlays.
- Mark educational simplifications explicitly.
- Maintain a research trace for legal concepts.

### Complexity Creep
The concept spans legal simulation, realtime systems, AI orchestration, and 3D tools.
Mitigation:
- Maintain phased scope boundaries.
- Prototype risky subsystems independently.
- Separate must-have session core from advanced features.

### AI Reliability Risk
AI witnesses, jurors, or judges may produce inconsistent or pedagogically harmful behavior.
Mitigation:
- Use constrained prompts and role schemas.
- Keep authoritative state outside free-form model control.
- Introduce evaluation harnesses before enabling critical AI roles broadly.

### Classroom Network Risk
School networks may degrade media or realtime reliability.
Mitigation:
- Make text/state sync the primary dependency.
- Treat voice/video as optional and separately degradable.
- Plan for reconnect and low-bandwidth modes.

### Safety and Privacy Risk
The platform may involve minors, classroom data, recordings, and sensitive scenarios.
Mitigation:
- Minimize retained personal data.
- Use role-based visibility controls.
- Separate private rooms and transcripts carefully.
- Provide moderation and retention policies.

### Content Authoring Risk
High-fidelity cases and rule packs are expensive to produce.
Mitigation:
- Start with a smaller canonical case library.
- Define reusable case-packet schema early.
- Support educator-created scenarios later.

## Deferred Decisions
- Voice/video in phase one or later
- Institutional billing model
- Exact case-authoring workflow
- Final AI model portfolio
- Final frontend/backend stack
