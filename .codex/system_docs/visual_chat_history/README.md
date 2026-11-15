# Visual Chat History: component README

**Purpose.** A local web page for reading a project's chat history: a clickable tab per session,
sort, filters, fuzzy search with highlighting, deep links to any session or entry, and live
updates while the conversation goes on. It runs on its own port next to the app's dev servers
and needs nothing installed beyond Node.

## Problem it solves
`.chat-history/user-messages.md` grows by thousands of lines. It is the right record, but reading
one day's work, or finding the entry where a decision was made, means scrolling and searching a
single long file. The `sessions/` folder (from `chat-history-convention`) splits it into one file
per session; this viewer adds search, filters and a readable layout on top, and keeps up as new
entries are logged.

## Pieces
| Piece | Path | Role |
|-------|------|------|
| Skill | `.claude/skills/visual-chat-history/SKILL.md` | What it shows, commands, rules |
| Server and CLI | `.claude/skills/visual-chat-history/scripts/viewer.mjs` | serve, start, stop, status, export, summary |
| Page | `.claude/skills/visual-chat-history/scripts/app/` | `index.html`, `app.css`, `app.js` (no libraries) |
| Agent | `.claude/agents/visual-chat-history-agent/AGENT.md` | Runs and troubleshoots the viewer |
| Command | `.claude/commands/visual-chat-history.md` | `/visual-chat-history start\|stop\|status\|export\|summary` |
| Shared parser | `.claude/skills/chat-history-convention/scripts/split-sessions.mjs` | Entry parser and session rule (owned by `chat-history-convention`) |
| Runbook | `.docs/runbooks/development/visual-chat-history.md` | Operating notes and validation evidence |
| Package | `.other-devices/components/visual-chat-history/` | Portable install package |

There is no hook. Nothing here runs on a prompt or a tool call; the viewer only runs when someone
starts it.

## Design invariants
- **Read only.** It never writes the history, the segments or `sessions/`.
- **Agnostic.** No project names or paths in the code; it finds `.chat-history/` from the folder it
  is run in and reads whichever history files are there.
- **Zero dependencies.** Node built-ins on the server; plain JavaScript in the page; no CDN, so it
  works offline.
- **Local only.** Binds to 127.0.0.1, checks the `Host` header, serves only the history files it
  lists, sends a strict Content-Security-Policy.
- **Chat text is never markup.** Every piece of chat text reaches the page through `textContent`
  or text nodes.
- **Contents stay home.** Only the component travels between repos; chat contents, `sessions/` and
  exported HTML stay in their own repo.

See `USAGE_GUIDE.md` for day-to-day use and `ARCHITECTURE.md` for how it works.
