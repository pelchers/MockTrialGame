---
name: visual-chat-history
description: Run, stop, check or export the visual chat history viewer, a local web page over the project's .chat-history/ with a clickable tab per session, sort, filters (date range, machine, author, which sections an entry has), fuzzy search with highlighting, deep links to any session or entry, and live updates as new entries are logged. Use when the user wants to browse, search or click through the chat history visually, wants it running next to the app's dev server, asks for a static HTML copy of the history, or says "visual chat history", "chat history viewer" or "open the chat log". Separate from chat-history-convention, which writes the history; this component only reads it.
---

# Visual Chat History

A small local web viewer for `.chat-history/`. It reads the history and never writes it. It runs
next to the app's own dev servers on its own port, and the page updates itself while the
conversation goes on.

> **What travels between repos:** only this component's code and docs. Each repo's chat contents,
> its `sessions/` folder and any exported HTML stay in that repo and are never synced.

## What it shows

- **Tabs:** "All sessions" plus one tab per session, using the same grouping rule as the
  `.chat-history/sessions/` files (UTC date, then machine, a gap over 6 hours starts a new one).
  The rule lives in `chat-history-convention/scripts/split-sessions.mjs`; the viewer imports it.
- **Sort:** newest first, oldest first, or best match while searching.
- **Filters:** date range, machine, author, and section chips (only entries that have verbatim
  prompts, agent replies, intent, decisions, an agent report, references or context).
- **Fuzzy search** over the raw message, the verbatim prompt and reply blocks, intent, decisions,
  the agent report, context, references and the commit line. Small typos still match
  ("pasword" finds "password"); words in quotes match exactly; every word must match. Matches
  are highlighted in the list and in the entry.
- **Entry view:** every section collapsible (the choice is remembered), the verbatim prompts and
  replies split into their numbered items, the raw entry text, previous and next, copy link.
- **Deep links:** `#session=<id>`, `#entry=<id>`, both together, plus `&q=<search>`. The browser's
  back button works.
- **Live:** the server watches `.chat-history/` and pushes a Server-Sent Event when a history file
  changes; the open page refetches, flags new entries and offers to jump to them.
- **Keyboard:** `/` or `Ctrl+K` search, `j`/`k` next and previous entry, `[`/`]` tabs, `a` all,
  `Esc` clear or back, `?` help. Light, dark or follow the system.

## Sources it reads (from the repo root it runs in)

`user-messages.md`, `user-messages.log`, any other `user-messages*.md|.log` (device segments such
as `user-messages.home-desktop.md` included) and the files in `sessions/`. Entries that appear in
several files are shown once, with every file they were found in. If the `sessions/` folder is
behind the history, the overview says so and gives the command that refreshes it.

## Commands

Run from the repo root. The script needs Node 18 or newer and nothing else (no install step).

```bash
node .claude/skills/visual-chat-history/scripts/viewer.mjs start            # background, windowless
node .claude/skills/visual-chat-history/scripts/viewer.mjs status
node .claude/skills/visual-chat-history/scripts/viewer.mjs stop
node .claude/skills/visual-chat-history/scripts/viewer.mjs serve            # foreground, Ctrl+C stops
node .claude/skills/visual-chat-history/scripts/viewer.mjs export [--out FILE]
node .claude/skills/visual-chat-history/scripts/viewer.mjs summary          # what it would show
```

- URL: `http://127.0.0.1:4700/`. It binds to 127.0.0.1 only.
- Port: default 4700, or `--port N`, or `VISUAL_CHAT_HISTORY_PORT`. It does not collide with the
  usual app ports (3000, 3100, 4321, 5173, 4173). If the port is taken it exits with a clear
  message and does nothing else.
- `start` on Windows uses `Start-Process -WindowStyle Hidden` (the Dev Server Persistence
  convention), so there is no window and the server outlives the shell that started it. The log
  is `%TEMP%\visual-chat-history-<port>.log`. On macOS and Linux it is a detached child process.
- `stop` asks the port's `/api/health` who is there and stops it only when it is this viewer. It
  never stops another program on that port.
- `export` writes one self-contained HTML file with the data inside (no server needed). The
  default is `.chat-history/exports/chat-history.html`; that folder gets a `.gitignore` of `*` so
  exports stay out of git. Pick another path with `--out`.
- Other flags: `--root DIR` (repo root, default: nearest folder up with `.chat-history` or
  `.git`), `--dir DIR` (chat history folder), `--source a.md,b.md` (only these files), `--open`.

## Rules

1. **Read only.** The viewer never edits `user-messages.md`, the segments or `sessions/`. To
   refresh `sessions/`, run `chat-history-convention`'s `split-sessions.mjs`.
2. **Stop what you start.** Leave the viewer running only when the user asked for it. Never stop
   a program you did not start (the `stop` command already refuses to).
3. **Never sync chat contents.** Only the files listed in the portable package's MANIFEST travel.
4. **Safe rendering.** Chat text is shown with `textContent` and text nodes only; never
   `innerHTML` with chat text. Keep it that way in any change.
5. **No dependencies.** Node built-ins and plain browser JavaScript only; no CDN, so it works
   offline and in any repo without `pnpm install`.

## Related

- Command `/visual-chat-history start|stop|status|export|summary` (with `$ARGUMENTS`) and agent
  `visual-chat-history-agent`.
- `chat-history-convention` writes the history and owns `split-sessions.mjs` (parser and session
  rule shared with this viewer).
- Docs: `.claude/system_docs/visual_chat_history/` (README, USAGE_GUIDE, ARCHITECTURE). Runbook:
  `.docs/runbooks/development/visual-chat-history.md`.
