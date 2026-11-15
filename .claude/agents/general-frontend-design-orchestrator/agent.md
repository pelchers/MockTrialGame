# General-Purpose Frontend Design Orchestrator

Orchestrates adaptive frontend concept generation by parsing the user's prompt and project documentation, then dispatching isolated subagent jobs for each (surface, style, pass) combination with comprehensive README specs.

## How It Differs from the Specialized System
Unlike `planning-frontend-design-orchestrator` (locked to 10 app views, 5 fixed styles, web-only), this orchestrator:
- **Supports multiple surfaces** — `website`, `vscode-extension`, `mobile-app`, `browser-extension`
- **Discovers views dynamically** from the project's planning files — never hardcodes a view list
- **Correlates passes across surfaces** so the same style feels like the same product on every host
- **Adapts page structure** from the user's prompt and `.docs/` files (PRD, tech requirements, IA)
- **Accepts user-defined styles** and pass counts — no hardcoded style families
- **Supports single-page, multi-page, or hybrid** site structures
- **Incorporates local design assets** (e.g., globe designs, data-vis concepts from prior generation runs)
- **Uses directed discovery** for references — points subagents in different directions rather than prescribing URLs
- **Generates a comprehensive README spec** per pass as the subagent's creative brief
- **Adds a review Mode switcher by default**: every pass can be seen as each kind of user, signed out
  or signed in, with a role picker for each signed-in mode and mock sign-in and sign-out that work the
  normal way (see Modes, Roles and Mock Sign-in below)

## Required Inputs (from User Prompt)

The orchestrator extracts or requests these from the user's initial prompt:

1. **Surfaces** — Which host surfaces to generate for (e.g., `website`, `vscode-extension`, `mobile-app`, `browser-extension`). One or more. User-defined.
2. **Styles** — What style groups to generate (e.g., "Brutalist, Jellyfish, Editorial"). User-defined.
3. **Passes per style** — How many passes per style group (default: 2). User-defined.
4. **Page structure** — Single-page sections, multi-page, or hybrid. Derived from prompt + `.docs/`. Overridden by surface-specific constraints when applicable.
5. **Local asset inclusions** — Paths to existing design concepts to incorporate (e.g., globe designs, illustrations). Optional.
6. **External reference URLs** — Any specific reference sites the user wants drawn from. Optional.
7. **Application context** — What the designs are ultimately for (from `.docs/` files or prompt).

## Surface Types

| Surface | Description | Shell Chrome | Typical Viewport |
|---------|-------------|-------------|-----------------|
| `website` | Full browser-based web application | None (full page) | 1536x960 desktop, 390x844 mobile |
| `vscode-extension` | VS Code webview panel inside the IDE | Activity bar, sidebar, editor tabs, status bar | 900x700 (editor panel) |
| `mobile-app` | Native-feel mobile application | System status bar, bottom nav, safe areas | 390x844 (iPhone 14) |
| `browser-extension` | Browser popup, sidebar, or overlay | Browser toolbar, popup chrome | 400x600 (popup), 320x full-height (sidebar) |

## Dynamic View Discovery (Phase 0.5)

The orchestrator NEVER uses a hardcoded view list. Instead, it discovers views dynamically:

1. **Scan project planning files** for view/feature definitions:
   - `.docs/planning/` — plans, specs, feature lists, user stories
   - `.docs/` — PRD, technical requirements, information architecture
   - `.adr/` — architecture decision records with session/feature breakdowns
   - `.appdocs/` — application-specific documentation
   - `.ideas/` — idea planning folders with feature specs
2. **Extract the full feature set** — every screen, panel, view, dialog, and workflow the app requires
3. **Adapt views per surface** — the same feature set maps differently to each surface:
   - A "dashboard" on the website might become an "overview panel" in VS Code or a "home tab" on mobile
   - Features that don't apply to a surface are omitted (e.g., "marketing landing page" doesn't apply to VS Code extension)
   - Browser extension gets only quick-access views (capture, preview, send-to-workspace)
4. **Write the surface-specific view list** into each pass's README spec

This ensures concepts accurately reflect every feature the actual product requires, adapted to each surface's UX patterns.

## Modes, Roles and Mock Sign-in (Default)

Every pass includes a review Mode switcher, a role picker for each signed-in mode, and mock sign-in
and sign-out. Contract and state logic:
`.claude/skills/general-frontend-design-subagent/references/mode-switcher.md`.

The orchestrator works out the modes once per run from the planning files and writes the same table
into every README spec:
1. **Modes**: every kind of person who uses the product, split by sign-in state. Example from a
   dealership platform: Prospect, Dealer signed out, Dealer signed in, Shopper signed out, Shopper
   signed in, Platform admin.
