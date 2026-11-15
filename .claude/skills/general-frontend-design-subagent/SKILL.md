---
name: general-frontend-design-subagent
description: Generate one isolated frontend concept pass as a fully functional frontend using plain HTML/CSS/JS with surface-appropriate design (website, VS Code extension, mobile app, browser extension), interactive behaviors, and Playwright validation.
agent: .claude/agents/general-frontend-design-subagent/agent.md
---

# General-Purpose Frontend Design Subagent

## Inputs (via Task Agent Prompt)
- `readmeSpecPath` — Path to the orchestrator-generated README spec
- `outputDir` — Directory to write output files
- `skillPath` — Path to this SKILL.md for workflow reference
- `libraryPath` — Path to library-catalog.json
- `validationScript` — Path to Playwright validation script
- `surface` — Target surface: `website`, `vscode-extension`, `mobile-app`, `browser-extension`
- `correlationGroup` — Shared visual identity for cross-surface consistency (optional, present for multi-surface runs)

## Hard Requirements

### Read the README Spec First
The orchestrator has written a comprehensive README spec at `readmeSpecPath`. Read it COMPLETELY before doing anything else. It defines your creative brief, structural constraints, and application requirements.

### Frontend-Only — No Backend
Generate only HTML, CSS, and JS. All data is mock data. All interactions are frontend-simulated. Forms submit to nowhere. The goal is a high-fidelity frontend prototype that demonstrates how the real application would look and feel.

### Legibility Non-Negotiable
- Body text: 16px minimum, 4.5:1 contrast ratio minimum
- Headings: Visually distinct from body (size, weight, or color)
- Interactive elements: Visible focus states for accessibility
- No text on complex backgrounds without text-shadow or backdrop

### Full Navigability Non-Negotiable
Every page and section defined in the README spec must be reachable via visible navigation. Navigation must work on both desktop and mobile.

For single-page concepts:
- All sections must have `id` attributes matching nav links
- Smooth scroll between sections
- Active nav link tracking on scroll

For multi-page concepts:
- All pages linked via consistent navigation
- Current page indicator in nav
- Back/forward navigation logic

For hybrid concepts:
- Main page sections + auxiliary page links in nav
- Consistent header/footer across all pages

### Mode Switcher, Role Picker and Mock Sign-in (default, every pass)
Every pass ships with a review **Mode switcher**, a **role picker** for each signed-in mode, and
**mock sign-in and sign-out**, unless the README spec says "Single mode: no switcher". Full contract,
state logic and test hooks: `references/mode-switcher.md` (read it before Phase 3). In short:

- **Modes** come from the README spec's "Modes, Roles and Mock Sign-in" table: every kind of visitor
  in each sign-in state (for example prospect, customer signed out, customer signed in, staff signed
  out, staff signed in, platform admin). Build exactly those; never invent modes.
- **Role picker**: each signed-in mode with more than one role gets a role select inside the
  switcher. Example from a dealership app: "Dealer signed in" with the roles Owner, Manager,
  Salesperson, Detailer and Photographer. Changing the role changes what the signed-in views show and
  allow: an Owner sees money and settings, a Detailer sees their detail jobs and no car costs, a
  Photographer lands on the photo queue.
- **Placement**: a small "Mode" button in the least intrusive spot (default bottom-right, inside safe
  areas, above bottom tabs or docks). It never covers content or a control: reserve room for it, or
  tuck it to a screen-edge tab when something sits under it.
- **Normal testing works**: the pass opens signed out (a first visit). Sign-in and sign-up forms
  accept any input that passes their own checks and sign in as the mode's default role; Sign out
  returns to the signed-out entry view. A signed-in view opened while signed out sends the visitor
  to sign in and back again afterwards.
- **Start in any state**: `?mode=<mode-id>&role=<role-id>` on any view starts it in that state, so a
  test can begin signed out or already signed in. `window.mockAuth` offers `state()`,
  `signIn(mode, role)`, `signOut()` and `reset()` for scripts.
- **One state**: the switcher, the forms, the guards and the URL parameters share one state.
- **No dead ends**: every link and button a mode or role can see opens a mocked page, dialog or sheet.

## Page Structure

The README spec defines pages and sections. Follow it precisely for WHAT to build. Use your creativity for HOW to build it.

### Default Sections (if README spec doesn't specify)
If the README spec doesn't define specific sections, default to:
1. **Hero** — Full-viewport introduction with primary visual and headline
2. **About** — Narrative description
3. **Features** — 3-6 feature cards/panels
4. **Gallery** — 4-8 visual items in a grid
5. **Testimonials** — 2-4 quote cards
6. **Contact** — Form with name, email, message fields
7. **Footer** — Links, branding, copyright

### Application-Specific Pages (if README spec includes Core Application Requirements)
If the spec defines application views (dashboard, settings, etc.), build them as functional frontend prototypes with:
- Real-looking mock data
- Interactive elements (buttons, forms, toggles that respond to clicks)
- State changes (tab switching, card moving, panel opening/closing)
- Animations triggered by user interaction, not just decoration

