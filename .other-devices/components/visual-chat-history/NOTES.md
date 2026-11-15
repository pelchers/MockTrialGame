# NOTES: `visual-chat-history`

## Why it exists
The user asked on 2026-11-15 for a way to click into any chat session quickly and for a web view
with tabs, sort, filters and fuzzy search that runs next to the app while work goes on. The
per-session markdown files became an appended section of `chat-history-convention`
(`split-sessions.mjs`); the web view is this separate component.

## Design decisions
- **One parser, one session rule.** The viewer imports `split-sessions.mjs` from
  `chat-history-convention` instead of carrying its own copy, so the viewer's tabs and the
  `sessions/` files can never disagree. The viewer looks for it next to itself first, then under
  `.claude/` and `.codex/` of the repo, and says clearly what is missing if it is absent.
- **Union of every history file.** It reads the merged view, `.log` files, device segments and the
  session files, and shows each entry once (key: timestamp, role and a hash of the first message
  line), listing every file it was found in. Nothing the history holds is hidden.
- **Read only, by construction.** The only write is an export the user asks for.
- **No hook.** A hook would run on prompts or tool calls for no benefit; the viewer only runs when
  started. The sessions folder is refreshed by running `split-sessions.mjs` after an append, as
  the appended section of `chat-history-convention` says.
- **Live via Server-Sent Events,** with `fs.watch` plus a 1.5 second size and time check, because
  watch events are unreliable on some editors and drives.
- **Port 4700,** clear of common dev ports (3000, 3100, 4321, 5173, 4173). Fails loudly when busy.
- **`stop` checks identity** through `/api/health` and only stops this viewer's own pid.

## Gotchas found while building
- On Windows, starting the hidden server from `execFileSync` with a stdout pipe made `start` hang
  until the server exited: the grandchild inherited the pipe. `start` now runs PowerShell with
  no pipes and reads the pid from a temp file.
- Histories mix line endings (older entries CRLF, newer LF in the same file). The session files
  keep each entry's own line endings so they stay byte for byte copies.
- Some histories wrap entries in `<!-- ENTRY -->` markers with no `---` between them, and old ones
  have compact entries separated only by a blank line, or nothing. An entry therefore starts at
  any `[timestamp] role=` line outside a code fence.
- Playwright MCP blocks `file:` URLs, so the export was validated through a plain static server.

## Relationships
- Reads what `chat-history-convention` writes; complements its `sessions/` folder.
- Independent of `cycle-back`, `qna-logger` and the branched-log engine (it only reads their
  output when it is a `user-messages*` file).
