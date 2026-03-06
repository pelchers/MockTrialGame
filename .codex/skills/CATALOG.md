# Claude Code Skills Catalog

Comprehensive index of all available skills organized by category, use case, and technology.

## Overview

**Total Skills**: 52
**Categories**: 7 (LinkWave Stack, Development Workflows, Academic & Learning, Planning & Architecture, External Integrations, System Maintenance, Anthropic/Claude)

This catalog provides a quick reference for finding the right skill for your task. Each skill is a specialized agent that understands domain-specific patterns, best practices, and workflows.

---

## Skills by Category

### LinkWave Stack (20 skills)

#### Backend & Database

**designing-convex-schemas**
- Designs Convex database schemas with TypeScript validators, indexes, and relationships
- Use when: Creating or modifying schema.ts files, defining tables, adding validators, setting up indexes
- Key features: Schema relationships, compound indexes, type safety, validation patterns
- Visual aids: ER diagrams, index flow charts, query optimization trees

**writing-convex-queries-mutations**
- Writes Convex queries and mutations for reading and modifying data
- Use when: Implementing database operations, data fetching, creating CRUD functions, handling real-time updates
- Key features: Query optimization, transactions, pagination, authorization patterns
- Visual aids: Query execution paths, transaction flows, optimization decision trees

**optimizing-database-queries** (Workflow)
- Systematic approach to analyzing and optimizing database query performance
- Use when: Queries are slow, debugging N+1 problems, adding indexes, improving query efficiency
- Key features: Performance profiling, index analysis, N+1 detection, caching strategies
- Visual aids: Performance audit flow, index effectiveness patterns, optimization workflows

**implementing-real-time-features** (Workflow)
- Build real-time features with Convex subscriptions, optimistic updates, and live sync
- Use when: Implementing collaborative features, live dashboards, notifications, instant updates
- Key features: Reactive subscriptions, optimistic updates, presence systems, live collaboration
- Visual aids: Real-time data flows, subscription patterns, collaboration architectures

#### Authentication & Authorization

**implementing-clerk-authentication**
- Implement Clerk authentication with webhooks, RBAC, and user management
- Use when: Adding authentication flows, managing user types, handling Clerk webhooks, implementing RBAC
- Key features: Session management, webhook integration, multi-tenant auth, role-based access
- Visual aids: Auth flow diagrams, webhook lifecycle, RBAC patterns, session management

#### Payments & Billing

**processing-stripe-payments**
- Process Stripe payments with subscriptions, webhooks, and checkout sessions
- Use when: Implementing payment flows, handling recurring billing, managing subscriptions, processing webhooks
- Key features: Checkout sessions, subscription lifecycle, webhook handling, customer management
- Visual aids: Payment flows, subscription states, webhook processing, retry strategies

#### Frontend & UI

**building-nextjs-routes**
- Build Next.js 14 routes with App Router, server components, and dynamic routing
- Use when: Creating pages, API routes, route handlers, implementing layouts, working with App Router
- Key features: Server/client components, parallel routes, intercepting routes, route handlers

**creating-shadcn-components**
- Create accessible UI components using shadcn/ui and Radix UI primitives
- Use when: Building forms, dialogs, dropdowns, navigation, data display components
- Key features: Radix primitives, accessibility, composability, theming

**styling-with-tailwind**
- Style applications with Tailwind CSS utility classes and design system
- Use when: Implementing designs, creating layouts, responsive design, theming
- Key features: Utility-first CSS, responsive design, dark mode, design tokens

**using-radix-primitives**
- Build custom accessible components with Radix UI primitives
- Use when: Creating complex interactive components, needing fine control, custom behaviors
- Key features: Unstyled primitives, accessibility, keyboard navigation, ARIA attributes

**ensuring-accessibility**
- Ensure WCAG compliance and accessible user experiences
- Use when: Auditing accessibility, fixing a11y issues, implementing ARIA, keyboard navigation
- Key features: WCAG guidelines, screen reader support, keyboard navigation, color contrast

#### State Management & Forms

**managing-application-state**
- Manage client-side state with Zustand, React Context, and local state
- Use when: Managing UI state, implementing global state, caching data, syncing state
- Key features: Zustand stores, React Context, persistence, state patterns

**handling-react-forms**
- Handle forms with React Hook Form, validation, and submission
- Use when: Creating forms, implementing validation, handling submissions, managing form state
- Key features: Form validation, error handling, async validation, field arrays

