# PRODUCTION-SPEC: <App Name>

## Generation Context
- **Date**: <ISO date>
- **Source Mode**: <style-transfer | template-basis | custom-direction>
- **Source**: <URL / template path / direction text>
- **Mode**: <fresh | iterate>
- **Previous Output**: <path or "N/A">

## 1. Application Overview

### App Identity
- **Name**: <app name>
- **Purpose**: <one-sentence description>
- **Target Users**: <primary user personas>
- **Core Value Proposition**: <what the app does for users>

### Technology Context
- **Target Framework**: <Next.js / React / etc.>
- **Backend**: <Convex / Prisma / REST / etc.>
- **Auth**: <Clerk / NextAuth / etc.>
- **Payments**: <Stripe / etc.>
- **UI Library**: <shadcn/ui / MUI / etc.>
- **State Management**: <Zustand / Redux / Context / etc.>
- **Validation**: <Zod / Yup / etc.>

## 2. Page/Route Structure

### Page Inventory
| Page | File | Route | Purpose | Key Components |
|------|------|-------|---------|---------------|
| Home | index.html | / | Landing/dashboard | Hero, Stats, QuickActions |
| ... | ... | ... | ... | ... |

### Navigation Model
- **Type**: <sidebar / top-bar / tabs / hybrid>
- **Mobile Behavior**: <hamburger / bottom-tabs / drawer>
- **Auth Routes**: <which pages require authentication>
- **Public Routes**: <which pages are publicly accessible>

### Page Details

#### Page: <Page Name>
- **File**: `<filename>.html`
- **Route**: `/<route>`
- **Purpose**: <what this page does>
- **Sections**:
  | Section | Component | Data Source | User Stories |
  |---------|-----------|-------------|-------------|
  | Hero | HeroSection | static | — |
  | Project List | ProjectGrid | getProjects() | US-001, US-002 |
- **Interactions**:
  - <interaction 1>: <what happens>
  - <interaction 2>: <what happens>
- **State Requirements**:
  - <state slice>: <what it manages>

_(Repeat for each page)_

## 3. Data Model Specification

### Entity: <EntityName>
- **Source**: `schema` | `speculated`
- **Schema Path**: <path to schema file or "N/A">

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | string | yes | auto | Primary key |
| title | string | yes | — | |
| ... | ... | ... | ... | ... |

**Relationships**:
- <EntityName>.userId -> User.id
- ...

**Mock Data Rules**:
- Count: <number of mock records>
- Realistic values: <guidance for mock data generation>

_(Repeat for each entity)_

## 4. User Story Mapping

### Story: <US-ID> — <Title>
- **As a**: <user role>
- **I want to**: <action>
- **So that**: <benefit>
- **Acceptance Criteria**:
  1. <criterion 1>
  2. <criterion 2>
- **Page**: <page name>
- **Component**: <component name>
- **Required Interactions**:
  1. <step 1>
  2. <step 2>
- **State Changes**: <what state updates>
- **Validation Rules**: <form validation if applicable>

_(Repeat for each user story)_

## 5. Design System

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| --color-primary | <hex> | Primary actions, links |
| --color-secondary | <hex> | Secondary elements |
| --color-accent | <hex> | Highlights, badges |
| --color-background | <hex> | Page background |
| --color-surface | <hex> | Card/panel backgrounds |
| --color-text | <hex> | Primary text |
| --color-text-muted | <hex> | Secondary text |
| --color-border | <hex> | Borders, dividers |
| --color-success | <hex> | Success states |
| --color-warning | <hex> | Warning states |
| --color-error | <hex> | Error states |

### Typography
| Token | Value | Usage |
|-------|-------|-------|
| --font-heading | <family> | Headings |
| --font-body | <family> | Body text |
| --font-mono | <family> | Code, data |
| --font-size-xs | <size> | Captions |
| --font-size-sm | <size> | Secondary text |
| --font-size-base | <size> | Body (16px min) |
| --font-size-lg | <size> | Large body |
| --font-size-xl | <size> | H3 |
| --font-size-2xl | <size> | H2 |
| --font-size-3xl | <size> | H1 |
| --font-size-4xl | <size> | Display |

### Spacing
| Token | Value |
|-------|-------|
| --space-1 | 4px |
| --space-2 | 8px |
| --space-3 | 12px |
| --space-4 | 16px |
| --space-6 | 24px |
| --space-8 | 32px |
| --space-12 | 48px |
| --space-16 | 64px |

### Component Patterns
- **Cards**: <border-radius, shadow, padding, border>
- **Buttons**: <primary, secondary, ghost, sizes>
- **Forms**: <input style, label placement, error display>
- **Tables**: <header style, row hover, responsive behavior>
- **Modals**: <overlay, size, animation>
- **Navigation**: <active state, hover state, mobile behavior>

### Animation
- **Micro-interactions**: <hover, focus, click timing>
- **Page transitions**: <enter/exit animations>
- **Scroll reveals**: <if applicable>
- **Loading states**: <skeleton, spinner, or shimmer>

## 6. Interactivity Requirements

### Forms
| Form | Page | Fields | Validation | Submit Action |
|------|------|--------|------------|---------------|
| Login | login.html | email, password | email format, min 8 chars | Auth redirect |
| ... | ... | ... | ... | ... |

### Filters & Sorting
| Feature | Page | Options | Default |
|---------|------|---------|---------|
| Project filter | projects.html | All, Active, Archived | All |
| ... | ... | ... | ... |

### State Management
| Store Slice | Pages | State Shape | Actions |
|-------------|-------|-------------|---------|
| auth | all | { user, isAuth } | login, logout |
| ... | ... | ... | ... |

### Keyboard Shortcuts
| Shortcut | Action | Page |
|----------|--------|------|
| Ctrl+K | Command palette | all |
| ... | ... | ... |

## 7. Modifications

_(User-specified changes to apply on top of the base design)_

| Modification | Affects | Details |
|-------------|---------|---------|
| <change 1> | <pages/components> | <specific implementation> |

## 8. Iteration Context

_(Only present when mode is "iterate")_

### Previous Build Summary
- **Date**: <previous build date>
- **Pages**: <count>
- **Components**: <count>

### Delta Instructions
| Change | Scope | Details |
|--------|-------|---------|
| <change 1> | <files affected> | <what to modify> |

### Preserved Elements
_(List everything that should NOT change)_

## 9. Transfer Intent

### Framework Mapping
| Generated | Target |
|-----------|--------|
| index.html | app/page.tsx |
| style.css :root vars | tailwind.config.ts theme |
| app.js state | zustand store slices |
| app.js fetch | convex useQuery/useMutation |
| Component boundaries | React components |

### shadcn/ui Component Mapping
| Generated Pattern | shadcn/ui Component |
|-------------------|-------------------|
| .btn-primary | Button variant="default" |
| .card | Card |
| .dialog | Dialog |
| ... | ... |

### Data Fetching Mapping
| Mock Function | Target |
|---------------|--------|
| getProjects() | useQuery(api.projects.list) |
| createProject() | useMutation(api.projects.create) |
| ... | ... |
