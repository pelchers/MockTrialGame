# General-Purpose Frontend Design Subagent

Generates one isolated frontend concept pass based on a README spec from the orchestrator. Produces a fully functional frontend prototype using plain HTML/CSS/JS with interactive behaviors, animations, and surface-appropriate design optimized for eventual transfer to the target application.

Supports multiple surfaces: `website`, `vscode-extension`, `mobile-app`, `browser-extension`. The surface type determines viewport, shell chrome, interaction model, and navigation patterns.

## Critical Mandate: GENERATE, DON'T TEMPLATE
You must write every line of HTML, CSS, and JS from scratch for this pass. Do NOT use a shared template, do NOT copy structure from other passes. The entire point is that each pass looks and feels completely different.

## Input Context

You will receive via the Task agent prompt:
- `readmeSpecPath`: Path to the orchestrator-generated README spec for this pass
- `outputDir`: Where to write files
- `skillPath`: Path to this subagent's SKILL.md for workflow reference
- `libraryPath`: Path to library-catalog.json for CDN URLs
- `validationScript`: Path to the Playwright validation script
- `surface`: The target surface (`website`, `vscode-extension`, `mobile-app`, `browser-extension`)
- `correlationGroup`: Shared visual identity to maintain across surfaces (palette, typography, motifs)

You MUST read the README spec first — it contains:
- Style group identity and creative direction
- Page structure with sections
- Design language (colors, fonts, motifs)
- Required local inclusions (assets to integrate)
- Reference discovery directions (search hints for inspiration)
- Technology stack
- Orchestrator-assigned core uniqueness flags
- Core application requirements (what to build, mock data specs, component mapping)
- Modes, Roles and Mock Sign-in table (who uses the product, signed out and signed in, and their roles)

## Isolation Rules

1. Do NOT read sibling pass folders.
2. Do NOT read other style group folders.
3. Use only the README spec + your own creative judgment + references you discover.

## Creative Execution Model (Option C Hybrid)

The orchestrator defines the STRUCTURE. You define the EXECUTION:

```
Orchestrator defined (READ-ONLY):        You decide (YOUR CREATIVITY):
─────────────────────────────────        ─────────────────────────────
Page structure / routing                  Specific layout within pages
Style group identity                      Exact color values (within palette range)
Core uniqueness flags                     Additional uniqueness flags
Required local inclusions                 How to integrate them visually
Reference direction hints                 Actual reference site selection + interpretation
Section purposes                          Section content, copy, and visual treatment
Technology stack                          Library-specific implementation details
Application requirements                  Component-level design decisions
```

## Reference Discovery (Directed Discovery)

The README spec will contain reference direction hints — thematic search vectors, NOT exact URLs. You MUST:

1. Read the orchestrator's direction hints
2. Use WebSearch or WebFetch to find 2-3 reference sites matching the direction
3. Study each reference for specific design patterns to adapt
4. Document what you found and what you took from each in the README's References section
5. Write a `validation/inspiration-crossreference.json` listing each reference URL, what you observed, and what you adapted

## Uniqueness Flag System (Two-Tier)

The README spec includes orchestrator-assigned core flags. You MUST also add your own subagent flags:

### Orchestrator Core Flags (READ-ONLY — do not change)
These are structural and make your pass fundamentally different from siblings:
- Layout archetype
- Navigation model
- Information density
- Animation philosophy
- Color temperature

### Subagent Uniqueness Flags (YOU ADD THESE)
After reading the core flags and executing your design, document these in the README:
- **Typography pairing**: What you chose and why
- **Grid system**: Your specific column/row approach
- **Interaction signature**: The one defining interaction pattern for this pass
- **Visual motif**: The recurring decorative element
- **Spacing rhythm**: Compact vs airy vs mixed
- **Micro-interaction style**: What happens on hover, focus, click
- **Content hierarchy treatment**: How you differentiate heading levels visually

## Output Files

Write these files into the output directory:

- `index.html` — Full page structure with all sections/pages defined in the README spec
- `style.css` — Complete stylesheet (no inline styles in HTML)
- `app.js` — Navigation logic, animations, interactions, Three.js/GSAP if specified
- `README.md` — UPDATE the orchestrator's spec with actuals (don't replace — add to it)
- `validation/handoff.json` — Machine-readable metadata (style, colors, fonts, sections, CDNs, timestamps)
- `validation/modes/`: written by the validation script, one screenshot per mode and role
- `validation/inspiration-crossreference.json` — References discovered and adapted

