---
name: managing-git-workflows
description: Manage Git workflows with atomic commits, clear messages, and autonomous coding practices. Use for version control, collaboration, and maintaining development history.
---

# Managing Git Workflows

Autonomous coding Git workflows for clear history and effective collaboration.

## Atomic Commits

### One Feature Per Commit

```bash
# Good: Single, focused commit
git add src/auth/login.ts src/auth/login.test.ts
git commit -m "Add login functionality with email validation"

# Bad: Multiple unrelated changes
git add .
git commit -m "Various changes"
```

### Commit After Each Task

```bash
# Complete task 1
git add src/components/ProfileCard.tsx
git commit -m "Create ProfileCard component with avatar and bio"

# Complete task 2
git add src/lib/api.ts
git commit -m "Add getProfile API function with caching"

# Complete task 3
git add src/app/profile/page.tsx
git commit -m "Integrate ProfileCard into profile page"
```

## Commit Messages

### Format

```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes nor adds feature
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Build process, dependencies, etc.

### Examples

```bash
# Feature with context
git commit -m "feat: Add user profile creation

- Created profile schema in Convex
- Added profile creation mutation
- Integrated with Clerk user creation webhook
- Added slug validation and uniqueness check

Closes #123"

# Bug fix
git commit -m "fix: Prevent duplicate profile slugs

Check for existing slugs before creating profile
to avoid unique constraint violation."

# Refactor
git commit -m "refactor: Extract authentication logic to helper

Move requireAuth logic from individual mutations
to shared auth.ts helper for reusability."

# Documentation
git commit -m "docs: Add API documentation for profile endpoints

Document all profile-related Convex mutations and queries
with parameter descriptions and return types."
```

## Autonomous Agent Pattern

### Commit with Attribution

```bash
git commit -m "feat: Add profile management system

Created comprehensive profile management with:
- Profile creation with slug validation
- Profile update with optimistic locking
- Profile deletion with cascade
- Real-time profile subscriptions

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Update Progress Log

After each commit, update `logs/development-progress.md`:

```markdown
### Commit #42: Profile Management System
**Date**: 2024-01-15
**Status**: Complete

#### Work Completed:
- Created profile schema with indexed fields
- Implemented CRUD mutations with validation
- Added real-time query subscriptions
- Integrated with Clerk authentication

#### Files Modified:
- `convex/schema.ts` - Added profile table
- `convex/profiles.ts` - Profile mutations and queries
- `convex/auth.ts` - requireUserType helper

#### Next Steps:
- Add profile image upload
- Implement profile analytics
```

## Branching Strategy

### Main Branch

```bash
# Always keep main stable
# Only merge tested, working code
git checkout main
git merge feature-branch --no-ff
```

### Feature Branches

```bash
# Create feature branch
git checkout -b feature/profile-management

# Work on feature
git add src/components/ProfileForm.tsx
git commit -m "feat: Create profile form component"

# Push to remote
git push -u origin feature/profile-management
```

### Autonomous Agent Workflow

```bash
# Agent works on main in isolated environment
git checkout main

# Make atomic commits as work progresses
git commit -m "feat: Add profile schema"
git commit -m "feat: Add profile mutations"
git commit -m "feat: Integrate profile with UI"

# Push when complete
git push origin main
```

## Useful Commands

### Check Status

```bash
# See what's changed
git status

# See unstaged changes
git diff

# See staged changes
git diff --cached

# See commit history
git log --oneline --graph --all
```

### Stage Changes

```bash
# Stage specific files
git add src/components/Button.tsx

# Stage all files in directory
git add src/components/

# Stage all changes
git add .

# Interactive staging
git add -p  # Review each change
```

### Undo Changes

```bash
# Unstage file
git reset HEAD file.ts

# Discard local changes
git checkout -- file.ts

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Amend last commit (only if not pushed)
git commit --amend -m "New message"
```

### View History

```bash
# Recent commits
git log --oneline -10

# With file changes
git log --stat

# Search commits
git log --grep="profile"

# By author
git log --author="Claude"

# File history
git log --follow -- file.ts
```

### Stash Changes

```bash
# Save work in progress
git stash

# List stashes
git stash list

# Apply latest stash
git stash pop

# Apply specific stash
git stash apply stash@{0}

# Stash with message
git stash save "WIP: profile form"
```

## Collaboration

### Pull Latest Changes

```bash
# Fetch and merge
git pull origin main

# Rebase instead of merge
git pull --rebase origin main
```

### Resolve Conflicts

```bash
# After conflict during merge/rebase
git status  # See conflicting files

# Edit files to resolve conflicts
# Then:
git add resolved-file.ts
git rebase --continue
# or
git merge --continue
```

## GitHub Workflows

### Create Pull Request

```bash
# Push feature branch
git push -u origin feature/profile-management

# Use GitHub CLI
gh pr create --title "Add profile management" --body "
## Summary
- Profile creation with validation
- Profile update and deletion
- Real-time subscriptions

## Test Plan
- [x] Create profile with valid data
- [x] Reject invalid slugs
- [x] Update profile fields
- [x] Delete profile with cascade

Generated with [Claude Code](https://claude.com/claude-code)
"
```

### Review PR

```bash
# Checkout PR locally
gh pr checkout 123

# View PR diff
gh pr diff

# Comment on PR
gh pr comment 123 --body "Looks good!"

# Approve PR
gh pr review 123 --approve

# Merge PR
gh pr merge 123 --squash
```

## Best Practices

1. **Commit early, commit often** - Small, focused commits
2. **Write clear messages** - Explain "why", not "what"
3. **One logical change per commit** - Easy to review and revert
4. **Keep commits atomic** - Each commit should work independently
5. **Review before committing** - Use `git diff` to check changes
6. **Use branches for experiments** - Keep main stable
7. **Pull before push** - Stay in sync with remote
8. **Don't commit secrets** - Use `.gitignore` and env files

## .gitignore Patterns

```gitignore
# Dependencies
node_modules/
.pnp/

# Build
.next/
out/
dist/
build/

# Environment
.env
.env.local
.env*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
coverage/
.nyc_output/

# Misc
.cache/
*.tsbuildinfo
```

## Conventional Commits Spec

```bash
# Format: <type>[optional scope]: <description>

feat(auth): add OAuth login
fix(api): handle rate limit errors
docs(readme): update installation steps
style(ui): format button components
refactor(db): optimize user queries
perf(images): lazy load profile avatars
test(auth): add login flow tests
chore(deps): update Next.js to 14.1
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org)
- [Git Best Practices](https://git-scm.com/book/en/v2)
- [GitHub CLI](https://cli.github.com)
