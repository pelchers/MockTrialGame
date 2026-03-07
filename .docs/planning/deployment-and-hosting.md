# Deployment and Hosting

## Hosting Goals
- Reliable realtime session hosting
- Clear separation between public client delivery and authoritative session services
- Scalable AI integration without forcing AI into the critical path for every action
- Compliance-friendly data boundaries for educational use

## Environment Layers
- **Client delivery:** CDN-hosted web app
- **API and session services:** region-aware application hosts
- **Database:** managed relational store
- **Realtime support:** websocket/session service plus default media service for voice/video
- **Object storage:** exhibits, transcripts, exports, reconstruction assets
- **AI runtime:** managed inference or self-hosted inference depending model choice and cost profile

## Topology Options
| Option | Description | Strengths | Risks |
|---|---|---|---|
| Managed web + managed DB + managed realtime | Fastest to ship | Lowest ops overhead | Vendor constraints |
| Containerized app on cloud platform | More control over session services | Flexible scaling | Higher DevOps load |
| Split architecture with separate media/AI services | Best long-term modularity | Clear isolation of risky subsystems | More moving parts |

## Planning Recommendation
Prototype with a topology that preserves architectural separation:
- web app and API/session layer separated logically
- media present by default but degradable without affecting core trial-state continuity
- AI inference isolated behind service boundaries
- storage separated by structured data vs asset data

## Unknowns
- Region requirements for schools
- Retention requirements for transcripts or recordings
- Need for on-prem or private-cloud variants
