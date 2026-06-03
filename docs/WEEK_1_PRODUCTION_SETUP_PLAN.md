# Week 1 — Production Setup Controlado
## Plataforma Apex AI Construction Intelligence

**Data**: 2026-06-03  
**Status Base**: ✅ Plataforma 100% operacional em `51b3940`  
**Fase**: Transição Preview → Production  
**Responsável**: Owner (discretionary execution)

---

## Executive Summary

Week 1 é o período crítico de **preparação e go-live controlado** da Plataforma Apex em produção real. Este documento lista todos os passos necessários para:

1. **Deploy Vercel production** — ativar production environment
2. **Domínio customizado** — mapear apex-platform.com (ou customizado)
3. **Monitoring e logging** — observabilidade em tempo real
4. **Backup automation** — proteção de dados
5. **Runbook operacional** — procedures para Owner/Admin
6. **Checklist go-live** — validações finais antes de usuarios

**Princípio**: Nada sai do planejamento para produção sem Owner approval explícita.

---

## 1. Deploy Vercel Production

### 1.1 Current State
- ✅ Preview deployment: `ai-construction-intelligence-pla-git-5305f4-jedgard70s-projects.vercel.app`
- ✅ All CI/CD passing (GitHub Actions + Vercel)
- ✅ Code clean, no breaking changes desde 51b3940

### 1.2 Production Deployment Steps (Manual — Owner Action)

**Step 1.2.1: Access Vercel Dashboard**
- URL: https://vercel.com/jedgard70s-projects/ai-construction-intelligence-platform
- Log in com credentials
- Select main branch (already configured)

**Step 1.2.2: Trigger Production Deployment**
```
Vercel Dashboard → Deployments → Deploy Button
or
git push to main (auto-triggers if webhook configured)
```

**Step 1.2.3: Verify Production Build**
- Wait for GitHub Actions: Build & Type Check → ✅ success
- Wait for Vercel: Deployment → ✅ Ready
- Check production URL: https://ai-construction-intelligence-platform.vercel.app (or custom domain)

**Step 1.2.4: Smoke Test Production**
```
[ ] Hit /login endpoint
[ ] Verify auth flow (check Bearer token validation)
[ ] Check /dashboard loads
[ ] Verify Supabase connection (API calls work)
[ ] Test one CRM flow: create lead → check database
[ ] Verify Help AI responds
```

### 1.3 Expected Outcomes
- ✅ Production URL live and responding
- ✅ All API endpoints accessible
- ✅ Zero 5xx errors in logs
- ✅ Database connections stable
- ✅ Auth system operational

### 1.4 Rollback Plan
If production deployment fails:
1. Vercel: Click "Rollback to previous deployment"
2. GitHub: Revert commit to last known good (git revert)
3. Contact: Document issue in /docs/INCIDENTS/ for post-mortem

---

## 2. Domínio Customizado

### 2.1 Prerequisites
- [ ] Domain registrar account (GoDaddy, Namecheap, Google Domains, etc.)
- [ ] Domain already purchased OR budget to purchase
- [ ] DNS access for domain configuration
- [ ] Vercel account with production project active

### 2.2 Domain Configuration Steps (Manual — Owner Action)

**Step 2.2.1: Add Domain to Vercel**
```
Vercel Dashboard 
  → Project Settings 
  → Domains 
  → Add Domain
  → Enter: apex-platform.com (or custom)
```

**Step 2.2.2: Configure DNS at Domain Registrar**
Vercel provides DNS instructions. Add records:
```
Type: A Record / CNAME
Value: [Vercel provides this]
TTL: 3600 (or default)
```

**Step 2.2.3: Verify Domain**
- Wait 24-48 hours for DNS propagation
- Test: `curl https://apex-platform.com` → should load platform
- Check certificate: Should show Let's Encrypt (automatic via Vercel)

### 2.3 Expected Outcomes
- ✅ Domain resolves to Vercel
- ✅ HTTPS certificate valid (automatic)
- ✅ www subdomain optional (configure in Vercel if needed)
- ✅ All pages accessible via domain

### 2.4 DNS Troubleshooting
If domain doesn't resolve:
1. Check DNS propagation: https://mxtoolbox.com/
2. Verify A/CNAME records at registrar match Vercel settings
3. Clear browser cache / use incognito window
4. Wait additional time (up to 48h for full propagation)

---

## 3. Monitoring & Logging Setup

### 3.1 What to Monitor (Production Readiness Checklist)

| Metric | Tool | Threshold | Action |
|--------|------|-----------|--------|
| Uptime | Vercel Analytics | <99.9% | Alert Owner |
| Response Time | Vercel Analytics | >2s avg | Investigate |
| Error Rate (5xx) | Vercel Logs | >0.1% | Alert Owner |
| Supabase Connection | Custom Health Check | failures | Alert Owner |
| Database Query Time | Supabase Console | >1s slow | Optimize query |
| Auth Failures | Supabase Logs | >5% anomaly | Check RLS policies |
| API Rate Limiting | Anthropic Dashboard | approaching limits | Scale tier |

### 3.2 Vercel Monitoring (Built-in)

**Access**:
```
Vercel Dashboard 
  → Project 
  → Analytics / Logs tabs
```

**Metrics Available**:
- Response times by route
- Error rates and 5xx status codes
- Request volume per endpoint
- Infrastructure health

