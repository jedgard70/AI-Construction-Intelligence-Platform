# Week 1 Production Reality Check
## Validação Hands-On da Plataforma Apex em Produção

**Data**: 2026-06-03  
**Fase**: Pre-Go-Live Production Validation  
**Owner**: Dr. Edgard / Apex Global Ltda.  
**Responsável**: Owner (hands-on testing)

---

## Executive Summary

Este documento guia o Owner através de testes **hands-on reais** da plataforma em produção, validando que:
- ✅ Plataforma está acessível via URL de produção
- ✅ Login funciona com credenciais reais
- ✅ Funcionalidades críticas respondendo corretamente
- ✅ Nenhum erro 5xx ou breaking issues
- ✅ Pronto para piloto com primeiros usuários

**Tempo estimado**: 20-30 minutos  
**Ferramenta necessária**: Navegador web (Chrome, Firefox, Safari)  
**Acesso**: Email jedgard70@gmail.com + senha

---

## 1. Production URL & Access

### 1.1 Identify Production URL

**Primary Options** (by priority):

**Option A (Preferred)**: Custom Domain
```
URL: https://apex-platform.com
Status: Check if configured (if yes, use this)
Verification: Should resolve to Vercel IP
```

**Option B**: Vercel Production Domain
```
URL: https://ai-construction-intelligence-platform.vercel.app
Status: Always available
Verification: Will work even if custom domain not yet configured
```

**Option C**: Preview Branch (if production not ready)
```
URL: https://ai-construction-intelligence-pla-git-...vercel.app
Status: Use only if A & B not available
Note: Not ideal for production, for testing only
```

### 1.2 Navigate to Platform

**Step 1**: Open browser and go to selected URL  
**Expected Result**: 
- Page loads without 5xx errors
- Login form appears OR redirects to login
- No console errors (F12 → Console tab)

**If Error**:
- [ ] Check browser console (F12 → Console)
- [ ] Check network tab (F12 → Network) for failed requests
- [ ] Document error message and HTTP status code
- [ ] Report in incident log

---

## 2. Authentication Test

### 2.1 Login with Owner Credentials

**Credentials**: 
```
Email: jedgard70@gmail.com
Password: [Use your Owner password]
```

**Steps**:
1. Go to production URL
2. Click "Login" or enter credentials
3. Submit form
4. **Expected**: Redirect to /dashboard within 3 seconds

**What to Verify**:
- [ ] Login page loads (no errors)
- [ ] Form accepts email and password
- [ ] "Forgot password?" link visible (optional)
- [ ] Login button clickable
- [ ] No 5xx errors on login attempt
- [ ] Redirect to dashboard works
- [ ] User profile shows correct name and role

**If Login Fails**:
- Check email spelling (jedgard70@gmail.com)
- Verify password (should be your Owner password)
- Check if user exists in Supabase (or was deleted)
- Look for auth error message on screen or in console
- Document exact error and screenshot

### 2.2 Verify Auth Token

**Browser DevTools Method**:
1. Open DevTools (F12)
2. Go to "Application" → "Cookies"
3. Find cookie: `sb-...` (Supabase auth token)
4. **Expected**: Cookie value should be present and not expired

**What This Means**:
- ✅ If present: Auth working correctly
- ❌ If missing: Auth system may be broken (try logout/login again)

---

## 3. Dashboard Accessibility

### 3.1 Dashboard Page

**URL**: https://[production-domain]/dashboard  
**Role Required**: Any (Owner, Admin, User, Guest)

**Steps**:
1. After login, you should land on dashboard automatically
2. Or manually navigate to /dashboard
3. **Expected**: Dashboard loads with:
   - Header with logo and "Apex" branding
   - Navigation menu (left sidebar or top nav)
   - Main content area showing overview cards/metrics
   - No 5xx errors

**What to Check**:
- [ ] Page loads within 2 seconds
- [ ] All text readable (no broken layout)
- [ ] Images/icons load (no broken images)
- [ ] Navigation menu items visible
- [ ] No console errors (F12 → Console)
- [ ] Responsive design (resize window, should work on mobile)

**Dashboard Content Expected**:
- Project overview (if any projects exist)
- CRM summary (leads, opportunities)
- Revenue metrics (if available)
- Quick action buttons (New Lead, New Project, etc.)

**If Dashboard Breaks**:
- Document what's visible vs. what's missing
- Check console for JavaScript errors
- Note if specific section is broken (e.g., metrics not loading)
- Screenshot the error state

---