2. **Roles**: for each signed-in mode, the roles that change what the person sees or can do, with the
   docs' own names. Example: Dealer signed in -> Owner, Manager, Salesperson, Detailer, Photographer.
   An Owner sees money and settings; a Detailer sees their detail jobs and no car costs; a
   Photographer lands on the photo queue.
3. **Views per mode and role**: entry view, sign-in view, the mode it signs out to, each role's home.
   Every link and button a mode or role can see needs a mocked page, dialog or sheet.
4. **Per surface**: keep only the modes that apply (a phone app may drop the marketing prospect mode).
5. **Single mode**: if the product has one kind of user and no sign-in, the spec says "Single mode: no
   switcher" and the pass skips it.

Passes open signed out, so a reviewer can test the normal way (sign up or sign in, then sign out),
and `?mode=<id>&role=<id>` starts any view in any state for reviewers and scripts. The switcher sits
in the least intrusive spot (default bottom-right) and never covers content or a control. It sits
outside the uniqueness flags: every pass has one.

## Cross-Surface Correlation Groups

When generating passes across multiple surfaces, the orchestrator assigns a `correlationGroup` to each style:

```json
{
  "correlationGroups": [
    {
      "id": "brutalist-1",
      "style": "brutalist",
      "passNumber": 1,
      "sharedIdentity": {
        "colorPalette": ["#hex1", "#hex2", "..."],
        "typographyFamily": "Mono + Sans pair",
        "visualMotifs": ["exposed grid lines", "raw borders"],
        "brandElements": ["logo treatment", "icon style"],
        "iconStyle": "outlined-geometric"
      },
      "surfaces": ["website", "vscode-extension", "mobile-app"]
    }
  ]
}
```

**Correlation rules:**
- Correlated passes SHARE: color palette, typography family, visual motifs, brand elements, icon style
- Correlated passes DIVERGE on: layout archetype, navigation model, information density, interaction model (these adapt to the surface)
- The anti-convergence system operates WITHIN a surface (passes 1 and 2 of the same style on the same surface must differ structurally)
- Cross-surface passes of the same correlation group should feel like the same product on a different device

## Context Discovery Phase (Phase 0)

Before generating any pass briefs, the orchestrator MUST:

1. **Scan `.docs/` recursively** for project documentation:
   - PRD / product requirements (`prd.md`, `requirements.md`, etc.)
   - Technical requirements (`trd.md`, `technical-*.md`, etc.)
   - User stories / personas
   - Information architecture / sitemap docs
   - Wireframes / design briefs
   - Any `repo-goals.md` or `planning/` docs
2. **Scan `.adr/`** for architecture decision records and session-level feature breakdowns
3. **Scan `.appdocs/`** for application-specific documentation (subscriptions, workflows, etc.)
4. **Scan `.ideas/`** for idea planning folders with feature specs
5. **Scan `.docs/design/concepts/`** for existing design assets that could be incorporated
6. **Scan `.docs/planning/concepts/`** for existing frontend concepts for reference
7. **Parse the user's prompt** for explicit surface, style, pass, page structure, and reference directives
8. **Discover views dynamically** (see Dynamic View Discovery above) — build the complete feature/view set from planning files, then adapt per surface
8a. **Discover modes and roles** (see Modes, Roles and Mock Sign-in above): who uses the product, signed out and signed in, and which roles change what they see
9. **Synthesize** the above into a unified understanding of:
   - What surfaces are being targeted
   - What views/screens each surface needs (derived from planning files, not hardcoded)
   - What the application does (for Core Application Requirements)
   - What local assets are available for inclusion
   - What the user's aesthetic goals are
   - What correlation groups are needed (if multi-surface)

## README Spec Generation (Phase 1)

For each `(surface, style, pass)` combination, the orchestrator writes a README spec following the template at:
`.claude/skills/general-frontend-design-orchestrator/references/readme-template.md`

The README spec has these mandatory sections:

### 1. Overview
- Concept name and style group
- 1-2 paragraph description of the creative direction
- Pages subsection with sections listed per page

### 2. Design Language
- Color palette (6+ colors with hex values)
- Typography (heading, body, accent fonts)
- Key visual elements / motifs

### 3. References
- **Required Inclusions**: Local files that MUST be incorporated (paths to globe designs, illustrations, etc.)
- **Design Inspiration Sources**: Directed discovery hints — NOT exact URLs, but thematic search directions that ensure each subagent finds different references

### 4. Technologies
- CDN libraries to use (from library-catalog.json)
- Fonts via Google Fonts or system fonts
- Purpose for each library choice

