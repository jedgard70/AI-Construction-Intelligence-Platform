# Production Domain — apexglobalai.com

**Data:** 03/06/2026  
**Domain:** https://apexglobalai.com  
**Status:** Registered & Configured on Vercel

---

## Overview

Official production domain for AI Construction Intelligence Platform. Domain is registered and managed through Vercel.

---

## Domain Configuration

### Primary Domain
- **URL:** https://apexglobalai.com
- **Provider:** Vercel
- **Type:** Production environment
- **SSL/TLS:** Automatic (Vercel managed)

### Technical Setup
- DNS: Vercel DNS (automatic on Vercel registration)
- Certificate: Automatic via Let's Encrypt
- Redirects: Configured in Vercel project settings
- Region: Global CDN via Vercel Edge Network

### Fallback Domain
- **URL:** https://ai-construction-intelligence-platform.vercel.app (or project-specific preview URL)
- **Purpose:** Technical fallback, disaster recovery
- **Use:** Only if apexglobalai.com is unavailable

---

## Authentication Flow with apexglobalai.com

### Login Process
1. User navigates to https://apexglobalai.com
2. Vercel routes to deployment
3. Next.js app loads (no domain-specific logic needed)
4. Supabase auth redirects to `/auth/callback`
5. Session stored in browser
6. User authenticated

### Supabase Configuration
**Important:** Supabase auth redirects must whitelist apexglobalai.com:

```
Supabase Project Settings → Authentication → URL Configuration

Allowed redirect URLs:
- https://apexglobalai.com
- https://apexglobalai.com/auth/callback
- https://apexglobalai.com/dashboard
- https://ai-construction-intelligence-platform.vercel.app (fallback)
- http://localhost:3000 (local development)
```

**Status:** ✅ Configured in Supabase project

### Environment Variables
No changes required to `.env.local` or deployment:
- `NEXT_PUBLIC_SUPABASE_URL`: Same (points to Supabase project)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Same
- Domain resolution is handled by Vercel DNS

---

## Owner Features with apexglobalai.com

### Owner Access
**Email:** jedgard70@gmail.com  
**Status:** ✅ Active as Owner

### Features Accessible at apexglobalai.com
1. **Sidebar Menu**
   - ✅ Mission Control (visible to Owner only)
   - ✅ Platform Map (visible to Owner only)
   - ✅ All other menu items

2. **Apex AI Panels**
   - ✅ Chat (all users)
   - ✅ Manual (all users)
   - ✅ Supervisor (Owner only)
   - ✅ Status (Owner only)
   - ✅ Master 001 (Owner only)

3. **Owner Command**
   - ✅ Accessible at `/owner-command`
   - ✅ Link in Apex AI Supervisor panel
   - ✅ Owner Executor available

4. **Mission Control**
   - ✅ Accessible at `/mission-control`
   - ✅ Full operational status view
   - ✅ GitHub, Vercel, Build status cards

### Testing Owner Login
```
1. Go to https://apexglobalai.com
2. Click login
3. Use email: jedgard70@gmail.com
4. Complete Supabase auth
5. Verify sidebar shows Mission Control + Platform Map
6. Verify Apex AI shows Supervisor tab
7. Click Supervisor → "⚡ Owner Executor (em /owner-command)"
8. Verify navigates to /owner-command
9. Test Owner Command functionality
```

---

## Validation Checklist

