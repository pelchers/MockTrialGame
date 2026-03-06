# Domain Families

## Overview

The visual creative system operates across three domain families. Each domain has its own
set of styles, preferred libraries, creative constraints, and (for data-vis) mock datasets.
The orchestrator reads these definitions from `style-config.json` and builds per-pass
creative briefs.

## Domain 1: Data Visualization (`data-vis`)

### Purpose
Interactive charts, dashboards, and statistical graphics that present data clearly with
user-controllable views.

### Libraries

| Library   | Strengths                        | CDN Source      |
|-----------|----------------------------------|-----------------|
| D3.js     | Maximum flexibility, custom viz  | cdnjs / unpkg   |
| Chart.js  | Quick bar/line/pie charts        | cdnjs           |
| ECharts   | Rich interactive dashboards      | cdnjs           |
| Vega-Lite | Declarative grammar of graphics  | cdnjs           |

### Style Examples

Styles within data-vis are typically named by chart type: `bar-chart`, `line-chart`,
`scatter-plot`, `treemap`, `heatmap`, `network-graph`, etc.

### Page Requirements

- Use the provided `mockData` faithfully; do not invent different data
- Chart colors must use `stylePalette`, not library defaults
- Include axis labels, legend, title, and tooltips
- Show at least 2 views of the data (e.g., chart + summary table)
- Animated entrance for chart elements
- Responsive: chart reflows on mobile, labels do not overflow

### Controls Panel

- Filter dropdowns
- Sort toggles
- Dataset switcher

### Mock Datasets

Mock data comes from the `mockDatasets` section of `style-config.json`. Each dataset
includes structured JSON with enough records to demonstrate the visualization.

---

## Domain 2: Animation (`animation`)

### Purpose
Motion graphics, physics simulations, and animated scenes that play continuously or
respond to user interaction.

### Libraries

| Library    | Strengths                         | CDN Source     |
|------------|-----------------------------------|----------------|
| GSAP       | Timeline animation, easing        | cdnjs          |
| p5.js      | Creative coding, particle systems | cdnjs          |
| Anime.js   | Lightweight keyframe animation    | cdnjs          |
| Matter.js  | 2D physics engine                 | cdnjs          |

### Style Examples

Styles within animation include: `particle-systems`, `physics-sim`, `timeline-motion`,
`procedural-scenes`, `wave-patterns`, etc.

### Page Requirements

- Animation must loop continuously or play indefinitely
- Use `requestAnimationFrame` or library animation loops
- Target 60fps with no jank or frame drops
- Include visible play/pause controls
- Animation fills the main showcase area
- For physics: add click/drag interactivity

### Controls Panel

- Play/pause button
- Speed slider
- Reset button

### Scene Description

Instead of mock data, animation passes receive a `sceneDescription` field that
specifies what to render: particle count, motion patterns, color behavior, interaction
model, etc.

---

## Domain 3: Graphic Design (`graphic-design`)

### Purpose
Generative art, 3D renders, and illustrations that produce a complete visual composition.

### Libraries

| Library   | Strengths                         | CDN Source     |
|-----------|-----------------------------------|----------------|
| Three.js  | 3D rendering, WebGL scenes        | cdnjs / unpkg  |
| p5.js     | Generative art, 2D compositions   | cdnjs          |
| Paper.js  | Vector graphics, path operations  | cdnjs          |
| PixiJS    | High-performance 2D rendering     | cdnjs          |

### Style Examples

Styles within graphic-design include: `generative-geometry`, `globe-3d`, `abstract-art`,
`landscape-render`, `typography-art`, etc.

### Page Requirements

- Render a complete composition, not a sketch or placeholder
- For generative art: include a "Regenerate" button with new random seed
- For 3D: include orbit controls or auto-rotation
- For illustrations: render at high resolution
- Display the random seed or generation parameters

### Controls Panel

- Regenerate/randomize button
- Parameter sliders (where applicable)

---

## Per-Pass Variety System

Each pass within a style receives distinct creative parameters from the config:

| Parameter        | Purpose                                                  |
|------------------|----------------------------------------------------------|
| `palette`        | Different colors per pass, same style DNA                |
| `direction`      | Different creative brief text per pass                   |
| `library`        | May use a different CDN library per pass within a style  |
| `antiRepeat`     | Explicit ban list from prior passes                      |
| `sceneDescription` | Detailed scene specification (animation/graphic)       |

This system ensures that even within the same style, every pass looks and feels
distinct. The orchestrator populates these fields from `style-config.json` when
building the creative brief.

## Shared Page Structure

Regardless of domain, every showcase page has these regions:

```
+--------------------------------------------------+
|  Header Bar                                       |
|  [Domain Badge] [Style Name] [Pass #] [Library]  |
+--------------------------------------------------+
|                                                    |
|                                                    |
|              Main Showcase Area                    |
|              (80%+ of viewport)                    |
|                                                    |
|                                                    |
+--------------------------------------------------+
|  Controls Panel                                    |
|  [Domain-specific controls]                        |
+--------------------------------------------------+
|  Info Footer                                       |
|  [Library] [Version] [Render method] [Technique]  |
+--------------------------------------------------+
```

## Library Catalog

All CDN URLs come from the library catalog at:
`.claude/skills/visual-creative-subagent/references/library-catalog.json`

The subagent must use exact URLs from this catalog. URLs are pre-validated and include
version-specific notes (e.g., UMD vs ESM build requirements). The subagent also
pre-validates each URL with a curl check before writing HTML.
