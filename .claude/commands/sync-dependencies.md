---
name: sync-dependencies
description: Update and sync dependencies across the project
invocable: true
---

# Sync Dependencies

Update and synchronize dependencies across the project, ensuring consistency.

## Instructions for Claude

When this command is invoked:

1. **Check current state**:
   ```bash
   npm outdated
   ```
   - Show outdated packages
   - Identify major vs minor updates
   - Note breaking changes

2. **Update package.json**:
   - Review dependencies
   - Update versions as needed
   - Check for security vulnerabilities: `npm audit`

3. **Install updated dependencies**:
   ```bash
   npm install
   # or for clean install
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **For monorepo (if applicable)**:
   ```bash
   # Install at workspace root
   npm install

   # Install in all workspaces
   npm install --workspaces
   ```

5. **Verify installations**:
   - Run build: `npm run build`
   - Run tests: `npm test`
   - Check for type errors: `tsc --noEmit`
   - Test dev server: `npm run dev`

6. **Update peer dependencies**:
   - Check for peer dependency warnings
   - Update related packages if needed
   - Ensure compatibility

7. **Security audit**:
   ```bash
   npm audit fix
   # For major updates that fix vulnerabilities
   npm audit fix --force
   ```

8. **Commit changes**:
   - Stage package.json and package-lock.json
   - Create atomic commit:
     ```
     chore: update dependencies

     - Updated [list major packages]
     - Fixed security vulnerabilities
     - Verified tests pass
     ```

## Update Strategies

**Minor/Patch Updates (Safe):**
```bash
npm update
```

**Major Updates (Review Required):**
```bash
npm install package@latest
# Review breaking changes in changelog
```

**Interactive Update:**
```bash
npx npm-check-updates -i
# Select packages to update interactively
```

## Example Usage

```
User: /sync-dependencies
Claude: Checking for outdated dependencies...
```

## Post-Update Checklist

- [ ] All packages installed successfully
- [ ] Build completes without errors
- [ ] Tests pass
- [ ] No type errors
- [ ] Dev server starts correctly
- [ ] No runtime errors in browser
- [ ] Security vulnerabilities addressed

## Common Issues

**Peer Dependency Conflicts:**
```bash
npm install --legacy-peer-deps
# or
npm install --force
```

**Lock File Conflicts:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Cache Issues:**
```bash
npm cache clean --force
npm install
```

## Notes

- Always test thoroughly after dependency updates
- Read changelogs for major version updates
- Update dependencies regularly to avoid accumulation
- Consider using Dependabot or Renovate for automation
- Pin versions for production stability
- Keep lock files committed to version control

