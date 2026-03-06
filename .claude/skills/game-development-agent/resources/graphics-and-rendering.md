# Graphics & Rendering Systems Reference

Comprehensive reference for rendering pipelines, 2D/2.5D/3D graphics, shader programming, camera systems, and optimization techniques relevant to game development.

---

## 1. Rendering Pipeline Fundamentals

### 1.1 The Three Conceptual Stages

The real-time graphics pipeline is divided into three broad stages that run in parallel on the CPU and GPU.

**Application Stage (CPU)**
- Executed on the main processor; prepares the scene each frame.
- Handles user input, physics, AI, animation updates, and scene-graph traversal.
- Determines visibility at a coarse level (e.g., frustum culling on the CPU side).
- Submits draw calls and state changes to the graphics API (Vulkan, OpenGL, Direct3D).

**Geometry Stage (GPU -- Vertex Processing)**
- Processes each vertex: model-space position, normals, texture coordinates, bone weights.
- Transforms vertices through Model -> World -> View -> Clip space.
- Runs the **vertex shader** (programmable) and optional geometry/tessellation shaders.
- Outputs homogeneous clip-space positions for the rasterizer.

**Rasterization Stage (GPU -- Fragment Processing)**
- Converts projected triangles into **fragments** (candidate pixels).
- Interpolates vertex attributes (UVs, normals, colors) across each triangle.
- Runs the **fragment shader** (programmable) per fragment to compute final color.
- Performs depth testing, stencil testing, and blending before writing to the framebuffer.

### 1.2 Forward vs Deferred Rendering

| Aspect | Forward | Deferred |
|---|---|---|
| Light scalability | O(objects x lights) -- expensive past ~100 dynamic lights | O(screen pixels x lights) -- handles thousands of lights |
| Memory | Low -- no G-Buffer needed | High -- G-Buffer stores albedo, normals, depth, roughness per pixel |
| Transparency | Handled naturally in the same pass | Must fall back to a forward pass for translucent objects |
| MSAA | Fully supported | Not natively supported (requires workarounds like FXAA/TAA) |
| Material variety | Unlimited shader complexity per object | Limited by G-Buffer layout; all materials share the same attribute set |

**Forward+ (Tiled/Clustered Forward)** is a hybrid approach that divides the screen into tiles, assigns lights to tiles on the GPU, then shades each fragment only against its tile's light list. This gives forward rendering's flexibility with deferred-like light scalability.

**Godot 4 Renderers:**
- **Forward+** (desktop only, Vulkan/D3D12) -- clustered lighting, SDFGI, VoxelGI support.
- **Mobile** (Vulkan/D3D12) -- single-pass forward, limited to 8 omni + 8 spot lights per mesh.
- **Compatibility** (OpenGL 3) -- broadest hardware support, fewest advanced features.

### 1.3 Render Passes and Framebuffers

A **framebuffer object (FBO)** is an off-screen render target with color, depth, and stencil attachments. Modern renderers chain multiple FBOs across several **render passes**:

1. **Shadow pass** -- renders depth from each light's perspective into shadow maps.
2. **Geometry / G-Buffer pass** (deferred only) -- writes albedo, normals, roughness, metallic, depth.
3. **Lighting pass** -- computes shading from G-Buffer data or in the forward pass.
4. **Transparency pass** -- forward-renders translucent objects sorted back-to-front.
5. **Post-processing passes** -- bloom, SSAO, tonemapping, etc., each reading/writing FBOs.

**Multiple Render Targets (MRT)** let a single draw call write to several color attachments simultaneously, which is essential for filling the G-Buffer in one pass.

---

## 2. 2D Rendering

### 2.1 Sprite Rendering and Batching

Sprite rendering draws textured quads (two triangles) for each on-screen element. The critical optimization is **draw call batching**: combining many sprites into a single GPU draw call.

**Batching requirements** -- sprites in the same batch must share:
- The same texture (or texture atlas)
- The same material / shader
- The same blend mode
- The same render state (stencil, depth)

**Texture atlases** pack many small images into one large texture so hundreds of sprites can be batched into a single draw call. Without atlasing, 100 sprites with unique textures require 100 draw calls and 100 texture binds.

**Sprite sorting strategies:**
- Sort by texture to maximize batching.
- Sort by Y-coordinate for top-down depth ordering.
- Use Z-index / layer for explicit ordering.

### 2.2 Tilemap Rendering

Tilemaps arrange tiles on a grid to build large environments efficiently.

**Key optimizations:**
- **Single renderer per tilemap** -- unlike individual sprites, the tilemap renderer batches all visible tile geometry into fewer, larger meshes.
- **Hybrid culling** -- only generate draw data for tiles visible within the camera viewport.
- **Pre-rendered chunks** -- cache groups of tiles into textures or static meshes so they do not need to be rebuilt every frame.
- **Tile data compression** -- store tile IDs in compact arrays (e.g., 16-bit indices into a palette).

### 2.3 2D Lighting

