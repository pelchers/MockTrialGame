# Sourced AI Model Research

## Purpose
This document records source-backed research for the first AI model portfolio and deployment posture.

## Research Takeaways
### Server-hosted inference still looks like the correct default
The current product needs consistent behavior, auditability, and role-specific control. That continues to favor server-hosted inference as the launch default, even if local inference remains attractive for later institutional or desktop variants.

### Small-to-mid open model families remain the right research band
The most promising launch-era research band remains compact models that can handle:
- tutor and glossary assistance
- transcript summaries
- structured role prompts
- constrained witness/juror simulation

### Mistral, Gemma, Qwen, and Phi remain the most practical families to probe first
Official model and platform materials still support the current planning direction:
- Mistral for strong server-hosted small-model workflows
- Gemma for openly available compact models and ecosystem support
- Qwen for broad open-model capability and multilingual flexibility
- Phi for smaller-footprint utility and constrained-assistant scenarios

### AI judges should remain advisory-first
The legal-risk profile is still too high for unconstrained AI judges. Advisory-only or heavily constrained behavior remains the right launch posture until a serious evaluation harness exists.

## Decision Implications
- Launch with a mixed portfolio rather than one model for everything.
- Keep the side-panel tutor and transcript workflows separate from official trial authority.
- Treat AI witness and juror support as bounded simulation problems, not open-ended chat.
- Do not let model selection outrun the evaluation plan.

## Critical Research Gaps Still Open
- Exact launch model portfolio
- Exact commercial and operational constraints per chosen release
- Role-by-role evaluation rubric
- Latency and cost envelope by session size

## Sources
- Mistral platform and models: https://mistral.ai/products/la-plateforme
- Mistral Small 3.1 announcement: https://mistral.ai/news/mistral-small-3-1
- Gemma official docs: https://ai.google.dev/gemma
- Gemma 3 model page: https://ai.google.dev/gemma/docs/model-card
- Azure AI Phi product page: https://azure.microsoft.com/en-us/products/phi/
- Qwen official site: https://qwenlm.github.io/
- Meta open source AI overview: https://ai.meta.com/opensourceAI/