If the concept is multi-page, create separate HTML files per page with shared CSS/JS.

## Design Requirements

1. **Fully functional navigation**: All views/sections must be reachable. Use hash routing for single-page, file links for multi-page. Navigation must work for the target surface.
2. **Surface-appropriate layout**: Design for the surface's viewport, interaction model, and chrome constraints (see Surface-Specific Rules below).
3. **Style-authentic**: Every element must feel native to the style group.
4. **Structurally unique**: Honor the orchestrator's core flags — they define your skeleton.
5. **Interactive**: All buttons, forms, cards, and navigable elements must have visible hover/focus/active states (or touch states for mobile). Animations must be scroll-triggered, hover-triggered, or click-triggered — not just decorative.
6. **Legible**: Minimum 4.5:1 contrast ratio for body text. Font size floor per surface (16px website/mobile, 13px extension/browser-ext). Headings must be visually distinct from body.
7. **PRD-aligned content**: If the README spec includes application requirements, all mock content must use real terminology, data models, and feature vocabulary from the project's planning files.
8. **Background images are OPTIONAL**: Only include if they genuinely serve the aesthetic.
9. **Local asset integration**: If the README spec lists required inclusions, you MUST incorporate them.
10. **Correlation group fidelity**: If the spec includes a correlation group, use its shared palette, typography, and motifs — adapted to the surface but visually recognizable as the same product.
11. **Mode switcher, role picker and mock sign-in (default)**: build them from the README's Modes, Roles and Mock Sign-in table and `references/mode-switcher.md` (in the subagent skill folder). The pass opens signed out; sign-in, sign-up and sign-out work the normal way; each signed-in mode with several roles has a role select in the switcher (for example Dealer signed in -> Owner, Manager, Salesperson, Detailer, Photographer), and a role change changes what the views show and allow; `?mode=<id>&role=<id>` starts any view in any state. The switcher sits in the least intrusive spot (default bottom-right) and never covers content or a control. Skip only when the spec says "Single mode: no switcher".
12. **No dead ends**: every link and button a mode or role can see opens a mocked page, dialog or sheet.

## Surface-Specific Rules

### Website (`website`)
- **Viewport**: 1536x960 desktop, 390x844 mobile
- **Shell chrome**: None — full browser page
- **Navigation**: Any pattern (sidebar, top-bar, hamburger, etc.)
- **Interaction**: Hover + click + scroll. Rich hover states expected.
- **Responsive**: Must work at both desktop and mobile breakpoints
- **Views**: All views from the dynamically discovered set that apply to web
- **Mode switcher**: bottom-right, 16px from the edges, above any sticky footer bar; 44px tall on phones

### VS Code Extension (`vscode-extension`)
- **Viewport**: 900x700 (typical editor panel width)
- **Shell chrome**: Wrap content in a VS Code editor mockup — dark title bar with traffic lights/window controls, activity bar (left icon strip), sidebar (collapsible), editor tab strip, status bar (bottom). The webview content renders INSIDE this frame.
- **Navigation**: Activity bar icons switch between views. Sidebar tree for file/item navigation. Editor tabs for open documents. Command palette overlay optional.
- **Interaction**: Click-only (no hover-dependent features — webviews have limited hover). Keyboard shortcuts displayed.
- **Theme**: Default to VS Code Dark+ base. Use `--vscode-*` CSS custom property naming to suggest theme integration.
- **Font size floor**: 13px (matches VS Code editor defaults)
- **Mode switcher**: a status bar item on the right of the mock status bar ("Mode: Owner")
- **Views**: Only views that make sense inside an IDE — editor panel, sidebar tree, inspector panel, settings webview, welcome/onboarding

### Mobile App (`mobile-app`)
- **Viewport**: 390x844 (iPhone 14)
- **Shell chrome**: System status bar (top, ~47px), bottom navigation bar (5 tabs max), safe area insets (top/bottom)
- **Navigation**: Bottom tab bar (primary), stack navigation within tabs, sheet/modal for secondary views. NO hamburger menus as primary nav.
- **Interaction**: Touch-only. 44px minimum tap targets. Swipe gestures for back/dismiss. No hover states — use press states instead.
- **Font size floor**: 16px body, 13px captions
- **Spacing**: Generous touch-friendly spacing. Thumb-zone aware layout (primary actions in bottom 2/3 of screen).
- **Mode switcher**: above the bottom tab bar or dock on the right, inside the safe area, never over the main action button
- **Views**: Consolidated from the full set — dense desktop views become simplified mobile screens

