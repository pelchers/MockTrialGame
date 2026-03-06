# Agent Creation Guide

## What Are Agents?

Agents are YAML-configured AI specialists that define focused expertise, tool access,
and model configurations. They enable domain specialization, controlled tool access,
subagent delegation patterns, and reusable configurations across projects.

## File Format

Agent files are Markdown files with YAML frontmatter, stored in `.claude/agents/`.

```yaml
---
name: Agent Display Name
description: Brief description of agent's purpose and expertise
model: claude-sonnet-4-5
permissionMode: auto
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
skills:
  - skill-name-1
  - skill-name-2
---

# Agent Display Name

Agent instructions, patterns, and domain knowledge follow here...
```

## Required Fields

| Field              | Required | Type     | Purpose                          |
|--------------------|----------|----------|----------------------------------|
| `name`             | Yes      | string   | Agent identifier for display     |
| `description`      | Yes      | string   | Purpose summary                  |
| `model`            | Yes      | string   | Claude model to use              |
| `permissionMode`   | Yes      | string   | Access control level             |
| `tools`            | No       | string[] | Allowed tool list                |
| `skills`           | No       | string[] | Skills to load                   |

## Permission Modes

### auto (Recommended)

Auto-approves safe operations (reading, searching, analyzing). Prompts for risky
actions (writing, editing, executing commands, network requests).

**Use for:** Standard development agents, production workflows, balanced safety.

### full (Advanced)

Unrestricted access with no approval prompts. The agent can modify any file or run
any command without confirmation.

**Use for:** Trusted automation, CI/CD pipelines, advanced workflows where speed
matters and the environment is controlled.

### manual (Maximum Control)

Requires explicit approval for every operation, including reads.

**Use for:** Learning agent behavior, working with sensitive codebases, debugging
agent actions step by step.

## Available Tools

### File Operations

| Tool   | Purpose                          |
|--------|----------------------------------|
| Read   | Read file contents               |
| Write  | Create or overwrite files        |
| Edit   | Modify existing files            |

### Search and Discovery

| Tool   | Purpose                          |
|--------|----------------------------------|
| Glob   | Find files by pattern            |
| Grep   | Search file contents             |
| LSP    | Language server queries           |

### Execution

| Tool         | Purpose                      |
|--------------|------------------------------|
| Bash         | Run shell commands           |
| NotebookEdit | Edit Jupyter notebooks       |

### External Data

| Tool       | Purpose                      |
|------------|------------------------------|
| WebFetch   | Fetch web content            |
| WebSearch  | Search the web               |

### Task Management

| Tool       | Purpose                      |
|------------|------------------------------|
| TodoWrite  | Manage task lists            |
| Skill      | Invoke other skills          |

## Tool Selection Strategies

### Minimal Access (Read-Only Analysis)

```yaml
tools: [Read, Glob, Grep]
```

### Standard Development (Balanced)

```yaml
tools: [Read, Write, Edit, Glob, Grep, Bash, LSP]
```

### Full Access (Multi-Purpose)

```yaml
tools: [Read, Write, Edit, Glob, Grep, Bash, LSP, WebFetch, WebSearch, TodoWrite, Skill, NotebookEdit]
```

Principle: include only the tools the agent actually needs.

## Skills Integration

Skills referenced in the agent frontmatter are loaded via progressive disclosure:

```yaml
skills:
  - designing-convex-schemas
  - processing-stripe-payments
```

**Best practices:**
- Limit to 3-5 focused skills that match the agent's domain.
- Avoid overlapping skill capabilities.
- Skills should complement the agent's markdown instructions.
- Skills load automatically; no manual triggering required.

## Subagent Patterns

### Delegation Strategy

A parent agent delegates specialized tasks to focused child agents:

```
  Parent Agent (Frontend)
       |
       +-- Shadcn/UI Agent (component creation)
       +-- Tailwind Agent (styling)
       +-- State Agent (Zustand stores)
```

### Parent Agent Example

```yaml
---
name: Frontend Agent
description: Next.js frontend specialist
model: claude-sonnet-4-5
permissionMode: auto
tools: [Read, Write, Edit, Grep, Glob, Bash]
skills: [nextjs-patterns, react-best-practices]
---

Delegates specialized tasks:
- UI components -> shadcn-ui-agent
- Styling -> tailwind-css-agent
- State -> state-management-agent
```

### Child Agent Example

```yaml
---
name: shadcn/ui Component Agent
description: shadcn/ui component specialist
model: claude-sonnet-4-5
permissionMode: auto
tools: [Read, Write, Edit, Bash]
skills: [creating-shadcn-components]
---

Focused expertise in shadcn/ui components...
```

## Naming Conventions

| Element       | Convention                 | Example                    |
|---------------|----------------------------|----------------------------|
| Agent files   | kebab-case, `-agent` suffix | `database-agent.md`       |
| Agent names   | Descriptive, "Agent" suffix | `Database Agent`          |
| Agent folders | kebab-case                  | `database-agent/`         |

## Model Selection

| Model              | Best For                                    | Cost     |
|--------------------|---------------------------------------------|----------|
| `claude-sonnet-4-5`| Fast iteration, general development         | Standard |
| `claude-opus-4-5`  | Complex architecture, critical decisions    | Higher   |

Use Sonnet for most agents. Reserve Opus for agents that handle complex reasoning
or architecture decisions.

## Instruction Structure

After the YAML frontmatter, provide markdown instructions covering:

1. **Core Competencies** -- What the agent specializes in
2. **Best Practices** -- Key guidelines to follow
3. **Code Patterns** -- Example implementations
4. **Integration Points** -- How agent interacts with other systems

## Common Patterns

| Pattern                   | Description                                 |
|---------------------------|---------------------------------------------|
| Technology Specialist     | Expert in one tech (Stripe, Convex, etc.)   |
| Workflow Automation       | Handles git, testing, CI/CD operations      |
| Analysis / Review         | Read-only code review and quality analysis  |
| Orchestrator              | Delegates work to multiple subagents        |

## Description Quality

```yaml
# Vague (avoid)
description: Helps with databases

# Specific (preferred)
description: Specialist in Convex database schemas, queries, mutations, and real-time subscriptions
```

Always describe what the agent does AND what technologies/domains it covers.
