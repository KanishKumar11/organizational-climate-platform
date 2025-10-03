# Survey Creation Wizard - Quick Start Guide

## Overview
The Survey Creation Wizard is a comprehensive 4-step process that guides you through creating organizational climate surveys with all P0 features integrated.

---

## 🚀 How to Use

### Step 1: Basic Info & Company Selection (CLIMA-001)

**Required Fields:**
- **Survey Title** (Required)
- **Company** (Required) - Searchable dropdown

**Optional Fields:**
- **Description** - Purpose and context of the survey

**What Happens:**
- Selecting a company automatically preloads:
  - All departments (for Step 3)
  - All users (up to 1000, for Step 3)

**Validation:**
- Can't proceed without title and company

---

### Step 2: Questions (CLIMA-002)

**Features:**
- **Question Library Browser:**
  - Left panel: Category tree (expandable hierarchy)
  - Center panel: Question list with search and filters
  - Right panel: Question preview (EN/ES tabs)

**Filters Available:**
- Question Type (multiple-choice, scale, text, binary, matrix)
- Category (hierarchical)
- Tags
- Text search

**Actions:**
- Click "Add" to add question to survey
- Questions appear in "Selected Questions" list
- Remove questions with "Remove" button
- Clear all with "Clear All" button

**Validation:**
- Need at least 1 question to proceed

---

### Step 3: Targeting

**Options:**
1. **All Employees** - Send to everyone in the company
2. **Specific Departments** - Select one or more departments
3. **Specific Users** - Select individual users

**For Departments:**
- Grid of department cards showing:
  - Department name
  - Employee count
  - Selection checkbox

**For Users:**
- Searchable list of users
- Shows name and email
- Select multiple users
- Up to 1000 users loaded (if more needed, implement pagination)

**Validation:**
- If "Departments" selected: Need at least 1 department
- If "Users" selected: Need at least 1 user

---

### Step 4: Schedule & Share (CLIMA-004, CLIMA-005)

**Scheduling (CLIMA-004):**
- **Start Date & Time** (Required)
- **End Date & Time** (Required)
- **Timezone** - 13 options including:
  - US timezones (ET, CT, MT, PT)
  - Latin America (Mexico, Colombia, Peru, Chile, Argentina, Brazil)
  - Europe (London, Madrid)
  - UTC

**Validation:**
- End date must be after start date
- Automatic duration calculator shows days and hours

**Distribution (CLIMA-005):**
- **QR Code Generator:**
  - Automatically generates QR code for survey
  - Download as PNG (high-res)
  - Download as SVG (vector)
  - Print QR code
  - Copy direct URL to clipboard

- **Token Types:**
  - Anonymous: Anyone with QR/URL can respond
  - Per-user: Unique QR code for each respondent (future feature)

**Validation:**
- Start and end dates must be set

---

## 💾 Autosave & Draft Recovery (CLIMA-006)

### Autosave
- **Frequency:** Every 8 seconds after you make changes
- **Indicator:** Top right shows "Saving..." then "Saved at HH:MM:SS"
- **Manual Save:** Click "Save Draft" button anytime

### Draft Recovery
- **On Page Load:** If you have a recent draft (within 1 hour), you'll see a blue banner:
  - Shows when draft was last saved
  - Shows which step you were on
  - Shows how many times it was autosaved

- **Actions:**
  - **Restore Draft** - Continue where you left off
  - **Discard Draft** - Start fresh
  - **Dismiss** - Hide banner but keep draft

### Session Expiry Warning
- **Warnings at:**
  - 5 minutes before expiry
  - 2 minutes before expiry
  - 30 seconds before expiry

- **Actions:**
  - **Continue Working** - Extend session
  - **Save & Close** - Save draft and exit

---

## 🎯 Navigation

### Progress Bar
- Shows current step (1-4) as percentage
- Updates as you progress

### Step Indicator
- 4 clickable cards showing each step
- **Active step:** Blue border
- **Completed step:** Green checkmark (can click to revisit)
- **Future step:** Grayed out (cannot access yet)

### Buttons
- **Previous** - Go back one step (disabled on Step 1)
- **Save Draft** - Manually save current progress
- **Next** - Validate and proceed (Steps 1-3)
- **Create Survey** - Submit survey (Step 4)

---

## ✅ Validation Rules

### Step 1
- Title: Required, non-empty string
- Company: Required selection

### Step 2
- Questions: At least 1 question required

### Step 3
- All Employees: No validation needed
- Specific Departments: At least 1 department required
- Specific Users: At least 1 user required

### Step 4
- Start Date: Required
- End Date: Required
- End Date > Start Date: Enforced
- Timezone: Defaults to UTC if not selected

---

## 🔔 Notifications (Toasts)

### Success Messages
- "Question Added" - When adding from library
- "Draft Restored" - When restoring from banner
- "Survey Created" - On successful submission