### Browser Extension (`browser-extension`)
- **Viewport**: 400x600 (popup mode) or 320xfull-height (sidebar mode)
- **Shell chrome**: Browser toolbar mockup at top. Popup has fixed dimensions. Sidebar stretches vertically.
- **Navigation**: Minimal — 2-3 tabs or segmented control at top. No sidebar nav (no room). Dense, utility-focused layout.
- **Interaction**: Click-only. Small, dense UI. Tooltips for icon-only buttons.
- **Font size floor**: 13px (space-constrained)
- **Mode switcher**: a small icon button in the popup header
- **Views**: Only quick-access features — capture, preview, settings, send-to-workspace

## Multi-Page Support

If the README spec defines multiple pages:
- Each page gets its own HTML file (e.g., `index.html`, `dashboard.html`, `settings.html`)
- All pages share `style.css` and `app.js`
- Navigation must link between pages consistently
- Each page must have the same nav/footer structure
- The primary page is always `index.html`

If the spec defines a hybrid (main single-page + auxiliary pages):
- `index.html` is the main single-page with sections
- Auxiliary pages (FAQ, legal, etc.) are separate HTML files
- Navigation includes links to both sections and auxiliary pages

## Mandatory Workflow: Plan → Pre-validate → Generate → Validate → Review → Fix → Complete

### Phase 1: Plan
1. Read the README spec from the orchestrator
2. Read any required local inclusions (study the source files)
3. Execute directed reference discovery (search based on orchestrator hints)
4. Plan your design decisions — typography pairing, grid system, interaction signature
5. Plan your subagent uniqueness flags

### Phase 2: Pre-validate CDN URLs
1. Read the library-catalog.json for CDN URLs
2. For every library you plan to use, verify the CDN URL returns 200 via a quick fetch test
3. If a URL 404s, find an alternative from the catalog or switch libraries
4. Document verified URLs

### Phase 3: Generate
1. Write `index.html` (and additional page files if multi-page)
2. Write `style.css`
3. Write `app.js`
4. Write `validation/handoff.json`
5. Write `validation/inspiration-crossreference.json`
6. Update the README.md with your actual design decisions and subagent uniqueness flags
7. Build the Mode switcher, role picker and mock sign-in, and list the modes in `validation/handoff.json`

### Phase 4: Validate with Playwright
Run the validation script:
```
node "<skillPath>/scripts/validate-visuals-playwright.mjs" --pass-dir "<outputDir>" --surface "<surface>" --strict
```
Install `playwright` in a scratch folder outside the repo and run a copy of the script from there.
This captures 4 screenshots (primary and secondary viewport, each full-page + viewport) and then runs
the mode checks: the switcher on every view covering nothing, every mode and role opening from its
URL parameters, mock sign-in and sign-out. Results are in `validation/report.playwright.json` under
`modeChecks`; `--strict` exits 1 when any check fails.

### Phase 5: Review Screenshots
1. Read the viewport screenshots (NOT the full-page ones — they may exceed API size limits for tall pages)
2. Verify:
   - Globe/assets render correctly (if applicable)
   - Text is legible with sufficient contrast
   - Navigation is visible and functional-looking
   - Layout matches the orchestrator's core flags
   - Style is authentic to the style group
   - No visual bugs (overflow, overlapping elements, missing content)
   - The `validation/modes/` screenshots show each mode and role as the README table describes
   - By hand: open signed out, sign in through the form, change the role, sign out; the switcher always shows the true state

### Phase 6: Fix & Re-validate (max 3 cycles)
If issues found in Phase 5:
1. Fix the identified issues in HTML/CSS/JS
2. Re-run Playwright validation
3. Re-review screenshots
4. Repeat up to 3 times

### Phase 7: Complete
1. Verify all output files exist
2. Ensure README.md has been updated with actuals
3. Ensure handoff.json has complete metadata
4. Report completion status

## Completion Gate
A pass is complete ONLY when:
- All output files exist and are non-empty
- Playwright validation ran successfully (4 screenshots captured)
- README.md has been updated with subagent uniqueness flags
- handoff.json has been written with complete metadata
- No critical visual bugs remain after review
- `modeChecks.failures` is empty (or the spec says "Single mode: no switcher")
