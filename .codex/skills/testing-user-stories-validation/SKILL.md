---
name: testing-user-stories-validation
description: Defines a workflow to validate every user story with Playwright, capture screenshots, and document steps. Use when creating or running user story validation suites.
---

# User Story Testing & Validation

Implements a structured workflow to test all user stories end-to-end with Playwright, capture evidence screenshots, and document the validation steps.

## Output Structure

- /user_stories
  - user_stories.md (master list)
  - /<story_slug>
    - story.md (steps + expected behavior)
    - /validation
      - screenshots and notes

## Required Steps

1) Update `/user_stories/user_stories.md` with all stories.
2) For each story, create a folder with:
   - `story.md` (steps + acceptance criteria)
   - `validation/` (screenshots + notes)
3) Run Playwright for each story and capture visuals.
4) Record pass/fail with notes in each story folder.

## Playwright Rules

- Do not force passes.
- If a story fails, record the failure, fix it, and re-run.
- Capture screenshots at every critical step.

## Templates

- `.codex/templates/user-story-validation/story.md`
- `.codex/templates/user-story-validation/validation.md`
