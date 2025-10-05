# 🚀 Export Functionality - Production Deployment Checklist

## Pre-Deployment Verification ✅

### 1. Dependencies Installed

- [x] nodemailer & @types/nodemailer
- [x] jspdf & @types/jspdf
- [x] jspdf-autotable
- [x] html2canvas
- [x] papaparse & @types/papaparse

**Verify:**

```bash
npm list nodemailer jspdf jspdf-autotable html2canvas papaparse
```

### 2. Environment Variables

- [ ] `SMTP_HOST` - Gmail SMTP (smtp.gmail.com)
- [ ] `SMTP_PORT` - Port 587
- [ ] `SMTP_SECURE` - false (use TLS)
- [ ] `SMTP_USER` - Your Gmail address
- [ ] `SMTP_PASSWORD` - Gmail app password (not regular password)
- [ ] `CRON_SECRET` - Random secure key for cron authentication

**Create `.env.local`:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=kanishkkumra@gmail.com
SMTP_PASSWORD=your-16-character-app-password
CRON_SECRET=change-this-to-random-secure-key-in-production
```

**How to get Gmail App Password:**

1. Go to Google Account Settings
2. Security → 2-Step Verification (enable if not already)
3. App Passwords → Generate new app password
4. Select "Mail" and "Other (Custom name)"
5. Copy the 16-character password
6. Paste into SMTP_PASSWORD

### 3. File Structure Check

```
src/
├── lib/
│   ├── pdf-export-service.ts          ✅ (750 lines)
│   ├── csv-export-service.ts          ✅ (350 lines)
│   ├── email-providers/
│   │   └── brevo.ts                   ✅ (Nodemailer configured)
│   └── notification-service.ts        ✅ (Existing)
├── app/
│   └── api/
│       ├── surveys/[id]/export/
│       │   ├── pdf/route.ts           ✅
│       │   └── csv/route.ts           ✅
│       ├── microclimates/[id]/export/
│       │   ├── pdf/route.ts           ✅
│       │   └── csv/route.ts           ✅
│       ├── action-plans/[id]/export/
│       │   ├── pdf/route.ts           ✅
│       │   └── csv/route.ts           ✅
│       ├── users/export/
│       │   └── csv/route.ts           ✅
│       ├── demographics/template/csv/
│       │   └── route.ts               ✅
│       └── cron/send-reminders/
│           └── route.ts               ✅
├── components/exports/
│   └── export-buttons.tsx             ✅
└── models/
    ├── Notification.ts                ✅ (Existing)
    └── ...

vercel.json                            ✅ (Cron configuration)
```

### 4. TypeScript Compilation

```bash
npm run build
```

Expected output: ✅ No errors

### 5. Code Quality

- [x] No TypeScript errors
- [x] All routes have authentication
- [x] All routes have authorization (role-based)
- [x] Error handling in all async functions
- [x] Type safety with interfaces

---

## Deployment Steps

### Step 1: Commit Changes

```bash
git add .
git commit -m "feat: implement PDF/CSV export and email reminder system

