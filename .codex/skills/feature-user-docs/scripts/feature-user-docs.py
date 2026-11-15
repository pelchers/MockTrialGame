#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
feature-user-docs.py — deterministic engine behind the `feature-user-docs` component.

Subcommands
-----------
  list-features                 List every feature that has an ADR and/or planning folder.
  scan <feature> [--write]      Discover + existence-verify every pertinent path for a feature and
                                emit the grouped `path-inventory.md` (stdout, or --write to the
                                feature's user-docs/ folder). --json for machine output.
  verify <feature|path>         Re-check every path cited by that feature's OVERVIEW.md (or an
                                explicit markdown file). Exit 1 if any cited path is dead.
  status [<feature>|--all]      Phase-completion fingerprint + map staleness, per feature.

Why a script: the reading map's one unforgivable failure is a dead path. Discovery and existence
checking are mechanical, so they are done here (repeatably, no model), leaving the model to write only
what it can actually do — the prose annotations.

Encoding: every read and write passes encoding='utf-8' explicitly. Python on Windows defaults `open()`
to cp1252, which mangles the em-dashes and arrows these docs are full of.

Usage:
  python .codex/skills/feature-user-docs/scripts/feature-user-docs.py scan f11 --write
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys

# --------------------------------------------------------------------------------------------------
# Repo layout
# --------------------------------------------------------------------------------------------------

ADR_ROOT = os.path.join(".adr", "orchestration")
PLANNING_ROOT = os.path.join(".docs", "planning")
USER_DOCS_DIRNAME = "user-docs"
OVERVIEW_NAME = "OVERVIEW.md"
INVENTORY_NAME = "path-inventory.md"

# The product subtree. The app lives ONLY here; everything the map points at under `apps/` or
# `packages/` resolves beneath it.
APP_SUBTREE = ""


def subtree_rel(p: str) -> str:
    """Prefix a subtree-relative path with the subtree name. Handles APP_SUBTREE = '' (app at root)."""
    p = p.replace("\\", "/")
    return f"{APP_SUBTREE}/{p}" if APP_SUBTREE else p

DOC_EXT = (".md",)
CODE_EXT = (".ts", ".tsx", ".js", ".mjs", ".sql", ".json", ".yml", ".yaml", ".css", ".html")

# Candidate app paths as they appear inside planning/ADR prose. Both bare (`apps/backend/...`) and
# subtree-prefixed (`CC/apps/backend/...`) spellings occur in the docs.
#
# Extension alternation is LONGEST-FIRST on purpose: `ts|tsx` would match the `.ts` of
# `Automations.tsx` and manufacture a dead path. Same trap for js/mjs and yml/yaml.
PATH_PATTERN = re.compile(
    r"(?:(?<![\w./-])(?:CC/)?)"
    r"((?:apps|packages|sql|scripts|\.app-docs)/"
    r"[A-Za-z0-9_@.\-/]*?"
    r"\.(?:tsx|ts|mjs|js|sql|jsonc|json|md|yaml|yml|css|html))"
    r"(?![A-Za-z0-9])"
)

# A bare `sql/…` or `scripts/…` in the docs is written relative to the backend app, not to the
# subtree root. Try each base in order and take the first that exists.
RESOLVE_BASES = ("", os.path.join("apps", "backend"))

# Directory mentions, e.g. `apps/backend/src/modules/email-campaigns/` — used to expand a module so
# sibling files the docs never named still get surfaced.
DIR_PATTERN = re.compile(
    r"(?:(?<![\w./-])(?:CC/)?)"
    r"((?:apps|packages)/[A-Za-z0-9_@.\-/]*?/)(?=[`\s,)\]]|$)"
)

