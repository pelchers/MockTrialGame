# AI Model Options Comparison

## AI Use Cases in Scope
- Tutor/explainer side panel
- AI witness simulation
- AI juror reasoning support or juror fill-ins
- AI judge behavior under strict constraints
- Transcript summarization and feedback generation

## Evaluation Criteria
- commercial-use suitability
- weight and inference cost
- structured-output reliability
- latency for classroom interaction
- local vs server deployment flexibility
- fine-tuning or domain adaptation path

## Model Family Options
| Model Family | Typical Strengths | Key Risks | Best Early Uses | Notes |
|---|---|---|---|---|
| Mistral Small / Ministral class | Good balance of quality and cost | Need careful evaluation for legal-role consistency | tutor, summarization, some witness simulation paths | Strong candidate for server-hosted assistant flows |
| Gemma family | Good ecosystem and smaller-size flexibility | May need more prompt scaffolding for complex roleplay | tutor, glossary, lightweight analysis | Good research candidate for lower-cost experimentation |
| Phi family | Efficient small models | Smaller reasoning ceiling on harder adversarial flows | helper tools, rubric generation, constrained assistants | Good utility-model option |
| Qwen family | Broad open-model range and strong multilingual potential | Licensing/version review needed per release | tutor, role simulation experiments | Strong candidate set to evaluate carefully |
| Llama family | Broad ecosystem and tooling | Licensing/release details must be reviewed per version | assistant and role-play experimentation | Important benchmark family even if not selected |

## Role-Fit Guidance
- **Tutor panel:** prioritize low latency, clarity, structured explanation
- **AI witness:** prioritize bounded memory and consistency over broad creativity
- **AI juror:** prioritize explainable reasoning and configurable deliberation styles
- **AI judge:** keep highly constrained; likely advisory-only early on

## Deployment Pattern Options
| Pattern | Strengths | Weaknesses | Fit |
|---|---|---|---|
| Server-hosted inference only | Central control, easier auditing | Ongoing infrastructure cost | Best default starting point |
| Local desktop inference later | Better privacy and offline possibilities | Not suitable for browser-only first release | Later institutional option |
| Browser inference for tiny helpers | Lowest server cost for small tasks | Severe model-size and performance limits | Only for narrow assistive features |

## Recommendation
Research and benchmark a mixed portfolio:
- one strong small server model for tutor and summaries
- one structured-output candidate for role simulation tests
- one very small fallback model for utility tasks

Do not let AI models become authoritative over trial state. They should act through constrained interfaces.
