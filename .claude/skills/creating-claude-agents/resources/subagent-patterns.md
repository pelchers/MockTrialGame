# Subagent Patterns

## Overview

Subagents are specialized Claude agents that handle focused tasks delegated by parent agents. This pattern enables building complex agent systems through composition and delegation.

## Core Concepts

### What are Subagents?

**Subagents** are Claude agents that:
- Specialize in narrow domains
- Receive delegated tasks from parent agents
- Operate with focused tool sets
- Load domain-specific skills
- Return results to calling agent

### Why Use Subagents?

**Benefits:**
1. **Separation of Concerns**: Each agent handles one domain
2. **Reusability**: Subagents work across multiple parent agents
3. **Context Efficiency**: Load only relevant expertise
4. **Maintainability**: Update specialists independently
5. **Testing**: Validate agents in isolation

## Delegation Patterns

### 1. Technology Stack Pattern

**Use case**: Multi-technology applications

```
┌─────────────────────────────────┐
│   Full-Stack Application Agent │
└────────────┬────────────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌────────┐ ┌────┐ ┌────────┐
│Frontend│ │API │ │Database│
│ Agent  │ │Agt │ │ Agent  │
└────────┘ └────┘ └────────┘
```

**Implementation:**

**Parent Agent** (`full-stack-agent.md`):
```yaml
---
name: Full-Stack Application Agent
description: Coordinates full-stack development
model: claude-sonnet-4-5
permissionMode: auto
tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
skills:
  - application-architecture
  - project-structure
---

# Full-Stack Application Agent

Coordinates development across stack layers.

## Task Delegation

### Frontend Tasks
Delegate to: **frontend-agent**
- UI component creation
- State management
- Styling and theming
- Client-side routing

### API Tasks
Delegate to: **api-agent**
- Endpoint design
- Request/response schemas
- Middleware implementation
- API documentation

### Database Tasks
Delegate to: **database-agent**
- Schema design
- Query optimization
- Index creation
- Migration management
```

**Subagent** (`frontend-agent.md`):
```yaml
---
name: Frontend Agent
description: Next.js frontend specialist
model: claude-sonnet-4-5
permissionMode: auto
tools:
  - Read
  - Write
  - Edit
  - Bash
skills:
  - nextjs-patterns
  - react-best-practices
---

Handles all frontend development tasks...
```

### 2. Layer Decomposition Pattern

**Use case**: UI framework with multiple concerns

```
┌────────────────────┐
│  Frontend Agent    │
└─────────┬──────────┘
          │
  ┌───────┼───────┬──────────┐
  │       │       │          │
  ▼       ▼       ▼          ▼
┌────┐ ┌─────┐ ┌────┐ ┌──────────┐
│UI  │ │Style│ │State│ │Animation │
│Agt │ │ Agt │ │Agt │ │   Agt    │
└────┘ └─────┘ └────┘ └──────────┘
```

**Implementation:**

**Parent** (`frontend-agent.md`):
```markdown
## Subagent Delegation

### UI Components
Delegate to: **shadcn-ui-agent**
- Component installation
- Variant creation
- Accessibility implementation
- Radix primitive usage

### Styling
Delegate to: **tailwind-agent**
- Utility class application
- Responsive design
- Custom variants
- Dark mode implementation

### State Management
Delegate to: **zustand-agent**
- Store creation
- State mutations
- Persistence
- DevTools integration

### Animations
Delegate to: **framer-motion-agent**
- Transition definitions
- Gesture handling
- Animation orchestration
- Performance optimization
```

### 3. Workflow Pipeline Pattern

**Use case**: Sequential processing stages

```
Input → Agent 1 → Agent 2 → Agent 3 → Output
        ┌──────┐  ┌──────┐  ┌──────┐
        │Plan  │→ │Build │→ │Test  │
        └──────┘  └──────┘  └──────┘
```

**Implementation:**