# Phase completion markers, as actually used in this repo's primary_task_list.md files. Three
# spellings occur in the wild and all three count:
#   1. a leading blockquote      > **STATUS: DONE (2026-10-05) — ...**
#   2. a metadata line           Status:  complete          (bare, or inside the ``` header fence)
#   3. a filled-in `## Outcome`  ## Outcome (2026-10-04)
STATUS_DONE = re.compile(
    r"^>\s*\*\*STATUS:\s*(?:(?:CORE|BACKEND|PARTIAL|FULLY)\s+)?(?:DONE|COMPLETE)\b",
    re.IGNORECASE,
)
STATUS_ANY = re.compile(r"^>\s*\*\*STATUS:\s*(.+?)(?:\*\*|\s+—|$)", re.IGNORECASE)
# Anchored at the start of the value so `in_progress (phases 01-07 complete...)` does NOT match.
META_STATUS_DONE = re.compile(r"^\s*Status:\s*\*{0,2}(?:complete|done)\b", re.IGNORECASE)
META_STATUS_ANY = re.compile(r"^\s*Status:\s*\*{0,2}([^*\n]+?)\*{0,2}\s*\.?\s*$", re.IGNORECASE)
OUTCOME_HEADING = re.compile(r"^##\s+Outcome\s*(\(([^)]*)\))?\s*$", re.IGNORECASE)
OUTCOME_PLACEHOLDER = re.compile(r"_\(\s*filled in on completion", re.IGNORECASE)

# A mentioned module directory is expanded (siblings surfaced) only when it is small enough to be
# "this feature's own module". A 70-file pre-existing module is NOT this feature's surface area, so
# expanding it would bury the map. Cited files from such a dir still appear individually.
DEFAULT_EXPAND_CAP = 30

# Paths cited inside an OVERVIEW.md, for `verify`. Windows-absolute and repo-relative, in backticks.
CITED_ABS = re.compile(r"`([A-Za-z]:\\[^`\n]+)`")
CITED_REL = re.compile(r"`((?:\.adr|\.docs|\.claude|\.codex|CC)[/\\][^`\n]+)`")


# --------------------------------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------------------------------


def read_text(path: str) -> str:
    """Read UTF-8, never explode on a stray byte."""
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            return fh.read()
    except OSError:
        return ""


def write_text(path: str, text: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)


def find_repo_root(start: str | None = None) -> str:
    """
    Walk up from this script until a dir holding .adr/ plus a provider dir is found.

    Provider-agnostic on purpose: the identical script is mirrored into both .codex/ and .codex/,
    and either copy must resolve the same root.
    """
    cur = os.path.abspath(start or os.path.dirname(os.path.abspath(__file__)))
    while True:
        has_provider = os.path.isdir(os.path.join(cur, ".claude")) or os.path.isdir(
            os.path.join(cur, ".codex")
        )
        if has_provider and os.path.isdir(os.path.join(cur, ".adr")):
            return cur
        parent = os.path.dirname(cur)
        if parent == cur:
            return os.path.abspath(start or os.getcwd())
        cur = parent


def rel(root: str, path: str) -> str:
    return os.path.relpath(path, root).replace("\\", "/")


def win(root: str, relpath: str) -> str:
    """Full path in this machine's native spelling — what a reader pastes into an editor."""
    return os.path.normpath(os.path.join(root, relpath))


def list_features(root: str) -> list[str]:
    names: set[str] = set()
    for base in (ADR_ROOT, PLANNING_ROOT):
        d = os.path.join(root, base)
        if not os.path.isdir(d):
            continue
        for entry in os.listdir(d):
            full = os.path.join(d, entry)
            if not os.path.isdir(full):
                continue
            # A feature folder is <id>@<owner>; the planning tree also holds non-feature dirs.
            if "@" in entry:
                names.add(entry)
    return sorted(names)


def resolve_feature(root: str, token: str) -> str:
    """Accept an exact id or a fuzzy prefix ('f11'). Ambiguity is an error, not a guess."""
    features = list_features(root)
    if token in features:
        return token
    low = token.lower()
    exact_prefix = [f for f in features if f.lower().startswith(low + "-") or f.lower().startswith(low + "@")]
    if len(exact_prefix) == 1:
        return exact_prefix[0]
    loose = [f for f in features if low in f.lower()]
    if len(loose) == 1:
        return loose[0]
    cands = exact_prefix or loose
    if not cands:
        raise SystemExit(f"ERROR: no feature matches '{token}'. Known: {', '.join(features)}")
    raise SystemExit(f"ERROR: '{token}' is ambiguous — matches: {', '.join(cands)}")


