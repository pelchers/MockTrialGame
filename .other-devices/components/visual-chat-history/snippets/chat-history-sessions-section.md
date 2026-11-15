
## Sessions folder (one file per session, for quick browsing)

Added 2026-11-15. This section only adds to the convention above. Nothing above it changed, and
`user-messages.md` is still the one file every entry is written to first.

`.chat-history/sessions/` sits next to `user-messages.md`. It holds one markdown file per session
plus a `README.md` index that links every session file, newest first, with the machine, entry
count, time span and the first line of the session's first message. Each session file is a word
for word copy of that session's entries, so you can click straight into one session instead of
scrolling the whole history.

- **Never edit the session files, and never write an entry there first.** They are rebuilt from
  `user-messages.md` by `scripts/split-sessions.mjs`, so a hand edit would be overwritten.
- **After each append** (by `scripts/append-user-message.ps1` or by hand), refresh the folder from
  the repo root:
  `node .claude/skills/chat-history-convention/scripts/split-sessions.mjs`
  The script reads the history and never writes it. It rewrites only the session files whose
  content changed and removes only stale files that carry its generated marker, so running it
  twice gives the same files. `--check` writes nothing and exits 1 when the folder is out of date.
  Commit the sessions folder in the same commit as the history change.
- **Grouping rule:**
  1. An entry's date is the UTC date of its `[timestamp] role=...` header line.
  2. Entries on the same date from the same machine make one session. The machine is the
     `device:` on the `Authored by:` line, else its `host`, else the device named by a
     branched-log ENTRY marker or a `user-messages.<device>.md` segment name. An entry that names
     no machine takes the machine of the nearest earlier entry that day, else the nearest later one.
  3. Within one date and machine, a gap of more than 6 hours between two entries starts a new
     session.
- **File naming:** `YYYY-MM-DD_<machine>.md` with the machine in lower case (for example
  `2026-11-15_vengeance.md`), or `YYYY-MM-DD.md` when no machine is recorded. A second or third
  session on the same date and machine gets `-2`, `-3`. Entries without a readable timestamp go to
  `undated.md`. Each file starts with a generated-marker comment and a short header (entry count,
  time span, machine, links to the index and to the previous and next session), then the entries,
  each wrapped in `---` lines as in the history.
- **Source file:** `user-messages.md`. A repo that only has `user-messages.log` uses that instead;
  a device-branched repo with segments but no merged view has its `user-messages.<device>.md`
  segments combined, with duplicates dropped.
- **Device-branched repos:** run the script after the merged view is regenerated
  (`append-user-message.ps1` and `branched-logs.sh merge` both do that), so the sessions carry
  every device's entries.
- The folder's contents are chat contents, so they are **project-local and never synced** to other
  repos. Only the script and this section travel with the component.
- To browse the history visually (a tab per session, fuzzy search, filters, live updates while you
  work), use the separate `visual-chat-history` component (`/visual-chat-history start`).
  work), use the separate `visual-chat-history` component (`/visual-chat-history start`).

### Automatic refresh (hook)

Added 2026-11-15. The step "after each append, refresh the folder" now runs on its own:
`.claude/hooks/scripts/chat-history-sessions-sync.sh` is registered in `.claude/settings.json`
on PostToolUse (Edit|Write), Stop and SessionStart. It compares the size and modified time of the
history files with a stamp under `.git/` and runs `split-sessions.mjs` only when they changed, so
an agent never needs to load this skill or remember the command just to keep `sessions/`
current. Running the script by hand still works and gives the same result. Commit `sessions/`
together with the history change. Turn the hook off with `CHAT_HISTORY_SESSIONS_SYNC=off`.