**Orchestrator** (`feature-pipeline-agent.md`):
```markdown
## Feature Development Pipeline

### Stage 1: Planning
Delegate to: **architecture-agent**
- Analyze requirements
- Design system architecture
- Define interfaces
- Document decisions

Output: Architecture decision records

### Stage 2: Implementation
Delegate to: **development-agent**
- Implement features
- Follow architectural patterns
- Write inline documentation
- Handle edge cases

Output: Implemented code

### Stage 3: Quality Assurance
Delegate to: **testing-agent**
- Write unit tests
- Create integration tests
- Verify edge cases
- Generate test reports

Output: Test suite + coverage report
```

### 4. Domain Expert Pattern

**Use case**: Third-party service integration

```
┌──────────────────────┐
│  Integration Agent   │
└──────────┬───────────┘
           │
  ┌────────┼──────────┬──────────┐
  │        │          │          │
  ▼        ▼          ▼          ▼
┌────┐  ┌──────┐  ┌──────┐  ┌────┐
│Auth│  │Payment│ │Email │  │SMS │
│Agt │  │ Agt   │ │ Agt  │  │Agt │
└────┘  └───────┘ └──────┘  └────┘
```

**Implementation:**

**Parent** (`integration-agent.md`):
```markdown
## Service Integration Delegation

### Authentication
Delegate to: **clerk-agent**
- User authentication
- Session management
- Webhook handling
- Middleware setup

### Payments
Delegate to: **stripe-agent**
- Payment processing
- Subscription management
- Webhook events
- Checkout flows

### Email
Delegate to: **sendgrid-agent**
- Template management
- Email sending
- Delivery tracking
- Bounce handling

### SMS
Delegate to: **twilio-agent**
- Message sending
- Number management
- Webhook processing
- Delivery status
```

### 5. Review and Analysis Pattern

**Use case**: Code quality and security

```
┌────────────────┐
│  Review Agent  │
└───────┬────────┘
        │
  ┌─────┼─────┬───────┬────────┐
  │     │     │       │        │
  ▼     ▼     ▼       ▼        ▼
┌────┐┌────┐┌─────┐┌──────┐┌─────┐
│Code││Sec ││Perf ││Access││Doc  │
│Agt ││Agt ││Agt  ││Agt   ││Agt  │
└────┘└────┘└─────┘└──────┘└─────┘
```

**Implementation:**

**Parent** (`code-review-agent.md`):
```yaml
---
name: Code Review Agent
description: Comprehensive code analysis
model: claude-opus-4-5  # Complex analysis
permissionMode: manual   # Review only, no changes
tools:
  - Read
  - Grep
  - Glob
  - LSP
skills:
  - code-review-patterns
---

## Review Delegation

### Code Quality
Delegate to: **code-quality-agent**
- Check for code smells
- Identify anti-patterns
- Suggest refactoring
- Verify best practices

### Security
Delegate to: **security-agent**
- Find vulnerabilities
- Check authentication
- Review authorization
- Identify injection risks

### Performance
Delegate to: **performance-agent**
- Analyze algorithmic complexity
- Find bottlenecks
- Suggest optimizations
- Review database queries

### Accessibility
Delegate to: **accessibility-agent**
- Check WCAG compliance
- Verify keyboard navigation
- Review ARIA attributes
- Test screen reader support

### Documentation
Delegate to: **documentation-agent**
- Verify JSDoc coverage
- Check README accuracy
- Review API documentation
- Ensure examples work
```

## Communication Patterns

### 1. Explicit Delegation

**Parent agent explicitly names subagent:**

```markdown
For database schema design, delegate to **database-agent**:
1. Pass table requirements
2. Specify relationships
3. Define indexes
4. Request validation
```

### 2. Implicit Delegation

**Parent references domain, Claude selects agent:**

```markdown
## Database Layer

Design Convex schemas with:
- Proper TypeScript validators
- Efficient indexes
- Clear relationships
- Migration support

[Claude Code recognizes Convex expertise and loads database-agent]
```

### 3. Context Passing

**Share information between agents:**

```markdown
## Task: Create User Profile Feature

### Step 1: Database Schema (database-agent)
Input: User profile requirements
Output: schema.ts with tables and indexes

### Step 2: API Endpoints (api-agent)
Input: Schema from Step 1
Output: CRUD endpoints for profiles

### Step 3: UI Components (frontend-agent)
Input: API contracts from Step 2
Output: Profile form and display components
```