def feature_dirs(root: str, feature: str) -> tuple[str, str]:
    return (
        os.path.join(root, ADR_ROOT, feature),
        os.path.join(root, PLANNING_ROOT, feature),
    )


def user_docs_dir(root: str, feature: str) -> str:
    """The HOME of the reading map: the planning tree (human-facing docs)."""
    return os.path.join(root, PLANNING_ROOT, feature, USER_DOCS_DIRNAME)


# --------------------------------------------------------------------------------------------------
# Phase completion
# --------------------------------------------------------------------------------------------------


def phase_status(task_list_path: str) -> dict:
    """Classify one primary_task_list.md. Returns {complete: bool, marker: str, reason: str}."""
    text = read_text(task_list_path)
    if not text:
        return {"complete": False, "marker": "", "reason": "unreadable"}
    lines = text.splitlines()

    head = lines[:24]

    marker = ""
    for line in head:
        m = STATUS_ANY.match(line)
        if m:
            marker = m.group(1).strip().rstrip("*.").strip()
            break
    if not marker:
        for line in head:
            m = META_STATUS_ANY.match(line)
            if m:
                marker = m.group(1).strip()
                break

    for line in lines[:6]:
        if STATUS_DONE.match(line):
            return {"complete": True, "marker": marker, "reason": "STATUS blockquote"}

    for line in head:
        if META_STATUS_DONE.match(line):
            return {"complete": True, "marker": marker or "complete", "reason": "Status metadata line"}

    # Outcome section filled in?
    for idx, line in enumerate(lines):
        m = OUTCOME_HEADING.match(line)
        if not m:
            continue
        dated = bool(m.group(2) and m.group(2).strip())
        body = "\n".join(lines[idx + 1: idx + 8]).strip()
        placeholder = bool(OUTCOME_PLACEHOLDER.search(body))
        if dated and not placeholder:
            return {"complete": True, "marker": marker or "outcome-dated", "reason": "Outcome dated"}
        if body and not placeholder:
            return {"complete": True, "marker": marker or "outcome-filled", "reason": "Outcome filled"}
        break

    return {"complete": False, "marker": marker, "reason": "no completion marker"}


def feature_phase_status(root: str, feature: str) -> list[dict]:
    """Every primary_task_list.md under the feature's ADR folder, classified."""
    adr_dir, _ = feature_dirs(root, feature)
    out: list[dict] = []
    if not os.path.isdir(adr_dir):
        return out
    for dirpath, dirnames, filenames in os.walk(adr_dir):
        dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules", USER_DOCS_DIRNAME)]
        if "primary_task_list.md" not in filenames:
            continue
        full = os.path.join(dirpath, "primary_task_list.md")
        st = phase_status(full)
        st["path"] = rel(root, full)
        st["phase"] = rel(root, dirpath).split("/")[-1]
        st["is_root"] = os.path.normpath(dirpath) == os.path.normpath(adr_dir)
        out.append(st)
    return sorted(out, key=lambda r: r["path"])


def completion_fingerprint(root: str, feature: str) -> str:
    rows = [r["path"] for r in feature_phase_status(root, feature) if r["complete"]]
    return "|".join(sorted(rows))


# --------------------------------------------------------------------------------------------------
# Discovery
# --------------------------------------------------------------------------------------------------


def classify(relpath: str) -> str:
    """Bucket a verified app path into a reading-map group."""
    p = relpath.replace("\\", "/")
    base = os.path.basename(p)

    if base.endswith((".spec.ts", ".spec.tsx", ".test.ts", ".test.tsx")):
        return "tests"
    if "/.app-docs/" in p or p.startswith(".app-docs/"):
        return "conventions"
    if "/sql/" in p or base.startswith("add_") and base.endswith(".sql"):
        return "schema"
    if "/src/db/" in p:
        return "schema"
    if "/scripts/ensure-" in p:
        return "schema"
    if "/apps/admin-panel/" in p:
        return "admin_ui"
    if "/apps/listing/" in p:
        return "storefront"
    if "/src/config/" in p or base in ("index.ts", "package.json") or "/src/scheduler/" in p:
        return "wiring"
    if "/src/modules/" in p:
        return "backend"
    if "/packages/" in p:
        return "backend"
    return "other"


