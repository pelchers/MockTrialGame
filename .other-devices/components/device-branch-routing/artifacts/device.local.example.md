# THIS MACHINE — device git toggle (TEMPLATE)
#
# HOW TO USE (new machine, one-time):
#   1. Copy this file to `device.local.md`  (same folder, repo root).
#   2. Check the ONE box that matches this device in each section.
#   3. Save. That's it — `device.local.md` is the ONLY file you ever edit to
#      change per-device git behavior. It is tracked & committed on this device branch (no-ignore policy) so the other device understands this lane.
#
# Full guides: .docs/runbooks/development/device-branch-convention.md
#              .docs/runbooks/development/device-sync-and-handoff-protocol.md
# The AI agent reads this file (via the device-branch-routing skill + the
# SessionStart sync-check hook) to decide where commits/pushes go.
#
# MODEL (2026-07-06): BOTH devices default to their own WORKING lane (home→Home-Work,
# asus→Asus-Work). `main` = handoff + savepoint + stable + deployment/prod — it is synced to your
# working lane only at WIND-DOWN (/winddown pushes the device branch AND main). Start each session
# with /pickup (adopt the latest handoff); end with /winddown.

## 1. Which device is this?            (check exactly ONE)
- [ ] home-desktop      # 🖥 Home PC      → default working lane: Home-Work
- [ ] asus-laptop       # 💻 Asus laptop  → default working lane: Asus-Work

## 2. Default commit/push target       (check exactly ONE)
- [x] device-default    # home → Home-Work,  asus → Asus-Work      ← recommended
- [ ] main              # force this machine to commit on main directly (rare — main is handoff/savepoint)

## 3. Release method to main           (check exactly ONE)
- [x] direct-push       # /winddown fast-forwards main to your handoff   ← default
- [ ] pr-release        # open a PR into main instead of fast-forwarding

## 4. Hostname pin (safety net — leave blank; auto-filled on first run)
HOSTNAME=