## Skills Sharing Strategies

### Shared Skills Pattern

**Multiple agents use common skills:**

```yaml
# database-agent.md
skills:
  - typescript-types    # Shared
  - designing-convex-schemas

# api-agent.md
skills:
  - typescript-types    # Shared
  - designing-rest-apis

# frontend-agent.md
skills:
  - typescript-types    # Shared
  - react-patterns
```

**Benefits:**
- Consistent type definitions
- Shared language across agents
- Reduced duplication

### Specialized Skills Pattern

**Each agent has unique skills:**

```yaml
# shadcn-ui-agent.md
skills:
  - creating-shadcn-components  # Unique
  - radix-ui-primitives         # Unique

# tailwind-agent.md
skills:
  - tailwind-utilities          # Unique
  - responsive-design           # Unique
```

**Benefits:**
- Clear specialization
- No skill overlap
- Focused expertise

### Layered Skills Pattern

**Parent has broad skills, children have specific:**

```yaml
# parent: frontend-agent.md
skills:
  - react-best-practices       # Broad
  - web-performance            # Broad

# child: shadcn-ui-agent.md
skills:
  - creating-shadcn-components # Specific
  - radix-ui-primitives        # Specific
```

**Benefits:**
- Parent provides overall guidance
- Children provide implementation details
- Clear hierarchy

## Tool Inheritance

### Tool Access Levels

**Parent has broader access:**
```yaml
# parent-agent.md
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - LSP
```

**Child has restricted access:**
```yaml
# child-agent.md
tools:
  - Read
  - Write
  - Edit
  - Grep
  # No Bash (safety)
  # No Glob (parent handles discovery)
```

### Tool Specialization

**Different tools for different roles:**

```yaml
# analysis-agent.md (read-only)
tools:
  - Read
  - Grep
  - Glob
  - LSP

# implementation-agent.md (write-focused)
tools:
  - Read
  - Write
  - Edit
  - Bash

# research-agent.md (web-focused)
tools:
  - Read
  - Write
  - WebFetch
  - WebSearch
```

## Permission Mode Strategies

### Hierarchical Permissions

```
Parent: permissionMode: auto
├── Child 1: permissionMode: auto    (same level)
├── Child 2: permissionMode: manual  (more restrictive)
└── Child 3: permissionMode: full    (less restrictive)
```

**Guidelines:**
- Children can be more restrictive
- Use manual mode for sensitive operations
- Use full mode for trusted automation

### Context-Based Permissions

```yaml
# Development context
parent: permissionMode: auto
children: permissionMode: auto

# Production deployment
parent: permissionMode: manual
children: permissionMode: manual

# Automated testing
parent: permissionMode: full
children: permissionMode: full
```

## Model Selection Hierarchy

### Mixed Model Strategy

**Parent uses Opus for orchestration:**
```yaml
# longrunning-orchestrator-agent.md
model: claude-opus-4-5  # Complex decision-making
```

**Children use Sonnet for implementation:**
```yaml
# implementation-agents.md
model: claude-sonnet-4-5  # Fast execution
```

**Benefits:**
- High-quality architectural decisions
- Fast implementation
- Cost optimization

### Uniform Model Strategy

**All agents use same model:**
```yaml
# All agents
model: claude-sonnet-4-5
```

**Benefits:**
- Consistent behavior
- Predictable performance
- Simpler configuration

## Real-World Examples

### Example 1: E-commerce Platform

```
┌─────────────────────────────┐
│  E-commerce Platform Agent  │
└──────────────┬──────────────┘
               │
      ┌────────┼────────┬───────────┐
      │        │        │           │
      ▼        ▼        ▼           ▼
   ┌─────┐ ┌──────┐ ┌──────┐ ┌──────────┐
   │Store│ │Cart  │ │Order │ │Analytics │
   │Agent│ │Agent │ │Agent │ │  Agent   │
   └─────┘ └──────┘ └──────┘ └──────────┘
      │        │        │           │
      ▼        ▼        ▼           ▼
   Product  Payment  Shipping   Reporting
```

### Example 2: SaaS Application