def discover_app_paths(
    root: str, doc_files: list[str], expand_cap: int = DEFAULT_EXPAND_CAP
) -> tuple[dict[str, list[str]], list[dict], list[dict]]:
    """
    Extract app-subtree paths mentioned across the feature's docs, expand mentioned module dirs that
    are small enough to be this feature's own surface, and stat everything.

    Returns (grouped_verified, records, skipped_dirs).
    """
    mentions: dict[str, set[str]] = {}
    dir_mentions: dict[str, set[str]] = {}
    stems: set[str] = set()

    for doc in doc_files:
        text = read_text(doc)
        if not text:
            continue
        citer = rel(root, doc)
        for m in PATH_PATTERN.finditer(text):
            mentions.setdefault(m.group(1), set()).add(citer)
        for m in DIR_PATTERN.finditer(text):
            d = m.group(1)
            # Only expand real leaf-ish module dirs, not `apps/` or `apps/backend/`.
            if d.count("/") >= 3:
                dir_mentions.setdefault(d, set()).add(citer)

    # Expand mentioned directories that actually exist (surfaces undocumented siblings), but only
    # when the directory is small enough to plausibly BE this feature's module. A large pre-existing
    # module is recorded as skipped instead, so the agent knows to read it selectively.
    skipped_dirs: list[dict] = []
    for d, citers in sorted(dir_mentions.items()):
        abs_d = os.path.join(root, APP_SUBTREE, d.replace("/", os.sep))
        if not os.path.isdir(abs_d):
            continue
        entries = [
            e
            for e in sorted(os.listdir(abs_d))
            if e.endswith(CODE_EXT) and os.path.isfile(os.path.join(abs_d, e))
        ]
        if len(entries) > expand_cap:
            cited_here = sum(1 for p in mentions if p.startswith(d))
            skipped_dirs.append(
                {
                    "dir": subtree_rel(d),
                    "abs": os.path.normpath(abs_d),
                    "files": len(entries),
                    "cited": cited_here,
                    "reason": f"{len(entries)} files > expand cap {expand_cap} — pre-existing module, not this feature's own",
                }
            )
            continue
        for entry in entries:
            mentions.setdefault(d + entry, set()).update(citers | {f"(dir expansion of {d})"})
        if "/modules/" in d or "/features/" in d:
            stems.add(d.rstrip("/").rsplit("/", 1)[-1])

    # --- stem probe -------------------------------------------------------------------------------
    # A feature's own surface area is spread across apps by NAMING CONVENTION, not by directory:
    # the module `email-campaigns/` has a sibling `email-campaigns-api.ts`, a
    # `use-email-campaigns-mutations.ts`, an `email-campaigns-schema.ts`, an
    # `add_email_campaigns.sql`. Those live in directories far too large to expand, and the docs
    # often name only some of them. So: take the feature's own module stems and sweep the app
    # subtree for any file whose BASENAME carries that stem. High precision, and it is the only way
    # the map reaches the hook/API/schema files a doc forgot to mention.
    for p in list(mentions):
        base = os.path.basename(p)
        if base.startswith("add_") and base.endswith(".sql"):
            stems.add(base[4:-4])
        if base.startswith("ensure-") and base.endswith(".ts"):
            stems.add(base[7:-3])

    stems = {s for s in stems if len(s) >= 6}
    if stems:
        app_root = os.path.join(root, APP_SUBTREE)
        skip = {"node_modules", "dist", "build", ".git", ".turbo", "coverage", ".next", "out"}
        for dirpath, dirnames, filenames in os.walk(app_root):
            dirnames[:] = [d for d in dirnames if d not in skip]
            for fn in filenames:
                if not fn.endswith(CODE_EXT):
                    continue
                stem_hit = next((s for s in stems if s in fn), None)
                if stem_hit is None:
                    continue
                relp = rel(app_root, os.path.join(dirpath, fn))
                mentions.setdefault(relp, set()).add(f"(stem probe '{stem_hit}')")

    records: list[dict] = []
    seen: set[str] = set()
    for p in sorted(mentions):
        # Resolve against each candidate base; first hit wins, else fall back to the bare spelling
        # so the path is still reported as MISSING rather than silently dropped.
        resolved_rel = None
        abs_p = None
        for base in RESOLVE_BASES:
            cand_rel = os.path.join(base, p.replace("/", os.sep)) if base else p.replace("/", os.sep)
            cand_abs = os.path.join(root, APP_SUBTREE, cand_rel)
            if os.path.isfile(cand_abs):
                resolved_rel, abs_p = cand_rel, cand_abs
                break
        if resolved_rel is None:
            resolved_rel = p.replace("/", os.sep)
            abs_p = os.path.join(root, APP_SUBTREE, resolved_rel)

        display = subtree_rel(resolved_rel)
        if display in seen:
            continue
        seen.add(display)
        records.append(
            {
                "path": display,
                "abs": os.path.normpath(abs_p),
                "exists": os.path.isfile(abs_p),
                "cited_by": sorted(mentions[p]),
                "group": classify(display),
            }
        )

    grouped: dict[str, list[str]] = {}
    for r in records:
        if r["exists"]:
            grouped.setdefault(r["group"], []).append(r["path"])
    return grouped, records, skipped_dirs


