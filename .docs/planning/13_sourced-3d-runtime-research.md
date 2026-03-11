# Sourced 3D Runtime Research

## Purpose
This document records source-backed research for the reconstruction sandbox runtime decision.

## Research Takeaways
### Three.js remains the most direct low-level browser 3D candidate
The official Three.js manual still reflects its core strength: flexible scene construction with a large ecosystem and low assumptions. That makes it strong when the reconstruction sandbox needs to integrate tightly with a broader web application shell.

### Babylon.js remains the strongest structured-engine alternative
Babylon.js presents itself more like a complete browser engine. That gives it stronger built-in engine ergonomics, but also a heavier abstraction layer. This fits the current planning view that it is the main alternative to Three.js for the shipped runtime.

### PlayCanvas is credible, but better as a narrower evaluation path
PlayCanvas remains appealing for browser-first 3D workflows and tooling, but it still looks less aligned with the current product direction than Three.js or Babylon.js for an in-app reconstruction layer embedded in a larger application shell.

## Decision Implications
- The current narrowing to one shipped runtime is correct.
- Three.js is likely the safer fit if tight React/web-app integration is the dominant concern.
- Babylon.js is likely the stronger fit if engine-style structure and built-in 3D features matter more.
- PlayCanvas should remain an evaluation candidate, not the default shipped runtime.

## Critical Research Gaps Still Open
- Which runtime behaves best on the target hardware profile
- How much editor-like interaction the reconstruction sandbox really needs
- How strongly the chosen frontend framework should influence the 3D choice
- Asset-pipeline and scene-authoring expectations for launch content

## Sources
- Three.js manual: https://threejs.org/manual/en/creating-a-scene.html
- Babylon.js official site: https://www.babylonjs.com/
- PlayCanvas official site: https://playcanvas.com/
