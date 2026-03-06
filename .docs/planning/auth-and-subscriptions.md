# Auth and Subscriptions

## Why This Matters
The product spans schools, private users, and potentially minors. Authentication and access control are therefore foundational even if monetization details are deferred.

## Auth Planning Assumptions
- Individual accounts for teachers, students, and private users
- Organization or classroom containers for school use
- Session invites and lobby joins with host approval policies
- Role assignment within a session independent from base account role

## Identity Modes to Evaluate
| Mode | Strengths | Weaknesses | Fit |
|---|---|---|---|
| Email/password + magic link | Simple cross-audience support | Extra auth maintenance | Strong default candidate |
| Google/Microsoft OAuth | Familiar for schools | School admin constraints vary | Good institutional option |
| Classroom roster codes only | Fast onboarding | Weak identity assurance | Good temporary/guest layer |
| SSO / SAML later | Enterprise-ready | Higher complexity | Phase-later feature |

## Authorization Layers
- Platform role: admin, educator, learner, independent user
- Organization role: org admin, teacher, assistant, student
- Session role: judge, attorney, witness, juror, staff, spectator
- Content role: author, reviewer, restricted viewer

## Subscription Thinking
This should remain open until product scope is tighter, but likely models include:
- free individual sandbox tier
- educator subscription tier
- classroom or school-seat licensing
- institutional licensing with admin controls and reporting

## Billing Unknowns
- Whether AI usage is bundled or metered
- Whether spectator capacity affects pricing
- Whether private case libraries are premium

## Recommendation for Planning
Assume authentication is required for production and organization support is important. Keep billing and packaging open until after architecture and product-shape review.