def discover_feature_docs(root: str, feature: str) -> dict:
    """Walk the ADR + planning folders. Returns docs, evidence files, and counts."""
    adr_dir, plan_dir = feature_dirs(root, feature)
    adr_docs: list[str] = []
    plan_docs: list[str] = []
    evidence: list[str] = []

    for base, bucket in ((adr_dir, adr_docs), (plan_dir, plan_docs)):
        if not os.path.isdir(base):
            continue
        for dirpath, dirnames, filenames in os.walk(base):
            dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules")]
            for fn in sorted(filenames):
                full = os.path.join(dirpath, fn)
                if fn.endswith(DOC_EXT):
                    # The map itself is not input to the map.
                    if os.path.basename(dirpath) == USER_DOCS_DIRNAME:
                        continue
                    bucket.append(full)
                elif fn.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".html")):
                    evidence.append(full)

    return {
        "adr_dir": adr_dir if os.path.isdir(adr_dir) else None,
        "plan_dir": plan_dir if os.path.isdir(plan_dir) else None,
        "adr_docs": adr_docs,
        "plan_docs": plan_docs,
        "evidence": evidence,
    }


GROUP_TITLES = [
    ("backend", "Backend module"),
    ("admin_ui", "Admin UI"),
    ("storefront", "Storefront UI"),
    ("schema", "Schema + migrations"),
    ("wiring", "Wiring + config"),
    ("tests", "Tests"),
    ("conventions", "Conventions + runbooks (product subtree)"),
    ("other", "Other app paths"),
]


def build_inventory(root: str, feature: str, expand_cap: int = DEFAULT_EXPAND_CAP) -> dict:
    docs = discover_feature_docs(root, feature)
    all_docs = docs["adr_docs"] + docs["plan_docs"]
    grouped, records, skipped = discover_app_paths(root, all_docs, expand_cap)
    phases = feature_phase_status(root, feature)
    return {
        "feature": feature,
        "repo_root": root,
        "user_docs_home": rel(root, user_docs_dir(root, feature)),
        "docs": docs,
        "grouped": grouped,
        "records": records,
        "skipped_dirs": skipped,
        "phases": phases,
        "verified": [r for r in records if r["exists"]],
        "missing": [r for r in records if not r["exists"]],
    }


