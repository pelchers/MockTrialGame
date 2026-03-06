# [CONCEPT_NAME] — [STYLE_GROUP] Pass [PASS_NUMBER]

## Overview

[1-2 paragraph description of the concept. Include the decade/era/aesthetic context, the mood and feeling the design should evoke, and any specific visual metaphors to use.]

### Pages

[Define page structure based on user prompt and .docs analysis. Can be single-page with sections, multi-page, or hybrid.]

**Single-page example:**
- **Page: Main** (`index.html`)
  - Section: Hero (`#hero`) — [description of what this section contains]
  - Section: About (`#about`) — [description]
  - Section: Features (`#features`) — [description]
  - Section: Gallery (`#gallery`) — [description]
  - Section: Testimonials (`#testimonials`) — [description]
  - Section: Contact (`#contact`) — [description]
  - Footer — [description]

**Multi-page example:**
- **Page: Home** (`index.html`) — Landing page with hero and overview
- **Page: Dashboard** (`dashboard.html`) — Main workspace with data panels
- **Page: Settings** (`settings.html`) — Configuration and preferences
- **Page: Legal** (`legal.html`) — Terms of service and privacy policy

**Hybrid example:**
- **Page: Main** (`index.html`) — Single-page with sectional content
  - Section: Hero, About, Features, Gallery, Testimonials, Contact, Footer
- **Page: FAQ** (`faq.html`) — Frequently asked questions
- **Page: Legal** (`legal.html`) — Terms and privacy

## Design Language

- **Colors**:
  - Primary: `#XXXXXX` — [usage context]
  - Secondary: `#XXXXXX` — [usage context]
  - Accent: `#XXXXXX` — [usage context]
  - Background: `#XXXXXX` — [usage context]
  - Surface: `#XXXXXX` — [usage context]
  - Text: `#XXXXXX` — [usage context]
  - [Additional colors as needed]

- **Typography**:
  - Headings: [Font Family] ([weights]) — [source: Google Fonts / system]
  - Body: [Font Family] ([weights]) — [source]
  - Accent/Mono: [Font Family] ([weights]) — [source, if applicable]

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
├── index.html                 ← Main page (or primary page for multi-page)
├── [additional-page].html     ← Only if multi-page concept
├── style.css                  ← All styles (no inline styles)
├── app.js                     ← All scripts (no inline scripts)
├── README.md                  ← This file (subagent updates with actuals)
└── validation/
    ├── handoff.json           ← Machine-readable metadata
    ├── inspiration-crossreference.json  ← Reference discovery results
    ├── report.playwright.json ← Playwright capture report
    ├── desktop/
    │   ├── showcase.png       ← Full-page desktop (1536x960)
    │   └── showcase-viewport.png  ← Viewport-only desktop
    └── mobile/
        ├── showcase.png       ← Full-page mobile (390x844)
        └── showcase-viewport.png  ← Viewport-only mobile
```

## Style

### Style Group: [STYLE_GROUP_NAME]
[2-3 sentence description of the shared aesthetic across all passes in this group. This is what makes them all feel like siblings while the core flags make them structurally distinct.]

### Orchestrator-Assigned Core Flags
| Flag | Value | Rationale |
|------|-------|-----------|
| Layout Archetype | [value] | [why this makes the pass structurally distinct] |
| Navigation Model | [value] | [why this nav pattern fits this pass] |
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
- Micro-interaction style (hover, focus, click behaviors)
- Content hierarchy treatment

## Core Application Requirements

### Target Application
- **App**: [Name of the application from .docs/ or user prompt]
- **View/Context**: [What this concept represents — landing page, dashboard, portfolio, etc.]
- **Transfer Intent**: [How these designs will be used — direct implementation, inspiration, component extraction]

### Functional Frontend Requirements
[List interactive behaviors the prototype should demonstrate. All are frontend-only with mock data.]

- [Requirement 1] — [mock data spec if needed]
- [Requirement 2] — [mock data spec if needed]
- [Requirement 3] — [mock data spec if needed]

### Mock Data Requirements
[Define what mock data is needed and its shape.]

- [Data type 1]: [count] items with [fields]
- [Data type 2]: [count] items with [fields]

### Transfer Notes
[How sections/components map to the real application's architecture.]

- [Section/Component] → maps to `<RealComponentName>` — [notes]
- [Section/Component] → maps to `<RealComponentName>` — [notes]

[If the concept is a standalone creative piece (not mapping to an app), write:]
"This concept is a standalone design exploration. Transfer intent is aesthetic inspiration and pattern extraction, not direct component mapping."