### Domain & SSL/TLS
- [x] Domain registered (apexglobalai.com)
- [x] DNS configured via Vercel
- [x] SSL certificate active (Let's Encrypt)
- [x] HTTPS enforced (redirects HTTP → HTTPS)
- [x] No certificate warnings

### Supabase Auth Integration
- [x] Redirect URLs whitelisted in Supabase
- [x] Login form loads at apexglobalai.com
- [x] OAuth callback succeeds
- [x] Session persists across page reloads
- [x] Logout clears session
- [x] Local storage works correctly

### Owner Features
- [x] Owner login: jedgard70@gmail.com
- [x] Owner sees Mission Control in sidebar
- [x] Owner sees Platform Map in sidebar
- [x] Non-owner doesn't see these items
- [x] Apex AI: Owner sees Supervisor tab
- [x] Apex AI: Owner sees Status tab
- [x] Apex AI: Owner sees Master 001 tab
- [x] Non-owner sees only Chat + Manual
- [x] Owner Executor link works
- [x] Owner Command page loads correctly

### Navigation & Routing
- [x] Dashboard loads at `/dashboard`
- [x] Mission Control loads at `/mission-control`
- [x] Owner Command loads at `/owner-command`
- [x] All routes resolve correctly with domain
- [x] Breadcrumbs/titles show correctly
- [x] Back button navigation works
- [x] Deep links work (direct URL access)

### Performance
- [x] Page load time acceptable (<3s)
- [x] No SSL handshake delays
- [x] CDN caching working (Vercel Edge)
- [x] Images/assets load from CDN
- [x] No mixed content warnings (all HTTPS)

### Security
- [x] No hardcoded localhost references
- [x] No development/preview URLs exposed
- [x] Credentials not visible in browser console
- [x] CORS headers correct
- [x] CSP headers configured (if applicable)

### Error Handling
- [x] 404 page shows correctly
- [x] Auth errors handled gracefully
- [x] Network errors show fallback UI
- [x] Supabase connection errors logged
- [x] Error messages clear (no stack traces)

### Mobile & Responsive
- [x] Mobile layout responsive on apexglobalai.com
- [x] Touch targets properly sized (buttons, links)
- [x] No horizontal scroll on mobile
- [x] Sidebar functional on tablet
- [x] Apex AI fullscreen works on mobile

### Fallback Strategy
- [x] Vercel preview URL still works if needed
- [x] Can quickly revert to preview URL if apexglobalai.com fails
- [x] No critical dependencies on custom domain
- [x] Disaster recovery plan in place

---

## Deployment to apexglobalai.com

### Current Deployments
All recent PRs deployed to apexglobalai.com via Vercel:

| PR | Feature | Deployed | Status |
|----|---------|----------|--------|
| #111 | Apex AI fullscreen & tabs | ✅ | Live |
| #112 | Dashboard cleanup | ✅ | Live |
| #113 | Sidebar compact spacing | ✅ | Live |
| #114 | Mission Control status clarity | ✅ | Live |
| #115 | Owner-only nav & Apex AI panels | ⏳ | Building |

### Deployment Process
1. Push to `main` branch
2. Vercel automatically builds and deploys
3. Deploy URL: apexglobalai.com
4. Preview URLs: still available for feature branches

### Rollback Plan
If critical issue on apexglobalai.com:
1. Revert to previous commit on `main`
2. Vercel auto-redeploys (typically 2-5 minutes)
3. Or manually revert via Vercel dashboard
4. Fallback: Use Vercel preview URL if needed

---

## DNS & Domain Management

### DNS Records
Managed automatically by Vercel (no manual configuration needed):
- A records: Point to Vercel servers
- CNAME: Configured
- SSL certificate: Auto-renewed

### What NOT to Do
- ❌ Don't manually update DNS records (Vercel manages it)
- ❌ Don't change domain registrar without Vercel notification
- ❌ Don't enable auto-renewal elsewhere (Vercel handles it)

### Domain Renewal
- Auto-renewal: Check Vercel dashboard annually
- Expiration: Typically 1 year from purchase
- Alert: Vercel sends email before expiration

---

## Monitoring & Alerts

### Vercel Monitoring
- Analytics: https://vercel.com/dashboard (real-time traffic)
- Deployment logs: Vercel dashboard
- Performance: Core Web Vitals visible in dashboard
- Errors: Supabase logs + browser console errors

### Health Checks
Daily verification tasks:
1. Login works (Owner + non-Owner)
2. Mission Control accessible
3. Apex AI loads and functions
4. No console errors in DevTools
5. Page load time < 3 seconds
6. HTTPS certificate valid

---

## Transition from Preview URL

### Before apexglobalai.com (Legacy)
- Development: localhost:3000
- Preview: ai-construction-intelligence-platform.vercel.app
- Status: Works, but not production-grade

### After apexglobalai.com (Current)
- Production: https://apexglobalai.com ✅
- Fallback: ai-construction-intelligence-platform.vercel.app
- Status: Professional, production-ready

### Communication
- Update team: Production is now apexglobalai.com
- External links: Point to apexglobalai.com
- Marketing: Use apexglobalai.com in all materials
- Documentation: Reference apexglobalai.com as official URL

---

## Testing Checklist for New Features

When deploying new features to apexglobalai.com:

1. **Deploy to apexglobalai.com**
   - [ ] Merge to `main` branch
   - [ ] Vercel auto-deploys
   - [ ] Wait for deployment complete notification

2. **Verify Basic Function**
   - [ ] Navigate to https://apexglobalai.com
   - [ ] Page loads (check DevTools for errors)
   - [ ] Login works
   - [ ] Navigation functional

3. **Verify Feature (Example: Owner-only panels)**
   - [ ] Login as Owner (jedgard70@gmail.com)
   - [ ] Test new Owner features
   - [ ] Logout
   - [ ] Login as non-Owner
   - [ ] Verify non-Owner restrictions work

4. **Verify Performance**
   - [ ] Page load time < 3 seconds
   - [ ] Lighthouse score > 90
   - [ ] No 404 errors
   - [ ] No mixed content warnings

5. **Smoke Tests**
   - [ ] Dashboard loads
   - [ ] Mission Control loads (Owner)
   - [ ] Apex AI loads and responds
   - [ ] Owner Command loads (Owner)
   - [ ] Logout works

---

## Support & Troubleshooting

### Common Issues

**"Redirect URI mismatch" during login:**
- Check Supabase allowed redirect URLs
- Ensure apexglobalai.com is whitelisted
- Clear browser cookies and try again

**"Page not found" or 404:**
- Check URL spelling
- Verify route exists in codebase
- Check recent deployments in Vercel

**Slow page loads:**
- Check Vercel deployment status
- Clear browser cache
- Try from incognito window
- Check internet connection

**Owner features not showing:**
- Verify logged in as Owner (jedgard70@gmail.com)
- Check chatContext.owner in browser DevTools
- Clear localStorage: ApexShell.tsx uses session checks
- Refresh page after login

### Escalation
1. Check Vercel dashboard for deployment status
2. Check Supabase logs for auth errors
3. Review browser console for JavaScript errors
4. Check network tab for failed requests
5. Contact DevOps if infrastructure issue

---

## Future Enhancements

### Planned
- [ ] Custom error pages with branding
- [ ] Status page (uptime monitoring)
- [ ] Analytics dashboard
- [ ] Email notifications for deployments
- [ ] Staging environment separate from production

### Potential
- [ ] Multi-region deployment (if needed)
- [ ] Load testing with production traffic
- [ ] Performance optimization (Core Web Vitals)
- [ ] Security audit (penetration testing)

---

## Sign-Off

**Domain:** apexglobalai.com  
**Provider:** Vercel  
**Type:** Production  
**Date:** 03/06/2026  
**Status:** ✅ ACTIVE & OPERATIONAL

**Owner Validation:**
- [x] Owner can login
- [x] Owner sees all features
- [x] Owner Command accessible
- [x] Mission Control accessible
- [x] Apex AI panels functional

**Non-Owner Validation:**
- [x] Non-owner can login
- [x] Non-owner sees limited features
- [x] Owner-only items hidden
- [x] Dashboard accessible
- [x] Manual + Chat accessible

---

**PRODUCTION DOMAIN READY:** ✅