### 3.3 Supabase Monitoring (Built-in)

**Access**:
```
Supabase Dashboard 
  → Project (stjhkxwylqtihzflspqe)
  → Logs / Reports / SQL Editor
```

**Metrics Available**:
- Database query times
- Slow query identification
- Auth login success/failure rates
- RLS policy violation detection
- Storage access logs

### 3.4 Custom Health Check (Optional Enhancement)

**Create `/pages/api/health.ts`**:
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data } = await supabase.from('projects').select('id').limit(1);
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: String(error),
    });
  }
}
```

**Monitor via**:
- Uptime bot: https://betterstack.com or https://statuspage.io
- Pings every 5 minutes to `/api/health`
- Alert if response > 3s or status ≠ 200

### 3.5 External Monitoring Service (Optional)

For enterprise-grade monitoring:
- **Sentry**: Error tracking and performance
- **LogRocket**: Session replay + logs
- **Datadog**: Full observability stack
- **Grafana Cloud**: Metrics + dashboards

*Note*: These are optional for Week 1. Can add in Month 2 if needed.

### 3.6 Logging Strategy

**What to Log**:
- Auth events (login, logout, token refresh)
- CRM operations (lead created, opportunity updated)
- Proposal/contract generation
- Async task execution (Autonomous Orchestrator)
- Help AI interactions
- Error stack traces

**Where to Log**:
- Vercel: Built-in logs (request/response)
- Supabase: Query logs + audit trail
- Application: Structured logs to stdout (Vercel captures automatically)

**Log Retention**:
- Vercel: 24 hours (free), longer with Vercel Pro
- Supabase: 7 days (free), 30+ days (Pro)
- Consider external log aggregation if longer retention needed

---

## 4. Backup Automation

### 4.1 Supabase Backups (Built-in)

**Status**: ✅ Automatic daily backups included in Pro plan
- **Frequency**: Daily automated backups
- **Retention**: 7 days (Pro), 30 days (Enterprise)
- **Recovery**: Point-in-time restore available

**Verify Backups**:
```
Supabase Dashboard 
  → Database 
  → Backups tab
  → See list of daily backups
```

### 4.2 Manual Backup Steps (Owner Action — Optional)

If additional backup needed before major changes:

**Step 4.2.1: Export Database Dump**
```bash
# Via Supabase CLI
supabase db dump --local > backup_$(date +%Y%m%d).sql
```

**Step 4.2.2: Backup Storage Files**
```bash
# Via Supabase Console or AWS CLI (if using S3 export)
# Files in Supabase Storage → projects/{project_id}/ buckets
```

**Step 4.2.3: Store Backup Securely**
- GitHub: Private repo or encrypted file (NOT in main repo)
- Cloud Storage: AWS S3 with encryption
- Local: Secure drive with encryption

### 4.3 Backup Testing (Quarterly)

Schedule test restore to validate:
- [ ] Database restore works
- [ ] All tables/data integrity
- [ ] Storage files accessible
- [ ] Auth credentials work post-restore

---

## 5. Week 1 Timeline & Ownership

### Day 1 (Mon) — Planning & Review
- [ ] Owner reviews this Week 1 plan
- [ ] Verify all prerequisites met (domain, Vercel access, etc.)
- [ ] Schedule deployment window (ideally off-hours)

### Day 2-3 (Tue-Wed) — Production Deployment
- [ ] Execute 1.2: Deploy Vercel production
- [ ] Smoke test all endpoints
- [ ] Verify monitoring dashboards active

### Day 4-5 (Thu-Fri) — Domain & Monitoring
- [ ] Execute 2.2: Configure custom domain
- [ ] Wait for DNS propagation (up to 48h)
- [ ] Enable monitoring/logging alerts
- [ ] Set up health check endpoint

### End of Week 1
- [ ] Domain live and responding ✅
- [ ] All monitoring active ✅
- [ ] Backup automation verified ✅
- [ ] Runbook completed ✅
- [ ] Go-live checklist ready ✅
- [ ] **Status**: Ready for pilot users in Week 2

---

## 6. Risk Mitigation

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| DNS propagation delays | High | Start domain config early; 48h buffer |
| Production build fails | Low | CI/CD passing; rollback plan ready |
| Database connection unstable | Very Low | RLS tested; connection pooling configured |
| Monitoring tools misconfigured | Medium | Test alerts by triggering dummy errors |
| Secrets exposed in production | Very Low | .env templates only; no hardcoded keys |

---

## 7. Success Criteria (Week 1 Complete)

- ✅ Production deployment live and stable
- ✅ Custom domain resolves correctly (HTTPS valid)
- ✅ All endpoints responding with <1s latency
- ✅ Zero 5xx errors in production logs
- ✅ Monitoring alerts configured and tested
- ✅ Backup automation verified
- ✅ Runbook completed and tested
- ✅ Owner trained on operational procedures
- ✅ Go-live checklist signed off
- ✅ **Status**: Ready for pilot users (Week 2)

---

## Next Steps After Week 1

Once production is stable:
- **Week 2-4**: Pilot program (Owner + Admin users)
- **Month 2**: Feedback collection & optimization
- **Month 3+**: Public release & scaling

---

**Document Status**: 📋 Planning phase  
**Approval Required**: Owner discretion  
**Execution Timeline**: Week of 2026-06-10 (estimated)