**Normal-map lighting** applies a per-pixel normal map to each sprite so that dynamic lights interact with surface detail. The engine samples the normal map and computes diffuse/specular lighting in screen space, producing convincing depth on flat sprites.

**2D shadow casting** techniques:
- **Raycasting from light source** -- cast rays toward geometry edges, build a visibility polygon, and render the illuminated area as a mesh.
- **Shadow geometry from occluders** -- extrude shadow volumes from sprite silhouettes or collider outlines.
- **Signed Distance Field (SDF) shadows** -- render the scene into an SDF, then march along rays for soft shadow falloff.

### 2.4 Pixel Art Rendering

- **Nearest-neighbor filtering** -- mandatory for pixel art to prevent blurring. Set texture import filter to `Nearest`.
- **Integer scaling** -- scale the viewport by whole multiples (2x, 3x, 4x) to keep pixels uniform.
- **Subpixel movement** -- when an object moves by fractional pixels, it causes "pixel shimmer." Solutions include snapping positions to the pixel grid, or rendering to a low-res viewport and upscaling.
- **Viewport approach** -- render the game at native pixel-art resolution (e.g., 320x180) in a sub-viewport, then stretch that viewport to fill the window with nearest-neighbor filtering.

### 2.5 Parallax Scrolling and Layers

Parallax scrolling moves background layers at different speeds relative to the camera to simulate depth.

```
Layer speed = base_speed * (1.0 - depth_factor)
```

- Foreground layers: `depth_factor` near 0 (move at camera speed).
- Background layers: `depth_factor` near 1 (move slowly or not at all).

**Implementation patterns:**
- **Repeating textures** -- tile background textures horizontally and wrap UV coordinates.
- **Per-scanline scrolling** (Mode 7 heritage) -- each row scrolls at a different rate, creating a pseudo-3D plane effect.
- **ParallaxBackground / ParallaxLayer nodes** in Godot handle this natively with `motion_scale` properties.

---

## 3. 2.5D Techniques

### 3.1 Isometric Rendering

Isometric projection uses a fixed camera angle where all three axes are equally foreshortened (true isometric = 120-degree separation). In games, **dimetric projection** with a 2:1 pixel ratio is most common.

**Coordinate conversion (screen <-> world):**
```
# World to screen (diamond layout)
screen_x = (world_x - world_y) * tile_width / 2
screen_y = (world_x + world_y) * tile_height / 2

# Screen to world
world_x = (screen_x / (tile_width/2) + screen_y / (tile_height/2)) / 2
world_y = (screen_y / (tile_height/2) - screen_x / (tile_width/2)) / 2
```