## Quality Standards

### 1. Responsive Design (Surface-Dependent)
Viewport and breakpoint requirements depend on the target surface:

**Website**: Desktop 1536px + mobile 390px. Breakpoints at 1024/768/480px. No horizontal overflow. 44px tap targets on mobile.
**VS Code Extension**: Primary 900x700 (editor panel). No mobile breakpoint needed. Content must fit within the IDE chrome frame.
**Mobile App**: Primary 390x844 (iPhone 14). No desktop breakpoint. 44px minimum tap targets. Safe area insets (top ~47px, bottom ~34px).
**Browser Extension**: Primary 400x600 (popup) or 320xfull-height (sidebar). No responsive breakpoints — fixed dimensions.

### 2. Typography
- Use Google Fonts (loaded via `<link>` in `<head>`)
- Maximum 3 font families per pass
- Clear visual hierarchy: heading > subheading > body > caption
- Line height 1.4-1.8 for body text

### 3. Color System
- Define all colors as CSS custom properties in `:root`
- Minimum 6 colors: primary, secondary, accent, background, surface, text
- Dark text on light backgrounds OR light text on dark backgrounds — never low-contrast combinations
- Use opacity variants for hover/focus states, not new colors

### 4. Animation & Interaction
- Every clickable element must have visible hover AND focus states
- Scroll-triggered animations via GSAP ScrollTrigger, AOS, or CSS `@keyframes` + IntersectionObserver
- Page load animations for hero/header elements
- Form inputs must have focus indicators (underline expand, border glow, etc.)
- Transitions: 200-400ms ease for micro-interactions, 600-1000ms for section reveals
- Respect `prefers-reduced-motion` media query

