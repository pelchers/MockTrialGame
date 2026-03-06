---
name: deploy-preview
description: Deploy to preview/staging environment for testing
invocable: true
---

# Deploy Preview Environment

Deploy the current branch to a preview/staging environment for testing before production.

## Instructions for Claude

When this command is invoked:

1. **Pre-deployment checks**:
   - Verify current git branch
   - Check for uncommitted changes
   - Ensure all tests pass: `npm test`
   - Run production build: `npm run build`
   - Check for type errors: `tsc --noEmit`

2. **Deploy Convex (if applicable)**:
   ```bash
   npx convex deploy --preview
   # or for named preview
   npx convex deploy --preview [branch-name]
   ```

3. **Deploy Frontend**:

   **For Vercel:**
   ```bash
   vercel
   # This creates a preview deployment automatically
   ```

   **For Netlify:**
   ```bash
   netlify deploy
   ```

   **For custom deployment:**
   ```bash
   # Run project-specific deployment command
   npm run deploy:preview
   ```

4. **Verify deployment**:
   - Show deployment URL
   - Check deployment logs for errors
   - Verify environment variables are set
   - Test critical endpoints/routes

5. **Report results**:
   - Display preview URL
   - Show deployment status
   - List any warnings or errors
   - Provide next steps for testing

## Deployment Checklist

- [ ] All tests passing
- [ ] Production build successful
- [ ] No TypeScript errors
- [ ] Environment variables configured
- [ ] Database migrations applied (if any)
- [ ] Webhooks configured (if needed)

## Example Usage

```
User: /deploy-preview
Claude: Preparing preview deployment...
```

## Post-Deployment Testing

After successful deployment:
1. Test authentication flows
2. Verify database connections
3. Check API endpoints
4. Test payment processing (use test mode)
5. Verify real-time features
6. Test critical user journeys

## Rollback Procedure

If deployment fails or has issues:
1. Check deployment logs
2. Identify error source
3. Fix issues locally
4. Redeploy with fixes
5. For critical issues, revert to last stable deployment

## Notes

- Preview deployments typically auto-deploy on PR creation
- Use preview environments for testing before production
- Preview URLs are publicly accessible but not indexed
- Clean up old preview deployments periodically
- Preview environments may have separate database instances
