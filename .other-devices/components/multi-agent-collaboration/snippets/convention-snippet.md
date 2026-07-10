<!-- BEGIN multi-agent-collaboration convention (managed; append idempotently — do not duplicate) -->
## Concurrent / Multi-Agent Work Convention
- **Multiple agents and/or devices may work in this repo at the same time** (parallel agents on one
  machine, plus other devices on their own branch lanes). Assume you are NOT the only writer.
- **Always `git add -A` + commit + push at every convention/standard commit point.** After each unit
  of work — and whenever any convention says "commit" — stage **everything** (`add -A`), commit, and
  push. Universal **add-all is deliberate**: because everything is *always* added, committed, and
  pushed, concurrent multi-agent edits are continuously integrated and nothing sits uncommitted long
  enough to be lost or to collide. Do **not** hand-pick paths to "avoid" another agent's in-flight
  work — add all and let git history capture every state.
- **Read before write, freshly.** Re-read a file immediately before editing it; re-read again if time
  has passed. Edits must make sense against the current on-disk state (which another agent may have
  changed since you last looked).
- **Pull/rebase before push.** `git pull --rebase` on your device branch before pushing; integrate
  others' commits rather than overwriting. Never force-push a shared branch.
- **Per-device branch lanes.** Each device commits to its own **working lane** — this laptop →
  `Asus-Work`, home-desktop → `Home-Work` — resolved from the **tracked** `device.local.md` (see the
  device-branch convention; `device.local.md` is committed per-branch, NOT gitignored, so each lane
  self-describes). Push to your working lane; `main` = handoff/savepoint/stable/prod, synced to your
  lane only at wind-down.
- **Umbrella submodules pin by commit SHA** (branch-agnostic), so `clone --recursive` always resolves
  even when child repos are on per-device branches.
- **Look before you delete/overwrite** a file you didn't create (`git log -- <file>` + read it first).
- **Announce concurrency in chat** when you detect another agent's changes (files changed under you,
  new commits on fetch).
<!-- END multi-agent-collaboration convention -->