### Error Messages
- "Validation Error" - When trying to proceed without required fields
- "Failed to create survey" - If API call fails

### Info Messages
- "Saving..." / "Saved at..." - Autosave status
- "Draft Discarded" - When dismissing draft banner

---

## 🎨 UI Features

### Visual Feedback
- **Selected items:** Highlighted with primary color
- **Completed steps:** Green checkmark icon
- **Loading states:** Spinner icons
- **Disabled states:** Grayed out appearance

### Responsive Design
- Grid layouts adapt to screen size
- Mobile-friendly (tested on various viewports)
- Scrollable sections for long lists

### Accessibility
- All form fields have labels
- Required fields marked with asterisk (in CSS via `.required::after`)
- ARIA labels prepared for future implementation
- Keyboard navigation ready

---

## 🗂️ Data Structure

### Survey Form Data
```typescript
{
  // Step 1
  title: string;
  description: string;
  company_id: string;
  company_name: string;
  
  // Step 2
  questions: Array<{
    id: string;
    library_question_id: string;
    text: string;
    text_es: string;
    type: string;
    config: object;
    required: boolean;
  }>;
  
  // Step 3
  target_type: 'all' | 'departments' | 'users';
  department_ids: string[];
  target_user_ids: string[];
  
  // Step 4
  start_date: string; // ISO format
  end_date: string;   // ISO format
  timezone: string;
  distribution_type: 'anonymous' | 'per_user';
}
```

---

## 🛠️ Troubleshooting

### Draft Not Saving
- Check browser console for errors
- Ensure you're logged in (session required)
- Check network tab for API call failures
- Try manual "Save Draft" button

### Question Library Empty
- Categories may not be seeded
- Run: `npm run seed` (if seeding script exists)
- Check API response in network tab

### Preload Data Not Loading
- Ensure company is selected
- Check network tab for API calls to:
  - `/api/companies/[id]/departments`
  - `/api/companies/[id]/users`
- Verify user has permission to access company data

### QR Code Not Generating
- Ensure `qrcode` package is installed
- Check browser console for errors
- Verify survey ID and URL are valid

### Session Expires Too Quickly
- Adjust session timeout in NextAuth configuration
- Consider implementing refresh tokens
- Increase warning thresholds in code

---

## 🔐 Security Notes

### Authorization
- Must be logged in to create surveys
- Can only select companies you have access to
- Can only target users from selected company
- Drafts are private to your user session

### Data Privacy
- Drafts auto-delete after 7 days
- No sensitive data stored in localStorage (only metadata)
- All API calls authenticated via session

---

## 📝 Best Practices

### Creating Surveys
1. **Start with clear title** - Be specific (e.g., "Q4 2024 Employee Engagement")
2. **Add description** - Explain purpose to help yourself later
3. **Choose questions carefully** - Use library to ensure consistency
4. **Target appropriately** - Don't spam all employees unnecessarily
5. **Set realistic timeframes** - Give enough time for completion
6. **Test QR codes** - Scan to verify URL works before distributing

### Using Drafts
1. **Save frequently** - Don't rely only on autosave
2. **Name surveys descriptively** - Makes recovery easier
3. **Restore promptly** - Drafts expire after 7 days
4. **Clear old drafts** - Discard if no longer needed

### Question Library
1. **Use categories** - Organize questions logically
2. **Add tags** - Makes searching easier
3. **Preview before adding** - Check both EN and ES versions
4. **Reuse popular questions** - Builds consistency across surveys

---

## 🚀 Advanced Features

### Keyboard Shortcuts (Future)
- `Ctrl/Cmd + S` - Save draft
- `Ctrl/Cmd + →` - Next step
- `Ctrl/Cmd + ←` - Previous step
- `Escape` - Close modals/popovers

### Bulk Operations (Future)
- Import questions from CSV
- Duplicate entire surveys
- Copy questions between surveys
- Batch edit question settings

### Analytics (Future)
- See which questions are most used
- Track survey creation time
- Monitor draft completion rates
- Identify abandoned surveys

---

## 📞 Support

### Getting Help
1. Check this guide first
2. Check `FUNCTIONAL_REQ_STATUS.md` for implementation details
3. Check browser console for errors
4. Review API responses in network tab
5. Contact system administrator

### Reporting Issues
Include:
- What step you were on
- What action you took
- Expected vs actual behavior
- Browser console errors
- Network tab screenshots

---

## 🎓 Training Resources

### Recommended Reading
1. `P0_IMPLEMENTATION_COMPLETE.md` - Technical overview
2. `FUNCTIONAL_REQ_STATUS.md` - Feature status and roadmap
3. Component source code for advanced usage

### Video Tutorials (Future)
- [ ] Creating your first survey
- [ ] Using the question library
- [ ] Advanced targeting options
- [ ] Scheduling and distribution

---

**Last Updated:** October 3, 2025  
**Version:** 1.0  
**Status:** Production-Ready