def render_inventory(inv: dict) -> str:
    root = inv["repo_root"]
    feature = inv["feature"]
    docs = inv["docs"]
    lines: list[str] = []
    A = lines.append

    A(f"# Path inventory — {feature}")
    A("")
    A("> **GENERATED FILE — do not hand-edit.**")
    A("> Produced by `.codex/skills/feature-user-docs/scripts/feature-user-docs.py scan`.")
    A("> It is the raw material for `OVERVIEW.md` and the staleness detector behind it:")
    A("> every path below was `stat`-ed at generation time. `OVERVIEW.md` is the human-facing map;")
    A("> this file is the machine-checked path ledger.")
    A("")
    A(f"- Repo root: `{os.path.normpath(root)}`")
    A(f"- Reading map home: `{inv['user_docs_home']}`")
    A(f"- Verified app paths: **{len(inv['verified'])}** · mentioned-but-absent: **{len(inv['missing'])}**")
    A("")

    # Phase status
    A("## ADR phase status")
    A("")
    if inv["phases"]:
        A("| Phase | Complete | Marker | Signal | Task list |")
        A("|---|---|---|---|---|")
        for p in inv["phases"]:
            tag = "yes" if p["complete"] else "no"
            label = "(feature root)" if p["is_root"] else p["phase"]
            A(f"| {label} | {tag} | {p['marker'] or '-'} | {p['reason']} | `{p['path']}` |")
    else:
        A("_No `primary_task_list.md` found under this feature's ADR folder._")
    A("")

    # Verified app paths by group
    A("## Verified app paths (grouped)")
    A("")
    any_group = False
    for key, title in GROUP_TITLES:
        paths = sorted(inv["grouped"].get(key, []))
        if not paths:
            continue
        any_group = True
        A(f"### {title} ({len(paths)})")
        A("")
        for p in paths:
            A(f"- `{win(root, p)}`")
            A(f"  - repo-relative: `{p}`")
        A("")
    if not any_group:
        A("_No app paths were discovered from this feature's docs._")
        A("")

    # Large pre-existing modules — named, not expanded
    if inv.get("skipped_dirs"):
        A("## Large modules touched but NOT expanded")
        A("")
        A("These directories are referenced by the feature but are too large to be this feature's own")
        A("surface area. Only the files the docs actually name appear above. Read these selectively.")
        A("")
        A("| Directory | Files | Cited by this feature | Full path |")
        A("|---|---|---|---|")
        for s in inv["skipped_dirs"]:
            A(f"| `{s['dir']}` | {s['files']} | {s['cited']} | `{s['abs']}` |")
        A("")

    # Feature docs
    A("## Feature docs")
    A("")
    A(f"### ADR record ({len(docs['adr_docs'])} markdown files)")
    A("")
    if docs["adr_dir"]:
        A(f"- Folder: `{os.path.normpath(docs['adr_dir'])}`")
        for d in docs["adr_docs"]:
            A(f"- `{rel(root, d)}`")
    else:
        A("_No ADR folder for this feature._")
    A("")
    A(f"### Planning docs ({len(docs['plan_docs'])} markdown files)")
    A("")
    if docs["plan_dir"]:
        A(f"- Folder: `{os.path.normpath(docs['plan_dir'])}`")
        for d in docs["plan_docs"]:
            A(f"- `{rel(root, d)}`")
    else:
        A("_No planning folder for this feature._")
    A("")

    # Evidence
    A(f"## Evidence artifacts ({len(docs['evidence'])})")
    A("")
    if docs["evidence"]:
        dirs: dict[str, int] = {}
        for e in docs["evidence"]:
            dirs[rel(root, os.path.dirname(e))] = dirs.get(rel(root, os.path.dirname(e)), 0) + 1
        for d in sorted(dirs):
            A(f"- `{win(root, d)}` — {dirs[d]} file(s)")
            A(f"  - repo-relative: `{d}`")
    else:
        A("_No screenshots / rendered evidence found._")
    A("")

    # Missing
    A("## Mentioned but NOT verified")
    A("")
    if inv["missing"]:
        A("These paths are named in the feature's docs but do **not** exist on disk. They must NOT be")
        A("written into `OVERVIEW.md` as live paths — report them instead.")
        A("")
        A("| Path | Named in |")
        A("|---|---|")
        for r in inv["missing"]:
            A(f"| `{r['path']}` | {', '.join(f'`{c}`' for c in r['cited_by'][:3])} |")
    else:
        A("_None — every app path named in this feature's docs exists on disk._")
    A("")
    return "\n".join(lines) + "\n"