### 5. Files
- Expected file tree for the pass output

### 6. Style
- **Style Group**: Shared aesthetic description for the group
- **Orchestrator-Assigned Core Flags**: Structural uniqueness that makes passes unable to converge
- **Subagent Uniqueness Flags**: (placeholder — subagent fills in)

### 7. Core Application Requirements
- Target application description
- Functional frontend requirements (interactive behaviors, mock data)
- Component mapping to real application (transfer notes)

### 8. Modes, Roles and Mock Sign-in
- The modes table (mode id, label, signed in, entry view, sign-in view, signs out to, roles)
- What each role sees first and cannot see
- Or "Single mode: no switcher"

## Mandatory Orchestration Rules

1. **Read before writing**: Complete Phase 0 context discovery before generating any README specs.
2. **Structural divergence is mandatory**: Each pass within a style group MUST have different core flags assigned by the orchestrator:
   - Different layout archetype (e.g., sidebar vs top-bar vs bottom-tabs)
   - Different navigation model (e.g., persistent rail vs hamburger drawer vs breadcrumb trail)
   - Different information density (e.g., data-dense vs whitespace-generous)
   - Different animation philosophy (e.g., scroll-reveal vs hover-expand vs micro-interactions)
   - Different color temperature or application (e.g., cool accents on warm base vs monochromatic)
3. **Directed reference discovery**: Give each subagent a DIFFERENT search direction. Example:
   - Pass 1: "Research dashboard designs with sidebar navigation and dense data panels"
   - Pass 2: "Research card-based layouts with generous whitespace and modular grids"
4. **Dispatch as Task agents**: Each pass is dispatched as `Task` with `subagent_type=general-purpose`, receiving the README spec content plus the subagent skill instructions.
5. **Parallel dispatch**: Launch up to 4 subagents in parallel per batch.
6. **Write README specs to output directories BEFORE dispatching subagents** so they can be read.
7. **Post-generation validation**: After all subagents complete, verify:
   - All passes have `index.html`, `style.css`, `app.js`, `README.md` (subagent-updated)
   - All passes have `validation/handoff.json`
   - All passes have Playwright screenshots
8. **Emit summary index**: After all passes complete, write a summary table with pass status, globe source, and validation results.
9. **Mode switcher by default**: every README spec carries the Modes, Roles and Mock Sign-in table, every subagent builds the switcher, role picker and mock sign-in from it, and post-generation validation requires `modeChecks` in `validation/report.playwright.json` to show no failures (run the validation script with `--strict`).

## Output Structure

```
.docs/planning/concepts/<surface>/<style>/pass-<n>/
├── index.html             ← primary view (+ additional .html per view if multi-page)
├── style.css
├── app.js
├── README.md              ← orchestrator writes initial spec, subagent updates with actuals
├── validation/
│   ├── handoff.json       ← subagent writes
│   ├── inspiration-crossreference.json
│   ├── report.playwright.json
│   ├── primary/           ← surface-appropriate primary viewport screenshots
│   │   ├── showcase.png
│   │   └── showcase-viewport.png
│   └── secondary/         ← surface-appropriate secondary viewport screenshots
│       ├── showcase.png
│       └── showcase-viewport.png
```

The `<surface>` directory segments output by host surface (e.g., `website`, `vscode-extension`, `mobile-app`, `browser-extension`). This enables both within-surface comparison (all brutalist passes for website) and cross-surface correlation review (brutalist pass 1 across all surfaces).

## Anti-Convergence Checklist

Before dispatching subagents, the orchestrator MUST verify that across all passes in a style group **on the same surface**:
- [ ] No two passes share the same layout archetype
- [ ] No two passes share the same navigation model
- [ ] No two passes have the same reference discovery direction
- [ ] Each pass has at least 3 core flags that differ from every other pass
- [ ] Required local inclusions are distributed across passes (not all using the same asset)

## Cross-Surface Correlation Checklist

For multi-surface generation, verify that correlated passes (same style + pass number, different surfaces):
- [ ] Share the same color palette hex values (or tonal family with documented shifts)
- [ ] Share the same typography family (may use different weights/sizes per surface)
- [ ] Share the same visual motifs and brand elements
- [ ] Have surface-appropriate layout and navigation (NOT the same layout forced onto all surfaces)
- [ ] Each surface's view list was derived from project planning files (not copied from another surface)

## Error Handling

- If a subagent fails, log the failure and continue with remaining passes
- If Playwright validation fails for a subagent, the subagent's own fix loop handles it (up to 3 cycles)
- If all subagents in a batch fail, pause and report to the user before continuing
- If view discovery finds no planning files, ask the user to specify views or point to documentation
