# Visual Chat History: runbook

A local web viewer for `.chat-history/`: a tab per session, sort, filters, fuzzy search, deep links
and live updates. It reads the history and never writes it. Component docs:
`.claude/system_docs/visual_chat_history/` (README, USAGE_GUIDE, ARCHITECTURE).

## Why it exists

The user asked (2026-11-15) for a sessions folder next to the chat history file so any session
can be clicked into, and for "a web render with clickable tabs and sort fitler fuzzy search etc
for it that I can run with a live server simultanous to the actual app being up so I can traverse
a more visual presentation of the chat history as we proceed" (verbatim, from the 2026-11-15
entry), built as its own component, separate from the chat history skill, and synced to the sync
repos.

The sessions folder is part of `chat-history-convention` (appended section "Sessions folder" in its
SKILL.md, script `scripts/split-sessions.mjs`). This viewer is the separate visual component and
imports that script so the tabs and the session files use one grouping rule.

## Operating it

| Task | Command (from the repo root) |
|------|---------|
| Start in the background | `node .claude/skills/visual-chat-history/scripts/viewer.mjs start` |
| Open | `http://127.0.0.1:4700/` |
| Status | `node .claude/skills/visual-chat-history/scripts/viewer.mjs status` |
| Stop | `node .claude/skills/visual-chat-history/scripts/viewer.mjs stop` |
| Run in this terminal | `node .claude/skills/visual-chat-history/scripts/viewer.mjs serve` |
| Static HTML copy | `node .claude/skills/visual-chat-history/scripts/viewer.mjs export [--out FILE]` |
| What would it show | `node .claude/skills/visual-chat-history/scripts/viewer.mjs summary` |
| Refresh `sessions/` | `node .claude/skills/chat-history-convention/scripts/split-sessions.mjs` |

- Port 4700 by default (`--port N` or `VISUAL_CHAT_HISTORY_PORT`). It stays clear of the app's
  ports; in CDP those are staff 3000, API 3100, site 4321, and 4173 belongs to another app on the
  Windows desktop and must never be stopped.
- On Windows `start` uses `Start-Process -WindowStyle Hidden` (Dev Server Persistence convention):
  no window, survives the shell, log at `%TEMP%\visual-chat-history-<port>.log`.
- `stop` checks `/api/health` on the port and stops the process only if it is this viewer.
- Exports default to `.chat-history/exports/chat-history.html`; that folder gets its own
  `.gitignore` (`*`), so exports never reach git.

## What stays in each repo

Chat contents (`user-messages*.md`, `.log`), the `sessions/` folder and exported HTML are
project-local and never synced. Only the component files in the portable package's MANIFEST
travel.

## Validation, 2026-11-15 (host VENGEANCE, CDP)

Run against CDP's real history (27 entries, 7 sessions) with the server started by `start` on
4700, in the Playwright Chromium at 1440 by 900 and 390 by 844:

- `start` returned in 0.5 s; the server process had no window (`MainWindowHandle` 0) and listened
  on 127.0.0.1:4700 only. A second `start` said "Already running". `stop` on a port held by a
  different program (a Python static server on 4702) refused and left it running.
- HTTP checks: page 200 with the CSP header; wrong `Host` header 403; POST 405; `/raw/` with
  `..%2F` traversal 404.
- Tabs: 8 (All plus 7 sessions); clicking a tab set `#session=...` and showed the session header
  and its link to `sessions/<id>.md`.
- Sort: newest first lists 2026-11-15 first, oldest first lists 2026-11-02 first and reverses the
  tab order.
- Filters: 2026-11-05 to 2026-11-06 gave 10 of 27 (6 plus 4); machine VENGEANCE gave 1; the
  References chip gave 11, equal to a raw count of entries with `REFERENCE FILES:`; Clear filters
  restored 27.
- Fuzzy search: `pasword fidelty` found the one entry holding both "password" and "fidelity",
  highlighted 4 and 6 times in the entry; `deploymnet` and `deployment` both gave 5; the quoted
  phrase `"subagent swarm"` gave 1, equal to a raw count.
- Deep links: `#session=2026-11-03_desktop-16o74re&entry=e20261103T215931Z` opened that tab with
  that entry selected; `#entry=` alone, `#session=` alone, and unknown ids (fallback to All) all
  worked; the Back button returned to the previous hash.
- Live update: a second viewer on port 4701 pointed at a copy of the history in a temp folder; a
  test entry appended to the copy appeared on the open page without a reload (same page object),
  flagged "new", with the "1 new entry just arrived" toast, whose Show button opened it. The test
  entry contained `<script>` and `<img onerror>` text; it showed as text and no element was
  created. The real `user-messages.md` was not touched.
- Export: 198 KB file; served from a plain static server it showed "Static export", tabs, search
  and deep links with no requests to the viewer API.
- Console: 0 errors, 0 warnings across the runs.

Screenshots in `visual-chat-history/`:
`search-typo-highlight.png`, `live-update-new-entry.png`, `dark-entry-view.png`, `phone-width.png`.

The split script was checked on 7 repos' histories (CDP 27 entries, PID 65, campus 213,
IDEA-MANAGEMENT 57, Markdown Mermaid Editor 22, Brand-MarTech 74, OutreachAI 34; output to a temp
folder for the other repos): every entry in every session file is a byte for byte copy of the
source, every source line belongs to an entry, and a second run rewrote nothing.

## Known limits

- Session dates are UTC dates, so an evening session that crosses midnight UTC is split in two.
- The page renders up to 200 entries per list and offers "Show more"; very large histories (many
  thousands of entries) load all data at once.
- Inline markdown is shown as text except `code` spans, bullet lines and http(s) links; tables
  and headings inside chat text are not formatted.