**validating-with-zod**
- Validate data with Zod schemas for runtime type safety
- Use when: Validating user input, API data, form submissions, type guards
- Key features: Schema validation, type inference, error messages, transformations

#### TypeScript & Types

**managing-typescript-types**
- Manage TypeScript types, interfaces, generics, and type safety
- Use when: Defining types, creating generic functions, type guards, utility types
- Key features: Type inference, generics, utility types, strict mode

#### API & Integration

**designing-rest-apis**
- Design RESTful APIs with proper structure, versioning, and error handling
- Use when: Creating API routes, designing endpoints, implementing REST principles
- Key features: Resource design, HTTP methods, status codes, API versioning

**tracking-user-analytics**
- Implement user analytics and event tracking
- Use when: Adding analytics, tracking user behavior, measuring metrics
- Key features: Event tracking, user properties, custom events, analytics platforms

#### Performance & SEO

**improving-web-performance**
- Optimize web performance with code splitting, caching, and optimization
- Use when: Improving load times, optimizing bundles, implementing caching
- Key features: Code splitting, lazy loading, image optimization, performance metrics

**optimizing-seo-metadata**
- Optimize SEO with metadata, structured data, and social sharing
- Use when: Improving SEO, adding metadata, implementing Open Graph, structured data
- Key features: Meta tags, Open Graph, Twitter Cards, structured data, sitemaps

#### Error Handling & Testing

**handling-application-errors**
- Handle errors gracefully with error boundaries and logging
- Use when: Implementing error handling, adding error boundaries, logging errors
- Key features: Error boundaries, error logging, user-friendly errors, retry logic

**testing-with-playwright**
- Write end-to-end tests with Playwright for critical user flows
- Use when: Writing E2E tests, testing user flows, automating browser testing
- Key features: Browser automation, test selectors, assertions, visual testing

---

### Development Workflows (5 skills)

**using-claude-hooks** (NEW!)
- Implement and use Claude Code hooks for automation, validation, and workflow enhancement
- Use when: Automating workflows, validating operations, enforcing standards, creating guardrails
- Key features: Event-driven automation, safety validation, auto-formatting, custom workflows
- Visual aids: Hook lifecycle diagrams, automation patterns, validation flows

**debugging-production-issues** (Workflow)
- Systematic approach to investigating and resolving production issues
- Use when: Debugging errors, analyzing logs, profiling performance, investigating user-reported problems
- Key features: Log analysis, root cause analysis, performance profiling, production debugging
- Visual aids: Investigation workflows, diagnostic trees, performance patterns

**optimizing-database-queries** (Workflow)
- See Backend & Database section above

**implementing-real-time-features** (Workflow)
- See Backend & Database section above

**managing-git-workflows**
- Manage Git workflows with branching, merging, rebasing, and collaboration
- Use when: Creating branches, merging code, resolving conflicts, managing releases
- Key features: Branch strategies, commit conventions, pull requests, conflict resolution

---

### Academic & Learning (7 skills)

**ingesting-academic-content**
- Ingests academic content from PDFs, DOCX, Markdown, web pages, and research papers
- Use when: Processing course materials, textbooks, research papers, assignments
- Key features: Multi-format support, metadata extraction, citation parsing, structure analysis
- Visual aids: Ingestion workflows, format parsing trees

**creating-study-summaries**
- Generates comprehensive study summaries with key concepts, flashcards, and quizzes
- Use when: Condensing reading materials, preparing for exams, creating review materials
- Key features: Concept extraction, chapter summarization, Mermaid concept maps, quiz generation
- Visual aids: Summary structures, concept maps, learning paths

**creating-visual-notes**
- Converts text notes into visual formats (mind maps, flowcharts, timelines, comparison tables)
- Use when: Transforming lecture notes, creating study aids, visualizing relationships
- Key features: Mermaid diagrams, mind maps, flowcharts, timeline visualizations
- Visual aids: Note transformation patterns, visual templates

**explaining-complex-concepts**
- Provides multi-modal explanations using progressive complexity (ELI5 to expert)
- Use when: Learning difficult concepts, teaching others, needing multiple explanation approaches
- Key features: Progressive complexity, visual diagrams, analogies, practice problems
- Visual aids: Explanation ladders, analogy maps, concept breakdowns

**decomposing-project-tasks**
- Breaks down complex assignments into manageable tasks with prioritization
- Use when: Starting new assignments, planning projects, organizing research tasks
- Key features: Task decomposition, information gap analysis, MoSCoW prioritization
- Visual aids: Task hierarchies, dependency graphs, priority matrices