## 4. Owner Command (CLI-like Interface)

### 4.1 Access Owner Command

**URL**: https://[production-domain]/owner-command  
**Role Required**: Owner only  
**Permission Level**: 🔴 Approval required (highest authority)

**Steps**:
1. Navigate to /owner-command in production
2. Page should load with command interface
3. **Expected**: Chat-like interface for issuing commands

**What to Verify**:
- [ ] Page loads successfully (no 5xx)
- [ ] Text input field visible (for commands)
- [ ] Send/submit button clickable
- [ ] Previous commands visible (if any)
- [ ] Interface responsive and readable

**Sample Commands to Try** (if interface supports):
```
(Optional, for advanced testing)
> help
> status
> list users
> list projects
```

**If Owner Command Unavailable**:
- Check if /owner-command route exists (should return 200)
- Verify user role is Owner (not Admin or User)
- Look for permission denied message
- If totally broken: Document as critical bug

---

## 5. Apex AI (Help AI as Owner)

### 5.2 Access Help AI / Apex AI

**URL**: https://[production-domain]/dashboard (or dedicated /help-ai route)  
**Access Method**: Usually embedded in dashboard or sidebar

**Steps**:
1. Look for "Help AI", "Ask Apex", or chat icon
2. Click to open chat interface
3. Send a test message: `"Hello, who are you?"`
4. **Expected**: AI responds with introduction message

**What to Verify**:
- [ ] Chat interface loads (no errors)
- [ ] Text input field active and responsive
- [ ] Send button works
- [ ] Message appears in chat
- [ ] AI generates response (may take 2-5 seconds)
- [ ] Response is relevant (not gibberish or error)
- [ ] No 5xx errors or timeout messages

**Sample AI Tests**:
```
Test 1: "Hello, who are you?"
Expected: Introduction to Apex AI, role-based capabilities

Test 2: "What can you help me with?"
Expected: List of available skills or capabilities

Test 3: "Create a new lead"
Expected: AI offers to guide through lead creation OR executes action
```

**If Apex AI Doesn't Respond**:
- [ ] Check browser console for errors
- [ ] Verify Anthropic API key configured (in Vercel env)
- [ ] Check network tab: POST to /api/help-ai/chat should succeed (200)
- [ ] If API returns 401/403: Auth token issue
- [ ] If API returns 5xx: Backend error (check logs)
- [ ] Document exact error message

---

## 6. Storage Operations

### 6.1 Upload a File

**URL**: https://[production-domain]/storage or via CRM/project interface  
**File Type**: Any (PDF, image, doc, etc.) < 10MB recommended

**Steps**:
1. Navigate to storage or project files section
2. Click "Upload" or drag-and-drop area
3. Select a file from your computer
4. **Expected**: File upload begins, progress bar appears

**What to Verify**:
- [ ] Upload progress shows (0% → 100%)
- [ ] Upload completes within 30 seconds (for small file)
- [ ] Success message appears
- [ ] No error messages

**If Upload Fails**:
- [ ] Check file size (< 10MB?)
- [ ] Check file type (PDF, image, doc, xlsx supported)
- [ ] Browser console may show upload error
- [ ] Network tab: POST to /api/storage/upload should return 200
- [ ] If fails: Document file name, size, type, error message

### 6.2 List Files (View Storage)

**After Upload**:
1. Stay on storage page
2. **Expected**: Uploaded file appears in file list
   - File name visible
   - File size shown
   - Upload date/time shown
   - Download/delete buttons available

**What to Verify**:
- [ ] File list loads (no 5xx)
- [ ] Uploaded file appears in list
- [ ] File details correct (name, size)
- [ ] Action buttons visible (Download, Delete, Share)

**If File List Broken**:
- [ ] Storage page loads but no files shown
- [ ] Console may show database query error
- [ ] Network tab: GET /api/storage/... should return 200 with JSON list
- [ ] Document: "Files uploaded but not appearing in list"

### 6.3 Download File

**Steps**:
1. Find file in list
2. Click "Download" button
3. **Expected**: File starts downloading to your computer
   - Browser shows download progress OR file appears in Downloads folder
   - No error dialogs

**What to Verify**:
- [ ] Download starts immediately (< 2 seconds)
- [ ] Download completes successfully
- [ ] File appears in Downloads folder
- [ ] File is not corrupted (can open it)

**If Download Fails**:
- [ ] Check browser download settings
- [ ] Network tab: GET to signed URL should return 200
- [ ] Signed URL may be expired (try re-uploading and download immediately)
- [ ] Document: "Download button clicked but file didn't appear"

