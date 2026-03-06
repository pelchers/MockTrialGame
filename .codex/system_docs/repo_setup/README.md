# Repo Setup System

## Overview

The repo setup system provides an interactive, conversational project bootstrapper that populates planning documentation and AI understanding docs based on structured discovery with the user. It ensures every new repo starts with a comprehensive planning foundation rather than empty templates.

## Architecture

```
User describes project
        |
        v
  [repo-setup-agent]
        |
        +--> Confirm understanding in chat
        +--> Ask 3-7 clarifying questions
        +--> Wait for user confirmation
        |
        v
  [Writing Phase]
        |
        +--> .ai-ingest-docs/project-goals-understanding.md
        +--> .docs/planning/ (core + conditional + additional docs)
        +--> README.md index update
        |
        v
  Completion report in chat
```

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Agent | `.codex/agents/repo-setup-agent/` | Conversational bootstrapper with 8-step workflow |
| Skill | `.codex/skills/repo-setup-session/SKILL.md` | Detailed templates and writing phase procedures |

## Conversational Discovery Phase

The agent follows a strict conversational protocol before writing any files:

### Step 1: Parse Initial Prompt
Read the user's project description and identify: project name, purpose, tech stack, target users, key features, and constraints. Note what's explicitly stated vs. missing.

### Step 2: Confirm Understanding
Present a structured summary back to the user covering project identity, purpose, users, features, tech stack, and scope. Be honest about uncertainties.

### Step 3: Ask Clarifying Questions
Ask 3-7 targeted questions based on identified gaps. Question categories include:
- Users and their technical level
- Authentication strategy
- Core data entities and storage
- Deployment targets
- Third-party integrations
- Scale expectations
- Team structure
- Timeline and deadlines
- Non-goals and constraints
- Existing work vs. greenfield

### Step 4: Process and Confirm
Update understanding based on answers. If major new information surfaces, confirm again before writing.

## Output Directories

### `.ai-ingest-docs/`
Single file: `project-goals-understanding.md` — structured AI memory of the project's identity including:
- Project Identity (name, one-liner, repo path)
- Core Purpose
- Target Users
- Key Features & Capabilities
- Tech Stack & Architecture
- Scope & Constraints
- Key Decisions Made
- Open Questions & Assumptions

### `.docs/planning/`

**Core files (always populated):**

| File | Content |
|------|---------|
| `overview.md` | Product vision, scope, functional emphasis |
| `prd.md` | Full product requirements document |
| `technical-specification.md` | Architecture, tech stack, data flow, infrastructure |
| `user-stories.md` | User stories with acceptance criteria by feature area |
| `milestones.md` | Phased delivery plan with deliverables |
| `risks-and-decisions.md` | Risk log, mitigation strategies, architecture decisions |
| `README.md` | Index of all planning docs |

**Conditional files (when relevant):**

| File | Trigger |
|------|---------|
| `auth-and-subscriptions.md` | Project has auth or billing |
| `deployment-and-hosting.md` | Deployment strategy is known |
| `project-structure-spec.md` | Project has defined folder schema |
| `sync-strategy.md` | Multi-device or cloud sync is in play |

**Additional files:** Created as needed based on project scope — no fixed list. The agent uses judgment to determine whether docs like `api-design.md`, `data-model.md`, `security-model.md`, etc. would meaningfully help.

## Safety Rules

- Never write files until user has confirmed understanding and answered questions
- Never assume — always ask
- Only write to `.docs/planning/` and `.ai-ingest-docs/` unless explicitly asked
- Warn before overwriting non-template content
- Use `[TBD — needs input]` for genuinely unknown details rather than inventing
- Use HTTPS remotes (not SSH) for pushes

## Quality Standards

- Write real content from conversation, not placeholders
- Cross-reference between docs (milestones reference PRD features, user stories map to features)
- Keep technical spec aligned with stated tech stack
- Match depth and style of existing planning docs
- Always update README.md to index new files

## Integration Points

| System | Connection |
|--------|------------|
| `ingesting-agent-history` | Repo setup session captured in ADR ingest for continuity |
| `chat-history-convention` | Setup conversation logged for reference |
| `managing-git-workflows` | Initial commit of planning docs follows git conventions |
| `production-frontend-orchestrator` | Planning docs feed into production spec generation |
