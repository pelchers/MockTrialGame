# Architecture Options Comparison

## Decision Posture
No stack is selected yet. The goal of this document is to frame sensible options for later discussion.

## Frontend and App Shell Options
| Option | Summary | Strengths | Weaknesses | Fit |
|---|---|---|---|---|
| Next.js + React + TypeScript | Broad ecosystem, SSR-capable, good app-shell maturity | Hiring pool, tooling depth, UI flexibility | Can become complex in highly interactive realtime apps | Strong default candidate |
| SvelteKit + TypeScript | Lean runtime and simpler mental model | Excellent reactivity and smaller client weight | Smaller ecosystem for some enterprise patterns | Strong alternative |
| Nuxt + Vue | Solid full-stack DX and good composition patterns | Good authoring experience | Smaller fit with likely realtime/game tooling preferences in this project | Worth reviewing |
| Godot Web client hybrid | Strong simulation/game ergonomics | Powerful scene tooling | Heavier browser tradeoffs and weaker web-app norms | Better for later experimental client, not main default |

## Authoritative Realtime Options
| Option | Summary | Strengths | Weaknesses | Fit |
|---|---|---|---|---|
| Node/TypeScript + WebSocket framework | Straightforward custom command/event architecture | Flexible, ecosystem fit with TS frontend | Requires disciplined state modeling | Strong default candidate |
| Colyseus-based room model | Purpose-built multiplayer room abstractions | Good for stateful session orchestration | Game-centric patterns may need adaptation for legal workflow rigor | Strong implementation candidate |
| Go realtime service | High performance and concurrency | Efficient for session core | Higher split-stack cost | Good later option if performance pressure demands it |
| Peer-to-peer core using WebRTC data channels | Low server state cost | Interesting for informal play | Harder authority, moderation, audit, and school-network reliability | Poor primary fit |

## 3D Reconstruction Options
| Option | Summary | Strengths | Weaknesses | Fit |
|---|---|---|---|---|
| Three.js / React Three Fiber | Most common browser 3D path | Flexible, large ecosystem | More engineering assembly required | Strong default candidate |
| Babylon.js | Structured engine with rich features | Good scene tooling and docs | Larger abstraction footprint | Strong alternative |
| PlayCanvas | Browser-focused engine/editor model | Useful for content workflows | Less alignment with broader app-shell patterns | Worth evaluating |

## 3D Runtime Strategy
Using all three engines as first-class runtime dependencies in the same product is usually a bad default. It multiplies:
- rendering abstractions
- scene and asset pipelines
- developer tooling and debugging burden
- bundle weight and performance risk
- long-term maintenance cost

The better default is:
- choose one primary runtime for the in-product reconstruction sandbox
- allow separate evaluation spikes or tooling experiments in other engines if a specific need appears
- only mix runtimes later if they are isolated behind clear boundaries and justified by a concrete use case

Current planning default:
- pick one main browser 3D runtime for the shipped product
- keep the other engines as comparison candidates, not co-equal runtime dependencies

## Media / Presence Options
| Option | Summary | Strengths | Weaknesses | Fit |
|---|---|---|---|---|
| Voice + video + text in tandem by default | Most natural courtroom-presence model | Strong immersion and accessibility overlap | Highest media complexity | Approved planning direction |
| Text-only fallback mode | Preserves accessibility and degraded-network usability | Reliable under constrained conditions | Less expressive by itself | Required fallback |
| Voice or video selectively disabled per participant | Flexible accommodation path | Supports privacy, bandwidth, or device limits | More settings complexity | Should be supported |

## Preliminary Recommendation
Start evaluation around:
- Next.js or SvelteKit for the client
- Node/TypeScript authoritative session service, with Colyseus considered during final stack selection
- PostgreSQL-class relational persistence
- Three.js or Babylon.js as the single primary reconstruction runtime
- Voice + video + text enabled together by default, with text-only fallback when needed