# --------------------------------------------------------------------------------------------------
# Verify
# --------------------------------------------------------------------------------------------------


def verify_overview(root: str, overview_path: str) -> dict:
    text = read_text(overview_path)
    if not text:
        return {"path": overview_path, "ok": False, "error": "missing or empty", "dead": [], "checked": 0}

    # Ignore anything under the "deliberately not included" / "not verified" sections — those are
    # supposed to name things that are absent.
    cut = re.split(r"^##\s+(?:Deliberately not included|Mentioned but not verified)", text, flags=re.M)
    body = cut[0]

    dead: list[str] = []
    checked = 0

    for m in CITED_ABS.finditer(body):
        raw = m.group(1).strip()
        checked += 1
        if not os.path.exists(raw):
            dead.append(raw)

    for m in CITED_REL.finditer(body):
        raw = m.group(1).strip().replace("\\", "/")
        checked += 1
        if not os.path.exists(os.path.join(root, raw.replace("/", os.sep))):
            dead.append(raw)

    return {"path": overview_path, "ok": not dead, "error": None, "dead": dead, "checked": checked}


# --------------------------------------------------------------------------------------------------
# Commands
# --------------------------------------------------------------------------------------------------


def cmd_list_features(args, root: str) -> int:
    feats = list_features(root)
    if args.json:
        print(json.dumps(feats, indent=2))
        return 0
    for f in feats:
        adr, plan = feature_dirs(root, f)
        marks = []
        if os.path.isdir(adr):
            marks.append("adr")
        if os.path.isdir(plan):
            marks.append("planning")
        has_map = os.path.isfile(os.path.join(user_docs_dir(root, f), OVERVIEW_NAME))
        print(f"{f}  [{'+'.join(marks)}]  user-docs:{'yes' if has_map else 'NO'}")
    return 0


def cmd_scan(args, root: str) -> int:
    feature = resolve_feature(root, args.feature)
    inv = build_inventory(root, feature, expand_cap=args.expand_cap)
    if args.json:
        payload = {k: v for k, v in inv.items() if k != "docs"}
        payload["docs"] = {
            "adr_docs": [rel(root, d) for d in inv["docs"]["adr_docs"]],
            "plan_docs": [rel(root, d) for d in inv["docs"]["plan_docs"]],
            "evidence": [rel(root, d) for d in inv["docs"]["evidence"]],
        }
        print(json.dumps(payload, indent=2))
        return 0

    rendered = render_inventory(inv)
    if args.write:
        target = os.path.join(user_docs_dir(root, feature), INVENTORY_NAME)
        write_text(target, rendered)
        print(f"WROTE {rel(root, target)}")
        print(
            f"  verified={len(inv['verified'])} missing={len(inv['missing'])} "
            f"phases_complete={sum(1 for p in inv['phases'] if p['complete'])}/{len(inv['phases'])}"
        )
        if inv["missing"]:
            print("  MENTIONED-BUT-ABSENT (do not put these in OVERVIEW.md as live paths):")
            for r in inv["missing"]:
                print(f"    - {r['path']}")
        return 0

    sys.stdout.write(rendered)
    return 0