---

## 7. CRM Basic Operations

### 7.1 View CRM Dashboard

**URL**: https://[production-domain]/crm/revenue or /crm dashboard  
**Role**: User or higher

**Expected View**:
- Leads count (total in system)
- Opportunities by stage (e.g., Prospecting, Qualification, Proposal, Won)
- Proposals pending approval
- Revenue summary (if calculated)

**What to Verify**:
- [ ] CRM page loads (no 5xx)
- [ ] Metrics displayed (even if 0 leads initially)
- [ ] Charts/tables visible
- [ ] No JavaScript errors
- [ ] Page responsive

**If CRM Dashboard Broken**:
- [ ] Document what's missing (metrics, charts, menu items)
- [ ] Check console for errors
- [ ] Network tab: API call to /api/crm/... should succeed

### 7.2 Create a Lead (Manual Entry)

**Steps**:
1. Navigate to CRM
2. Click "New Lead" or equivalent button
3. Fill form with test data:
   ```
   Name: Test Lead (Production Check)
   Email: test-[random]@example.com
   Company: Test Corp
   Phone: +55 11 99999-9999
   Source: Manual / Admin
   ```
4. Click "Save" or "Create Lead"

**Expected Result**:
- Success message appears ("Lead created" or similar)
- Form clears or redirects to lead list
- New lead appears in CRM dashboard
- No 5xx errors

**What to Verify**:
- [ ] Form submits successfully
- [ ] Lead appears in list immediately (or after refresh)
- [ ] Lead data is correct (name, email, company)
- [ ] Lead can be clicked to view details

**If Lead Creation Fails**:
- [ ] Error message may appear (document it)
- [ ] Form may reject empty fields (fill all fields)
- [ ] Network tab: POST /api/crm/leads should return 200/201
- [ ] Database error may prevent save (check API response)
- [ ] Document: "Cannot create lead, error: [exact message]"

### 7.3 View Lead Details

**Steps**:
1. Find test lead in list
2. Click on lead name
3. **Expected**: Lead details page loads showing:
   - Lead name, email, company
   - Contact history (if any)
   - Opportunity linked (if any)
   - Actions: Change status, add note, create opportunity

**What to Verify**:
- [ ] Lead detail page loads (no 5xx)
- [ ] All fields visible and populated correctly
- [ ] Action buttons available (Edit, Delete, Create Opportunity)
- [ ] No errors in console

**If Lead Details Broken**:
- [ ] Detail page won't load (404 or 5xx)
- [ ] Data not showing (blank fields)
- [ ] Document: "Lead ID: [id], cannot view details, error: [message]"

---

## 8. Revenue Calculations (Basic)

### 8.1 Revenue Dashboard

**URL**: https://[production-domain]/crm/revenue  
**Expected Display**:
- Total revenue YTD or for selected period
- Revenue by month/quarter (if data exists)
- Top clients/projects by revenue
- Revenue growth trend

**What to Verify**:
- [ ] Revenue page loads (no 5xx)
- [ ] Metrics visible (even if $0 if no data)
- [ ] Charts render correctly
- [ ] Data looks reasonable

**If Revenue Broken**:
- [ ] Page won't load (404 or error)
- [ ] Dashboard shows NaN, null, or undefined
- [ ] Charts fail to render
- [ ] Network: GET /api/crm/revenue should return 200 with JSON data
- [ ] Document: "Revenue dashboard error: [specific issue]"

---

## 9. System Performance Check

### 9.1 Page Load Times

**How to Measure** (Chrome DevTools):
1. Open DevTools (F12)
2. Go to "Network" tab
3. Reload page (Ctrl+R)
4. Look at "Finish" time (bottom of Network tab)

**Expected Metrics**:
- Dashboard: < 3 seconds
- API endpoints: < 1 second
- File operations: < 5 seconds

**Record**:
- [ ] Dashboard load time: ___ seconds
- [ ] CRM load time: ___ seconds
- [ ] API response time (via console Network tab): ___ ms

**If Slow**:
- [ ] Check if it's first load vs. cached (repeat reload)
- [ ] Check internet connection speed
- [ ] If consistently > 5s: May be backend bottleneck
- [ ] Document: "Dashboard takes 8s to load (slow)"

### 9.2 Error Monitoring

**Check for Errors**:
1. Open DevTools Console (F12 → Console)
2. Look for red error messages
3. **Expected**: No errors (or only warnings)

