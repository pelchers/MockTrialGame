---
name: frontend-design-subagent
description: Generate one isolated frontend concept pass as a full navigable app ideation using plain HTML/CSS/JS with deliberate interaction design, optional media assets, and CDN library integration. Each pass is written from scratch by the AI agent, not stamped from a template.
---

# Frontend Design Subagent

Use this skill for one pass only. Do not blend with other pass outputs.

## Inputs (via Task agent prompt)
- `styleId` - Which style family
- `pass` - Pass number
- `outputDir` - Where to write generated files
- `stylePalette` - Colors, fonts, design tokens (with per-pass overrides applied)
- `styleDirection` - Creative brief text
- `uniquenessProfile` - Layout structure flags
- `inspirationReferences` - External site references (specific URLs, not categories)
- `interactionProfile` - Deliberate interaction design choices (see below)
- `contentPersona` - Visual/tonal flavor for the pass (controls how it looks and feels)
- `productContext` - Product data models, terminology, and feature vocabulary (controls what content says)
- `viewHints` - Per-view component/layout directives
- `antiRepeat` - Explicit list of things NOT to repeat from prior passes
- `librariesCatalog` - Available CDN libraries to choose from
- `assetSources` - Approved media download sources

## Hard Requirements
1. Generate a fully navigable app frontend (not a landing page).
2. Include views for: dashboard, projects, project workspace, kanban, whiteboard, schema planner, directory tree, ideas, AI chat, settings.
3. Each pass must be wholly distinct from every other pass in layout structure, typography, color, spacing rhythm, component language, AND interaction feel.
4. Use plain HTML/CSS/JS with optional CDN libraries for low-friction review.
5. Include responsive behavior for desktop and mobile.
6. Write EVERY line of code from scratch - no shared templates.
7. Background images and media assets are OPTIONAL - use only when they genuinely enhance the style.
8. Animations, transitions, and interactions should be deliberately designed, not generic defaults.
9. Meet ALL Professional Quality Standards (see below) — the orchestrator will visually review screenshots and reject passes that fail.

## Full Navigability (CRITICAL — NON-NEGOTIABLE)

Every generated pass MUST be fully navigable. This is the single most important functional requirement. A concept that looks beautiful but cannot be navigated between views is WORTHLESS for evaluation.

### Navigation Architecture Requirements
1. **Every view must have a clickable `data-view="viewId"` navigation element** visible at all times (desktop AND mobile). The Playwright validation script relies on these attributes to navigate between views.
2. **Every view's content section must have a `data-page="viewId"` attribute** on its container div/section.
3. **Clicking any nav item must immediately show the corresponding view** and hide all others. No dead links, no broken handlers, no console errors.
4. **The currently active view must be visually indicated** in the navigation (highlighted, underlined, filled, etc.).
5. **Hash-based routing** (`#dashboard`, `#kanban`, etc.) must be supported so direct URL navigation works.
6. **On page load, the default view (dashboard) must be visible** — not a blank screen, loading spinner, or "select a view" placeholder.

### Mobile Navigation Requirements
7. **On mobile (390px), ALL 10 views must still be reachable** via hamburger menu, bottom tab bar, drawer, or equivalent mobile nav pattern.
8. **The mobile nav must actually work** — hamburger buttons must open menus, drawer items must trigger view switches, and the menu must close after selection.
9. **Touch targets must be at least 44x44px** for all navigation elements on mobile.

### Interactive Elements Within Views
10. **Forms must be visible and functional-looking**: The Ideas view must show a capture form with visible input fields for title, description, tags, and priority. Settings must show actual form controls (toggles, inputs, selects).
11. **All buttons must look clickable** — Create New Project, Add Card, Promote to Kanban, Generate Tree, Send Message, etc.
12. **Directory tree folders must be expandable/collapsible** with click handlers.
13. **Settings must have sub-tabs or sections** that are independently navigable.
14. **AI Chat must show the message input** and have a visible send button.

