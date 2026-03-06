---
name: system-docs-agent
description: Creates and maintains system documentation entries in .codex/system_docs/ for agents and skills. Automatically invoked after new agents or skills are created to document their purpose, architecture, component locations, and integration points. Use when adding new agents, skills, or systems that need system_docs entries.
---

# System Docs Agent Skill

Manages the `.codex/system_docs/` directory — the central reference mapping every agent, skill, config, and output path in the project. Automatically invoked after agent/skill creation to keep documentation in sync.

## When This Skill Activates

This skill should be invoked whenever:
1. A new agent is created in `.claude/agents/` or `.codex/agents/`
2. A new skill is created in `.claude/skills/` or `.codex/skills/`
3. An existing system's agents/skills are modified, renamed, or deprecated
4. The master index needs updating after structural changes

## System Docs Convention

### Directory Structure

```
.codex/system_docs/
├── README.md                    ← Master index (MUST be updated for every change)
├── <system_name>/               ← One folder per "system"
│   ├── README.md                ← Required: purpose, architecture, component map
│   ├── architecture.md          ← Optional: detailed architecture docs
│   └── <topic>.md               ← Optional: additional detail docs
└── deprecated/                  ← Superseded systems
    ├── DEPRECATED.md
    └── <old_system>/
```

### What Constitutes a "System"

A **system** is a group of related agents and/or skills that work together. Examples:
- An orchestrator + subagent pair = one system
- A skill + its dedicated agent = one system
- A standalone agent with a unique skill = one system

**Standalone skills** that don't have a dedicated agent or don't form a system go in the "Skills Not Mapped to System Docs" table in the master index instead of getting their own folder.

### Decision: Folder vs Table Entry

```
Does the agent/skill have:
  - Multiple components (agent + skill + config)? → Folder
  - An orchestrator/subagent pattern? → Folder
  - Complex architecture worth documenting? → Folder
  - Resource files or scripts? → Folder
  - Just a single standalone skill? → Table entry
  - A utility with no dedicated agent? → Table entry
```

## README.md Format (Per-System Folder)

Every system folder's README.md MUST follow this structure:

```markdown
# <System Display Name>

System documentation for the <description> agents and skills.

## Purpose

<2-3 sentences explaining what this system does and why it exists.>

## When to Use

- <Bullet list of trigger conditions>
- <When should a user/agent invoke this system?>

## Architecture

<ASCII diagram showing component relationships.
Use box-drawing characters: ┌ ─ ┐ │ ├ ┤ └ ┘ ▼ ▲>

## Key Concepts

<Brief explanations of important patterns or conventions specific to this system.>

## Workflow

<Numbered steps describing how the system operates end-to-end.>

## Agent & Skill Locations

| Component | Claude Path | Codex Path |
|-----------|-------------|------------|
| <Agent/Skill Name> | `.claude/<path>` | `.codex/<path>` |

## Integration with Other Systems

- **<system-name>**: <How this system relates to or depends on another system.>
```

### Required Sections
- Purpose, Agent & Skill Locations are ALWAYS required
- Architecture diagram is required if system has multiple components
- When to Use is required for systems invoked by users/agents
- Key Concepts, Workflow, Integration are included when relevant

### Optional Sections (Add When Relevant)
- Output Locations (if system produces files)
- Configuration (if system has config files)
- Comparison tables (if system has a sibling/alternative)
- Example output (if helps clarify what system produces)

## Master Index Format (system_docs/README.md)

The master index has three sections that MUST all be updated:

### 1. File Tree — Agent & Skill → System Docs Mapping

```
system_docs/
├── <system_name>/               ← <Display Name>
│   └── README.md
│       Agents:
│         .codex/agents/<agent-name>/
│       Skills:
│         .codex/skills/<skill-name>/
│       Config:
│         <config paths if any>
│       Output:
│         <output paths if any>
```

### 2. Skills Not Mapped to System Docs

Table for standalone skills that don't warrant their own folder:

```
| Skill | Purpose | Related System |
|-------|---------|---------------|
| `skill-name` | Brief purpose | parent_system or — |
```

### 3. System Overview

Summary table with counts:

```
| System | Purpose | Agent Count | Skill Count |
|--------|---------|-------------|-------------|
| <Name> | <Brief> | N | N |
```

Update the **Total** row at the bottom.

## Procedure: Documenting a New Agent/Skill

### Step 1: Read the New Component

Read the YAML frontmatter and body of the new agent/skill to extract:
- Name and description
- Skills referenced (for agents)
- Tools used
- Resource files
- Related systems

### Step 2: Determine Classification

Apply the folder-vs-table decision tree above.

### Step 3: Create Documentation

**If folder:**
1. Create `.codex/system_docs/<system_name>/README.md`
2. Follow the per-system README format above
3. Include ASCII architecture diagram
4. Map all component paths (Claude + Codex)

**If table entry:**
1. Add a row to the "Skills Not Mapped" table in the master index

### Step 4: Update Master Index

1. Add entry to the file tree section
2. Add/update the system overview table
3. Update the Total row

### Step 5: Mirror to Both Repos

Ensure `.codex/system_docs/` changes exist in both:
- The current working repo
- The template repo (if maintaining-trinary-sync applies)

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| System folder | snake_case | `game_development` |
| README | Always `README.md` | `README.md` |
| Detail docs | kebab-case .md | `architecture.md` |
| Display names | Title Case | `Game Development System` |

## Anti-Patterns

- **Don't create empty system_docs folders** — every folder needs at least a README.md
- **Don't duplicate agent/skill content** — system_docs summarize and map, they don't repeat instructions
- **Don't skip the master index** — it's the primary navigation entry point
- **Don't create a folder for a single standalone utility skill** — use the table instead
