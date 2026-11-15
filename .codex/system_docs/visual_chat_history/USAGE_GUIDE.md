# Visual Chat History: usage guide

All commands run from the repo root.

## Start it next to the app

```bash
node .claude/skills/visual-chat-history/scripts/viewer.mjs start
```

It prints the URL (`http://127.0.0.1:4700/`), the pid and the log file, then returns. On Windows
it starts a hidden process with `Start-Process -WindowStyle Hidden`, so no window appears and it
keeps running after the shell closes. Or ask: `/visual-chat-history start`.

Another port: `--port 4710`, or set `VISUAL_CHAT_HISTORY_PORT=4710`. If the port is busy it says
so and exits; it never takes over a port another program holds.

To start it by hand on Windows, the convention's own pattern works too:

```powershell
Start-Process node -WindowStyle Hidden -ArgumentList '.claude/skills/visual-chat-history/scripts/viewer.mjs','serve','--port','4700'
```

## Check, stop

```bash
node .claude/skills/visual-chat-history/scripts/viewer.mjs status
node .claude/skills/visual-chat-history/scripts/viewer.mjs stop
```

`stop` asks the port who is there and only stops it when it is this viewer.

## Use the page

- **Tabs** across the top: "All sessions", then one per session, newest first (oldest first when
  you sort that way). Each tab shows the date, the machine and the number of entries; while
  searching or filtering it shows matches out of total and dims tabs with none.
- **Search** box (`/` or `Ctrl+K`): type words. Small typos still match, every word must match,
  `"quoted words"` match exactly. Matches are highlighted.
- **Sort:** newest, oldest, best match.
- **Filters:** From and To dates (UTC), machine, author (shown when there is more than one), and
  the section chips: Prompts, Replies, Intent, Decisions, Report, References, Context. A chip
  keeps only entries that have that section. "Clear filters" resets them.
- **Entry view:** sections fold open and closed (remembered in this browser), "Collapse all" and
  "Expand all", the raw entry text at the bottom, Previous and Next, "Copy link".
- **Session view:** pick a tab to see its header (date, machine, entries, time span), a link to
  its file in `.chat-history/sessions/` and a copyable link.
- **Keyboard:** `j`/`k` entries, `[`/`]` tabs, `a` all sessions, `Esc` clear or go back, `?` help.
- **Theme:** the button at the top right cycles Auto, Light, Dark.

## Links you can share or bookmark

- `http://127.0.0.1:4700/#session=2026-11-15_vengeance` opens a session.
- `http://127.0.0.1:4700/#entry=e20261115T174000Z` opens one entry.
- Add `&q=word` to open with a search. Session ids are the `sessions/` file names without `.md`;
  entry ids are `e` plus the entry's UTC timestamp.

## Live updates

Leave the page open while you work. When a history file changes, the page updates within about
two seconds, marks new entries "new" and shows "1 new entry just arrived" with a Show button.
The status at the top says "Live", "Reconnecting" or "Static export".

## Static copy

```bash
node .claude/skills/visual-chat-history/scripts/viewer.mjs export
node .claude/skills/visual-chat-history/scripts/viewer.mjs export --out C:/somewhere/history.html
```

One HTML file with the data inside; open it straight from disk. The default folder
`.chat-history/exports/` is ignored by git. The file holds the whole history, so treat it the
same way as `user-messages.md`.

## When something looks wrong

- `summary` prints the files read, entry counts per file and the sessions.
- "The sessions/ folder is behind the history": run
  `node .claude/skills/chat-history-convention/scripts/split-sessions.mjs`.
- "needs the chat-history-convention skill's scripts/split-sessions.mjs": sync
  `chat-history-convention` into the repo; the viewer shares its parser.
- Nothing found: the viewer looks for `.chat-history/` in the folder it runs in and its parents;
  pass `--root <repo>` or `--dir <folder>`.
