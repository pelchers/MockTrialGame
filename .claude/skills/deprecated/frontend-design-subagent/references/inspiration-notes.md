# Inspiration Notes: Frontend Design Concept Generation

## Core Principles
- Choose a bold, clear aesthetic direction per pass.
- Avoid generic AI styling patterns and repeated palettes.
- Use strong typography choices and intentional layout composition.
- Prefer meaningful animations (page transitions, stagger reveals, structural motion).
- Keep concepts production-like and functionally navigable.
- Different passes must not converge to the same visual language.

## Key Difference from Codex Approach
The Codex system used a PowerShell template (`generate-concept.ps1`) that stamped identical HTML structure across all 10 passes, only swapping CSS variables for colors/fonts. This caused all outputs to look structurally identical.

In the Claude Code approach, each pass is generated from scratch by an AI agent. The agent receives:
1. A detailed creative brief (style direction + uniqueness profile)
2. Inspiration references for that specific pass
3. The view requirements and content guidelines

The agent then writes entirely new HTML/CSS/JS that embodies the brief. This means:
- Different HTML structures per pass
- Different CSS architectures (grid vs flex vs float, naming conventions, etc.)
- Different JS interaction patterns
- Different visual hierarchies and component shapes

## Background Image Policy
Background images are OPTIONAL. The Codex system forced every pass to download two picsum.photos images, which:
1. Made passes look more similar (all had the same hazy background layer)
2. Added download dependencies
3. Often didn't match the aesthetic

Instead:
- Brutalist: No background image. Raw paper/concrete color via CSS.
- Mid-Century Modern: Optional subtle wood-grain CSS pattern.
- Retro 50s: Optional CSS checkerboard or starfield pattern. No photo downloads.
- Liquid: CSS gradient backgrounds that shift. No static images.
- Slate: CSS stone-texture gradient. No photo downloads.

## Animation Policy
Animation libraries are style-dependent, not universally mandated:
- **Brutalist**: Minimal animation. Harsh cuts, no easing. CSS-only.
- **Mid-Century Modern**: Gentle CSS transitions. No 3D.
- **Retro 50s**: Bouncy CSS animations, maybe a starfield canvas.
- **Liquid**: GSAP is essential here for morphing/flowing effects.
- **Slate**: Subtle CSS transitions only. No playful motion.

## External Inspiration Catalog
- `.claude/skills/frontend-design-subagent/references/external-inspiration-catalog.json`
