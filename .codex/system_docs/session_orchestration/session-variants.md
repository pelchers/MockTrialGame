# Session Variants

## Overview

Three session variants share the same foundational phase lifecycle but differ in
their focus, output artifacts, and subagent behavior. Choose the variant that matches
your session's primary objective.

## Comparison Table

| Feature                  | longrunning-session        | orchestrator-session       | research-docs-session       |
|--------------------------|----------------------------|----------------------------|-----------------------------|
| **Primary use case**     | ADR orchestration workflow | Multi-phase delegation     | Research + documentation    |
| **Who runs phases?**     | Current chat or subagent   | Always a new subagent      | Subagent with research focus|
| **Phase kickoff**        | Reads phase plan           | Reviews previous review    | Aligns with PRD + plan     |
| **Subagent spawning**    | Via queue + hook           | Via queue + hook (required)| Via queue + hook            |
| **Poke-back required?**  | Yes (implicit or explicit) | Yes (structured, mandatory)| Yes (structured)            |
| **Extra outputs**        | None                       | Poke template              | Sources, media references   |
| **Citation validation**  | No                         | No                         | Yes                         |
| **Sitemap integration**  | No                         | No                         | Yes                         |

## When to Use Each Variant

### longrunning-session

Use this variant for **general ADR orchestration** where work is primarily code-based.

**Best for:**
- Feature implementation across multiple phases
- Infrastructure or architecture changes
- Any multi-step coding task that benefits from phase boundaries

**Distinguishing traits:**
- Produces the full set of 6 output files (PTL, PRD, tech req, notes, phase plan, review)
- Can run phases in the current chat or delegate to subagents
- The most general-purpose variant

**Skill path:** `.codex/skills/longrunning-session/SKILL.md`
**Agent path:** `.codex/agents/longrunning-worker-subagent/AGENT.md`

### orchestrator-session

Use this variant when you need **strict delegation** where every phase runs in a fresh
subagent and the current chat acts purely as an orchestrator.

**Best for:**
- Large sessions where context window exhaustion is a concern
- Work requiring clean isolation between phases
- Sessions where you want a persistent orchestrator tracking all phases

**Distinguishing traits:**
- The orchestrator never executes phase work directly
- Every phase starts with a brief review of the previous phase review
- Requires a structured poke-back with 5 mandatory sections
- Uses the poke template for consistency

**Skill path:** `.codex/skills/orchestrator-session/SKILL.md`
**Agent path:** `.codex/agents/longrunning-orchestrator-agent/AGENT.md`

### research-docs-session

Use this variant for sessions focused on **research and documentation** rather than code.

**Best for:**
- Documentation sprints
- Research tasks that produce written deliverables
- Content that references external sources, media, or assets

**Distinguishing traits:**
- Captures sources, notes, and assets in dedicated folders
- Validates citations and media references against source URLs
- Ties documentation updates to the project sitemap
- Tracks media references and local copies

**Skill path:** `.codex/skills/research-docs-session/SKILL.md`
**Agent path:** `.codex/agents/research-docs-agent/AGENT.md`

## Shared Foundations

All three variants share:

1. **Phase lifecycle** -- The same 10-step process (see [phase-lifecycle.md](./phase-lifecycle.md))
2. **Queue-based spawning** -- Same queue file format and hook mechanism
3. **Phase reviews** -- File tree + technical summary written to history
4. **Primary task list** -- Master checklist tracking all phases
5. **Commit discipline** -- Commit + push after every completed phase
6. **Testing policy** -- Never force passing tests
7. **Remote handling** -- HTTPS remotes only, no hardcoded URLs

## Template Inventory

Each variant has its own template set under `.codex/skills/<variant>/templates/`:

### longrunning-session Templates

| Template                           | Purpose                              |
|------------------------------------|--------------------------------------|
| `notes_template.md`               | Running notes format                 |
| `phase_template.md`               | Phase plan structure                 |
| `phase_review_template.md`        | Phase review structure               |
| `prd_template.md`                 | Product requirements format          |
| `primary_task_list_template.md`   | Master checklist format              |
| `technical_requirements_template.md` | Technical requirements format     |

### orchestrator-session Templates

| Template                    | Purpose                                     |
|-----------------------------|---------------------------------------------|
| `phase_review_template.md` | Phase review structure                      |
| `poke_template.md`         | Structured poke-back format for subagents   |

### research-docs-session Templates

| Template                           | Purpose                              |
|------------------------------------|--------------------------------------|
| `notes_template.md`               | Research notes with source tracking  |
| `phase_template.md`               | Research phase plan structure         |
| `phase_review_template.md`        | Review with citation validation      |
| `prd_template.md`                 | Research-focused PRD                 |
| `primary_task_list_template.md`   | Master checklist with research tasks |
| `technical_requirements_template.md` | Technical requirements format     |

## Reference Documents

| Variant              | Reference File                                          | Content                          |
|----------------------|---------------------------------------------------------|----------------------------------|
| longrunning-session  | `references/orchestration-guide.md`                     | Core orchestration rules         |
| orchestrator-session | `references/orchestrator-loop.md`                       | Multi-agent loop pattern origins |
| research-docs-session| `references/orchestration-guide.md`                     | Same core rules as longrunning   |
| research-docs-session| `references/research-docs-guide.md`                     | Research-specific guidance        |

## Migration Between Variants

Switching mid-session is possible but requires care:

1. **longrunning to orchestrator**: Start delegating phases via queue. Add poke-back
   requirements to existing phase plans.
2. **longrunning to research-docs**: Add source tracking to notes. Begin validating
   citations. Update phase plans with research deliverables.
3. **orchestrator to longrunning**: Simplify poke-back to implicit completion signals.
   Allow the current chat to execute phases directly.

In all cases, preserve the primary task list and existing phase reviews.
