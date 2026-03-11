# Sourced Legal Rules-Engine Research

## Purpose
This document records source-backed legal baseline research that should shape the first rules-engine and trial-state implementation.

## Research Takeaways
### Federal criminal cases provide a strong baseline for shared procedure
The U.S. Courts overview of federal criminal cases is useful for the broad actor model and trial lifecycle: government initiation, prosecutor role, grand jury context, burden of proof, trial, and sentencing. That makes it a reasonable starting reference layer for a shared criminal-trial baseline before state or competition overlays are added.

### Discovery needs to exist as a first-class pretrial workflow
Federal Rule of Criminal Procedure 16 is directly relevant to the product because it frames discovery and continuing disclosure obligations. That means discovery cannot be treated as a vague preparation phase; it should exist in the data model as requests, disclosures, restrictions, and updates.

### Admissibility requires a preliminary-question layer
Federal Rule of Evidence 104 matters because it places certain admissibility questions with the court. In product terms, some evidence-state transitions should require judicial resolution rather than simple upload-or-display behavior.

### Examination order and witness handling are not cosmetic
Federal Rule of Evidence 611 is central for direct, cross, and witness-control behavior. This reinforces the need for structured examination turns, order control, and role-specific speaking/action permissions.

### Hearsay needs explicit modeling, not just a label
Federal Rule of Evidence 801 is important because hearsay is one of the clearest early objection families to model. Even if the first release uses a simplified objection catalog, hearsay cannot be treated as a generic text objection.

## Implementation Implications
- Model pretrial discovery as structured state, not informal notes.
- Separate offered evidence from admitted evidence.
- Give judges or judicial-authority actors explicit control over preliminary admissibility transitions.
- Treat examinations as ordered procedural turns with role-aware permissions.
- Build an initial objection family around relevance, foundation, leading, and hearsay before broadening.

## Critical Research Gaps Still Open
- First concrete rule pack beyond the general federal-style baseline
- Exact objection catalog for launch
- What level of witness impeachment and rehabilitation is needed for launch
- How much post-trial procedure is necessary beyond verdict and sentencing hooks

## Sources
- U.S. Courts, Criminal Cases: https://www.uscourts.gov/about-federal-courts/types-cases/criminal-cases
- U.S. Courts educational criminal-trial steps infographic: https://www.mtd.uscourts.gov/sites/mtd/files/infographics_steps_criminal_trial.pdf
- LII, Federal Rules of Criminal Procedure Rule 16: https://www.law.cornell.edu/rules/frcrmp/rule_16
- LII, Federal Rules of Evidence Rule 104: https://www.law.cornell.edu/rules/fre
- LII, Federal Rules of Evidence Rule 611: https://www.law.cornell.edu/rules/fre/rule_611
- LII, Federal Rules of Evidence Rule 801: https://www.law.cornell.edu/rules/fre/rule_801