### 5. Code Quality
- Semantic HTML5 (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<nav>`)
- All styles in `style.css` — zero inline styles in HTML
- All scripts in `app.js` — zero inline scripts in HTML (except CDN `<script>` tags)
- CSS custom properties for theming
- Comments marking section boundaries in all three files

### 6. Performance
- Maximum 5 CDN library imports
- Images via CSS gradients, SVG inline, or canvas — no external image URLs
- Lazy-load heavy animations (Three.js, particles) — don't block initial render
- Total JS payload under 2MB (CDN libraries combined)

### 7. Local Asset Integration
If the README spec lists required inclusions (e.g., globe design files):
1. READ the source files (`index.html`, `style.css`, `app.js`) from the inclusion path
2. ADAPT the code — don't just copy-paste. Integrate it into your design language
3. The adapted asset should feel native to your pass's aesthetic
4. Document how you adapted it in the README's References section

## Directed Reference Discovery

The README spec will include reference direction hints from the orchestrator. Follow this process:

1. Read the direction hint (e.g., "Research dashboard designs with sidebar navigation and dense data panels")
2. Use WebSearch to find 2-3 reference sites matching the direction
3. Study each reference — identify specific patterns you want to adapt:
   - Layout structure
   - Navigation approach
   - Card/panel design
   - Color relationships
   - Typography pairings
   - Interaction patterns
4. Document findings in `validation/inspiration-crossreference.json`:
```json
{
  "references": [
    {
      "url": "<site URL>",
      "name": "<site name>",
      "observedPatterns": ["<pattern 1>", "<pattern 2>"],
      "adaptedElements": ["<what you took from it>"]
    }
  ]
}
```

## CDN Libraries

Reference: `.claude/skills/general-frontend-design-subagent/references/library-catalog.json`

Rules:
- Pick 0-5 libraries based on style fit and pass needs
- ALWAYS verify CDN URLs return 200 before using them (Phase 2)
- Pure CSS is always valid — libraries are enhancements, not requirements
- If a CDN URL fails, check the catalog for alternatives or use a different version
- Three.js: Use v0.160.0 specifically (v0.170.0+ dropped UMD builds)

## Mandatory Workflow (7 Phases)

### Phase 1: Plan
1. Read the README spec completely
2. Read any required local inclusions (study source files)
3. Execute directed reference discovery
4. Plan your design decisions and subagent uniqueness flags
5. Confirm you understand the core flags and won't violate them

### Phase 2: Pre-validate CDN URLs
For each CDN URL you plan to use:
```javascript
// Test via fetch or curl
fetch('<CDN URL>').then(r => console.log(r.status))
```
If any return non-200, find alternatives from the library catalog.

### Phase 3: Generate
Write all output files:
1. `index.html` (+ additional pages if multi-page)
2. `style.css`
3. `app.js`
4. `README.md` — update the orchestrator's spec:
   - Add your subagent uniqueness flags under the Style section
   - Add your reference discoveries under the References section
   - Add actual color/font values if you refined the palette
5. `validation/handoff.json`
6. `validation/inspiration-crossreference.json`

### Phase 4: Validate with Playwright
Run the validation script with the surface parameter (`--strict` makes it exit 1 when a Mode
switcher, role or mock sign-in check fails):
```bash
node "<validationScript>" --pass-dir "<outputDir>" --surface "<surface>" --strict
```
The script imports `playwright`; install it in a scratch folder outside the repo and run a copy of
the script from there.
This captures surface-appropriate screenshots:

**Website**: `primary/` = desktop 1536x960, `secondary/` = mobile 390x844
**VS Code Extension**: `primary/` = editor panel 900x700, `secondary/` = narrow panel 600x700
**Mobile App**: `primary/` = iPhone 14 390x844, `secondary/` = small phone 360x640
**Browser Extension**: `primary/` = popup 400x600, `secondary/` = sidebar 320x800

Each directory gets `showcase.png` (full-page) + `showcase-viewport.png` (viewport-only) + `report.playwright.json`.

It then runs the mode checks (results in `report.playwright.json` under `modeChecks`): the switcher
is on every view and covers no control at either viewport, every mode and role in
`validation/handoff.json` opens from `?mode=<id>&role=<id>`, the first signed-in mode's sign-in form
signs in and `[data-mock-signout]` signs out. One screenshot per mode and role goes to
`validation/modes/`.

### Phase 5: Review Screenshots
Read the **viewport-only** screenshots (not full-page — they may exceed API size limits for tall pages):
1. `validation/desktop/showcase-viewport.png`
2. `validation/mobile/showcase-viewport.png`

Verify:
- [ ] Hero/header renders with correct style
- [ ] Text is legible (contrast, size, font loading)
- [ ] Navigation is visible and functional-looking
- [ ] Layout matches the orchestrator's core flags (sidebar? top-bar? etc.)
- [ ] Local assets integrated correctly (globe spinning, illustrations showing)
- [ ] No visual bugs (overflow, overlapping, missing elements)
- [ ] Mobile has responsive layout with appropriate nav (hamburger, etc.)
- [ ] `modeChecks.failures` is empty, and the `validation/modes/` screenshots show each mode and role
      as the README table describes it
- [ ] Normal flow by hand: open signed out, sign in through the form, change the role in the
      switcher, sign out; the switcher always shows the true state

### Phase 6: Fix & Re-validate (max 3 cycles)
If issues found:
1. Identify the specific issue
2. Fix in HTML/CSS/JS
3. Re-run Playwright
4. Re-review viewport screenshots
5. Repeat up to 3 times total

### Phase 7: Complete
1. Verify all files exist and are non-empty
2. Ensure README.md has subagent uniqueness flags added
3. Ensure handoff.json has complete metadata, including `modes`
4. Ensure the last validation run shows no `modeChecks` failures
5. Report final status

## Required Screenshots Per Pass (Surface-Dependent)

Screenshots are captured in `primary/` and `secondary/` directories (not `desktop/`/`mobile/`) to support all surface types:

| Surface | Primary Viewport | Secondary Viewport |
|---------|-----------------|-------------------|
| `website` | 1536x960 (desktop) | 390x844 (mobile) |
| `vscode-extension` | 900x700 (editor panel) | 600x700 (narrow panel) |
| `mobile-app` | 390x844 (iPhone 14) | 360x640 (small phone) |
| `browser-extension` | 400x600 (popup) | 320x800 (sidebar) |

Each directory gets: `showcase.png` (full-page) + `showcase-viewport.png` (viewport-only).

## handoff.json Schema
```json
{
  "concept": "<concept name>",
  "pass": "<pass number>",
  "surface": "<website | vscode-extension | mobile-app | browser-extension>",
  "correlationGroup": "<correlation group ID, if multi-surface>",
  "domain": "<concept type>",
  "style": "<style group>",
  "files": ["index.html", "style.css", "app.js", "README.md"],
  "cdns": [
    { "library": "<name>", "version": "<ver>", "url": "<CDN URL>" }
  ],
  "fonts": ["<font 1>", "<font 2>"],
  "sections": [
    { "id": "<section-id>", "name": "<display name>", "description": "<what it contains>" }
  ],
  "modeSwitcher": "<default | none (single mode, as the README spec says)>",
  "modes": [
    {
      "id": "<mode-id>", "label": "<label>", "signedIn": true,
      "entry": "<view file, may include #hash>", "signInView": "<sign-in view, signed-in modes only>",
      "signedOutMode": "<mode-id it signs out to>",
      "roles": [ { "id": "<role-id>", "label": "<label>", "home": "<view file>" } ]
    }
  ],
  "designTokens": {
    "colors": { ... },
    "typography": { ... },
    "borderRadius": "<value>",
    "transition": "<value>"
  },
  "coreFlags": { ... },
  "subagentFlags": { ... },
  "localInclusions": ["<paths to integrated assets>"],
  "accessibility": {
    "contrastRatio": "4.5:1 minimum",
    "bodyFontSize": "16px",
    "reducedMotion": true
  },
  "timestamp": "<ISO 8601>"
}
```
