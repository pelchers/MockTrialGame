# System Documentation Index

Cross-reference map showing which agents, skills, and configurations belong to each documented system.

## File Tree — Agent & Skill → System Docs Mapping

```
system_docs/
│
├── general_frontend/                  ← General Frontend Concept Generation
│   └── README.md
│       Agents:
│         .claude/agents/general-frontend-design-orchestrator/
│         .claude/agents/general-frontend-design-subagent/
│       Skills:
│         .claude/skills/general-frontend-design-orchestrator/
│         .claude/skills/general-frontend-design-subagent/
│       Config:
│         .claude/skills/general-frontend-design-orchestrator/references/style-config.json
│       Output:
│         .docs/planning/concepts/<style>/pass-<n>/
│
├── production_frontend/               ← Production Frontend Generation
│   ├── README.md
│   ├── architecture.md
│   ├── schema-inference.md
│   ├── component-reconciliation.md
│   └── input-modes.md
│       Agents:
│         .claude/agents/production-frontend-orchestrator/
│         .claude/agents/production-frontend-subagent/
│       Skills:
│         .claude/skills/production-frontend-orchestrator/
│         .claude/skills/production-frontend-subagent/
│       Config:
│         .claude/skills/production-frontend-orchestrator/references/production-spec-template.md
│       Output:
│         .docs/production/frontend/
│
├── visual_creative/                   ← Visual/Creative Concept Generation
│   ├── README.md
│   ├── domain-families.md
│   └── validation-pipeline.md
│       Agents:
│         .claude/agents/planning-visual-creative-orchestrator/
│         .claude/agents/visual-creative-subagent/
│       Skills:
│         .claude/skills/planning-visual-creative-orchestrator/
│         .claude/skills/visual-creative-subagent/
│       Config:
│         .claude/skills/planning-visual-creative-orchestrator/references/style-config.json
│         .claude/skills/visual-creative-subagent/references/library-catalog.json
│       Output:
│         .docs/design/concepts/<domain>/<style>/pass-<n>/
│
├── session_orchestration/             ← ADR Phase Orchestration
│   ├── README.md
│   ├── phase-lifecycle.md
│   ├── subagent-spawning.md
│   └── session-variants.md
│       Skills:
│         .claude/skills/longrunning-session/
│         .claude/skills/orchestrator-session/
│         .claude/skills/research-docs-session/
│       Hooks:
│         .claude/hooks/scripts/orchestrator-poke.ps1
│       Queue:
│         .claude/orchestration/queue/next_phase.json
│       Output:
│         .adr/orchestration/
│         .adr/current/
│         .adr/history/
│
├── version_control/                   ← Git Workflows & Savepoints
│   ├── README.md
│   ├── commit-conventions.md
│   └── savepoint-workflow.md
│       Skills:
│         .claude/skills/managing-git-workflows/
│         .claude/skills/savepoint-branching/
│
├── trinary_sync/                      ← Cross-Repo Synchronization
│   └── README.md
│       Skills:
│         .claude/skills/maintaining-trinary-sync/
│       Scripts:
│         .claude/skills/maintaining-trinary-sync/scripts/sync-all.js
│         .claude/skills/maintaining-trinary-sync/scripts/sync-skill.js
│         .claude/skills/maintaining-trinary-sync/scripts/sync-agent.js
│         .claude/skills/maintaining-trinary-sync/scripts/check-sync.js
│
├── extensibility/                     ← Agent, Skill & Hook Creation
│   ├── README.md
│   ├── agent-creation.md
│   ├── skill-creation.md
│   └── hooks-system.md
│       Skills:
│         .claude/skills/creating-claude-agents/
│         .claude/skills/creating-claude-skills/
│         .claude/skills/using-claude-hooks/
│
├── chat_reports/                      ← Session Report Generation
│   └── README.md
│       Agents:
│         .claude/agents/chat-report-agent/
│       Skills:
│         .claude/skills/generating-chat-reports/
│       Output:
│         (printed to chat; optionally .chat-history/reports/)
│
├── claude_codex_sync/                 ← .claude ↔ .codex Synchronization
│   └── README.md
│       Agents:
│         .claude/agents/claude-codex-sync-agent/
│       Skills:
│         .claude/skills/syncing-claude-codex/
│
├── repo_setup/                        ← Project Bootstrapping
│   └── README.md
│       Agents:
│         .claude/agents/repo-setup-agent/
│       Skills:
│         .claude/skills/repo-setup-session/
│       Output:
│         .ai-ingest-docs/project-goals-understanding.md
│         .docs/planning/
│
└── deprecated/                        ← Superseded Systems
    ├── DEPRECATED.md
    └── frontend_planning/             (replaced by general_frontend/)
        ├── README.md
        ├── architecture.md
        ├── configuration-reference.md
        ├── generation-workflow.md
        ├── style-families.md
        └── validation-system.md
```

## Skills Not Mapped to System Docs

These skills are standalone utilities that don't warrant their own system docs folder:

| Skill | Purpose | Related System |
|-------|---------|---------------|
| `chat-history-convention` | User message logging with structured analysis | chat_reports |
| `repo-setup-session` | Interactive project bootstrapper | repo_setup |
| `ingesting-agent-history` | Session handoff summaries in .adr/agent_ingest | session_orchestration |
| `producing-visual-docs` | User/developer docs with Playwright capture | — |
| `testing-with-playwright` | E2E testing patterns | — |
| `testing-user-stories-validation` | User story validation with screenshots | — |
| `researching-with-playwright` | Web research automation | — |
| `decomposing-project-tasks` | Task breakdown methodology | — |
| `creating-project-documentation` | README/API doc generation | — |

## System Overview

| System | Purpose | Agent Count | Skill Count |
|--------|---------|-------------|-------------|
| General Frontend | Multi-style concept exploration | 2 | 2 |
| Production Frontend | Single convergent production build | 2 | 2 |
| Visual/Creative | Data-vis, animation, graphic design concepts | 2 | 2 |
| Session Orchestration | Multi-phase ADR workflow | 0 | 3 |
| Version Control | Git conventions + savepoints | 0 | 2 |
| Trinary Sync | Cross-repo config synchronization | 0 | 1 |
| Extensibility | Agent/skill/hook creation guides | 0 | 3 |
| Chat Reports | Session report generation | 1 | 1 |
| Claude-Codex Sync | .claude ↔ .codex mirroring | 1 | 1 |
| Repo Setup | Interactive project bootstrapper | 1 | 1 |
| **Total** | | **9** | **18** |