**managing-study-sessions**
- Plans and tracks study sessions using Pomodoro and spaced repetition (SM-2 algorithm)
- Use when: Organizing study time, building schedules, tracking learning progress
- Key features: Pomodoro technique, spaced repetition, progress tracking, focus analytics
- Visual aids: Study schedules, retention curves, progress dashboards

**writing-academic-reports**
- Writes academic reports, essays, and papers with proper citation formatting
- Use when: Drafting academic documents, formatting citations, adapting writing style
- Key features: Citation formats (APA, MLA, Chicago, IEEE), structure templates, tone customization
- Visual aids: Document structures, citation patterns

---

### Planning & Architecture (4 skills)

**exploring-app-ideas**
- Brainstorms and evaluates app concepts through market research and competitive analysis
- Use when: Starting a new project, evaluating multiple ideas, researching market opportunities
- Key features: Market research, competitive analysis, idea validation, prioritization scoring
- Visual aids: Validation frameworks, market analysis matrices

**gathering-requirements**
- Extracts and documents functional and non-functional requirements
- Use when: Starting app development, defining features, creating specifications
- Key features: User story creation, use case identification, acceptance criteria, prioritization
- Visual aids: Requirements hierarchies, user story maps

**designing-app-architecture**
- Designs application architecture with system design patterns and technology selection
- Use when: Starting technical design, choosing technologies, planning system structure
- Key features: System design patterns, tech stack selection, database schema, API design, ADRs
- Visual aids: Architecture diagrams, system flows, decision records

**creating-project-documentation**
- Generates comprehensive project documentation (README, API docs, setup guides)
- Use when: Starting projects, preparing for open source, onboarding developers
- Key features: README templates, API documentation, setup guides, contributing guidelines
- Visual aids: Documentation structures, API reference formats

---

### External Integrations (11 skills)

#### AI/ML & Design Tools

**using-huggingface** (MCP)
- Integrates with HuggingFace to access AI models, datasets, and spaces
- Use when: Adding AI/ML capabilities, using transformers, fine-tuning models
- Key features: Model loading, inference pipelines, dataset management, Spaces deployment
- Visual aids: Model integration flows, pipeline architectures

**integrating-figma** (MCP)
- Automates Figma workflows via REST API for design file access and asset export
- Use when: Exporting design assets, syncing design tokens, automating design workflows
- Key features: File access, asset export, design token extraction, version management
- Visual aids: API workflows, export pipelines

#### Database & Infrastructure

**querying-postgresql** (MCP)
- Manages PostgreSQL databases with node-postgres, connection pooling, and migrations
- Use when: Working with PostgreSQL, writing queries, managing connections, running migrations
- Key features: Query building, connection pooling, transaction management, migrations
- Visual aids: Connection flows, query optimization patterns

**managing-docker-containers** (MCP)
- Orchestrates Docker containers with Compose, multi-stage builds, and production deployment
- Use when: Containerizing applications, setting up development environments, deploying to production
- Key features: Dockerfile optimization, Docker Compose, networking, volume management
- Visual aids: Container architectures, deployment flows

#### Automation & Creative Tools

**automating-excalidraw**
- Generates Excalidraw diagrams programmatically for documentation and visualization
- Use when: Creating diagrams, visualizing architectures, generating documentation graphics
- Key features: Programmatic diagram creation, element manipulation, export automation
- Visual aids: Element structures, diagram patterns

**scripting-blender**
- Automates Blender 3D workflows via Python bpy module
- Use when: Batch 3D operations, procedural modeling, automated rendering, asset pipelines
- Key features: Scene automation, procedural modeling, batch rendering, asset export
- Visual aids: Automation workflows, bpy API patterns

**scripting-godot**
- Automates Godot game engine via GDScript and CLI
- Use when: Automating game builds, generating scenes, setting up CI/CD for game projects
- Key features: Scene generation, build automation, headless testing, multi-platform export
- Visual aids: Build pipelines, export workflows

**integrating-vscode**
- Automates VS Code via Extension API and CLI
- Use when: Building developer tools, custom workflows, IDE integrations
- Key features: Extension development, command creation, workspace automation, CLI operations
- Visual aids: Extension architectures, command flows

**automating-photoshop**
- Automates Adobe Photoshop via UXP and ExtendScript
- Use when: Batch image processing, automating design workflows, building custom tools
- Key features: Batch processing, layer automation, export workflows, filter automation
- Visual aids: Batch workflows, script patterns

