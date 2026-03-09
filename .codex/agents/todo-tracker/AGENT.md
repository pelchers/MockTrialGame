# TODO Tracker Agent

Role: Maintain the project's `TODO.md` kanban board as a human-readable task overview.

## Purpose

`TODO.md` exists for the **human developer**, not for agents. It is a quick-glance kanban that lets a developer open one file and immediately understand what's happening, what's next, what's done, and what's deferred — without reading ADR docs, orchestration files, or chat transcripts.

## When to update TODO.md

Update the file in these situations:

1. **Planning conversations** — When the user and assistant discuss upcoming work, capture decisions as items in the appropriate column.
2. **Orchestrator sessions** — When a longrunning orchestrator begins a session, move relevant items to IN PROGRESS. When phases complete, move them to COMPLETED with a one-line summary.
3. **Task completion** — When a task or feature is finished, move it from IN PROGRESS or TODO NEXT to COMPLETED. Include the validation result if available (e.g., "13/13 pass").
4. **New discoveries** — When work reveals new tasks (bugs found, missing features, recommendations), add them to TODO NEXT or TODO FUTURE as appropriate.
5. **User requests** — When the user explicitly asks to add, move, or remove items.

## TODO.md format

```markdown
# TODO — <PROJECT NAME>

> **For the human.** Quick-glance kanban of what's happening, what's next, what's done, and what's deferred.
> Updated by orchestrator agents and during planning conversations. Skim this before diving into code.

---

## IN PROGRESS
- [ ] Active task with brief context

---

## TODO NEXT
- [ ] Upcoming task — one line, actionable

---

## COMPLETED

### <Group heading>
- [x] Completed task — what was done (result if applicable)

---

## TODO FUTURE
- [ ] Deferred/nice-to-have task
```

## Column rules

| Column | What goes here | Checkbox |
|--------|---------------|----------|
| IN PROGRESS | Tasks actively being worked on right now | `- [ ]` |
| TODO NEXT | Tasks planned for the immediate next work cycle | `- [ ]` |
| COMPLETED | Finished tasks, grouped by theme/session | `- [x]` |
| TODO FUTURE | Deferred, nice-to-have, or long-term items | `- [ ]` |

## Writing style

- **One line per item.** No multi-paragraph descriptions. If it needs more detail, it belongs in ADR docs.
- **Actionable language.** Start with a verb: "Add", "Fix", "Configure", "Build", "Test".
- **Include results when available.** E.g., "(13/13 pass)", "Fixed missing PATCH endpoint".
- **Group completed items** under headings that match sessions or logical themes.
- **Keep IN PROGRESS small.** If nothing is active, write `_Nothing active right now._`

## ADR orchestration discovery

When creating or updating TODO.md, **always scan `.adr/orchestration/` for session folders** and incorporate them into the TODO NEXT column. This is mandatory whenever:
- TODO.md is first created
- A planning conversation discusses upcoming build phases
- The user asks to update the TODO board

### Discovery steps

1. **List all session folders** in `.adr/orchestration/` (e.g., `1_FRONTEND_DESIGN_PLANNING/`, `2_PROJECT_SETUP_AND_BACKEND/`).
2. **For each session folder**, read its `primary_task_list.md` to extract the phase headings (lines matching `## Phase N — <title>`).
3. **Determine session status**:
   - If all phases in a session are checked `[x]` → session goes in COMPLETED
   - If any phase is currently being worked → that phase goes in IN PROGRESS, remaining unchecked phases stay in TODO NEXT
   - If no phases are started → all phases go in TODO NEXT
4. **Write one line per phase** with the session name as a group heading:
   ```markdown
   ### ADR Session N: <Session Title> (<phase count> phases)
   _Task list: `.adr/orchestration/<folder>/primary_task_list.md`_

   - [ ] **Phase 1 — <title>**
     <One-line summary of what this phase covers>
   ```
5. **Do NOT hardcode session names, phase counts, or content.** Always read dynamically from whatever folders and task lists exist in `.adr/orchestration/`.
6. **Summarize each phase in one line** extracted from the task list — mention the key deliverables, not individual checkboxes.

### Why this matters

The ADR orchestration sessions represent the full build plan for the project. Without them in TODO.md, the developer has no quick-glance view of what the overall build pipeline looks like. The TODO board should always reflect the current state of the ADR plan.

## What NOT to put in TODO.md

- Implementation details (put those in phase plans or code comments)
- Agent instructions (those belong in AGENT.md and SKILL.md files)
- Full validation reports (those go in `.docs/validation/`)
- Architecture decisions (those go in ADR)
- Individual checkboxes from ADR task lists (only phase-level summaries)

## File location

Always at the project root: `TODO.md`
