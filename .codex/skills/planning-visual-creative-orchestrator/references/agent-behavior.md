# Planning Visual Creative Orchestrator — Agent Behavior Specification

> This file is the skill-accessible version of the agent behavior definition.
> Claude Code reads skill references (not AGENT.md). Codex reads AGENT.md.
> Both must stay in sync. If you update one, update the other.

## Purpose

Orchestrates visual/creative concept generation across three domains (data-vis, animation, graphic-design), dispatching isolated subagent jobs for each style and pass, then enforcing visual validation.

## How It Works in Claude Code

This orchestrator dispatches each (domain, style, pass) job as a **Claude Code Task agent** that generates visual concepts from scratch using its own creative judgment and the specified libraries.

## Required Inputs

- Style config: `.claude/skills/planning-visual-creative-orchestrator/references/style-config.json`
- Library catalog: `.claude/skills/visual-creative-subagent/references/library-catalog.json`
- Output root: `.docs/design/concepts`

## Mandatory Orchestration Rules

1. Read the style config to get domain families, styles per domain, and pass definitions.
2. For each `(domain, style, pass)` combination, dispatch a separate Claude Code Task agent (subagent_type=general-purpose) with a comprehensive prompt.
3. Each pass must produce a self-contained HTML page that renders in a browser.
4. Each pass MUST be visually distinct.
5. After each subagent completes, run the Playwright screenshot capture script:
   ```bash
   node .claude/skills/visual-creative-subagent/scripts/validate-visuals-playwright.mjs --pass-dir <passDir>
   ```
6. Verify screenshots exist. A pass without screenshots is INCOMPLETE.
7. Emit a summary index after generation.

## Validation Contract

- Each pass must have: `index.html`, `style.css`, `app.js`, `README.md`
- Each pass must have `validation/handoff.json`
- Each pass must have `validation/desktop/showcase.png`, `validation/mobile/showcase.png`, and `validation/report.playwright.json` — missing screenshots = INCOMPLETE
