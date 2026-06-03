# Runbook Operacional — Plataforma Apex Production
## Procedures para Owner/Admin em Ambiente Production

**Data**: 2026-06-03  
**Versão**: 1.0 (Week 1 Operacional)  
**Audiência**: Owner, Admin, Operations Team  
**Nível de Acesso**: 🔴 Approval Required (Owner only)

---

## Table of Contents

1. [Daily Operations](#1-daily-operations)
2. [Incident Response](#2-incident-response)
3. [User Management](#3-user-management)
4. [CRM Operations](#4-crm-operations)
5. [Performance Tuning](#5-performance-tuning)
6. [Backup & Recovery](#6-backup--recovery)
7. [Deployment Procedures](#7-deployment-procedures)
8. [Escalation & Support](#8-escalation--support)

---

## 1. Daily Operations

### 1.1 Morning Health Check (Start of Day)

**Time**: 8:00 AM (before users arrive)  
**Owner Action**: Yes  
**Duration**: 5 minutes

**Checklist**:
```
[ ] Visit https://[production-domain]/api/health
    Expected: { status: "healthy", database: "connected" }
    
[ ] Check Vercel Analytics
    URL: https://vercel.com/projects/ai-construction-intelligence-platform
    Look for:
      - ✅ No 5xx errors in last 24h
      - ✅ Response time < 1s average
      - ✅ Uptime = 100% or > 99.9%
    
[ ] Check Supabase Logs
    URL: https://supabase.com/dashboard/project/stjhkxwylqtihzflspqe/logs
    Look for:
      - ✅ No auth failures
      - ✅ No slow queries (>1s)
      - ✅ No RLS policy violations
    
[ ] Quick user login test
    Go to production URL
    Create dummy test user (or use existing)
    Verify: Can login → Dashboard loads
    
[ ] Review overnight errors (if any)
    Vercel Logs → Filter for errors
    If any 5xx: Check issue, escalate if critical
```

**If Any Check Fails**:
1. Screenshot error
2. Document timestamp and affected endpoint
3. Follow Section 2: Incident Response

---

### 1.2 Monitoring Throughout Day

**Frequency**: Continuous (automated alerts)  
**Owner Action**: Respond to alerts  
**Tools**: Vercel, Supabase dashboards

**Set Up Alerts** (Week 1 Setup):
- Uptime alert if downtime > 5 min
- Error rate alert if 5xx > 0.5%
- Slow query alert if query time > 2s
- Auth failure spike if > 10% of requests

**During Business Hours**:
- Monitor Slack/Email for alert notifications
- Respond within 15 min of critical alert
- Document any anomalies in `/docs/INCIDENTS/`

---

### 1.3 End of Day Summary (5 PM)

**Duration**: 5 minutes  
**Checklist**:
```
[ ] Check Vercel Analytics for the day
    - Total requests processed
    - Error count
    - Top slow endpoints (if any)
    
[ ] Review CRM activity
    - Number of leads created today
    - Proposals generated
    - User activity (logins, actions)
    
[ ] Check backup status
    - Last successful Supabase backup timestamp
    - Any backup errors
    
[ ] Create daily summary
    File: /docs/DAILY_LOGS/summary_YYYY-MM-DD.txt
    Content:
      Date: 2026-06-10
      Status: ✅ Operational
      Uptime: 100%
      Errors: 0
      Users active: N
      Transactions processed: N
      Issues: None / [list]
      Notes: [operational notes]
```

---

## 2. Incident Response

### 2.1 Incident Classification

| Severity | Definition | Response Time | Example |
|----------|-----------|----------------|---------|
| 🔴 Critical | Complete outage, >5 min downtime | Immediate (<5 min) | API completely down, DB unavailable |
| 🟠 High | Major functionality broken, users blocked | <15 min | Login broken, CRM not accessible |
| 🟡 Medium | Partial functionality, workaround exists | <1 hour | Slow endpoint, degraded performance |
| 🟢 Low | Minor issue, no user impact | <24 hours | UI glitch, non-critical endpoint slow |

---

### 2.2 Critical Incident Response (🔴)

**Trigger**: Uptime drops below 99%, 5xx errors spike

**Immediate Actions** (First 5 min):
1. **Verify Issue**
   ```bash
   # SSH to Vercel or check logs
   curl -I https://[production-domain] 
   # Should return HTTP 200, not 5xx
   ```

2. **Check Status Pages**
   - Vercel status: https://www.vercelstatus.com/
   - Supabase status: https://status.supabase.com/
   - Anthropic API: https://status.anthropic.com/ (if using API heavily)
   - If external service down: Wait for resolution, communicate with users

3. **Check Recent Deployments**
   ```
   Vercel Dashboard → Deployments
   If bad deployment visible:
     - Click "Rollback to Previous"
     - Wait for rollback to complete (~2-3 min)
   ```

4. **If Rollback Succeeds**:
   - Test API endpoints again
   - Verify system recovered
   - Document incident in `/docs/INCIDENTS/CRITICAL_[timestamp].md`

5. **If Issue Persists**:
   - Check Supabase database status
   - Look for RLS policy errors in logs
   - Verify Anthropic API key is valid
   - **Last resort**: Escalate to Claude Code agent or external support

**Post-Incident** (After recovery):
- Write incident report within 4 hours
- Schedule postmortem meeting with team
- Document root cause and preventive measures

---

### 2.3 High Incident Response (🟠)

**Trigger**: Specific endpoint broken, login issues, CRM not working

**Steps**:
1. Identify affected endpoint
   ```
   Vercel Logs → Filter by endpoint
   Supabase Logs → Look for auth/query errors
   ```

2. Check recent code changes
   ```
   git log --oneline -10
   If issue correlates with recent commit:
     - Consider rollback
     - Or hotfix if quick fix available
   ```

3. Temporary workaround (if available)
   - Disable affected feature in UI
   - Route traffic to alternative endpoint
   - Notify users of degradation

4. Fix and deploy hotfix
   ```
   git checkout -b hotfix/[issue]
   [fix code]
   git commit -m "Hotfix: [issue description]"
   git push && create PR
   Wait for CI checks → Merge → Vercel auto-deploys
   ```

5. Verify fix in production
   ```
   Test affected endpoint
   Monitor error rates for 30 min
   If recovered: Document in incident log
   ```

---

### 2.4 Medium/Low Incident Response (🟡🟢)

**Process**:
1. Log issue in `/docs/INCIDENTS/[ticket_id].md`
2. Assess priority vs. workload
3. Schedule fix in next deployment
4. Monitor but don't interrupt active operations

---

### 2.5 Incident Report Template

**File**: `/docs/INCIDENTS/INCIDENT_[TIMESTAMP].md`

```markdown
# Incident Report — [Issue Title]

**Date/Time**: 2026-06-10 14:30 UTC  
**Duration**: 15 minutes  
**Severity**: 🟠 High  
**Status**: 🔧 Resolved

## Summary
[One sentence describing what broke]

## Impact
- Affected users: [N] logins
- Revenue impact: [estimated loss]
- Data loss: None / [describe]

## Root Cause
[Technical explanation]

## Timeline
- 14:30: Alert triggered (error rate spike)
- 14:32: Owner identified issue (endpoint X failing)
- 14:40: Rolled back to previous deployment
- 14:45: System recovered, verified working

## Fix
[Description of code change or hotfix]

## Prevention
[Measures to prevent recurrence]

## Owner Sign-off
- [ ] Incident documented
- [ ] Root cause identified
- [ ] Fix deployed
- [ ] Prevention in place
- [ ] Team notified
```

---

## 3. User Management

### 3.1 Add New User (Admin Action)

**Prerequisite**: Owner approval  
**Time**: 5 minutes

**Steps**:
1. Access Supabase Auth Console
   ```
   URL: https://supabase.com/dashboard/project/stjhkxwylqtihzflspqe/auth/users
   ```

2. Click "Invite User"
   ```
   Email: user@example.com
   Select Role: Owner / Admin / User / Guest
   Click "Send Invite"
   ```

3. User receives email with magic link
   ```
   User clicks link → Sets password → Logs in
   ```

4. Verify access
   ```
   User should see:
   - Dashboard (all roles)
   - CRM (Owner/Admin/User)
   - Skills (Owner/Admin)
   - Admin panel (Owner/Admin only)
   ```

---

### 3.2 Change User Role (Admin Action)

**Steps**:
1. Supabase Auth Console → Find user
2. Click user row → Edit role dropdown
   ```
   Options: owner, admin, user, guest
   ```
3. Save changes
4. User sees new capabilities on next login

---

### 3.3 Disable/Remove User (Owner Action)

**Warning**: Cannot be undone without restoring from backup

**Steps**:
1. Supabase Auth Console → Find user
2. Click three dots → "Disable user"
   ```
   User cannot login
   All sessions invalidated
   ```

3. (Optional) Delete user
   ```
   Click three dots → "Delete user"
   All user data in profiles/projects deleted
   (based on RLS cascade rules)
   ```

---

## 4. CRM Operations

### 4.1 View CRM Dashboard

**URL**: `https://[production-domain]/crm/revenue`  
**Role Required**: User or higher  
**Purpose**: Monitor leads, opportunities, proposals, revenue

**Dashboard Shows**:
- Total leads this month
- Opportunities in each stage
- Proposals pending/approved
- Revenue YTD
- Top performers (if tracking users)

---

### 4.2 Manual Lead Creation (Admin Action)

**Use Case**: Manually add lead if system form fails

**Steps**:
1. Login to production
2. Navigate to CRM → Create Lead (or use API)
   ```
   POST /api/crm/leads
   Body: {
     "name": "Acme Corp",
     "email": "contact@acme.com",
     "phone": "+55 11 99999-9999",
     "company": "Acme Construction",
     "status": "new",
     "source": "manual_admin"
   }
   ```

3. Verify in CRM dashboard
   ```
   Lead should appear in "New" stage
   ```

---

### 4.3 Generate Proposal (Owner/Admin)

**URL**: `https://[production-domain]/crm/proposals/new`

**Steps**:
1. Select opportunity
2. Choose services/pricing
3. Click "Generate PDF"
   ```
   Backend calls Help AI → Generates proposal
   PDF created and ready to download
   ```

4. Review PDF
5. Download or send to client
6. Track status in CRM

---

## 5. Performance Tuning

### 5.1 Identify Slow Endpoints

**Monitor Via Vercel**:
```
Vercel Dashboard → Analytics → Functions tab
Shows response time distribution
Look for outliers > 1s
```

**Monitor Via Supabase**:
```
Supabase Console → Logs → Filter by slow queries (>1000ms)
```

---

### 5.2 Optimize Slow Database Queries

**Example**: If `/api/crm/revenue/dashboard` slow

1. Check query in logs
   ```
   Supabase Logs → Search for "revenue/dashboard"
   Look at generated SQL
   ```

2. Identify issue (if not indexed)
   ```
   SELECT * FROM opportunities WHERE created_at > NOW() - '30 days'
   → Missing index on created_at
   ```

3. Add index (via Supabase)
   ```
   Supabase Console → SQL Editor
   CREATE INDEX idx_opportunities_created_at ON opportunities(created_at);
   ```

4. Verify performance improved
   ```
   Re-run query in Logs
   Compare: before (2s) → after (200ms)
   ```

---

### 5.3 API Rate Limiting

**Current Limits**:
- Anthropic API: Based on subscription tier (check account)
- Supabase RLS: No hard limit (but optimize queries)
- Vercel: No function timeout for preview, 60s for production

**If Rate Limited**:
1. Check Anthropic dashboard
   ```
   https://console.anthropic.com/
   Look at usage vs. tier limit
   ```

2. Options:
   - Upgrade Anthropic tier
   - Implement request queuing (for High AI skill)
   - Batch requests instead of individual calls

---

## 6. Backup & Recovery

### 6.1 Manual Backup (Before Major Changes)

**Procedure**:
1. Notify users: "Scheduled maintenance 5-10 min"
2. Trigger manual backup via Supabase
   ```
   Supabase Console → Database → Backups → "Create backup"
   ```
3. Wait for backup to complete (~5 min)
4. Proceed with changes

---

### 6.2 Restore from Backup (Disaster Recovery)

**Warning**: Restores entire database to backup point. Test in staging first!

**Steps**:
1. Verify backup exists
   ```
   Supabase Console → Backups tab
   Select desired backup (e.g., 1 day old)
   ```

2. Click "Restore" button
   ```
   Confirmation: "This will restore database to [date/time]"
   Click "Restore"
   ```

3. Wait for restore (5-15 min depending on data size)

4. Verify post-restore
   ```
   Test login
   Query CRM data
   Verify file storage accessible
   ```

5. If restore successful: Document in recovery log
6. If restore fails: Contact Supabase support

---

### 6.3 Storage File Recovery

**Use Case**: User accidentally deletes project files

**Steps**:
1. Check if file in trash/archive
   ```
   Supabase Console → Storage → projects bucket
   Look for deleted file (if soft-delete enabled)
   ```

2. If file in backup:
   ```
   Restore full database backup (Section 6.2)
   File should reappear
   ```

3. If file permanently deleted:
   ```
   Contact user: Can recreate project files
   No recovery available post-backup
   ```

---

## 7. Deployment Procedures

### 7.1 Hotfix Deployment (Emergency)

**Trigger**: Critical bug in production

**Steps**:
```bash
# 1. Create hotfix branch from main
git checkout -b hotfix/[issue-name] main

# 2. Make minimal code change
# (Edit only what's broken)

# 3. Commit
git commit -m "Hotfix: [description]"

# 4. Push and create PR
git push -u origin hotfix/[issue-name]

# 5. Wait for CI/CD
# GitHub Actions: Build & Type Check → must pass
# Vercel: Preview deployment → verify

# 6. Merge when CI green
# (Squash merge to keep main history clean)

# 7. Monitor production
# (Vercel auto-deploys from main)
# Check logs for errors
```

---

### 7.2 Regular Feature Deployment (Week 2+)

**Timeline**: Friday evening, minimal user impact

**Steps**:
1. Create feature branch from main
2. Develop and test locally
3. Create PR with test evidence
4. Code review (Owner approval required)
5. CI/CD checks pass
6. Merge to main
7. Vercel auto-deploys
8. Monitor for 30 min post-deployment

---

### 7.3 Rollback Procedure

**Trigger**: Deployed code has critical bug

**Via Vercel Console**:
```
Vercel Dashboard → Deployments
Click previous "Ready" deployment
Click three dots → "Promote to Production"
Wait for promotion (~1 min)
Test production
```

**Via GitHub**:
```bash
# If urgent, manually revert commit
git revert [commit-hash]
git push
# Vercel auto-deploys the revert
```

---

## 8. Escalation & Support

### 8.1 Who to Contact

| Issue | Contact | Response Time |
|-------|---------|----------------|
| Vercel deployment failed | Vercel Support | 24h |
| Supabase down | Supabase Support | 24h |
| Code bug (not external) | Claude Code agent | 2-4h |
| Anthropic API limit exceeded | Anthropic support | 24h |
| Database corruption | Supabase support + Backup restore | 4h |

---

### 8.2 Support Escalation Path

**Step 1**: Try self-service
- Check dashboards (Vercel, Supabase)
- Review logs
- Attempt rollback if needed

**Step 2**: Document issue
- Create incident report (Section 2.5)
- Gather screenshots, logs, timestamps
- Describe steps to reproduce

**Step 3**: Contact vendor support
- Include incident report
- Link to affected service
- Specify production vs. staging

**Step 4**: Follow up
- Check support ticket daily
- Provide additional info if requested
- Document resolution for future reference

---

## 9. Scheduled Maintenance

### 9.1 Weekly Maintenance Window (Every Sunday, 2-4 AM UTC)

**Announce to Users**: "Scheduled maintenance Sun 2-4 AM UTC, ~1 hour downtime expected"

**During Window**:
- [ ] No deployments from Owner actions
- [ ] Supabase can perform maintenance (automatic)
- [ ] Vercel auto-scales if needed
- [ ] Monitor closely for issues
- [ ] Have rollback ready if something breaks

---

### 9.2 Monthly Reviews (First Monday of Month)

**Checklist**:
- [ ] Review all incidents from past month
- [ ] Analyze trends (most common errors, slowest endpoints)
- [ ] Plan optimizations for next month
- [ ] Update this runbook with learnings
- [ ] Team sync meeting (15 min)

---

## 10. Emergency Contacts

Keep updated:
```
Owner/Admin: [phone] [email]
Vercel Support: support@vercel.com
Supabase Support: support@supabase.com
Anthropic API Support: support@anthropic.com
```

---

**Document Status**: 📋 Week 1 Ready  
**Last Updated**: 2026-06-03  
**Next Review**: After Week 1 pilot goes live

