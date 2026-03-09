---
name: todo-tracker
description: Update TODO.md kanban board during planning conversations and orchestrator sessions
user_invocable: true
trigger: When planning work with the user, starting/completing longrunning sessions, or when tasks change status
---

# TODO Tracker Skill

## Purpose

Maintain `TODO.md` at the project root as a human-readable kanban board. This file is for the **developer**, not for agents — it provides a quick-glance overview of project status without requiring deep dives into ADR docs or orchestration files.

## When to invoke

1. **Automatically during orchestrator sessions:**
   - At session start: move session tasks to IN PROGRESS
   - At phase completion: update COMPLETED column with summary + result
   - At session end: move remaining items to TODO NEXT or TODO FUTURE

2. **During planning conversations:**
   - When the user discusses what to work on next
   - When new tasks are identified
   - When priorities change

3. **On user request:**
   - `/todo` — show current TODO.md status
   - `/todo add <item>` — add item to TODO NEXT
   - `/todo done <item>` — move item to COMPLETED
   - `/todo future <item>` — add item to TODO FUTURE

## Steps

### 1. Read current TODO.md
Read `TODO.md` from the project root. If it doesn't exist, create it using the template below.

### 2. Determine what changed
Based on the conversation context or orchestrator output:
- What tasks started? → Move to IN PROGRESS
- What tasks finished? → Move to COMPLETED (include result)
- What new tasks were identified? → Add to TODO NEXT or TODO FUTURE
- What got deprioritized? → Move to TODO FUTURE

### 3. Update the file
Edit `TODO.md` with the changes. Follow these rules:
- One line per item, verb-first, actionable
- Include validation results when available (e.g., "7/7 pass")
- Group completed items under logical headings
- Keep IN PROGRESS minimal (only actively running work)
- Use `- [ ]` for incomplete, `- [x]` for complete

### 4. Confirm to the user
Briefly state what was updated (e.g., "Moved 3 items to COMPLETED, added 2 to TODO NEXT").

## Template

```markdown
# TODO — <PROJECT NAME>

> **For the human.** Quick-glance kanban of what's happening, what's next, what's done, and what's deferred.
> Updated by orchestrator agents and during planning conversations. Skim this before diving into code.

---

## IN PROGRESS

_Nothing active right now._

---

## TODO NEXT

- [ ] First upcoming task

---

## COMPLETED

_No completed items yet._

---

## TODO FUTURE

- [ ] First future/deferred task
```

## Integration with orchestrator

When the `longrunning-orchestrator-agent` runs:

**Session start:**
```
## IN PROGRESS
- [ ] <session-name>: Phase 1 — <phase title>
```

**Phase completion:**
```
## COMPLETED
### <session-name>
- [x] Phase 1: <title> — <one-line summary> (<result>)
```

**Session end:**
```
## IN PROGRESS
_Nothing active right now._

## COMPLETED
### <session-name>
- [x] Phase 1: ...
- [x] Phase 2: ...
(all phases listed)
```

## ADR orchestration discovery

When creating TODO.md for the first time, or when the user asks to sync the board with the ADR plan, **scan `.adr/orchestration/` and populate TODO NEXT with all session phases**.

### Steps

1. **List folders** in `.adr/orchestration/` — each folder is a session.
2. **Read `primary_task_list.md`** in each session folder — extract `## Phase N — <title>` headings.
3. **Check phase status** — count `[x]` vs `[ ]` checkboxes to determine if a phase is done, in progress, or not started.
4. **Add one entry per phase** to the appropriate TODO column:
   - Completed phases → COMPLETED
   - Active phase → IN PROGRESS
   - Future phases → TODO NEXT
5. **Group phases under session headings** with a link to the full task list file:
   ```
   ### ADR Session N: <Session Title> (<count> phases)
   _Task list: `.adr/orchestration/<folder>/primary_task_list.md`_
   - [ ] **Phase 1 — <title>**
     <One-line summary of key deliverables>
   ```
6. **Always read dynamically** — never hardcode session names, phase counts, or descriptions. Different repos will have different numbers of sessions and phases.

## Scope

- File: `TODO.md` at project root
- Audience: Human developer (not agents)
- Depth: One line per item (details live in ADR/phase plans)
- Updates: Incremental edits, not full rewrites
- ADR sync: Phase-level summaries from `.adr/orchestration/`, not individual task checkboxes