- Add PDF export service (surveys, microclimates, action plans)
- Add CSV export service with 3 formats (long, wide, summary)
- Implement email reminder cron job with Nodemailer
- Create 9 API routes with authentication
- Add Vercel cron configuration
- Create frontend export button components"
```

### Step 2: Push to Repository

```bash
git push origin main
```

### Step 3: Deploy to Vercel

#### Option A: Auto-Deploy (Recommended)

1. Vercel will automatically deploy on push to main
2. Go to Vercel Dashboard → Your Project
3. Wait for deployment to complete

#### Option B: Manual Deploy

```bash
vercel --prod
```

### Step 4: Configure Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following variables:

| Variable        | Value                   | Environment |
| --------------- | ----------------------- | ----------- |
| `SMTP_HOST`     | smtp.gmail.com          | Production  |
| `SMTP_PORT`     | 587                     | Production  |
| `SMTP_SECURE`   | false                   | Production  |
| `SMTP_USER`     | kanishkkumra@gmail.com  | Production  |
| `SMTP_PASSWORD` | your-gmail-app-password | Production  |
| `CRON_SECRET`   | random-secure-key-123   | Production  |

3. Click "Save"
4. Redeploy the application for changes to take effect

### Step 5: Verify Cron Job

1. Go to Vercel Dashboard → Your Project → Cron Jobs
2. You should see: `/api/cron/send-reminders` scheduled for every 15 minutes
3. Check "Last Execution" to ensure it's running
4. Review logs for any errors

---

## Testing Checklist

### 1. Email Service Test

```bash
# Test SMTP connection
curl -X GET https://your-domain.vercel.app/api/cron/send-reminders
```

Expected response:

```json
{
  "status": "active",
  "pending_notifications": 0,
  "recent_processed": [],
  "cron_schedule": "Every 15 minutes",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### 2. PDF Export Test

#### Survey PDF

```bash
curl -X GET "https://your-domain.vercel.app/api/surveys/SURVEY_ID/export/pdf" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  --output survey.pdf
```

#### Microclimate PDF

```bash
curl -X GET "https://your-domain.vercel.app/api/microclimates/MICRO_ID/export/pdf" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  --output microclimate.pdf
```

#### Action Plan PDF

```bash
curl -X GET "https://your-domain.vercel.app/api/action-plans/PLAN_ID/export/pdf" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  --output action-plan.pdf
```

### 3. CSV Export Test

#### Survey CSV (All Formats)

```bash
# Long format
curl -X GET "https://your-domain.vercel.app/api/surveys/SURVEY_ID/export/csv?format=long" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  --output survey-long.csv

# Wide format
curl -X GET "https://your-domain.vercel.app/api/surveys/SURVEY_ID/export/csv?format=wide" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  --output survey-wide.csv

# Summary format
curl -X GET "https://your-domain.vercel.app/api/surveys/SURVEY_ID/export/csv?format=summary" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  --output survey-summary.csv
```

#### Users Export (Admin Only)

```bash
curl -X GET "https://your-domain.vercel.app/api/users/export/csv" \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_SESSION_TOKEN" \
  --output users.csv
```

### 4. Cron Job Test

#### Manual Trigger

```bash
curl -X POST "https://your-domain.vercel.app/api/cron/send-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:

```json
{
  "success": true,
  "processed": 5,
  "succeeded": 5,
  "failed": 0,
  "duration_ms": 1250,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### 5. Frontend UI Test

- [ ] Survey results page has export buttons
- [ ] PDF export button downloads correct file
- [ ] CSV export dropdown shows 3 format options
- [ ] All CSV formats download correctly
- [ ] Loading state shows during export
- [ ] Success toast appears after export
- [ ] Error toast appears on failure
- [ ] Export works in Chrome
- [ ] Export works in Firefox
- [ ] Export works in Safari

### 6. Email Reminder Test

1. Create a test notification:

```javascript
// In MongoDB or via API
{
  user_id: ObjectId("USER_ID"),
  type: "survey_reminder",
  channel: "email",
  status: "pending",
  scheduled_for: new Date(),  // Now
  data: {
    survey: {
      title: "Test Survey",
      description: "Testing email reminders"
    },
    link: "https://your-domain.vercel.app/survey/123",
    companyName: "Your Company",
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
}
```

2. Wait 15 minutes (or trigger cron manually)
3. Check email inbox
4. Verify notification status changed to "sent" in database

---

## Monitoring & Maintenance

### 1. Monitor Cron Job Execution

**Vercel Dashboard:**

- Go to Deployments → Functions → Cron Jobs
- Check execution history
- Review error logs

**Database Check:**

```javascript
// Count pending notifications
db.notifications.countDocuments({ status: 'pending', channel: 'email' });

// Check recent sent notifications
db.notifications.find({ status: 'sent' }).sort({ sent_at: -1 }).limit(10);

// Check failed notifications
db.notifications.find({ status: 'failed' }).sort({ created_at: -1 });
```

### 2. Email Delivery Monitoring

- Check Gmail "Sent" folder for sent emails
- Monitor bounce rates
- Review spam complaints
- Check SMTP rate limits (Gmail: 500/day for free, 2000/day for Workspace)

### 3. Export Usage Analytics

Track export usage with custom logging:

```typescript
// Add to export routes
console.log(
  `[EXPORT] ${format} export by user ${userId} at ${new Date().toISOString()}`
);
```

### 4. Performance Monitoring

- PDF generation time (should be < 5 seconds)
- CSV generation time (should be < 2 seconds)
- Email sending time (should be < 1 second per email)
- Cron job execution time (should be < 30 seconds for 100 emails)

---

## Troubleshooting Guide

### Issue: PDF Export Returns 500 Error

**Possible Causes:**

1. Survey not found → Check survey ID
2. No responses → Add test responses
3. jsPDF dependency missing → Run `npm install`
4. Memory limit exceeded → Reduce data size or increase Vercel function memory

**Debug:**

```bash
# Check Vercel function logs
vercel logs --follow
```

### Issue: CSV Download Has Garbled Characters

**Solution:**
Ensure UTF-8 encoding:

```typescript
const csvContent = '\uFEFF' + csvService.exportSurveyResponses(data);
```

### Issue: Email Not Sending

**Possible Causes:**

1. Wrong SMTP credentials → Verify Gmail app password
2. 2FA not enabled → Enable 2-Step Verification
3. "Less secure apps" blocked → Use app password instead
4. Rate limit exceeded → Check Gmail limits (500/day free, 2000/day Workspace)

**Debug:**

```bash
# Test SMTP connection
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
transporter.verify().then(console.log).catch(console.error);
"
```

### Issue: Cron Job Not Running

**Possible Causes:**

1. `vercel.json` not in root → Move to project root
2. Vercel cron not enabled → Check Vercel plan (Pro+ required)
3. Wrong path in cron config → Verify `/api/cron/send-reminders`
4. Authorization failing → Check `CRON_SECRET` matches

**Debug:**

```bash
# Check cron configuration
cat vercel.json

# Manually trigger to test
curl -X POST https://your-domain.vercel.app/api/cron/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -v
```

### Issue: Authentication Failed

**Solution:**
Ensure NextAuth session is valid:

```typescript
// Check session in API route
const session = await getServerSession(authOptions);
console.log('Session:', session);
```

---

## Rollback Plan

If deployment fails or issues occur:

### Option 1: Revert Git Commit

```bash
git revert HEAD
git push origin main
```

### Option 2: Redeploy Previous Version

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### Option 3: Disable Cron Job

1. Comment out cron configuration in `vercel.json`
2. Redeploy

---

## Success Criteria ✅

Deployment is successful when:

- [x] `npm run build` completes without errors
- [ ] Vercel deployment successful
- [ ] All environment variables set
- [ ] Cron job appears in Vercel dashboard
- [ ] PDF export downloads successfully
- [ ] CSV export works in all 3 formats
- [ ] Email reminder sends test email
- [ ] No errors in Vercel function logs
- [ ] Export buttons appear in frontend
- [ ] Authentication works on all routes
- [ ] Exports work in multiple browsers

---

## Next Steps After Deployment

1. **Monitor First 24 Hours**
   - Check cron job executions
   - Review email delivery rate
   - Monitor export usage
   - Watch for errors in logs

2. **User Communication**
   - Announce new export features
   - Provide usage documentation
   - Collect user feedback

3. **Performance Optimization**
   - Monitor export generation times
   - Optimize PDF rendering if needed
   - Cache frequently exported data

4. **Feature Enhancements** (Future)
   - Scheduled automatic exports
   - Email export results
   - Batch export multiple surveys
   - Custom export templates
   - Excel (.xlsx) format support

---

## Support Contacts

**Technical Issues:**

- Vercel Support: https://vercel.com/support
- GitHub Issues: Create issue in repository

**Documentation:**

- Full Guide: `EXPORT_FUNCTIONALITY_COMPLETE.md`
- Summary: `EXPORT_IMPLEMENTATION_SUMMARY.md`
- Frontend: `src/components/exports/export-buttons.tsx`

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Ready for Production 🚀
