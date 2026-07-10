# HANDOFF — cross-device agent handoff log

> **Append-only, per-device.** At every **wind-down** (`/winddown`) the agent prepends a new entry
> here; at every **pickup** (`/pickup`) the next machine's agent reads the newest entry. This is the
> living "where we left off + what's next" record that bridges home-desktop ⇄ asus-laptop.
> Full protocol: `.docs/runbooks/development/device-sync-and-handoff-protocol.md`.
>
> **Entry template** (newest on top):
> ```
> ## <YYYY-MM-DD HH:MM TZ> · <device> (<hostname>) · <agent> · branch <X>-Work @ <short-sha>
> **Synced from:** <what /pickup adopted this session, or "fresh clone">
> **What changed:** <the work done>
> **Where I stopped / state:** <current app + DB + branch state>
> **Next actions:** <ordered, concrete>
> **Blocked on (needs user/external):** <keysets, proxy creds, decisions>
> **Gotchas:** <traps the next agent must know>
> ```

---

<!-- First real entry is prepended here by the first /winddown on this repo. -->
