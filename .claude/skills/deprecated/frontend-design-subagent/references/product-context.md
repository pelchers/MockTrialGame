# Product Context — IDEA-MANAGEMENT

This file defines the **content layer** for frontend concept generation. Visual style comes from the style-config pass. Content comes from here. The two are independent layers.

All mock content in generated passes MUST use the terminology, data models, and feature vocabulary defined below. The `contentPersona` still controls visual tone and metaphor — but the actual text, labels, metrics, column names, and sample data must reflect this product spec.

## What This App Is

IDEA-MANAGEMENT is a production-grade idea management and software planning platform. Users create **projects**, capture **ideas**, organize work on **kanban boards**, sketch on **whiteboards**, model data with a **schema planner**, scaffold directory structures, and get AI assistance — all synchronized between web and desktop clients.

## Data Models & Terminology

### Project (`project.json`)
- Fields: `id`, `name`, `slug`, `description`, `status` (active/archived), `tags[]`, `ownerId`, `collaborators[]`, `goals[]`, `techStack[]`, `links{}`, `sync { cloudProjectId, lastSyncedAt, revision }`, `createdAt`, `updatedAt`
- Example project names: "Wavz.fm Music Platform", "Campus Learning App", "RepoSaver Backup Tool", "Storyboarder Video Editor", "Event Invites System"

### Idea (`ideas/ideas.json`)
- Quick-capture entries with title, description, tags, priority
- Can be promoted to kanban cards, whiteboard items, or tasks
- Example ideas: "Add dark mode toggle to settings", "Implement drag-drop file upload", "Research vector search for AI embeddings", "Prototype real-time collaboration"

### Kanban Board (`kanban/board.json`)
- Columns: **Backlog**, **In Progress**, **Review**, **Done** (default workflow)
- Cards have: title, description, labels, priority, due date, assignee
- Example cards: "Set up Clerk authentication", "Design kanban drag-drop UX", "Write Stripe webhook handler", "Add AI sidebar context panel"

### Whiteboard (`whiteboard/board.json` + `whiteboard/assets/`)
- Infinite canvas with draggable/resizable containers
- Text blocks, image attachments, node linking, grouping
- Example content: architecture diagrams, wireframe sketches, brainstorm clusters

### Schema Planner (`schema/schema.graph.json`)
- Node-based data modeling with entity definitions
- Relationships: 1-to-1, 1-to-many, many-to-many
- Example entities: `User`, `Project`, `Idea`, `KanbanCard`, `KanbanColumn`, `WhiteboardNode`, `AuditLog`, `Subscription`
- Example fields: `User { id, email, displayName, role, subscriptionTier, createdAt }`, `Idea { id, title, body, tags[], priority, projectId, promotedTo? }`

### Directory Tree (`directory-tree/tree.plan.json`)
- Template-driven folder structure generation with preview-before-apply
- The canonical project folder structure:
  ```
  <ProjectRoot>/
  ├── project.json
  ├── planning/ (prd.md, trd.md, notes.md)
  ├── kanban/ (board.json)
  ├── whiteboard/ (board.json, assets/)
  ├── schema/ (schema.graph.json, exports/)
  ├── directory-tree/ (tree.plan.json, generated/)
  ├── ideas/ (ideas.json)
  ├── ai/ (chats/default.ndjson)
  └── .meta/ (sync.json, snapshots/)
  ```

### AI Chat (`ai/chats/`)
- Full-page chat and sidebar chat modes
- Tool actions that mutate project artifacts:
  - `add_idea` → writes to `ideas/ideas.json`
  - `update_kanban` → modifies `kanban/board.json`
  - `generate_tree` → creates directory structure
  - `create_project_structure` → scaffolds default folders/files
- All file-changing actions require confirmation and are audit-logged
- Example exchanges:
  - User: "Add an idea for implementing WebSocket real-time updates"
  - AI: "I'll add that to your ideas list." [Tool: add_idea] [Confirmation dialog]
  - User: "Move the auth card to Review"
  - AI: "Moving 'Set up Clerk authentication' to Review column." [Tool: update_kanban]

## View-Specific Content Requirements

### Dashboard
- Greeting with user name
- 4+ stat metrics: Active Projects count, Total Ideas count, Tasks In Progress, Collaborators
- Recent activity feed: "Alice updated Wavz.fm kanban", "Bob added 3 ideas to Campus", etc.
- Upcoming milestones or due dates
- Quick-action buttons: New Project, Capture Idea, Open AI Chat

### Projects (Drive View)
- Grid or list of project cards
- Each card: project name, description snippet, status badge (Active/Archived), tag chips, last updated date, collaborator avatars
- Search bar, filter by status/tags, sort by name/date
- Create New Project button

### Project Workspace
- Left pane: folder navigation showing `planning/`, `kanban/`, `whiteboard/`, `schema/`, `directory-tree/`, `ideas/`, `ai/`, `.meta/`
- Right pane: `project.json` metadata display — name, description, status, tags, tech stack, goals, sync status
- Breadcrumb navigation

### Kanban
- 4 columns: Backlog, In Progress, Review, Done
- 2-3 cards per column with real task titles, labels (feature/bug/chore), priority indicators, assignee avatars, due dates
- Column card counts
- Add Card button per column

### Whiteboard
- Canvas area with toolbar (select, draw, text, image, connect, group)
- 3-5 placeholder containers with text/image content
- Zoom controls, minimap
- Node connection lines between containers

### Schema Planner
- 3-5 entity nodes (User, Project, Idea, KanbanCard, etc.)
- Relationship edges with cardinality labels
- Field lists inside each entity node (field name, type, constraints)
- Export button / migration timeline

### Directory Tree
- Expandable/collapsible folder tree showing the canonical project structure
- File type icons (folder, markdown, json)
- Path breadcrumbs
- "Generate" and "Preview" action buttons

### Ideas
- Quick-capture input form (title, description, tags, priority)
- Ideas list/grid with: title, snippet, tag chips, priority badge, creation date
- "Promote to Kanban" action button on each idea
- Filter by tag, search

### AI Chat
- Message thread with 4-6 exchanges demonstrating tool actions
- User messages and AI responses clearly differentiated
- Tool action UI: confirmation dialogs, success toasts
- Context panel showing current project
- Suggested quick actions: "Add idea", "Update board", "Generate tree"

### Settings
- Account section: display name, email, avatar
- Subscription section: current plan (Free/Pro/Team), billing status, upgrade button
- Preferences: theme (light/dark/system), default view, notification settings
- Integrations: connected services
- Data: export project, sync status

## Auth & Subscription Context
- Auth: email/password with session tokens (not social login for v1)
- Subscription tiers: Free, Pro, Team
- Gated features: AI chat (Pro+), unlimited projects (Pro+), team collaboration (Team)
- Admin role exists for testing/validation

## Key Terminology
- "Project" not "workspace" or "space"
- "Idea" not "note" or "thought"
- "Kanban card" not "ticket" or "issue"
- "Schema planner" not "ERD" or "database designer"
- "Directory tree" not "file manager" or "explorer"
- "Whiteboard" not "canvas" (canvas is the underlying tech, whiteboard is the feature)
