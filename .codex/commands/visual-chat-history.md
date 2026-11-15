---
name: visual-chat-history
description: Start, stop, check or export the visual chat history viewer (a local web page over .chat-history/ with session tabs, sort, filters, fuzzy search, deep links and live updates).
invocable: true
---

# /visual-chat-history: browse the chat history in a web page

Runs the `visual-chat-history` component (skill `visual-chat-history`, agent
`visual-chat-history-agent`) against this repo's `.chat-history/`. It reads the history and never
writes it.

`$ARGUMENTS` selects the operation (default `start`):

- `/visual-chat-history start [--port N]` starts it in the background (windowless on Windows) and
  prints the URL, normally `http://127.0.0.1:4700/`.
- `/visual-chat-history stop [--port N]` stops it. It only stops this viewer, never another
  program on the port.
- `/visual-chat-history status [--port N]` says whether it is running, where, and for which repo.
- `/visual-chat-history export [--out FILE]` writes one self-contained HTML file (default
  `.chat-history/exports/chat-history.html`, which git ignores).
- `/visual-chat-history summary` lists what the viewer would show and whether `sessions/` is up
  to date.

## Instructions for Codex

1. Invoke the **`visual-chat-history`** skill and follow it. The commands are one line each, so run
   them inline; hand off to **`visual-chat-history-agent`** only for troubleshooting.
2. Run from the repo root:
   `node .claude/skills/visual-chat-history/scripts/viewer.mjs <operation> [flags]`.
3. If the port is taken by another program, try the next free port; never stop that program.
4. Report the URL (or the file path for `export`) and how to stop it, in plain words.
5. Never write to `.chat-history/` yourself and never copy chat contents to another repo.

$ARGUMENTS
