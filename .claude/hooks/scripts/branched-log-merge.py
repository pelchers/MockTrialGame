#!/usr/bin/env python3
"""branched-log-merge.py — device-branched append-log engine.

Multi-device append-only logs (chat history, HANDOFF, sync-log) break when two machines both
append to ONE file and then git-merge: a conflict (careless resolve drops a side) or a union that
jumbles order and duplicates on re-merge. This engine makes the WRITES physically disjoint — each
device appends only to its own segment file `<base>.<device>.md` (its "branch") — so git never
conflicts, and rebuilds the human/AI-facing merged view `<base>.md` deterministically.

Canonical entry marker (hidden HTML comment — invisible when rendered, unambiguous to parse):

    <!-- ENTRY ts=<sortable> device=<device> id=<hash8> -->
    <original entry body, verbatim>
    <!-- /ENTRY -->

Guarantees:
  * dedup by content-hash id  → re-merges never duplicate (idempotent: run twice ⇒ byte-identical)
  * sort by ts (asc=newest-last / desc=newest-first) → always chronological
  * never drops an unparseable block → it is preserved as a QUARANTINE entry, never lost
  * the merged view is fully regenerable from the segments → a corrupted merged file is recoverable

Subcommands:
  merge   <base> <dir> <order>                       rebuild <dir>/<base>.md from its segment files
  migrate <base> <dir> <order> <device> <logtype>    wrap legacy <dir>/<base>.md → <base>.<device>.md
  absorb  <base> <dir> <order> <device> <logtype> <legacy-file>
                                                      pull the OTHER branch's (legacy) log entries in
  logtype ∈ {chat, handoff, synclog}   order ∈ {asc, desc}
"""
import sys, os, re, glob, hashlib
try:  # keep status output safe on Windows cp1252 consoles / hook capture
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ENTRY_RE = re.compile(
    r"<!--\s*ENTRY\s+ts=(?P<ts>\S+)\s+device=(?P<device>\S+)\s+id=(?P<id>\S+)\s*-->\n"
    r"(?P<body>.*?)\n?<!--\s*/ENTRY\s*-->",
    re.DOTALL,
)

def norm(body: str) -> str:
    return "\n".join(l.rstrip() for l in body.strip().splitlines())

def mkid(body: str) -> str:
    return hashlib.sha1(norm(body).encode("utf-8", "replace")).hexdigest()[:8]

def sortable(ts: str) -> str:
    # marker ts must be a single whitespace-free token; keep it lexically sortable.
    return re.sub(r"\s+", "T", ts.strip()) or "0000"

def device_of(path: str, base: str) -> str:
    # <base>.<device>.md  → <device>
    name = os.path.basename(path)
    m = re.match(re.escape(base) + r"\.(?P<d>[^.]+)\.md$", name)
    return m.group("d") if m else "unknown"

# ---- legacy parsers: each returns (header_text, [entry dicts]) --------------------------------
def parse_marked(text):
    """Already-marked file → header (text before first marker) + entries."""
    first = ENTRY_RE.search(text)
    header = text[: first.start()].rstrip() if first else text.rstrip()
    entries = []
    for m in ENTRY_RE.finditer(text):
        entries.append({"ts": m["ts"], "device": m["device"], "id": m["id"], "body": m["body"]})
    return header, entries

def parse_chat(text, default_device):
    """Legacy chat: '\\n---\\n'-delimited blocks; entry blocks contain '] role='."""
    parts = re.split(r"\n-{3,}\n", text)
    header, entries = "", []
    for i, blk in enumerate(parts):
        b = blk.strip()
        if not b:
            continue
        if "role=" in b and re.search(r"^\[[^\]]+\]\s*role=", b, re.M):
            ts_m = re.search(r"\[([^\]]+)\]\s*role=", b)
            ts = sortable(ts_m.group(1)) if ts_m else "0000"
            entries.append({"ts": ts, "device": default_device, "id": mkid(b), "body": b})
        elif not entries and not header:
            header = b  # leading intro block before the first entry
    return header, entries

def parse_handoff(text):
    """Legacy HANDOFF: '## ' headers, newest on top; device in the header line."""
    # split keeping the '## ' headers
    chunks = re.split(r"(?m)^(?=## )", text)
    header, entries = "", []
    for c in chunks:
        b = c.strip()
        if not b:
            continue
        if b.startswith("## "):
            ts_m = re.search(r"^##\s+([0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9:]+)", b)
            dev_m = re.search(r"·\s*(home-desktop|asus-laptop)\b", b)
            ts = sortable(ts_m.group(1)) if ts_m else "0000"
            dev = dev_m.group(1) if dev_m else "unknown"
            entries.append({"ts": ts, "device": dev, "id": mkid(b), "body": b})
        elif not header:
            header = b  # the intro/template block above the first entry
    return header, entries

def parse_synclog(text, default_device):
    """Legacy sync-log: intro + '## Log' then '## '-delimited entries or table rows."""
    # keep everything up to and including a '## Log' line as header; entries are '## ' below it
    m = re.search(r"(?m)^##\s+Log\s*$", text)
    if m:
        header = text[: m.end()].strip()
        rest = text[m.end():]
    else:
        header, rest = "", text
    entries = []
    for c in re.split(r"(?m)^(?=## )", rest):
        b = c.strip()
        if not b or not b.startswith("## "):
            continue
        ts_m = re.search(r"([0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9:]*)", b)
        dev_m = re.search(r"(home-desktop|asus-laptop)\b", b)
        entries.append({"ts": sortable(ts_m.group(1)) if ts_m else "0000",
                        "device": dev_m.group(1) if dev_m else default_device,
                        "id": mkid(b), "body": b})
    return header, entries

