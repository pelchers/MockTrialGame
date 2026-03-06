# Skill Creation Guide

## What Are Skills?

Skills are folders of instructions, scripts, and resources that Claude discovers and
loads dynamically to perform specialized tasks. They follow a progressive disclosure
architecture for efficient, context-aware loading.

### Key Properties

- **Filesystem-based**: Skills are folders, not database entries.
- **Progressive disclosure**: Information loads in 3 levels to minimize context usage.
- **Auto-discovery**: Claude scans skill metadata and loads relevant skills automatically.
- **Portable**: Skills work across projects and teams.
- **Composable**: Agents can reference multiple skills.

## Progressive Disclosure (3-Level Architecture)

```
  Task arrives
       |
       v
  Level 1: Scan Metadata (~100 tokens, always loaded)
  - name + description from YAML frontmatter
       |
       v
  Is skill relevant?
  - No  --> Skip skill entirely
  - Yes --> Load Level 2
       |
       v
  Level 2: Load SKILL.md Body (<5k tokens)
  - Concise instructions, quick-reference patterns
       |
       v
  Need more detail?
  - No  --> Task complete
  - Yes --> Load Level 3
       |
       v
  Level 3: Load Resources/Scripts (unlimited)
  - Detailed docs, reference guides, executable utilities
```

### Level Budgets

| Level | Content                | Token Budget | Loaded When         |
|-------|------------------------|--------------|---------------------|
| 1     | YAML name+description  | ~100 tokens  | Always (every task) |
| 2     | SKILL.md body          | <5,000 tokens| Skill matches task  |
| 3     | resources/ + scripts/  | Unlimited    | Explicitly needed   |

## Folder Structure

```
skill-name/
  SKILL.md              <-- Required: instructions with YAML frontmatter
  scripts/              <-- Optional: executable utilities (JS/TS/Python)
    utility.py
    validate.ts
  resources/            <-- Optional: reference docs, templates, data
    reference.md
    advanced-patterns.md
    templates/
      template.json
```

## SKILL.md Format

### YAML Frontmatter

```yaml
---
name: skill-name
description: What the skill does and when to use it (max 1024 chars)
---
```

**Frontmatter rules:**
- Only two fields: `name` and `description`. No other fields.
- `name`: Use gerund form (verb + -ing).
- `description`: Include WHAT it does + WHEN to use it. Max 1024 characters.

### Body Structure

Keep the body under 500 lines. Typical structure:

```markdown
# Skill Title

## Quick Start
[Essential patterns for immediate use]

## Common Patterns
[Frequently used examples and recipes]

## Best Practices
[Key guidelines and conventions]

For advanced usage, see resources/advanced-patterns.md
```

## Naming Conventions

### Skill Names (Gerund Form)

| Correct                  | Incorrect              |
|--------------------------|------------------------|
| `processing-pdfs`        | `pdf-processor`        |
| `analyzing-data`         | `data-analyzer`        |
| `designing-schemas`      | `schema-designer`      |
| `validating-forms`       | `form-validator`       |
| `managing-git-workflows` | `git-workflow-manager` |

### File and Folder Names

| Element     | Convention                      |
|-------------|----------------------------------|
| Folders     | kebab-case: `skill-name`        |
| Main file   | Always `SKILL.md` (uppercase)   |
| Scripts     | kebab-case: `utility-name.py`   |
| Resources   | kebab-case: `reference-doc.md`  |
| Paths       | Forward slashes `/`, never `\`  |

## Writing Style

### Voice

Use **third person** (skill perspective):

```
Processes Excel files with formulas and formatting.
```

Do NOT use first/second person:

```
I can help you process Excel files.    <-- wrong
```

### Conciseness

- SKILL.md must be under 500 lines total.
- Put detailed documentation in `resources/`.
- Link from SKILL.md: `See resources/api-reference.md`.

## Scripts Directory

**Purpose**: Executable utilities that solve specific problems.

**When to use scripts:**
- Deterministic operations (validation, formatting, data processing)
- Code generation or template rendering
- Test utilities
- Automation helpers

**When NOT to use scripts:**
- Just code examples (put in SKILL.md instead)
- Non-executable documentation (put in resources/)

**Script requirements:**
- Add a usage docstring or header comment.
- Make scripts executable.
- Export functions for testing.
- Handle errors gracefully with clear output.

## Resources Directory

**Purpose**: Detailed reference documentation that does not fit in SKILL.md.

**When to use resources:**
- Complete API references
- Advanced patterns and techniques
- Large data sets or templates
- In-depth explanations

**Organization rules:**
- Add table of contents for files over 100 lines.
- Link from SKILL.md: `See resources/doc-name.md`.
- Keep one level deep (SKILL.md references resources directly).
- Use descriptive filenames.

## Description Quality

```yaml
# Vague (avoid)
description: Helps with Stripe payments

# Specific (preferred)
description: Processes Stripe payments including subscriptions, webhooks, and checkout flows. Use when implementing payment processing, handling Stripe webhooks, or managing customer billing.
```

The description drives auto-discovery. If it is vague, Claude may fail to load the
skill when it is relevant.

## Discovery Process

1. User provides a task description.
2. Claude scans all skill metadata (names + descriptions from Level 1).
3. Claude identifies relevant skills based on description match.
4. Claude loads SKILL.md body (Level 2) for matched skills.
5. Claude uses patterns from the skill to complete the task.
6. Claude loads resources/scripts (Level 3) only when explicitly referenced or needed.

## Common Mistakes

| Mistake                      | Correction                               |
|------------------------------|------------------------------------------|
| Noun-based name              | Use gerund: `processing-pdfs`            |
| First person voice           | Use third person: `Processes files...`   |
| 800-line SKILL.md            | Keep under 500 lines, use resources/     |
| Scripts with just examples   | Make scripts executable utilities        |
| Backslash paths              | Use forward slashes: `resources/doc.md`  |
| Extra YAML fields            | Only `name` and `description`            |
| Vague description            | Include WHAT + WHEN                      |