```
┌──────────────────────────┐
│   SaaS Application Agent │
└───────────┬──────────────┘
            │
   ┌────────┼─────────┬──────────┐
   │        │         │          │
   ▼        ▼         ▼          ▼
┌────┐  ┌─────┐  ┌──────┐  ┌────────┐
│Auth│  │Tenant│ │Billing│ │Features│
│Agt │  │ Agt │  │ Agt  │  │  Agt   │
└────┘  └─────┘  └──────┘  └────────┘
   │        │         │          │
   ▼        ▼         ▼          ▼
Clerk  Multi-tenant Stripe   Feature
              DB            Flags
```

### Example 3: Content Platform

```
┌────────────────────────┐
│  Content Platform Agt  │
└──────────┬─────────────┘
           │
  ┌────────┼──────┬───────────┐
  │        │      │           │
  ▼        ▼      ▼           ▼
┌───┐  ┌──────┐ ┌────┐  ┌────────┐
│CMS│  │Search│ │CDN │  │Moderate│
│Agt│  │ Agt  │ │Agt │  │  Agt   │
└───┘  └──────┘ └────┘  └────────┘
  │        │      │           │
  ▼        ▼      ▼           ▼
Editor  Algolia  Images   Content
               Cloudinary  Safety
```

## Best Practices

### Design Principles

1. **Clear Boundaries**: Each subagent has one responsibility
2. **Minimal Coupling**: Subagents work independently
3. **Explicit Delegation**: Parent clearly defines what to delegate
4. **Context Efficiency**: Share only necessary information
5. **Tool Minimalism**: Subagents have minimal required tools

### Communication Guidelines

1. **Structured Handoffs**: Clear input/output contracts
2. **Context Preservation**: Maintain relevant context across delegation
3. **Error Handling**: Subagents report clear errors to parent
4. **Result Validation**: Parent verifies subagent outputs
5. **Documentation**: Document delegation patterns in parent

### Performance Optimization

1. **Parallel Execution**: Independent subagents run concurrently
2. **Lazy Loading**: Load subagents only when needed
3. **Context Caching**: Reuse loaded subagent context
4. **Skill Sharing**: Common skills loaded once
5. **Tool Batching**: Combine tool operations where possible

### Testing Strategy

1. **Unit Test Subagents**: Test each in isolation
2. **Integration Testing**: Test parent-child communication
3. **Mock Subagents**: Parent tests with simulated children
4. **End-to-End Testing**: Full workflow validation
5. **Validation Scripts**: Automated configuration checking

## Common Pitfalls

### Avoid These Patterns

❌ **Too Many Layers**
```
Agent → Subagent → Sub-subagent → Sub-sub-subagent
(Excessive nesting, hard to maintain)
```

❌ **Circular Dependencies**
```
Agent A delegates to Agent B
Agent B delegates to Agent A
(Infinite loop)
```

❌ **Overlapping Responsibilities**
```
Database Agent: Handles schemas AND queries
Query Agent: Handles queries AND schemas
(Unclear boundaries)
```

❌ **Tool Duplication**
```
Parent: All tools
Child: All tools
(No access control benefit)
```

### Better Approaches

✅ **Flat Hierarchy**
```
Parent Agent
├── Subagent 1
├── Subagent 2
└── Subagent 3
(Clear, maintainable)
```

✅ **Clear Dependencies**
```
Agent A → Agent B → Agent C
(One-way delegation)
```

✅ **Distinct Responsibilities**
```
Schema Agent: Table definitions, validators
Query Agent: Data retrieval, filters
(Clear separation)
```

✅ **Layered Tool Access**
```
Parent: Read, Write, Edit, Bash
Child: Read, Write, Edit
(Progressive restriction)
```

## Summary

Subagent patterns enable building sophisticated agent systems through:
- Clear separation of concerns
- Focused expertise areas
- Controlled tool access
- Efficient context management
- Reusable components

**Key Takeaways:**
1. One responsibility per agent
2. Explicit delegation with clear contracts
3. Minimal tool sets for safety
4. Shared skills for consistency
5. Hierarchical organization for maintainability

Use these patterns to create scalable, maintainable agent systems that handle complex tasks through coordinated specialization.