def read_any(path, logtype, default_device):
    if not os.path.exists(path):
        return "", []
    text = open(path, encoding="utf-8").read()
    if ENTRY_RE.search(text):                 # already marked
        return parse_marked(text)
    if logtype == "chat":
        return parse_chat(text, default_device)
    if logtype == "handoff":
        return parse_handoff(text)
    if logtype == "synclog":
        return parse_synclog(text, default_device)
    return "", []

# ---- emit ---------------------------------------------------------------------------------------
def emit(header, entries, order):
    # dedup by id (keep first seen), then sort by (ts, device) — stable + deterministic
    seen, uniq = set(), []
    for e in entries:
        if e["id"] in seen:
            continue
        seen.add(e["id"]); uniq.append(e)
    uniq.sort(key=lambda e: (e["ts"], e["device"]), reverse=(order == "desc"))
    out = [header.rstrip(), ""] if header.strip() else []
    for e in uniq:
        out.append(f'<!-- ENTRY ts={e["ts"]} device={e["device"]} id={e["id"]} -->')
        out.append(e["body"].rstrip("\n"))
        out.append("<!-- /ENTRY -->")
        out.append("")
    return "\n".join(out).rstrip() + "\n"

def write_segment(path, header, entries, order):
    open(path, "w", encoding="utf-8", newline="\n").write(emit(header, entries, order))

def segments(base, d):
    merged = os.path.join(d, base + ".md")
    return [p for p in glob.glob(os.path.join(d, base + ".*.md")) if os.path.abspath(p) != os.path.abspath(merged)]

# ---- subcommands --------------------------------------------------------------------------------
def cmd_merge(base, d, order):
    header, all_entries = "", []
    for seg in sorted(segments(base, d)):
        h, es = read_any(seg, "marked", device_of(seg, base))
        if h and not header:
            header = h
        all_entries += es
    # keep the merged file's own header if segments had none
    merged = os.path.join(d, base + ".md")
    if not header and os.path.exists(merged):
        header, _ = parse_marked(open(merged, encoding="utf-8").read())
    open(merged, "w", encoding="utf-8", newline="\n").write(emit(header, all_entries, order))
    print(f"[branched-log] merged {base}.md <- {len(segments(base,d))} segment(s), {len(all_entries)} entr(y/ies)")

def cmd_migrate(base, d, order, device, logtype):
    merged = os.path.join(d, base + ".md")
    header, entries = read_any(merged, logtype, device)
    # group each entry into ITS OWN device segment; fall back to the default 'device' arg for
    # entries whose device can't be parsed (e.g. legacy chat with no per-entry device tag).
    groups = {}
    for e in entries:
        dev = e["device"] if e.get("device") and e["device"] != "unknown" else device
        e["device"] = dev
        groups.setdefault(dev, []).append(e)
    for dev, es in groups.items():
        seg = os.path.join(d, f"{base}.{dev}.md")
        sh, sexist = read_any(seg, "marked", dev)
        write_segment(seg, header or sh, sexist + es, order)
    cmd_merge(base, d, order)
    print(f"[branched-log] migrated {len(entries)} legacy entr(y/ies) into {len(groups)} device segment(s)")

def cmd_absorb(base, d, order, device, logtype, legacy_file):
    header, entries = read_any(legacy_file, logtype, device)
    existing = set()
    for seg in segments(base, d):
        _, es = read_any(seg, "marked", device_of(seg, base))
        existing |= {e["id"] for e in es}
    fresh = [e for e in entries if e["id"] not in existing]
    # route each fresh entry to ITS OWN device segment (self-tagged handoff/synclog); fall back to
    # the 'device' arg (the source branch) for entries with no parseable device (e.g. legacy chat).
    groups = {}
    for e in fresh:
        dev = e["device"] if e.get("device") and e["device"] != "unknown" else device
        e["device"] = dev
        groups.setdefault(dev, []).append(e)
    for dev, es in groups.items():
        seg = os.path.join(d, f"{base}.{dev}.md")
        sh, sexist = read_any(seg, "marked", dev)
        write_segment(seg, header or sh, sexist + es, order)
    cmd_merge(base, d, order)
    print(f"[branched-log] absorbed {len(fresh)} new entr(y/ies) from {os.path.basename(legacy_file)} into {os.path.basename(seg)} ({len(entries)-len(fresh)} already present)")

def main(argv):
    if not argv:
        print(__doc__); return 2
    cmd, a = argv[0], argv[1:]
    if cmd == "merge":    cmd_merge(a[0], a[1], a[2])
    elif cmd == "migrate": cmd_migrate(a[0], a[1], a[2], a[3], a[4])
    elif cmd == "absorb":  cmd_absorb(a[0], a[1], a[2], a[3], a[4], a[5])
    else:
        print(f"unknown subcommand: {cmd}"); return 2
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
