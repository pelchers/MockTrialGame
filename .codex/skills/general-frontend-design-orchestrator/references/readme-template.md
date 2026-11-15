# [CONCEPT_NAME] — [STYLE_GROUP] Pass [PASS_NUMBER] ([SURFACE])

## Surface

- **Type**: [website | vscode-extension | mobile-app | browser-extension]
- **Correlation Group**: [correlation group ID — e.g., "brutalist-1". Omit for single-surface runs.]

### Surface Constraints

[Include the appropriate constraint block for this surface. These are load-bearing instructions — the subagent cannot generate a correct concept without them.]

**If `website`:**
- Full browser page, no shell chrome
- Responsive: desktop 1536px + mobile 390px with breakpoints at 1024/768/480px
- Interaction model: hover + click + scroll
- All navigation patterns available

**If `vscode-extension`:**
- Content renders inside a VS Code webview panel, surrounded by IDE chrome
- Shell mockup required: dark title bar, activity bar (left icon strip), sidebar (collapsible), editor tab strip, status bar (bottom)
- Viewport: 900x700 typical editor panel
- Interaction model: click-only (no hover-dependent features)
- Theme base: VS Code Dark+ with `--vscode-*` CSS custom property naming
- Font size floor: 13px
- Navigation: activity bar icons switch views, sidebar tree for items, editor tabs for documents

**If `mobile-app`:**
- Content renders inside a mobile device frame with system chrome
- Shell mockup required: system status bar (~47px top), bottom tab navigation (5 tabs max), safe area insets (bottom ~34px)
- Viewport: 390x844 (iPhone 14)
- Interaction model: touch-only, 44px minimum tap targets, press states (no hover)
- Font size floor: 16px body, 13px captions
- Navigation: bottom tab bar primary, stack nav within tabs, sheet/modal for secondary
- Thumb-zone aware: primary actions in bottom 2/3 of screen

**If `browser-extension`:**
- Content renders inside a browser popup or sidebar panel
- Shell mockup required: browser toolbar at top
- Viewport: 400x600 (popup) or 320xfull-height (sidebar)
- Interaction model: click-only, dense utility-focused UI
- Font size floor: 13px
- Navigation: 2-3 tabs or segmented control (no sidebar nav, no room)

## Overview

[1-2 paragraph description of the concept. Include the decade/era/aesthetic context, the mood and feeling the design should evoke, and any specific visual metaphors to use. Mention how this style adapts to the target surface.]

### Views

[Define views dynamically from the project's planning files. The orchestrator discovers what views the app needs and adapts them for this surface. NEVER use a hardcoded view list — derive views from `.docs/`, `.adr/`, `.appdocs/`, `.ideas/`, and the user's prompt.]

**Website example (derived from planning files):**
- **View: Dashboard** (`index.html`) — Workspace overview, recent docs, activity feed
- **View: Editor** (`editor.html`) — Full Markdown+Mermaid editing experience
- **View: Projects** (`projects.html`) — Project/workspace listing and management
- **View: Settings** (`settings.html`) — Account, preferences, billing
- **View: Landing** (`landing.html`) — Public-facing product page

**VS Code extension example (derived from planning files):**
- **View: Editor Panel** (`index.html`) — Main Markdown+Mermaid editing webview
- **View: Sidebar Tree** — Document/workspace file explorer (rendered in sidebar)
- **View: Inspector** — Diagram property panel (sidebar or bottom panel)
- **View: Settings** (`settings.html`) — Extension configuration webview
- **View: Welcome** (`welcome.html`) — First-launch onboarding

**Mobile app example (derived from planning files):**
- **Tab: Home** (`index.html#home`) — Recent docs, quick actions
- **Tab: Editor** (`index.html#editor`) — Touch-optimized Markdown+Mermaid editing
- **Tab: Projects** (`index.html#projects`) — Workspace/project browser
- **Tab: Activity** (`index.html#activity`) — Comments, notifications
- **Tab: Settings** (`index.html#settings`) — Account and preferences

