# FILE-TREE: `visual-chat-history` (install checklist)

Files this component adds or edits in a host repo.

## Created
```
.claude/skills/visual-chat-history/SKILL.md
.claude/skills/visual-chat-history/scripts/viewer.mjs
.claude/skills/visual-chat-history/scripts/app/index.html
.claude/skills/visual-chat-history/scripts/app/app.css
.claude/skills/visual-chat-history/scripts/app/app.js
.claude/agents/visual-chat-history-agent/AGENT.md
.claude/commands/visual-chat-history.md
.claude/system_docs/visual_chat_history/README.md
.claude/system_docs/visual_chat_history/USAGE_GUIDE.md
.claude/system_docs/visual_chat_history/ARCHITECTURE.md
.codex/skills/visual-chat-history/SKILL.md                    (mirror)
.codex/skills/visual-chat-history/scripts/viewer.mjs          (mirror)
.codex/skills/visual-chat-history/scripts/app/index.html      (mirror)
.codex/skills/visual-chat-history/scripts/app/app.css         (mirror)
.codex/skills/visual-chat-history/scripts/app/app.js          (mirror)
.codex/agents/visual-chat-history-agent/AGENT.md              (mirror)
.codex/commands/visual-chat-history.md                        (mirror; header says Codex)
.codex/system_docs/visual_chat_history/README.md              (mirror)
.codex/system_docs/visual_chat_history/USAGE_GUIDE.md         (mirror)
.codex/system_docs/visual_chat_history/ARCHITECTURE.md        (mirror)
.docs/runbooks/development/visual-chat-history.md             (.docs only, not mirrored)
.other-devices/components/visual-chat-history/**              (this package)
```

## Dependency (owned by chat-history-convention)
```
.claude/skills/chat-history-convention/scripts/split-sessions.mjs
.codex/skills/chat-history-convention/scripts/split-sessions.mjs
.claude/skills/chat-history-convention/SKILL.md     (+ "Sessions folder" section appended at the end)
.codex/skills/chat-history-convention/SKILL.md      (same append)
```

## Edited (shared wiring)
```
.claude/hooks/scripts/sync-component.sh   (+ FILES entries; mirror to .codex)
.claude/hooks/scripts/sync-flush.sh       (+ PATHS entries; mirror to .codex)
SYNC-REPOS.md                             (+ "What to sync" bullet)
.claude/system_docs/README.md / .codex/system_docs/README.md   (index block, optional)
```

## Generated at run time, project-local, never committed by the component or synced
```
.chat-history/sessions/*.md               (split-sessions.mjs; committed in its own repo only)
.chat-history/exports/                    (export; has its own .gitignore of *)
%TEMP%/visual-chat-history-<port>.log     (background server log)
%TEMP%/visual-chat-history-<port>.json    (pid file)
```

## Counts
- 1 skill (with 4 script files) + 1 agent + 1 command + 3 system docs + 1 runbook, each mirrored to
  `.codex` except the runbook: 21 files, plus this package.
- No hook, no settings.json change.
