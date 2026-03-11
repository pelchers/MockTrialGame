# Sourced Realtime and Media Research

## Purpose
This document records source-backed research for the authoritative session layer and the default voice/video/text communication model.

## Research Takeaways
### WebRTC is the right baseline for browser media, not authoritative game state
The official WebRTC project materials remain the clearest basis for browser-native real-time audio/video. That supports the current product decision to use browser-native media patterns rather than inventing a custom media transport.

### Voice/video should stay operationally separate from courtroom authority
Because WebRTC media requires signaling and network traversal support, the authoritative trial state should remain server-driven and independent from whether media is currently healthy. This matches the current product posture: media by default, but text-only fallback without session breakage.

### TURN/STUN and firewall realities are first-order design concerns
LiveKit's official docs are useful here because they make the operational point concrete: browser media at scale is not just a frontend choice. It requires media-server strategy, NAT traversal, and firewall-aware deployment planning.

### The authoritative session layer should remain event-driven
Colyseus is still a serious candidate because its official model is built around synchronized rooms and stateful session orchestration. It is not the only answer, but it remains a plausible fit for room-based trial sessions if its abstractions map cleanly to legal flow.

### Frontend framework choice should not decide session authority
Next.js and SvelteKit are both viable app-shell candidates, but the authority model belongs in the session-service layer. This supports keeping frontend selection and authoritative realtime design as linked but separate decisions.

## Implementation Implications
- Keep authoritative trial state on the server.
- Treat media as a parallel service layer with graceful degradation.
- Support reconnect and text fallback even when media fails.
- Decide early whether the session-service abstraction is custom WebSocket/event infrastructure or a room abstraction such as Colyseus.

## Critical Research Gaps Still Open
- Exact signaling and media topology
- Whether LiveKit-class infrastructure is the preferred operational path
- Recording posture and retention policy
- Classroom-network tolerance targets and low-bandwidth behavior

## Sources
- WebRTC project overview and getting started: https://webrtc.org/getting-started/overview
- LiveKit docs overview: https://docs.livekit.io/
- LiveKit self-hosting / deployment docs: https://docs.livekit.io/home/self-hosting/
- Next.js official docs: https://nextjs.org/docs
- SvelteKit official docs: https://svelte.dev/docs/kit/introduction
- Colyseus official docs: https://docs.colyseus.io/