**Common Errors to Document**:
- `TypeError: Cannot read property 'X' of undefined` → Data not loading
- `404 Not Found` → Missing API endpoint
- `401 Unauthorized` → Auth token issue
- `500 Internal Server Error` → Backend crash

**If Errors Found**:
- Take screenshot of error
- Document the error message exactly
- Note which page/action triggered it
- Try to reproduce (refresh, repeat action)

---

## 10. Reality Check Checklist

### ✅ Success Criteria (All Must Pass)

| Item | Status | Evidence |
|------|--------|----------|
| Production URL accessible | ✅/❌ | [URL works/doesn't work] |
| Login succeeds | ✅/❌ | [Can/cannot login as Owner] |
| Dashboard loads | ✅/❌ | [Displays/shows error] |
| Owner Command page loads | ✅/❌ | [Accessible/denied] |
| Apex AI responds | ✅/❌ | [Responds to message/fails] |
| Storage upload works | ✅/❌ | [File uploaded/failed] |
| Storage list works | ✅/❌ | [Files visible/not showing] |
| Storage download works | ✅/❌ | [File downloads/fails] |
| CRM dashboard displays | ✅/❌ | [Shows metrics/error] |
| Can create test lead | ✅/❌ | [Lead created/form fails] |
| Lead details viewable | ✅/❌ | [Detail page works/broken] |
| Revenue dashboard displays | ✅/❌ | [Shows data/error] |
| No 5xx errors observed | ✅/❌ | [Clean/has errors] |
| Performance acceptable | ✅/❌ | [< 3s load/slow] |

### ⏳ Overall Result

- **All Green ✅**: Platform ready for pilot users
- **1-2 Issues**: Document and fix before go-live
- **3+ Issues**: Delay go-live, major debugging needed

---

## 11. Incident Logging (If Issues Found)

### For Each Issue, Document:

```
BUG REPORT:
═════════════════════════════════════════

Issue: [1 line description]
  Example: "Login page shows 500 error"

Severity: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
  🔴 = Platform not usable / no workaround
  🟠 = Major feature broken / workaround exists
  🟡 = Minor feature slow / degraded performance
  🟢 = Nice-to-have not working / not urgent

Steps to Reproduce:
  1. [Action 1]
  2. [Action 2]
  3. [Expected result] vs [Actual result]

Error Message (if any):
  [Copy exact error from screen or console]

URL/Endpoint:
  https://[production-domain]/[path]

Browser/OS:
  [Chrome 120 on Windows 10, etc.]

Screenshot:
  [Attach screenshot if helpful]

Impact:
  [Who does this affect? Pilot users? Owner only?]

Workaround (if any):
  [Is there a way to proceed despite bug?]

Fix Required:
  [What code/config change needed?]
```

---

## 12. Owner Sign-Off

### After Completing All Tests

**I, Dr. Edgard, have tested the production platform and confirm:**

- [ ] Production URL is working and accessible
- [ ] Login with owner credentials succeeds
- [ ] Dashboard displays correctly
- [ ] All core features tested and working
- [ ] No critical blocking issues found
- [ ] Performance is acceptable (< 3s page loads)
- [ ] Ready to proceed with pilot program (Week 2)

**OR**

- [ ] Found issues listed below that must be fixed before go-live:
  1. [Issue 1]
  2. [Issue 2]
  3. [Issue 3]

**Owner Signature**: ____________________  
**Date/Time**: _________________________  
**Status**: ✅ Ready for Pilot / ⏳ Needs Fixes / ❌ Delay Go-Live

---

## 13. Notes for Owner

### Browser Recommendations
- Chrome (recommended, best DevTools)
- Firefox (alternative, good console)
- Safari (test responsive, but avoid if issues)

### Testing Best Practices
- Clear browser cache if strange issues: Ctrl+Shift+Delete
- Test in Incognito/Private mode if sessions are buggy
- Try different file sizes/types for storage test
- Test on both desktop and mobile (if possible)

### What NOT to Do
- ❌ Don't delete important test data without backup
- ❌ Don't share your password in error reports
- ❌ Don't test with production data yet (pilot only)
- ❌ Don't make config changes without approval

### Next Steps After Reality Check
- ✅ If all green: Proceed to Week 1 Setup (deploy, domain, monitoring)
- ❌ If issues: Create incident tickets, schedule fixes
- 📋 Document findings in this checklist for future reference

---

**Document Status**: 📋 Ready for Owner Execution  
**Last Updated**: 2026-06-03  
**Review Schedule**: Complete before June 9, 2026 (go-live date)