**Layout variants:**
- **Diamond** -- most common; tiles rotated 45 degrees.
- **Staggered** -- alternating row offsets; simpler for rectangular maps.
- **Hexagonal** -- six-sided tiles with offset or cube coordinates (see Red Blob Games' hexagonal grid reference for coordinate math).

**Depth sorting** is the central challenge: objects must be drawn back-to-front. For flat tilemaps this is row order; for multi-height objects, a topological sort or painter's algorithm on bounding boxes is needed.

### 3.2 Oblique Projection

Oblique projection keeps one face parallel to the screen while showing depth along a diagonal axis. Less common in games due to visual distortion, but used in some strategy and city-builder titles. The math is a shear transform applied to the view matrix.

### 3.3 Billboard Sprites in 3D Space

Billboards are 2D sprites placed in a 3D scene that always face the camera. Two types:

- **Spherical billboard** -- rotates on all axes to face the camera (particles, distant trees).
- **Cylindrical billboard** -- rotates only around the Y-axis (NPCs, signposts).

```glsl
// Vertex shader: spherical billboard
VERTEX = (MODEL_MATRIX * vec4(0, 0, 0, 1)).xyz
       + CAMERA_RIGHT * VERTEX.x * scale
       + CAMERA_UP * VERTEX.y * scale;
```

### 3.4 Mode 7 / Affine Transformations

Mode 7 (named after the SNES hardware mode) applies per-scanline rotation and scaling to a flat texture, creating a perspective floor/ceiling effect (as in F-Zero, Mario Kart). The technique applies an affine transformation matrix per raster line:

```
For each scanline y:
    scale = focal_length / (y - horizon)
    u = camera_x + (screen_x - center_x) * scale
    v = camera_y + direction * scale
    sample texture at (u, v)
```

### 3.5 Raycasting (Wolfenstein-Style)

Raycasting renders a pseudo-3D view from a 2D grid map by casting one ray per screen column.

**Algorithm (DDA -- Digital Differential Analyzer):**
1. For each column x (0..screen_width), compute ray direction from player angle.
2. Step the ray through the grid using DDA, checking each cell for a wall.
3. On wall hit, compute perpendicular distance to avoid fisheye distortion.
4. Wall column height = `screen_height / distance`.
5. Sample wall texture at the hit point's fractional coordinate.

This technique is extremely fast because it requires only `screen_width` rays (e.g., 320 for a classic display), not per-pixel calculations.

---

## 4. 3D Rendering

### 4.1 Mesh Rendering and Buffers

A mesh is defined by:
- **Vertex buffer** -- array of vertex attributes (position, normal, UV, tangent, color, bone weights).
- **Index buffer** -- array of integer indices that define triangles by referencing vertices, allowing vertex reuse.

**Vertex formats** should be packed tightly. A typical PBR vertex:
```
struct Vertex {
    vec3 position;   // 12 bytes
    vec3 normal;     // 12 bytes
    vec2 uv;         //  8 bytes
    vec4 tangent;    // 16 bytes (xyz + sign for bitangent)
};  // 48 bytes per vertex
```

### 4.2 Materials and Texture Mapping

**UV mapping** assigns 2D texture coordinates to each vertex. The GPU interpolates UVs across triangles and samples the texture.

**Triplanar mapping** projects textures along three world axes (X, Y, Z) and blends based on the surface normal direction. Useful for terrain and voxels where UV unwrapping is impractical:

```glsl
// Triplanar blend weights from world normal
vec3 blend = abs(NORMAL);
blend = normalize(max(blend, 0.00001));
blend /= (blend.x + blend.y + blend.z);

// Sample texture from three projections
vec4 x_proj = texture(albedo_tex, world_pos.yz);
vec4 y_proj = texture(albedo_tex, world_pos.xz);
vec4 z_proj = texture(albedo_tex, world_pos.xy);

ALBEDO = (x_proj * blend.x + y_proj * blend.y + z_proj * blend.z).rgb;
```

**Projective texture mapping** projects a texture from a point in space (like a projector), useful for decals and light cookies.

### 4.3 Physically Based Rendering (PBR)

PBR simulates light-material interaction based on physical principles, producing consistent results across all lighting conditions.

**Metallic-Roughness workflow** (industry standard, used by Godot, glTF, Unreal):
| Map | Purpose | Value Range |
|---|---|---|
| Albedo / Base Color | Surface color (no lighting baked in) | sRGB color |
| Metallic | Whether the surface is metal or dielectric | 0.0 (non-metal) to 1.0 (metal) |
| Roughness | Microsurface irregularity | 0.0 (mirror smooth) to 1.0 (fully rough) |
| Normal | Per-pixel surface direction perturbation | Tangent-space RGB |
| Ambient Occlusion | Self-shadowing in crevices | 0.0 (occluded) to 1.0 (exposed) |
| Emission | Self-illumination | HDR color |

**Core principles:**
- **Energy conservation** -- reflected light never exceeds incoming light; as roughness decreases, the specular highlight becomes smaller but brighter.
- **Microfacet theory** -- surfaces are modeled as collections of tiny flat mirrors; roughness controls their angular distribution.
- **Fresnel effect** -- surfaces become more reflective at grazing angles (Schlick's approximation: `F = F0 + (1 - F0) * pow(1 - cos_theta, 5)`).

### 4.4 Global Illumination

GI simulates indirect light bounces, filling shadows with colored ambient light.

| Technique | Real-time? | Scale | Quality | Engine Support |
|---|---|---|---|---|
| **Baked Lightmaps** | Bake-time only | Any | Highest (static) | All engines |
| **VoxelGI** | Yes | Small/medium rooms | Good, smooth | Godot (Forward+) |
| **SDFGI** | Yes | Large open worlds | Good, some artifacts | Godot (Forward+) |
| **SSIL/SSGI** | Yes (screen-space) | Complement to others | Detail only | Godot, Unity, Unreal |
| **LPV (Light Propagation Volumes)** | Yes | Medium | Lower quality | Unreal (legacy), custom |
| **Lumen** | Yes | Any | Excellent | Unreal 5 |

**Baked lightmaps** store pre-computed indirect lighting in texture atlases. They produce the highest quality static GI with minimal runtime cost, but cannot respond to dynamic objects or lights.

**SDFGI** uses cascaded signed distance fields to trace indirect light in real time, suitable for outdoor scenes. It requires no baking but can exhibit light leaking through thin geometry.

**VoxelGI** voxelizes the scene into a 3D texture and traces cones through it. Limited by VRAM to smaller enclosed spaces.

**Screen-space techniques** (SSIL, SSGI) only see what the camera sees, so they miss off-screen contributions. Best used as a supplement to another GI method for capturing small-scale detail and dynamic objects.

### 4.5 Shadow Techniques

**Shadow Mapping** -- the standard approach:
1. Render the scene from the light's point of view into a depth texture (shadow map).
2. During the main pass, project each fragment into light space and compare its depth to the shadow map.
3. If the fragment is farther than the stored depth, it is in shadow.

**Cascaded Shadow Maps (CSM)** split the view frustum into distance-based slices, each with its own shadow map. Nearby geometry gets higher-resolution shadows; distant geometry gets coarser coverage. Standard for directional lights in outdoor scenes.

**Variance Shadow Maps (VSM)** store both depth and depth-squared, enabling pre-filtering for soft shadow edges. They are susceptible to light bleeding but allow mipmap-based blur.

**Percentage-Closer Filtering (PCF)** samples multiple points around the shadow lookup and averages the binary results to produce soft edges.

**Ray-traced shadows** fire shadow rays from each fragment toward the light. They produce physically accurate soft shadows with penumbra proportional to light size and distance. Requires RT-capable hardware.

### 4.6 Post-Processing Effects

Post-processing operates on the rendered image in screen space after the main 3D pass.

**Bloom** -- extract bright pixels above a threshold, blur them (typically Gaussian in multiple passes), and add back to the original image. Creates light-bleed glow around bright surfaces.

**SSAO (Screen-Space Ambient Occlusion)** -- for each pixel, sample nearby depth values in a hemisphere around the surface normal. If many samples are occluded (closer than the surface), darken the pixel. Adds contact shadows in crevices and corners.

**SSR (Screen-Space Reflections)** -- ray-march through the depth buffer from each reflective pixel along its reflection vector. Produces sharp reflections but can only reflect what is on screen.

**Depth of Field (DOF)** -- blur pixels based on their distance from a focal plane, simulating camera lens behavior. Circle-of-confusion radius grows with distance from focus.

**Motion Blur** -- accumulate velocity vectors per pixel (from camera movement and object motion), then blur along those vectors. Creates a sense of speed and smooth temporal continuity.

**Tonemapping** -- maps HDR (high dynamic range) lighting values down to displayable LDR range. Common operators: Reinhard, ACES Filmic, AgX. Should be applied after bloom and before final output.

**Recommended pipeline order:**
```
Scene render -> SSAO -> SSR -> Transparency -> Bloom (HDR) ->
DOF (HDR) -> Motion Blur (HDR) -> Tonemapping -> Anti-aliasing -> Output
```

---

## 5. Shader Programming

### 5.1 Shader Types

**Vertex Shader** -- runs once per vertex. Transforms positions, computes per-vertex lighting, passes `varying`/`out` data to the fragment stage. In Godot, this is the `vertex()` function.

**Fragment Shader** -- runs once per fragment (potential pixel). Computes final color, samples textures, applies lighting models. In Godot, this is the `fragment()` function.

**Compute Shader** -- runs independently of the graphics pipeline on arbitrary data. Used for particle simulation, GPU-based culling, procedural generation, and physics. Dispatched in workgroups with shared local memory.

### 5.2 Shader Languages

| Language | API | Notes |
|---|---|---|
| **GLSL** | OpenGL / Vulkan (SPIR-V compiled) | C-like syntax, most common in cross-platform engines |
| **HLSL** | Direct3D / Vulkan (via DXC) | Microsoft standard, dominant on Windows/Xbox |
| **Godot Shading Language** | Godot Engine | GLSL-like with simplified built-ins; compiles to GLSL/SPIR-V internally |
| **WGSL** | WebGPU | Emerging standard for web-based GPU compute and rendering |
| **Metal Shading Language** | Apple Metal | C++-based, Apple platforms only |

**Godot shader structure:**
```gdshader
shader_type spatial;  // or canvas_item, particles, sky, fog

uniform sampler2D albedo_texture;
uniform float roughness : hint_range(0.0, 1.0) = 0.5;

void vertex() {
    // Transform vertices, pass varyings
}

void fragment() {
    ALBEDO = texture(albedo_texture, UV).rgb;
    ROUGHNESS = roughness;
    METALLIC = 0.0;
}

void light() {
    // Custom per-light calculations (optional)
}
```

**Converting GLSL to Godot shaders:**
- Rename `main()` to `vertex()` or `fragment()`.
- Replace `gl_Position` with built-in `VERTEX` / `POSITION`.
- Replace `gl_FragColor` with `ALBEDO`, `EMISSION`, etc.
- Replace `uniform sampler2D` texture lookups with Godot hint annotations.

### 5.3 Common Shader Patterns

**Toon / Cel Shading:**
Quantize the diffuse lighting into discrete steps to produce flat, cartoon-like shading bands.
```gdshader
void light() {
    float NdotL = dot(NORMAL, LIGHT);
    float intensity = smoothstep(0.0, 0.01, NdotL);  // Hard step
    // Quantize to N bands:
    intensity = floor(intensity * 3.0) / 3.0;
    DIFFUSE_LIGHT += ATTENUATION * LIGHT_COLOR * intensity;
}
```

**Outline / Silhouette (inverted hull method):**
Render back-faces extruded along normals in a separate pass:
```gdshader
shader_type spatial;
render_mode cull_front, unshaded;

uniform float outline_width = 0.02;
uniform vec4 outline_color : source_color = vec4(0, 0, 0, 1);

void vertex() {
    VERTEX += NORMAL * outline_width;
}

void fragment() {
    ALBEDO = outline_color.rgb;
}
```

**Dissolve Effect:**
Use a noise texture and a threshold uniform to discard pixels progressively:
```gdshader
shader_type spatial;

uniform sampler2D noise_texture;
uniform float dissolve_amount : hint_range(0.0, 1.0) = 0.0;
uniform vec4 edge_color : source_color = vec4(1.0, 0.5, 0.0, 1.0);
uniform float edge_width = 0.05;

void fragment() {
    float noise_val = texture(noise_texture, UV).r;
    if (noise_val < dissolve_amount) {
        discard;
    }
    // Glow at dissolve edge
    float edge = smoothstep(dissolve_amount, dissolve_amount + edge_width, noise_val);
    EMISSION = edge_color.rgb * (1.0 - edge) * 3.0;
    ALBEDO = texture(albedo_texture, UV).rgb;
}
```

**Water Surface:**
Combine animated UV distortion, depth-based coloring, and Fresnel reflections:
```gdshader
void fragment() {
    vec2 distorted_uv = UV + vec2(
        sin(UV.y * 10.0 + TIME * 2.0) * 0.01,
        cos(UV.x * 10.0 + TIME * 1.5) * 0.01
    );
    // Depth-based color (shallow vs deep)
    float depth = texture(DEPTH_TEXTURE, SCREEN_UV).r;
    // ... reconstruct linear depth, blend shore/deep colors
    float fresnel = pow(1.0 - dot(NORMAL, VIEW), 3.0);
    ALBEDO = mix(deep_color, shore_color, depth_factor);
    SPECULAR = fresnel * 0.5;
}
```

**Fog (distance-based):**
```gdshader
void fragment() {
    float depth = length(VERTEX);  // distance from camera
    float fog_factor = clamp((depth - fog_start) / (fog_end - fog_start), 0.0, 1.0);
    ALBEDO = mix(surface_color, fog_color.rgb, fog_factor);
}
```

### 5.4 Shader Optimization

- **Minimize branching** -- GPUs run threads in lockstep (SIMD warps of 32-64). Divergent branches force both paths to execute. Use `mix()`, `step()`, `smoothstep()` instead of `if/else` where possible.
- **Reduce texture lookups** -- pack multiple channels into one texture (e.g., roughness in R, metallic in G, AO in B). Use texture arrays or atlases.
- **Use smallest data types** -- `mediump` / `lowp` precision qualifiers on mobile; `vec2` instead of `vec4` when only two components are needed.
- **Precompute on CPU** -- pass pre-computed values as uniforms rather than recalculating per-pixel.
- **Early exit can help** -- `if (alpha < 0.001) discard;` saves subsequent computation for transparent pixels.
- **Avoid dependent texture reads** -- compute UVs in the vertex shader and pass as varyings rather than computing them in the fragment shader.

---

## 6. Camera Systems

### 6.1 Projection Types

**Perspective projection** -- mimics human vision; distant objects appear smaller. Defined by field of view (FOV), aspect ratio, and near/far planes. Standard for 3D games.

**Orthographic projection** -- no perspective foreshortening; parallel lines remain parallel. Defined by view volume width/height. Used for 2D games, isometric views, UI rendering, and shadow map generation.

**Custom projections** -- oblique near-plane clipping for portals/mirrors, asymmetric frustums for VR eye offsets, infinite far planes for skyboxes.

### 6.2 Camera Behaviors

**Smooth follow** -- interpolate toward the target using a critically-damped spring or exponential decay to avoid jerky movement:
```gdscript
# Exponential smoothing (frame-rate independent)
position = position.lerp(target.position + offset, 1.0 - exp(-speed * delta))
```

**Camera shake** -- add random offset and rotation, decaying over time. Use Perlin noise for organic shake rather than pure random for smoother results. Different shake profiles for different events (subtle for footsteps, heavy for explosions).

**Look-ahead** -- offset the camera in the direction of player movement so the player can see more of what is ahead.

**Dead zone** -- define a rectangular region in screen space; the camera only moves when the target exits this zone.

**Cinematic camera** -- scripted spline paths with easing curves for cutscenes. Blend between gameplay and cinematic cameras using a `lerp` or cross-fade on the transform.

### 6.3 Split-Screen and Multi-Viewport

Each viewport renders its own camera into its own framebuffer. In Godot, use `SubViewport` nodes with individual `Camera3D` / `Camera2D` nodes. Considerations:
- Rendering cost scales linearly with viewport count.
- Shared world state but independent culling per viewport.
- UI overlays may need per-viewport or shared HUD strategies.

---

## 7. Culling and Optimization

### 7.1 Frustum Culling

Tests each object's bounding volume (AABB or bounding sphere) against the six planes of the camera's view frustum. Objects entirely outside are skipped. This is nearly universal and typically automatic in engines (Godot performs frustum culling on all `VisualInstance3D` nodes).

### 7.2 Occlusion Culling

Determines which objects are hidden behind other geometry and skips rendering them. Methods:
- **Hardware occlusion queries** -- ask the GPU if any pixels passed depth testing for a bounding box.
- **Hierarchical Z-buffer (Hi-Z)** -- build a mipmap pyramid of the depth buffer; test bounding boxes against coarse depth levels.
- **Software rasterization** -- rasterize simplified occluder meshes on the CPU to build an occlusion buffer.
- **Godot's OccluderInstance3D** -- place occluder shapes in the scene for the engine's occlusion system.

### 7.3 Level of Detail (LOD)

Swap high-poly meshes for lower-poly versions as they move away from the camera.

**Discrete LOD** -- predefined mesh variants (LOD0, LOD1, LOD2) selected by distance thresholds. Risk of "popping" at transitions.

**Continuous LOD** -- dynamically simplify meshes (e.g., progressive meshes). Smoother transitions but more complex.

**Cross-fade / dithering transitions** -- blend between LOD levels using alpha dithering to hide the switch.

**HLOD (Hierarchical LOD)** -- merge distant objects into combined meshes to reduce draw calls for far-away clusters (used in open-world games).

### 7.4 GPU Instancing and Draw Call Batching

**GPU instancing** renders many copies of the same mesh in a single draw call, with per-instance data (transform, color, etc.) passed via instance buffers or uniform arrays. Highly effective for vegetation, particles, debris, and building windows.

**Static batching** -- combine meshes that share a material at build time into a single large mesh. Trades memory for fewer draw calls.

**Dynamic batching** -- engine combines small meshes at runtime. Limited by vertex count and attribute matching.

**Indirect rendering** -- the GPU generates draw commands itself (via compute shaders), enabling fully GPU-driven pipelines with per-instance culling and LOD selection without CPU round-trips.

### 7.5 Texture Atlasing and Streaming

**Texture atlases** combine many small textures into one large texture. This allows sprites and UI elements sharing an atlas to be batched into a single draw call.

**Virtual texturing / texture streaming** -- only load texture tiles (pages) that are actually visible at the current camera position and mip level. Reduces VRAM usage for large open worlds with many unique textures. Implemented as "Virtual Textures" in Unreal and as custom systems in other engines.

---

## 8. Voxel Rendering

This section is directly relevant to Chat Attack's godot-voxel (Zylann) chunk-based terrain system.

### 8.1 Meshing Approaches

**Naive meshing** -- generate one quad per exposed voxel face. Simple but produces massive vertex counts (up to 6 quads x 2 triangles per voxel).

**Greedy meshing** -- merge adjacent faces that share the same material/texture into larger rectangles. Dramatically reduces triangle count (often 10-50x reduction). Algorithm:
1. For each slice along an axis, build a 2D grid of exposed faces.
2. Sweep row by row; grow rectangles as wide and tall as possible while faces match.
3. Mark consumed faces and continue.

Greedy meshing integrates well with ambient occlusion when faces with different AO values are treated as non-mergeable.

**Marching cubes** -- converts a scalar field (density values at grid points) into smooth triangle meshes. Produces organic, rounded terrain rather than blocky voxels. Uses a lookup table of 256 possible cube configurations to determine triangle placement. Produces more triangles than greedy meshing but enables smooth terrain.

**Dual contouring** -- similar to marching cubes but preserves sharp features by placing vertices at optimal positions using Hermite data (position + normal at intersections).

### 8.2 Chunk-Based Rendering and LOD

**Chunk architecture:**
- World is divided into chunks (commonly 16x16x16 or 32x32x32 voxels).
- Each chunk generates its own mesh independently, enabling incremental updates.
- Only re-mesh the chunk that was modified (plus neighbors for seamless face culling).
- Chunks outside the view distance are unloaded from VRAM.

**Voxel LOD strategies:**
- **Octree-based LOD** -- subdivide chunks into an octree; distant regions use coarser voxel resolution (e.g., 2x2x2 voxels merged into one).
- **Transvoxel algorithm** -- generates transition meshes between chunks at different LOD levels to prevent cracks at boundaries.
- **Clipmap LOD** -- nested rings of increasing voxel size centered on the camera (used by godot-voxel's `VoxelLodTerrain`).

### 8.3 Ambient Occlusion for Voxels

Voxel AO is computed during mesh generation by examining the 3x3 neighborhood around each vertex:

```
For each vertex of a face:
    Count occupied voxels in the 4 adjacent corners:
    side1 = is_solid(neighbor_1)
    side2 = is_solid(neighbor_2)
    corner = is_solid(diagonal_neighbor)

    if side1 AND side2:
        ao = 0  (fully occluded -- both sides block)
    else:
        ao = 3 - (side1 + side2 + corner)

    // ao ranges from 0 (dark) to 3 (bright)
    // Normalize to 0.0-1.0 and store as vertex color
```

This per-vertex AO is baked into the mesh and interpolated across faces, providing soft contact shadows at edges and corners for minimal runtime cost. The visual improvement is significant -- it adds depth and readability to voxel structures.

**Integration with greedy meshing:** faces can only be merged if all four vertex AO values match, preventing AO artifacts on merged quads.

**Smooth AO interpolation fix:** when two opposing corners have different AO values, flipping the quad's diagonal prevents interpolation artifacts (the "anisotropy fix").

---

## 9. Engine-Specific Notes (Godot 4)

### Rendering Architecture
- Godot 4 uses the **RenderingDevice** abstraction over Vulkan and D3D12.
- The **RenderingServer** is the low-level singleton that manages all rendering state.
- 2D and 3D rendering are separate pipelines; 2D uses a dedicated canvas renderer with batching.

### Shader Types in Godot
| Type | Keyword | Use |
|---|---|---|
| 3D surfaces | `shader_type spatial` | Meshes, terrain, characters |
| 2D / UI | `shader_type canvas_item` | Sprites, tilemaps, Control nodes |
| Particles | `shader_type particles` | GPU particle behavior |
| Sky | `shader_type sky` | Procedural skyboxes |
| Fog | `shader_type fog` | Volumetric fog volumes |

### Performance Tools
- **Godot Profiler** (Debugger > Profiler) -- frame time breakdown.
- **RenderingServer.get_rendering_info()** -- draw call count, vertex count, texture memory.
- **Monitors panel** -- real-time graphs for FPS, physics, memory.
- Enable `rendering/driver/debug/visible_collision_shapes` for visual debugging.

---

## Citations

### Rendering Pipeline & Forward vs Deferred
- [LearnOpenGL - Deferred Shading](https://learnopengl.com/Advanced-Lighting/Deferred-Shading)
- [Forward+ Rendering - 3D Game Engine Programming](https://www.3dgep.com/forward-plus/)
- [Unreal Art Optimization - Forward vs Deferred](https://unrealartoptimization.github.io/book/pipelines/forward-vs-deferred/)
- [Graphics Pipeline - Wikipedia](https://en.wikipedia.org/wiki/Graphics_pipeline)
- [OpenGL Wiki - Rendering Pipeline Overview](https://www.khronos.org/opengl/wiki/Rendering_Pipeline_Overview)
- [NVIDIA GPU Gems - Graphics Pipeline Performance](https://developer.nvidia.com/gpugems/gpugems/part-v-performance-and-practicalities/chapter-28-graphics-pipeline-performance)
- [LearnOpenGL - Framebuffers](https://learnopengl.com/Advanced-OpenGL/Framebuffers)
- [OpenGL FBO Reference](https://www.songho.ca/opengl/gl_fbo.html)

### Godot Rendering
- [Godot Docs - Overview of Renderers](https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html)
- [Godot Docs - Shading Language](https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/shading_language.html)
- [Godot Docs - Introduction to Shaders](https://docs.godotengine.org/en/stable/tutorials/shaders/introduction_to_shaders.html)
- [Godot Docs - Converting GLSL to Godot Shaders](https://docs.godotengine.org/en/stable/tutorials/shaders/converting_glsl_to_godot_shaders.html)
- [Godot Docs - Global Illumination Systems](https://deepwiki.com/godotengine/godot-docs/3.3-global-illumination-systems)
- [Godot Docs - Using SDFGI](https://github.com/godotengine/godot-docs/blob/master/tutorials/3d/global_illumination/using_sdfgi.rst)
- [Godot Docs - Using Lightmap GI](https://docs.godotengine.org/en/stable/tutorials/3d/global_illumination/using_lightmap_gi.html)
- [Godot Engine - 2D Batching Optimization](https://godotengine.org/article/gles2-renderer-optimization-2d-batching/)
- [Godot Shaders - Dissolve Effect](https://godotshaders.com/shader/dissolve-godot-4-x/)

### 2D Rendering
- [LearnOpenGL - Rendering Sprites](https://learnopengl.com/In-Practice/2D-Game/Rendering-Sprites)
- [MDN - Tiles and Tilemaps Overview](https://developer.mozilla.org/en-US/docs/Games/Techniques/Tilemaps)
- [Unity - Optimize 2D Games with Tilemap](https://unity.com/how-to/optimize-performance-2d-games-unity-tilemap)
- [GameDev.net - Sprite Batching Techniques](https://www.gamedev.net/forums/topic/637848-sprite-batching-and-other-sprite-rendering-techniques/5026227/)
- [GameMaker - Using Normal Maps for 2D Lighting](https://gamemaker.io/en/blog/using-normal-maps-to-light-your-2d-game)
- [GitHub - 2D Pixel Perfect Shadows](https://github.com/mattdesl/lwjgl-basics/wiki/2D-Pixel-Perfect-Shadows)
- [Ncase - Sight & Light (2D Visibility)](https://ncase.me/sight-and-light/)

### 2.5D & Isometric
- [Pikuma - Isometric Projection in Games](https://pikuma.com/blog/isometric-projection-in-games)
- [Isometric Video Game Graphics - Wikipedia](https://en.wikipedia.org/wiki/Isometric_video_game_graphics)
- [Red Blob Games - Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/)
- [Envato Tuts+ - Creating Isometric Worlds](https://code.tutsplus.com/creating-isometric-worlds-a-primer-for-game-developers--gamedev-6511t)
- [Parallax Scrolling - Wikipedia](https://en.wikipedia.org/wiki/Parallax_scrolling)
- [2.5D - Wikipedia](https://en.wikipedia.org/wiki/2.5D)

### Raycasting
- [Lodev - Raycasting Tutorial](https://lodev.org/cgtutor/raycasting.html)
- [Ray Casting - Wikipedia](https://en.wikipedia.org/wiki/Ray_casting)
- [Pikuma - Raycasting Engine Course](https://pikuma.com/courses/raycasting-engine-tutorial-algorithm-javascript)

### PBR & Materials
- [LearnOpenGL - PBR Theory](https://learnopengl.com/PBR/Theory)
- [Marmoset - Physically Based Rendering and You Can Too](https://marmoset.co/posts/physically-based-rendering-and-you-can-too/)
- [TurboSquid - Intro to PBR Metallic/Roughness](https://blog.turbosquid.com/2023/07/27/an-intro-to-physically-based-rendering-material-workflows-and-metallic-roughness/)
- [Catlike Coding - Triplanar Mapping](https://catlikecoding.com/unity/tutorials/advanced-rendering/triplanar-mapping/)
- [Ronja's Tutorials - Triplanar Mapping](https://www.ronja-tutorials.com/post/010-triplanar-mapping/)
- [UV Mapping - Wikipedia](https://en.wikipedia.org/wiki/UV_mapping)

### Shadows
- [Microsoft Learn - Cascaded Shadow Maps](https://learn.microsoft.com/en-us/windows/win32/dxtecharts/cascaded-shadow-maps)
- [Stanford - Variance Shadow Maps](https://graphics.stanford.edu/~mdfisher/Shadows.html)
- [Shadow Mapping - Wikipedia](https://en.wikipedia.org/wiki/Shadow_mapping)
- [The Real MJP - A Sampling of Shadow Techniques](https://therealmjp.github.io/posts/shadow-maps/)
- [Imagination Tech - Ray Traced Soft Shadows](https://blog.imaginationtech.com/implementing-fast-ray-traced-soft-shadows-in-a-game-engine/)

### Post-Processing
- [LearnOpenGL - Bloom](https://learnopengl.com/Advanced-Lighting/Bloom)
- [Rendering Evolution - Order of Post-Process Effects](https://www.renderingevolution.net/?p=103)
- [Bart Wronski - Next-Gen Post-Effects Pipeline](https://bartwronski.com/2014/12/09/designing-a-next-generation-post-effects-pipeline/)

### Shader Optimization
- [NVIDIA Developer Blog - Advanced API Performance: Shaders](https://developer.nvidia.com/blog/advanced-api-performance-shaders/)
- [Microsoft Learn - Optimizing HLSL Shaders](https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-optimize)
- [Dev.to - Shader Performance Optimization Tips](https://dev.to/hayyanstudio/turbocharge-your-shaders-performance-optimization-tips-and-tricks-367h)

### Shader Patterns
- [Torchinsky - Cel-Shading Tricks](https://torchinsky.me/cel-shading/)
- [Wikibooks - GLSL Toon Shading](https://en.wikibooks.org/wiki/GLSL_Programming/Unity/Toon_Shading)
- [Roystan - Toon Water Shader](https://roystan.net/articles/toon-water/)
- [Daniel Ilett - Godot Visual Shader Effects](https://danielilett.com/2024-02-06-tut8-1-godot-shader-intro/)

### Camera Systems
- [Generalist Programmer - Game Camera Systems Guide 2025](https://generalistprogrammer.com/tutorials/game-camera-systems-complete-programming-guide-2025/)
- [Gamasutra / Game Developer - Scroll Back: Cameras in Side-Scrollers](https://www.gamedeveloper.com/design/scroll-back-the-theory-and-practice-of-cameras-in-side-scrollers)
- [Little Polygon - Third Person Cameras in Games](https://blog.littlepolygon.com/posts/cameras/)

### Culling & Optimization
- [Unity Docs - GPU Instancing](https://docs.unity3d.com/Manual/GPUInstancing.html)
- [Medium - Efficient GPU Rendering for Dynamic Instances](https://medium.com/@kacper.szwajka842/efficient-gpu-rendering-for-dynamic-instances-in-game-development-9cef0b1eeeb6)
- [Wayline - Optimizing GPU Performance](https://www.wayline.io/blog/optimizing-gpu-performance-real-time-rendering-techniques)

### Voxel Rendering
- [0fps - Meshing in a Minecraft Game (Greedy Meshing)](https://0fps.net/category/programming/voxels/)
- [0fps - Ambient Occlusion for Minecraft-like Worlds](https://0fps.net/2013/07/03/ambient-occlusion-for-minecraft-like-worlds/)
- [0fps - Level of Detail for Blocky Voxels](https://0fps.net/2018/03/03/a-level-of-detail-method-for-blocky-voxels/)
- [Spacefarer - Voxel Meshing for the Rest of Us](https://playspacefarer.com/voxel-meshing/)
- [Spacefarer - Adding Ambient Occlusion to Voxel Meshers](https://playspacefarer.com/ambient-occlusion/)
- [The Numb At - Voxel Meshing in Exile](https://thenumb.at/Voxel-Meshing-in-Exile/)
- [Nick's Blog - High Performance Voxel Engine](https://nickmcd.me/2021/04/04/high-performance-voxel-engine/)