**automating-premiere-pro**
- Automates Adobe Premiere Pro via ExtendScript
- Use when: Batch exporting videos, automating edit workflows, creating templated sequences
- Key features: Timeline automation, batch export, template workflows, marker management
- Visual aids: Export pipelines, automation patterns

**automating-after-effects**
- Automates Adobe After Effects via ExtendScript
- Use when: Generating data-driven animations, batch rendering, creating templated motion graphics
- Key features: Template automation, expression generation, render management, data-driven graphics
- Visual aids: Template flows, render pipelines

---

### System Maintenance (1 skill)

**maintaining-trinary-sync**
- Maintains synchronized copies across main, app-builder-template, and do-over-files directories
- Use when: Adding new skills, agents, or MCP configurations to ensure all locations stay in sync
- Key features: Three-way sync, integrity verification, automated copying, conflict detection
- Visual aids: Sync flows, directory structures

---

### Anthropic & Claude Code (3 skills)

**creating-claude-skills**
- Create new Claude Code skills following progressive disclosure patterns
- Use when: Building new skills, documenting workflows, creating skill templates
- Key features: Skill structure, progressive disclosure, examples, templates

**creating-claude-agents**
- Create specialized Claude agents for complex workflows with subagent patterns
- Use when: Building complex agents, coordinating subagents, hierarchical workflows
- Key features: Agent architecture, subagent coordination, state management

**configuring-mcp-servers**
- Configure Model Context Protocol servers for extended Claude capabilities
- Use when: Adding MCP tools, configuring servers, extending Claude with external tools
- Key features: MCP configuration, server setup, tool integration

---

### General Development (1 skill)

**researching-with-playwright**
- Research and extract data from websites using Playwright
- Use when: Web scraping, gathering documentation, extracting structured data
- Key features: Headless browsing, selector strategies, data extraction, anti-detection

**gathering-documentation**
- Gather and synthesize documentation from multiple sources
- Use when: Researching APIs, compiling documentation, learning new technologies
- Key features: Documentation extraction, synthesis, organization

---

## Quick Reference Matrix

| Skill Name | Primary Use | Technology | Complexity | Has Diagrams |
|------------|-------------|------------|------------|--------------|
| designing-convex-schemas | Database schema design | Convex | Medium | Yes |
| writing-convex-queries-mutations | Database operations | Convex | Medium | Yes |
| implementing-clerk-authentication | User authentication | Clerk | Medium | Yes |
| processing-stripe-payments | Payment processing | Stripe | High | Yes |
| building-nextjs-routes | Page routing | Next.js | Medium | No |
| creating-shadcn-components | UI components | shadcn/ui | Low | No |
| styling-with-tailwind | CSS styling | Tailwind | Low | No |
| using-radix-primitives | Accessible components | Radix UI | Medium | No |
| managing-application-state | State management | Zustand/React | Medium | No |
| handling-react-forms | Form handling | React Hook Form | Medium | No |
| validating-with-zod | Data validation | Zod | Low | No |
| managing-typescript-types | Type safety | TypeScript | Medium | No |
| designing-rest-apis | API design | REST | Medium | No |
| optimizing-seo-metadata | SEO optimization | Next.js | Low | No |
| improving-web-performance | Performance | Web APIs | Medium | No |
| ensuring-accessibility | A11y compliance | WCAG | Medium | No |
| testing-with-playwright | E2E testing | Playwright | Medium | No |
| handling-application-errors | Error handling | React/TS | Low | No |
| tracking-user-analytics | Analytics | Various | Low | No |
| managing-git-workflows | Version control | Git | Medium | No |
| debugging-production-issues | Troubleshooting | Various | High | Yes |
| optimizing-database-queries | Query performance | Convex | High | Yes |
| implementing-real-time-features | Live updates | Convex | High | Yes |
| creating-claude-skills | Skill creation | Claude Code | High | No |
| creating-claude-agents | Agent architecture | Claude Code | High | No |
| configuring-mcp-servers | MCP setup | MCP | Medium | No |
| researching-with-playwright | Web research | Playwright | Medium | No |
| gathering-documentation | Documentation | Various | Low | No |
| ingesting-academic-content | Content processing | Multi-format | Medium | Yes |
| creating-study-summaries | Study aids | Academic | Medium | Yes |
| creating-visual-notes | Visual learning | Mermaid | Low | Yes |
| explaining-complex-concepts | Teaching | Educational | Medium | Yes |
| decomposing-project-tasks | Task planning | Productivity | Low | Yes |
| managing-study-sessions | Study tracking | Pomodoro/SR | Medium | Yes |
| writing-academic-reports | Academic writing | Citations | Medium | Yes |
| exploring-app-ideas | Ideation | Market research | Medium | Yes |
| gathering-requirements | Requirements | Analysis | Medium | Yes |
| designing-app-architecture | Architecture | System design | High | Yes |
| creating-project-documentation | Documentation | Technical writing | Low | Yes |
| using-huggingface | AI/ML | HuggingFace | Medium | Yes |
| integrating-figma | Design automation | Figma API | Medium | Yes |
| querying-postgresql | Database | PostgreSQL | Medium | Yes |
| managing-docker-containers | Containers | Docker | Medium | Yes |
| automating-excalidraw | Diagramming | Excalidraw | Low | Yes |
| scripting-blender | 3D automation | Blender bpy | High | Yes |
| scripting-godot | Game automation | Godot | Medium | Yes |
| integrating-vscode | IDE automation | VS Code API | Medium | Yes |
| automating-photoshop | Image processing | ExtendScript | Medium | Yes |
| automating-premiere-pro | Video automation | ExtendScript | Medium | Yes |
| automating-after-effects | Motion graphics | ExtendScript | High | Yes |
| maintaining-trinary-sync | System maintenance | File sync | Low | Yes |