**Browser extension example (derived from planning files):**
- **Tab: Capture** (`index.html#capture`) — Quick content capture from current page
- **Tab: Preview** (`index.html#preview`) — Markdown/Mermaid preview
- **Tab: Settings** (`index.html#settings`) — Extension preferences

[The above are EXAMPLES of how planning files might map to each surface. The actual views come from the project's own documentation.]

## Design Language

- **Colors**:
  - Primary: `#XXXXXX` — [usage context]
  - Secondary: `#XXXXXX` — [usage context]
  - Accent: `#XXXXXX` — [usage context]
  - Background: `#XXXXXX` — [usage context]
  - Surface: `#XXXXXX` — [usage context]
  - Text: `#XXXXXX` — [usage context]
  - [Additional colors as needed]

[If this pass is part of a correlation group, these colors MUST match the shared palette.]

- **Typography**:
  - Headings: [Font Family] ([weights]) — [source: Google Fonts / system]
  - Body: [Font Family] ([weights]) — [source]
  - Accent/Mono: [Font Family] ([weights]) — [source, if applicable]

[If this pass is part of a correlation group, the font families MUST match the shared typography.]

- **Visual Elements**:
  - [Key motif 1] — [where and how it's used]
  - [Key motif 2] — [where and how it's used]
  - [Key motif 3] — [where and how it's used]

## References

### Required Inclusions
[List local files/assets that MUST be incorporated into this pass. Include paths relative to repo root.]

- `[path/to/asset/]` — [What it is and how it should be integrated]
  - Source files to read: `index.html`, `style.css`, `app.js`
  - Integration approach: [e.g., "Adapt Three.js globe code into hero section canvas"]

[If no required inclusions, write: "None — this pass uses only original content."]

### Design Inspiration Sources
[Directed discovery hints — NOT exact URLs. The subagent will search based on these directions.]

- **Direction**: "[Thematic search direction for the subagent to explore]"
  - Look for: [specific patterns to find — layout, nav, color, interaction]
  - Avoid: [patterns that would conflict with this pass's core flags]

[Each pass in a style group MUST have a DIFFERENT direction to prevent convergence.]

## Technologies

- **[Library Name]** v[version] — [purpose in this pass]
  - CDN: `[URL from library-catalog.json]`
  - Plugins: [if applicable]
- **Google Fonts** — [font names]
  - `https://fonts.googleapis.com/css2?family=[encoded]`

[List all CDN dependencies. Subagent MUST verify each URL returns 200.]

## Files

```
pass-[N]/
├── index.html                 ← Primary view (+ additional .html per view if multi-view)
├── [additional-view].html     ← Only if multi-page concept
├── style.css                  ← All styles (no inline styles)
├── app.js                     ← All scripts (no inline scripts)
├── README.md                  ← This file (subagent updates with actuals)
└── validation/
    ├── handoff.json           ← Machine-readable metadata
    ├── inspiration-crossreference.json  ← Reference discovery results
    ├── report.playwright.json ← Playwright capture report (includes modeChecks)
    ├── modes/                 ← One screenshot per mode and role
    ├── primary/               ← Surface-appropriate primary viewport
    │   ├── showcase.png       ← Full-page
    │   └── showcase-viewport.png  ← Viewport-only
    └── secondary/             ← Surface-appropriate secondary viewport
        ├── showcase.png       ← Full-page
        └── showcase-viewport.png  ← Viewport-only
```

## Style

### Style Group: [STYLE_GROUP_NAME]
[2-3 sentence description of the shared aesthetic across all passes in this group. This is what makes them all feel like siblings while the core flags make them structurally distinct.]

### Surface Adaptation
[How this style adapts to the target surface. Include density, font size, interaction model, and any surface-specific adjustments.]
- **Density**: [high | medium | low] — [why this fits the surface]
- **Font Size Floor**: [13px | 16px] — [per surface convention]
- **Interaction Model**: [hover+click | click-only | touch] — [per surface capability]
- **Navigation Adaptation**: [how nav patterns change for this surface]

### Orchestrator-Assigned Core Flags
| Flag | Value | Rationale |
|------|-------|-----------|
| Layout Archetype | [value] | [why this makes the pass structurally distinct] |
| Navigation Model | [value] | [why this nav pattern fits this pass AND this surface] |
| Information Density | [value] | [high/medium/low and why] |
| Animation Philosophy | [value] | [what motion approach to use] |
| Color Temperature | [value] | [warm/cool/monochrome and how to apply] |

### Subagent Uniqueness Flags
[SUBAGENT FILLS THIS SECTION IN — leave this placeholder for the subagent to add:]

_To be completed by the subagent after design execution. The subagent will document:_
- Typography pairing rationale
- Grid system specifics
- Interaction signature (the one defining interaction pattern)
- Visual motif (the recurring decorative element)
- Spacing rhythm (compact vs airy vs mixed)
- Micro-interaction style (hover, focus, click, or touch behaviors)
- Content hierarchy treatment

## Modes, Roles and Mock Sign-in

[Default for every pass (orchestrator Step 0.6), derived from the planning files; the same table for
every pass in the run. Write "Single mode: no switcher" instead if the product has one kind of user
and no sign-in. Contract: `.claude/skills/general-frontend-design-subagent/references/mode-switcher.md`.]

| Mode id | Mode | Signed in | Entry view | Sign-in view | Signs out to | Roles (default first) |
|---|---|---|---|---|---|---|
| `prospect` | Prospect | no | `index.html` | | | |
| `dealer-out` | Dealer signed out | no | `app-signin.html` | | | |
| `dealer` | Dealer signed in | yes | `app-home.html` | `app-signin.html` | `dealer-out` | `owner` Owner, `manager` Manager, `sales` Salesperson, `detailer` Detailer, `photographer` Photographer |

[The rows above are an EXAMPLE from a dealership app. Use the product's own modes and role names.]

Role differences (what each role sees first, and what it cannot see):
- **Owner**: money and settings; home `app-home.html`
- **Detailer**: their detail jobs, no car costs or profit; home `app-jobs.html`
- **Photographer**: the photo queue; home `app-photos.html`

Rules:
- The pass opens signed out. Sign-in, sign-up and sign-out work as mock flows.
- `?mode=<id>&role=<id>` on any view starts it in that state.
- The Mode button sits bottom-right (or this surface's least intrusive spot) and covers nothing.
- Every link and button a mode or role can see opens a mocked page, dialog or sheet.

## Core Application Requirements

### Target Application
- **App**: [Name of the application from .docs/ or user prompt]
- **Surface**: [Which host surface this concept targets]
- **View/Context**: [What views this concept covers — derived from project planning files]
- **Transfer Intent**: [How these designs will be used — direct implementation, inspiration, component extraction]

### Functional Frontend Requirements
[List interactive behaviors the prototype should demonstrate. All are frontend-only with mock data. Adapt to the surface's interaction model (hover+click for web, touch for mobile, click-only for extensions).]

- [Requirement 1] — [mock data spec if needed]
- [Requirement 2] — [mock data spec if needed]
- [Requirement 3] — [mock data spec if needed]

### Mock Data Requirements
[Define what mock data is needed and its shape.]

- [Data type 1]: [count] items with [fields]
- [Data type 2]: [count] items with [fields]

### Transfer Notes
[How views/components map to the real application's architecture.]

- [View/Component] → maps to `<RealComponentName>` — [notes]
- [View/Component] → maps to `<RealComponentName>` — [notes]

[If the concept is a standalone creative piece (not mapping to an app), write:]
"This concept is a standalone design exploration. Transfer intent is aesthetic inspiration and pattern extraction, not direct component mapping."
