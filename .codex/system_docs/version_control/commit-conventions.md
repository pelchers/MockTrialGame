# Commit Conventions

## Message Format

Every commit message follows this structure:

```
<type>[optional scope]: <subject>

<body (optional)>

<footer (optional)>
```

The subject line is a concise imperative description. The body provides context.
The footer contains metadata such as issue references or co-authorship.

## Commit Types

| Type       | Purpose                                      | Example                              |
|------------|----------------------------------------------|--------------------------------------|
| `feat`     | New feature                                  | `feat: Add user profile creation`    |
| `fix`      | Bug fix                                      | `fix: Prevent duplicate slugs`       |
| `docs`     | Documentation only                           | `docs: Add API endpoint docs`        |
| `style`    | Formatting, whitespace, missing semicolons   | `style: Format button components`    |
| `refactor` | Code change that neither fixes nor adds      | `refactor: Extract auth helper`      |
| `perf`     | Performance improvement                      | `perf: Lazy load profile avatars`    |
| `test`     | Adding or updating tests                     | `test: Add login flow tests`         |
| `chore`    | Build process, dependencies, tooling         | `chore: Update Next.js to 14.1`      |

## Scoped Commits

Add a scope in parentheses to narrow the commit's domain:

```
feat(auth): add OAuth login
fix(api): handle rate limit errors
docs(readme): update installation steps
style(ui): format button components
refactor(db): optimize user queries
perf(images): lazy load profile avatars
test(auth): add login flow tests
chore(deps): update Next.js to 14.1
```

Scopes are lowercase, short, and consistent within a project. Common scopes include
`auth`, `api`, `ui`, `db`, `deps`, `readme`, `config`.

## Agent Attribution

Autonomous agent commits include two trailers at the end of the message:

```
feat: Add profile management system

Created comprehensive profile management with:
- Profile creation with slug validation
- Profile update with optimistic locking
- Profile deletion with cascade
- Real-time profile subscriptions

Generated with Claude Code

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

The `Co-Authored-By` trailer credits the AI model that generated the code.

## Progress Log Updates

After each commit, update `logs/development-progress.md` with an entry:

```markdown
### Commit #42: Profile Management System
**Date**: 2025-02-28
**Status**: Complete

#### Work Completed:
- Created profile schema with indexed fields
- Implemented CRUD mutations with validation
- Added real-time query subscriptions

#### Files Modified:
- `convex/schema.ts` - Added profile table
- `convex/profiles.ts` - Profile mutations and queries

#### Next Steps:
- Add profile image upload
- Implement profile analytics
```

## Complete Examples

### Feature with context

```
feat: Add user profile creation

- Created profile schema in Convex
- Added profile creation mutation
- Integrated with Clerk user creation webhook
- Added slug validation and uniqueness check

Closes #123
```

### Bug fix

```
fix: Prevent duplicate profile slugs

Check for existing slugs before creating profile
to avoid unique constraint violation.
```

### Refactor

```
refactor: Extract authentication logic to helper

Move requireAuth logic from individual mutations
to shared auth.ts helper for reusability.
```

### Documentation

```
docs: Add API documentation for profile endpoints

Document all profile-related Convex mutations and queries
with parameter descriptions and return types.
```

## Branching Strategy

### Main Branch

Keep main stable. Only merge tested, working code:

```
git checkout main
git merge feature-branch --no-ff
```

### Feature Branches

Create a branch, do work, push:

```
git checkout -b feature/profile-management
git add src/components/ProfileForm.tsx
git commit -m "feat: Create profile form component"
git push -u origin feature/profile-management
```

### Autonomous Agent Workflow

Agents typically work directly on main in an isolated environment:

```
git checkout main
git commit -m "feat: Add profile schema"
git commit -m "feat: Add profile mutations"
git commit -m "feat: Integrate profile with UI"
git push origin main
```

## Anti-Patterns

| Anti-Pattern                       | Correct Approach                          |
|------------------------------------|-------------------------------------------|
| `git add . && git commit -m "wip"` | Stage specific files, write clear message |
| Multiple unrelated changes         | One logical change per commit             |
| Missing type prefix                | Always use `feat:`, `fix:`, etc.          |
| Committing `.env` files            | Add to `.gitignore`                       |
| Force pushing to main              | Use feature branches and merge            |
| Skipping progress log              | Update after every commit                 |