---

## Skills by Technology

### Convex
- designing-convex-schemas
- writing-convex-queries-mutations
- optimizing-database-queries
- implementing-real-time-features

### Next.js
- building-nextjs-routes
- optimizing-seo-metadata
- improving-web-performance

### React
- creating-shadcn-components
- using-radix-primitives
- managing-application-state
- handling-react-forms
- handling-application-errors

### Authentication
- implementing-clerk-authentication

### Payments
- processing-stripe-payments

### Styling
- styling-with-tailwind
- creating-shadcn-components

### TypeScript
- managing-typescript-types
- validating-with-zod

### Testing
- testing-with-playwright
- researching-with-playwright

### Claude Code
- creating-claude-skills
- creating-claude-agents
- configuring-mcp-servers
- maintaining-trinary-sync

### AI/ML
- using-huggingface

### Design & Creative
- integrating-figma
- automating-excalidraw
- scripting-blender
- automating-photoshop
- automating-premiere-pro
- automating-after-effects

### Database
- querying-postgresql

### Infrastructure
- managing-docker-containers

### Game Development
- scripting-godot

### IDE & Development Tools
- integrating-vscode

### Academic & Learning
- ingesting-academic-content
- creating-study-summaries
- creating-visual-notes
- explaining-complex-concepts
- decomposing-project-tasks
- managing-study-sessions
- writing-academic-reports

### Planning & Architecture
- exploring-app-ideas
- gathering-requirements
- designing-app-architecture
- creating-project-documentation

---

## Skills by Use Case

### Building New Features
1. designing-convex-schemas (database)
2. writing-convex-queries-mutations (backend)
3. building-nextjs-routes (routing)
4. creating-shadcn-components (UI)
5. handling-react-forms (forms)
6. validating-with-zod (validation)

### Adding Authentication
1. implementing-clerk-authentication (setup)
2. managing-application-state (user state)
3. handling-application-errors (auth errors)

### Implementing Payments
1. processing-stripe-payments (setup)
2. handling-application-errors (payment errors)
3. tracking-user-analytics (conversion tracking)

### Performance Issues
1. debugging-production-issues (investigation)
2. optimizing-database-queries (database)
3. improving-web-performance (frontend)

### Real-Time Features
1. implementing-real-time-features (setup)
2. writing-convex-queries-mutations (subscriptions)
3. managing-application-state (optimistic updates)

### Accessibility & SEO
1. ensuring-accessibility (a11y)
2. optimizing-seo-metadata (SEO)
3. using-radix-primitives (accessible components)

### Starting a New Project
1. exploring-app-ideas (ideation)
2. gathering-requirements (requirements)
3. designing-app-architecture (architecture)
4. creating-project-documentation (documentation)

### Academic & Study Work
1. ingesting-academic-content (content processing)
2. creating-study-summaries (summarization)
3. creating-visual-notes (visualization)
4. explaining-complex-concepts (understanding)
5. decomposing-project-tasks (planning)
6. managing-study-sessions (scheduling)
7. writing-academic-reports (writing)

