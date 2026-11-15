# Visual Chat History: architecture

## Shape

```
.chat-history/user-messages.md, *.log, user-messages.<device>.md, sessions/*.md
        |  read only (fs.readFileSync)
        v
viewer.mjs  --imports-->  chat-history-convention/scripts/split-sessions.mjs
  |                         parseHistoryText(): entries, each with its exact raw text
  |                         groupSessions():    the session rule (UTC date, machine, 6 hour gap)
  |
  |  buildData(): union of all files, deduped by (timestamp, role, first line), entry ids,
  |               sessions, sources, "is sessions/ out of date"
  v
http.Server on 127.0.0.1:<port>
  GET /             page shell (index.html)           CSP: self only
  GET /app.js, /app.css
  GET /api/data     the whole model as JSON
  GET /api/events   Server-Sent Events: hello, update, ping every 20 s
  GET /api/health   {app, pid, port, root, version, ...}  used by start, stop, status
  GET /raw/<name>   a listed history or session file as text/plain
        |
        v
app.js in the browser
  analyze():  splits each entry into the message and its sections (VERBATIM USER PROMPT(S),
              VERBATIM AGENT REPLY(S), SESSION CONTEXT, USER INTENT, REFERENCE FILES,
              KEY DECISIONS, AGENT REPORT, and any other ALL CAPS heading after those)
  index:      token map for fuzzy search
  render:     tabs, filters, list, entry view; the URL hash holds session, entry and search
```

## Parsing

- An entry starts at a line `[<timestamp>] role=<name>` at the start of a line, outside fenced
  code blocks. That covers the current format (with `Authored by:`, `Most recent commit:`, the
  VERBATIM blocks), older entries without them, compact one-line entries, entries with no `---`
  between them, and the branched-log `<!-- ENTRY ... -->` markers (kept as part of the entry).
- Timestamps may lack seconds or the `Z`; offsets are converted to UTC. An entry whose timestamp
  cannot be read goes to an "undated" session instead of being dropped.
- Tested against the histories of 12 repos on this machine (6 to 213 entries each): the entry
  counts match a plain count of header lines in every one, and every entry's text is a byte for
  byte slice of its file.

## Sessions

The rule is `groupSessions()` in `split-sessions.mjs`, used by both the `sessions/` files and the
viewer's tabs, so they always agree: UTC date of the header, then machine (`device:` on the
`Authored by:` line, else `host`, else the ENTRY marker or segment name; an entry naming no
machine takes the one used earlier that day), then a new session after a gap of more than 6 hours.
Ids: `YYYY-MM-DD_<machine>`, `-2` and `-3` for later ones, `undated`.

## Live updates

The server watches `.chat-history/` and `sessions/` with `fs.watch` and also checks file sizes and
times every 1.5 seconds (some editors and network drives do not raise watch events). When the
signature changes it rebuilds; when the model's hash changes it sends `event: update` to every
open page. The page refetches `/api/data`, keeps the current tab, entry, search and filters,
flags new and changed entries and shows a toast. `EventSource` reconnects on its own; on `hello`
after a reconnect the page compares versions and refetches if it missed something.

## Fuzzy search

Each search word is matched against every field as a substring first (weight by field: message
and prompts 3, replies, intent and decisions 2, report 1.5, others 1; a match at a word start
counts more). Words of 4 or more letters also match tokens within a small edit distance (1 for
4 to 9 letters, 2 for 10 or more; a swap of two neighbouring letters counts as one edit) and
tokens whose first letters are within that distance. Words of 3 or more letters also match a
token at most 4 letters longer that starts with the same letter and holds the word's letters in
order. Fuzzy hits score lower than exact ones. Every word must match. Quoted phrases are exact
only. "Best match" sorts by score.

## Safety

- Binds to 127.0.0.1 only; requests whose `Host` is not `127.0.0.1:<port>` or `localhost:<port>`
  get 403 (blocks DNS rebinding); only GET and HEAD.
- `/raw/` serves only names in the viewer's own source list, so no paths or traversal.
- Server pages carry `Content-Security-Policy: default-src 'none'; script-src 'self';
  style-src 'self'; connect-src 'self'; img-src 'self' data:`. Exports carry a meta CSP that
  allows only their own inline script and style.
- All chat text is written with `textContent` or text nodes; links are created only for
  `http(s)` URLs, with `rel="noopener noreferrer"`. The export embeds the data as JSON inside a
  `type="application/json"` script with every `<` escaped, so the history cannot close the tag.
- `stop` only kills the pid that `/api/health` on that port reports as this viewer.

## Background start

- Windows: `powershell -EncodedCommand` runs `Start-Process node ... -WindowStyle Hidden
  -RedirectStandardOutput <log>`, writes the pid to a temp file and exits; PowerShell runs with no
  pipes attached so the hidden child cannot hold the caller open. The server is outside the
  calling shell's process tree.
- macOS and Linux: `spawn(node, ..., { detached: true })` with output to the log, then `unref()`.
- `start` then polls `/api/health` for up to 10 seconds.

## Files

| File | Lines (about) | What |
|------|------|------|
| `scripts/viewer.mjs` | 570 | CLI, server, watcher, export |
| `scripts/app/index.html` | 75 | Page shell |
| `scripts/app/app.css` | 500 | Light and dark styles, narrow-screen layout |
| `scripts/app/app.js` | 1000 | Analysis, search, rendering, navigation, live updates |
