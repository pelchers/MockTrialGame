---
name: device-branch-routing
description: Resolve which git branch to commit/push to based on the per-machine device.local.md toggle. Use before any commit or push, when the user says "commit"/"push"/"merge to main", or when deciding the default git target on this machine. Enforces that the work laptop never auto-pushes to main.
---

# Device Branch Routing

One repo, multiple machines. The correct default git branch depends on **which physical device**
the agent is running on. That device — plus the default target and release method — is declared in
a single per-branch tracked file at the repo root (committed, no-ignore policy): **`device.local.md`**. This skill is how the agent reads
that file and routes commits/pushes correctly.

> The user edits **only** `device.local.md`. Everything here is fixed infrastructure.
> Full setup guide: `.docs/runbooks/development/device-branch-convention.md`.

## When to use

- Before ANY `git commit` or `git push`.
- When the user says "commit", "push", "save", "sync", "merge to main", "push to main".
- When deciding this machine's default git target at the start of work.

## Step 1 — Read the toggle

Read `device.local.md` at the repo root. It has four sections, each a checkbox list where the
**checked** box (`- [x]`) is the active choice:

1. **Device** — `home-desktop` | `asus-laptop`
2. **Default target** — `device-default` | `main`
3. **Release method** — `direct-push` | `pr-release`
4. **Hostname pin** — `HOSTNAME=<name>` (safety net)

Parse the checked line in each section. If `device.local.md` **does not exist**, STOP: tell the
user to copy `device.local.example.md` → `device.local.md` and check a device (or run `/device`).
Never guess a device or push target.

## Step 2 — Resolve the default branch

> **Updated 2026-07-06:** BOTH devices default to their own **working lane**; `main` is the
> **handoff + savepoint + stable/prod** branch, synced to your lane only at **wind-down**
> (`/winddown`). Routine commits go to the working lane; `main` is not a daily target. See the
> `device-sync-protocol` skill + `.docs/runbooks/development/device-sync-and-handoff-protocol.md`.

| Device | Target toggle | → Default branch | `main` updated |
|---|---|---|---|
| `home-desktop` | `device-default` | **`Home-Work`** | at `/winddown` (fast-forward handoff) |
| `home-desktop` | `main` | **`main`** | direct (rare override) |
| `asus-laptop` | `device-default` | **`Asus-Work`** | at `/winddown` (fast-forward handoff) |
| `asus-laptop` | `main` | **`main`** | direct (rare override) |

Future devices follow the same shape: `<name>-device` → `<Name>-Work`.

## Step 3 — Enforce the push-gate (critical)

- **`asus-laptop` with `device-default`:** routine `commit`/`push` goes to **`Asus-Work`**.
  A bare "push" pushes `Asus-Work` to `origin Asus-Work` — **NOT** `main`.
- **`home-desktop` with `device-default`:** routine `commit`/`push` goes to **`Home-Work`**.
  A bare "push" pushes `Home-Work` to `origin Home-Work` — **NOT** `main`.
- **`main` is not a daily target for either device.** It is the handoff/savepoint/stable/prod
  branch, synced to your working lane only at **`/winddown`** (`git push origin <Device>-Work:main`,
  fast-forward) or when the user **explicitly** directs it ("push to main", "merge to main").
- If unsure whether a request means `main`, **ask** before pushing to `main`. Never force-push `main`.

## Step 4 — Apply the release method (only when going to `main`)

Read toggle 3:

- **`direct-push`** (default): `git push origin main` (after the gate in Step 3 is satisfied).
- **`pr-release`**: do NOT push to `main` directly. Push the work branch and open a PR into `main`
  (`gh pr create --base main`).

## Step 5 — Hostname safety net

If toggle 4 `HOSTNAME` is set and does **not** match `hostname` / `$COMPUTERNAME` on this machine,
warn the user: the `device.local.md` may have been copied from another device. Offer to re-pin.
If `HOSTNAME` is blank, fill it with the current hostname on first use.

## Routing quick-reference

```
home-desktop  →  commit/push → Home-Work        (default)
asus-laptop   →  commit/push → Asus-Work        (default)
either        →  /winddown   → fast-forward main (handoff/savepoint/prod)
```

## Related

- Sync banner each session: hook `.claude/hooks/scripts/device-sync-check.sh` (SessionStart).
- View/flip the toggle: `/device` command.
- Naming + decisions: `.docs/planning/plans/2-device-aware-branch-convention.md`.
- Portable package for syncing to template repos / other machines:
  `.other-devices/components/device-branch-routing/`. Per the repo convention, reusable artifacts
  are staged there — see `.other-devices/README.md`.
