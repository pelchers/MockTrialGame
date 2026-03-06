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
| Colyseus-based room model | Purpose-built multiplayer room abstractions | Good for stateful session orchestration | Game-centric patterns may need adaptation for legal workflow rigor | Strong prototype candidate |
| Go realtime service | High performance and concurrency | Efficient for session core | Higher split-stack cost | Good later option if performance pressure demands it |
| Peer-to-peer core using WebRTC data channels | Low server state cost | Interesting for informal play | Harder authority, moderation, audit, and school-network reliability | Poor primary fit |

## 3D Reconstruction Options
| Option | Summary | Strengths | Weaknesses | Fit |
|---|---|---|---|---|
| Three.js / React Three Fiber | Most common browser 3D path | Flexible, large ecosystem | More engineering assembly required | Strong default candidate |
| Babylon.js | Structured engine with rich features | Good scene tooling and docs | Larger abstraction footprint | Strong alternative |
| PlayCanvas | Browser-focused engine/editor model | Useful for content workflows | Less alignment with broader app-shell patterns | Worth evaluating |

## Media / Presence Options
| Option | Summary | Strengths | Weaknesses | Fit |
|---|---|---|---|---|
| Text-first, no voice/video initially | Keeps focus on procedure and state | Lowest complexity | Less immersive | Best phase-one planning assumption |
| Optional voice/video via WebRTC service | Improves realism | NAT/TURN and moderation complexity | Good later phase |
| Full voice/video first-class | Highest immersion | Expensive and operationally heavy | Not recommended before session core is proven |

## Preliminary Recommendation
Start evaluation around:
- Next.js or SvelteKit for the client
- Node/TypeScript authoritative session service, with Colyseus considered during prototyping
- PostgreSQL-class relational persistence
- Three.js or Babylon.js for the reconstruction sandbox
- Text-first courtroom channels, voice/video deferred