### Self-Test Checklist (MANDATORY before completing)
Before marking the pass as done, mentally test EVERY navigation path:
- [ ] Dashboard loads on page open — content is visible, not blank
- [ ] Click Projects nav → projects view appears with project cards
- [ ] Click Project Workspace nav → workspace view with folder tree + metadata
- [ ] Click Kanban nav → 4 columns visible with cards
- [ ] Click Whiteboard nav → canvas area with toolbar
- [ ] Click Schema Planner nav → entity nodes with relationships
- [ ] Click Directory Tree nav → expandable folder tree
- [ ] Click Ideas nav → capture form + ideas list visible
- [ ] Click AI Chat nav → message thread + input visible
- [ ] Click Settings nav → settings panels with real controls
- [ ] On mobile: hamburger/menu opens → all 10 items listed → each item navigates correctly

If ANY navigation path fails, FIX IT before completing.

## Professional Quality Standards (CRITICAL)

Your output will be visually reviewed by examining screenshots. Treat this as a design portfolio piece being reviewed by a senior frontend designer. The following are hard requirements — violations will cause the pass to be rejected and you will need to fix and regenerate.

### 1. No Blank or Empty Views
- **Every single one of the 10 views** must render visible, meaningful content when navigated to.
- A view that shows only a title/heading with an empty content area below is a FAIL.
- Each view must have at minimum: a heading, 3+ content elements (cards, rows, items, panels), and interactive elements.
- Test this mentally: if you navigate to "kanban" and there are no columns or cards visible, that's a blank page.