### Creative Automation
1. integrating-figma (design assets)
2. automating-excalidraw (diagrams)
3. scripting-blender (3D modeling)
4. automating-photoshop (image processing)
5. automating-premiere-pro (video editing)
6. automating-after-effects (motion graphics)

### Infrastructure & DevOps
1. managing-docker-containers (containerization)
2. querying-postgresql (database)
3. integrating-vscode (IDE automation)

### AI/ML Integration
1. using-huggingface (models & datasets)

### Game Development
1. scripting-godot (game engine automation)

---

## How to Use This Catalog

### Finding the Right Skill

1. **By Task**: Look in "Skills by Use Case" for your current task
2. **By Technology**: Find skills for a specific tech stack in "Skills by Technology"
3. **By Category**: Browse major categories for related skills
4. **By Complexity**: Check the Quick Reference Matrix for complexity levels

### Combining Skills

Skills are designed to work together. For example:

**Building a Profile Feature**:
1. designing-convex-schemas → Create profile table
2. writing-convex-queries-mutations → Add CRUD operations
3. implementing-clerk-authentication → Add auth checks
4. building-nextjs-routes → Create profile pages
5. creating-shadcn-components → Build profile UI

**Optimizing Performance**:
1. debugging-production-issues → Identify bottlenecks
2. optimizing-database-queries → Fix slow queries
3. improving-web-performance → Optimize frontend
4. implementing-real-time-features → Add efficient subscriptions

**Starting a New SaaS Project**:
1. exploring-app-ideas → Validate concept
2. gathering-requirements → Define features
3. designing-app-architecture → Plan system
4. designing-convex-schemas → Create database
5. implementing-clerk-authentication → Add auth
6. processing-stripe-payments → Add billing
7. creating-project-documentation → Document setup

**Automating Content Creation Pipeline**:
1. integrating-figma → Export design assets
2. automating-excalidraw → Generate diagrams
3. scripting-blender → Create 3D models
4. automating-photoshop → Process images
5. automating-premiere-pro → Edit videos
6. automating-after-effects → Add motion graphics

**Academic Research Workflow**:
1. ingesting-academic-content → Process papers
2. creating-study-summaries → Summarize content
3. creating-visual-notes → Visualize concepts
4. explaining-complex-concepts → Deep understanding
5. managing-study-sessions → Schedule study time
6. writing-academic-reports → Write papers

### Skill Complexity Levels

- **Low**: Quick reference, straightforward patterns
- **Medium**: Multiple patterns, requires understanding
- **High**: Complex workflows, architectural decisions

---

## Contributing New Skills

See `creating-claude-skills` for the complete guide to creating new skills.

**Skill Structure**:
```
skill-name/
├── SKILL.md              # Main skill documentation
├── resources/            # Detailed resources
│   └── *.md
└── scripts/              # Code examples
    └── *.ts
```

**When to Create a New Skill**:
- Repeated pattern across multiple features
- Complex workflow requiring specialized knowledge
- Technology with significant learning curve
- Cross-cutting concern (auth, errors, performance)

---

## Skill Dependencies

Some skills build on others. Recommended learning order:

**Foundation (Start Here)**:
1. managing-typescript-types
2. validating-with-zod
3. styling-with-tailwind

**Backend**:
1. designing-convex-schemas
2. writing-convex-queries-mutations
3. optimizing-database-queries

**Frontend**:
1. building-nextjs-routes
2. creating-shadcn-components
3. handling-react-forms
4. managing-application-state

**Advanced**:
1. implementing-real-time-features
2. debugging-production-issues
3. creating-claude-agents

---

## Maintenance

**Last Updated**: 2026-01-05
**Skills Version**: 2.0 (Phase 2 Complete)
**Total Skills**: 51
**Total Agents**: 31 (30 + do-over-agent)
**Maintained By**: Claude Code Skills Team

### Recent Updates
- **Phase 2 Expansion**: Added 23 new skills across 4 categories
  - Academic & Learning (7 skills)
  - Planning & Architecture (4 skills)
  - External Integrations (11 skills)
  - System Maintenance (1 skill)
- **New Agents**: Added 12 specialized agents
  - MCP integrations: HuggingFace, Figma, PostgreSQL, Docker
  - Creative automation: Excalidraw, Blender, Godot, Photoshop, Premiere Pro, After Effects
  - Development tools: VS Code
  - System maintenance: Do-Over Agent

For issues or suggestions, see the contributing guidelines in `creating-claude-skills`.