def cmd_verify(args, root: str) -> int:
    targets: list[tuple[str, str]] = []
    if args.target in ("--all", "all"):
        for f in list_features(root):
            ov = os.path.join(user_docs_dir(root, f), OVERVIEW_NAME)
            if os.path.isfile(ov):
                targets.append((f, ov))
    elif args.target.lower().endswith(".md"):
        targets.append(("(explicit)", os.path.abspath(args.target)))
    else:
        f = resolve_feature(root, args.target)
        targets.append((f, os.path.join(user_docs_dir(root, f), OVERVIEW_NAME)))

    if not targets:
        print("No OVERVIEW.md found to verify.")
        return 0

    bad = 0
    for feature, path in targets:
        res = verify_overview(root, path)
        if res["error"]:
            print(f"FAIL {feature}: {res['error']} — {rel(root, path)}")
            bad += 1
            continue
        if res["ok"]:
            print(f"OK   {feature}: {res['checked']} cited path(s), 0 dead — {rel(root, path)}")
        else:
            bad += 1
            print(f"FAIL {feature}: {len(res['dead'])} DEAD of {res['checked']} cited — {rel(root, path)}")
            for d in res["dead"]:
                print(f"       dead: {d}")
    return 1 if bad else 0


def cmd_status(args, root: str) -> int:
    feats = list_features(root) if (args.feature in (None, "--all", "all")) else [resolve_feature(root, args.feature)]
    rows = []
    for f in feats:
        phases = feature_phase_status(root, f)
        done = sum(1 for p in phases if p["complete"])
        ov = os.path.join(user_docs_dir(root, f), OVERVIEW_NAME)
        inv = os.path.join(user_docs_dir(root, f), INVENTORY_NAME)
        has_ov = os.path.isfile(ov)
        stale = False
        if has_ov and os.path.isfile(inv):
            stale = os.path.getmtime(inv) > os.path.getmtime(ov) + 1
        rows.append(
            {
                "feature": f,
                "phases": len(phases),
                "complete": done,
                "overview": has_ov,
                "inventory": os.path.isfile(inv),
                "overview_stale": stale,
            }
        )

    if args.json:
        print(json.dumps(rows, indent=2))
        return 0

    print(f"{'feature':62} {'phases':>7} {'done':>5}  overview  stale")
    for r in rows:
        print(
            f"{r['feature']:62} {r['phases']:>7} {r['complete']:>5}  "
            f"{'yes' if r['overview'] else 'NO ':8}  {'YES' if r['overview_stale'] else '-'}"
        )
    missing = [r['feature'] for r in rows if r['complete'] > 0 and not r['overview']]
    if missing:
        print("")
        print("Features with completed phases but NO reading map:")
        for m in missing:
            print(f"  - {m}   → /feature-user-docs {m}")
    return 0


def main(argv: list[str] | None = None) -> int:
    # Windows consoles default to cp1252; these docs are full of em-dashes and arrows. Force UTF-8
    # on stdout/stderr so printed output is not mojibake (file writes already pass encoding).
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

    ap = argparse.ArgumentParser(prog="feature-user-docs", description=__doc__)
    ap.add_argument("--repo-root", default=None, help="repo root (default: auto-detect)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("list-features")
    p.add_argument("--json", action="store_true")
    p.set_defaults(fn=cmd_list_features)

    p = sub.add_parser("scan")
    p.add_argument("feature")
    p.add_argument("--write", action="store_true", help="write path-inventory.md into the feature's user-docs/")
    p.add_argument("--json", action="store_true")
    p.add_argument(
        "--expand-cap",
        type=int,
        default=DEFAULT_EXPAND_CAP,
        help=f"max files in a mentioned dir before sibling expansion is skipped (default {DEFAULT_EXPAND_CAP})",
    )
    p.set_defaults(fn=cmd_scan)

    p = sub.add_parser("verify")
    p.add_argument("target", help="feature id, --all, or a path to a markdown file")
    p.set_defaults(fn=cmd_verify)

    p = sub.add_parser("status")
    p.add_argument("feature", nargs="?", default="--all")
    p.add_argument("--json", action="store_true")
    p.set_defaults(fn=cmd_status)

    args = ap.parse_args(argv)
    root = os.path.abspath(args.repo_root) if args.repo_root else find_repo_root()
    return args.fn(args, root)


if __name__ == "__main__":
    sys.exit(main())