### 2. Text-to-Background Contrast
- All body text must have a contrast ratio of at least 4.5:1 against its immediate background.
- All heading text must have a contrast ratio of at least 3:1.
- DO NOT place light-colored text on light backgrounds or dark text on dark backgrounds.
- If using background images, patterns, or gradients, ensure text has a solid backing or text-shadow for readability.
- Common mistakes to avoid:
  - Gray text (#999) on white background — too low contrast
  - White text on light pastel backgrounds — unreadable
  - Text over busy patterns without a solid color backing
  - Accent-colored text on similarly-saturated backgrounds

### 3. Mobile Responsive Design
- At 390px width, the layout must be genuinely usable, not just a scaled-down desktop view.
- Navigation must be accessible on mobile (hamburger menu, bottom tab bar, or equivalent).
- No horizontal scrolling should be required to see content.
- Text must be at least 14px on mobile (no microscopic text).
- Touch targets (buttons, links, nav items) must be at least 44x44px.
- Content cards/panels must stack vertically on mobile, not overflow.
- Sidebar navigation must collapse or transform on mobile — a 250px sidebar on a 390px screen is a FAIL.

### 4. Content Population
- Use the `contentPersona` to populate EVERY view with realistic, themed data.
- Dashboard: at least 4 metric/stat elements + a recent activity section.
- Projects: at least 4-6 project items with names, descriptions, status.
- Kanban: at least 3 columns with 2-3 cards each.
- AI Chat: at least 4-6 message exchanges (not just an empty chat input).
- Settings: at least 3 settings groups with real toggle/input controls.
- All other views: meaningful content, not just a heading and a paragraph.

### 5. Layout Integrity
- No elements should visually overlap in a way that makes content unreadable.
- CSS Grid/Flexbox layouts must not break or collapse unexpectedly.
- Fixed/sticky elements (nav bars, headers) must not cover content without proper spacing.
- All views must have proper vertical spacing — content should not be crammed against the top.

### 6. Visual Polish
- Google Fonts must be imported correctly in the `<head>` — verify font names match exactly.
- Incorrect: `font-family: 'Playfair Display'` without the corresponding Google Fonts `<link>` tag.
- All CDN library scripts must load (use valid CDN URLs from the libraries catalog).
- Color values must match the paletteOverrides — don't use default/fallback colors.
- Border-radius, shadows, and spacing should feel intentional and consistent, not random.

### Self-Check Before Completing
Before reporting the pass as complete, mentally walk through each view and ask:
1. Does this view have real content, or is it an empty shell?
2. Can I read all the text clearly against its background?
3. Would this layout work on a phone screen?
4. Does the navigation clearly show which view I'm on?
5. Would a professional designer consider this polished enough for a portfolio?

If ANY answer is "no", fix the issue before completing.

## Interaction Design (Required)

Every pass MUST have deliberately designed interactions across ALL of these categories. The `interactionProfile` input specifies the direction — implement it faithfully.

### Interaction Categories
| Category | What to Design | Examples |
|----------|---------------|----------|
| **buttonHover** | What happens when cursor enters a button | underline-slide-in, background-fill-expand, border-draw, scale-up, glow-pulse, color-invert |
| **buttonClick** | What happens on click/tap | ink-ripple-from-cursor, press-down-spring, flash-feedback, stamp-press, none (instant) |
| **cardHover** | How cards respond to hover | lift-shadow-deepen, 3d-tilt-perspective, border-highlight, scale-slight, glow-edge |
| **pageTransition** | How views switch | crossfade-with-slide, instant-cut, morph-dissolve, flip-card, zoom-through, slide-stack |
| **scrollReveal** | How content appears on scroll | stagger-fade-up, slide-from-left, scale-in, parallax-depth, typewriter-cascade, none |
| **navItemHover** | Nav button hover state | scale-bounce, background-fill, text-weight-shift, icon-wiggle, underline-expand |
| **navItemActive** | Active nav indicator | bold-weight-shift, accent-underline, filled-background, border-left-bar, icon-filled |
| **inputFocus** | Text input focus state | border-glow-pulse, label-float-up, underline-expand, shadow-inset, color-shift |
| **toggleSwitch** | Toggle/switch animation | elastic-thumb-slide, color-flood-fill, flip-3d, snap-with-bounce, slide-smooth |
| **tooltips** | Tooltip/popover entrance | fade-scale-from-origin, slide-from-trigger, instant, typewriter-text |
| **loadingState** | Loading indicators | skeleton-shimmer-sweep, spinner-rotate, progress-bar-fill, pulse-dots, lottie-animation |
| **idleAmbient** | Ambient background motion | floating-particles, breathing-glow, wave-drift, none, subtle-parallax, color-cycle |
| **microFeedback** | Success/error/completion | checkmark-draw, confetti-burst, flash-green, toast-slide-in, shake-on-error |

Each interaction choice must be implemented in CSS and/or JS. Don't just list them — wire them up so they work.

## CDN Libraries (Optional)

Reference: `available-libraries.json` in the references folder.

Pick 0-5 libraries from the catalog based on what genuinely fits the style and interaction profile. Don't use libraries for the sake of using them. Pure CSS is always valid.

When using a library:
- Include the CDN `<script>` or `<link>` tag in `index.html`
- Initialize it in `app.js`
- Document the usage in `README.md`

## Media Assets (Optional)

Reference: `asset-sources.json` in the references folder.

Download assets ONLY when they genuinely enhance the design beyond what CSS can achieve. Rules:
- Store all downloaded files in `assets/` subfolder
- Max 10 assets per pass, max 2MB total
- Prefer transparent PNGs and SVGs over photos
- Prefer SVG illustrations (unDraw, Heroicons) over raster images
- Video backgrounds: at most 1 per pass, hero section only, muted autoplay loop
- Lottie animations: keep each under 50kb
- Never hotlink — download and store locally

## Product Context & Content Persona (Two Independent Layers)

**Product context** defines WHAT content says — the real app's data models, terminology, feature names, view content, column names, metrics, and sample data. Read `references/product-context.md` before generating. All mock content MUST use the app's real data models and feature vocabulary.

**Content persona** defines HOW the pass looks and feels — the visual tone, metaphor, and stylistic flavor. A brutalist pass still feels raw and industrial. A retro-50s pass still feels chrome-diner-atomic. But the kanban board says "Backlog → In Progress → Review → Done" with real task cards, not arbitrary themed content.

The persona shapes the design language; the product context shapes the information displayed.

## Anti-Repeat Rules

The `antiRepeat` array lists specific things from prior passes that this pass MUST NOT repeat. Treat these as hard constraints. If a prior pass used a left-rail nav, this pass must not. If a prior pass used stat cards for the dashboard, use a different pattern.

## Files
- `index.html` - Complete HTML with all 10 navigable views
- `style.css` - Full CSS with responsive breakpoints
- `app.js` - Navigation, interactions, library initialization
- `README.md` - Concept overview, design decisions, library usage
- `validation/handoff.json` - Structural metadata
- `validation/inspiration-crossreference.json` - Inspiration mapping
- `assets/` - (Optional) Downloaded media assets

## Mandatory Workflow: Plan → Generate → Validate → Fix Loop

**The subagent itself (NOT the orchestrator) owns the full validation lifecycle. A pass is not complete until the subagent has validated and visually reviewed its own output.**

### Phase 1: Plan
- Review all inputs (style, palette, direction, uniqueness profile, interaction profile, product context, anti-repeat)
- If using CDN libraries, read available-libraries.json for correct CDN URLs
- Plan design approach: layout shell, nav pattern, content flow, interaction feel

### Phase 2: Pre-validate CDN URLs
If using CDN libraries or Google Fonts, verify every URL resolves:
```bash
curl -s -o /dev/null -w "%{http_code}" "<CDN_URL>"
```
- Non-200 → find alternative URL/version
- **Do NOT proceed with unverified CDN URLs**

### Phase 3: Generate
- Write all files with verified CDN URLs only

### Phase 4: Validate (Playwright)
The **subagent** runs the Playwright validation script (not the orchestrator):
```bash
node .claude/skills/frontend-design-subagent/scripts/validate-concepts-playwright.mjs --concept-root <concept-root> --style <style> --pass <pass>
```

### Phase 5: Review Screenshots
The **subagent** reads the generated PNG screenshots and visually assesses them. Check:
- All 10 views render with meaningful content (not blank shells)
- Navigation works — active state visible
- Text readable — correct fonts, sufficient contrast
- Layout intact — no overflow, overlap, collapsed elements
- Mobile responsive — nav accessible, content stacks properly
- Interactive elements present — forms, buttons, toggles, trees
- Style-authentic — matches the style family

### Phase 6: Fix and Re-validate (Loop, max 3 cycles)
If failures detected → fix root cause → re-run Phase 4 → re-review Phase 5.
After 3 cycles, document remaining issues in `validation/handoff.json` under `unresolvedIssues`.

### Phase 7: Complete
Write final `validation/handoff.json` with:
- `validationPassed`: boolean
- `fixCycles`: number
- `cdnUrlsVerified`: true
- `screenshotsReviewed`: true
- `allViewsRendered`: true
- `navigationWorking`: true

### Required Screenshots Per Pass
- `validation/desktop/<view>.png` — Full-page screenshot for each of the 10 views at 1536x960
- `validation/desktop/<view>_segment-N.png` — Viewport-height scroll segments for tall pages (auto-generated)
- `validation/mobile/<view>.png` — Full-page screenshot for each of the 10 views at 390x844 (2x scale)
- `validation/mobile/<view>_segment-N.png` — Viewport-height scroll segments for tall pages (auto-generated)
- `validation/report.playwright.json` — Structured report with viewport info, screenshot paths, and segment counts

The script uses smart waiting (networkidle + DOM stability checks + loading overlay dismissal) to ensure all content is fully rendered before capture. Scroll segments break tall pages into viewport-height slices for detailed review.

**Completion gate:** A pass is NOT complete until all view screenshots exist on disk AND the subagent has visually reviewed them AND no failure conditions remain. The total screenshot count is dynamic — at minimum 20 (10 desktop + 10 mobile full-page), plus additional scroll segments for tall pages.

## Inspiration
- Draw from the provided specific external reference URLs (not generic category pages)
- Apply the aesthetic quality bar from the style direction
- Make design choices that feel authentic to the style family, not generic
- The `takeaway` field on each reference tells you the ONE specific thing to draw from that site
