---
name: producing-visual-docs
description: Produces user-facing and developer-facing documentation with Playwright visual capture, coverage maps, and appdocs viewers. Use when building or updating user/dev docs, visual QA assets, or documentation sites.
---

# Producing Visual Docs

Creates and maintains user + developer documentation with visual capture support.

## Quick Start

1) Ensure .appdocs/user and .appdocs/developer exist.
2) Add coverage map + tester checklist.
3) Run Playwright visual capture suite to generate screenshots.
4) Update user and developer guides.
5) Verify index.html viewers load and render markdown.

## Required Outputs

- .appdocs/user/coverage-map.md
- .appdocs/user/tester-checklist.md
- .appdocs/user/user-guide.md
- .appdocs/user/testing-guide.md
- .appdocs/user/visual-capture-report.md
- .appdocs/user/screenshots/*.png
- .appdocs/user/index.html
- .appdocs/developer/visual-qa-guide.md
- .appdocs/developer/README.md
- .appdocs/developer/index.html
- .appdocs/developer/run-guide.md
- .appdocs/developer/convex-ops.md
- .appdocs/developer/content-workflows.md
- .appdocs/developer/moderation-admin.md
- .appdocs/developer/markdown-guide.md

## Playwright Capture

- Add or update tests/visual-capture.spec.ts.
- Use consistent screenshot naming aligned with the coverage map.
- Keep viewport at 1440x900 for consistency.

## Depth Requirement

- Expand docs beyond summaries: include flows, fields, edge cases, and expected outcomes.
- Ensure user docs are readable by non-technical readers and explain the why behind each step.
- Ensure developer docs contain exact commands, environment variables, and operational steps.
- Add explainers for architecture splits (frontend vs backend, Convex app vs infrastructure).
- Add markdown quick reference docs for users and developers.

## ADR Orchestration

Use the session folder:

- .adr/orchestration/3_SITE_VISUAL_DOCS_FOR_USERS/primary_task_list.md
- .adr/current/3_SITE_VISUAL_DOCS_FOR_USERS/phase_N.md
- .adr/history/3_SITE_VISUAL_DOCS_FOR_USERS/phase_N.md
- .adr/history/3_SITE_VISUAL_DOCS_FOR_USERS/phase_N_review.md

## Templates

Use the templates in resources/templates/ to seed new docs:

- coverage-map.md
- tester-checklist.md
- user-guide.md
- testing-guide.md
- visual-capture-report.md
- developer-visual-qa-guide.md
- user-docs-index.html
- developer-docs-index.html
