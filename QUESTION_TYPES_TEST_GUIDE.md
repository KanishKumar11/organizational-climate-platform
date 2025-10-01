# Quick Test Guide - New Question Types

## Testing the New Question Types

### Test 1: Yes/No with Comment

**Steps:**
1. Navigate to `/surveys/templates/create` or use survey wizard
2. Click "Add Question"
3. Select **"Yes/No with Comment"** (indigo card)
4. Fill in:
   - Question: "Do you feel valued at work?"
   - Comment prompt: "Please tell us more about your experience:"
   - Comment required: ON
5. Click preview to see the question
6. Create survey and test response

**Expected Result:**
- Question shows Yes/No buttons (indigo when selected)
- After clicking Yes or No, comment field appears smoothly
- Comment field shows custom prompt
- Required indicator (*) appears if enabled

---

### Test 2: Emoji Scale

**Steps:**
1. Navigate to survey builder
2. Click "Add Question"
3. Select **"Emoji Scale"** (pink card with smile icon)
4. Fill in:
   - Question: "How do you feel about team collaboration?"
5. Review default emojis (5 satisfaction levels)
6. Optional: Customize emojis:
   - Edit emoji: 🤩 for "Excellent"
   - Edit value: 6
   - Add option: 😴 for "Bored"
7. Preview and create survey

**Expected Result:**
- Preview shows emoji buttons with labels
- Each emoji is large (4xl size) and clickable
- Hover effect scales emoji up
- Selected emoji has pink background
- Can add/remove emoji options

---

### Test 3: Survey Response Flow

**Create Complete Test Survey:**

```
Survey Title: "Team Culture Pulse Check"

Q1: [Emoji Scale]
"How satisfied are you with your work environment?"
Default emojis: 😞 😕 😐 🙂 😊

Q2: [Yes/No with Comment]
"Would you recommend this company as a great place to work?"
Comment prompt: "What's the main reason for your answer?"
Required: Yes

Q3: [Yes/No with Comment]  
"Do you feel you have opportunities for growth?"
Comment prompt: "What opportunities would you like to see?"
Required: No
```

**Test Response:**
1. Create the survey with above questions
2. Launch survey (mark as active)
3. Take the survey as a respondent:
   - Click emoji for Q1 (should see pink highlight)
   - Click "Yes" for Q2 (comment field should appear)
   - Enter comment
   - Click "No" for Q3 (comment field appears, optional)
4. Submit survey

**Verify:**
- All responses saved correctly
- Comment text stored with yes/no answer
- Emoji value recorded
- Responses visible in survey results

---

### Test 4: Template Creation

**Steps:**
1. Go to `/surveys/templates/create`
2. Create template: "Employee Satisfaction - Enhanced"
3. Add both new question types
4. Mark as public
5. Save template
6. Use template to create new survey

**Expected:**
- Template saves with new question types
- Template preview shows correct question types
- Creating survey from template works
- All question configurations preserved

---

### Visual Verification Checklist

#### Yes/No with Comment
- [ ] Indigo color scheme matches design
- [ ] MessageSquare icon displays in builder
- [ ] Buttons are properly sized (min-width 100px)
- [ ] Comment field slides in smoothly (0.3s animation)
- [ ] Comment prompt text displays correctly
- [ ] Required indicator (*) appears when enabled
- [ ] Preview matches actual question appearance

#### Emoji Scale
- [ ] Pink color scheme matches design
- [ ] Smile icon displays in builder
- [ ] Emojis are large and readable (text-4xl)
- [ ] Labels are centered below emojis
- [ ] Hover effect works (scale 1.1)
- [ ] Selected state shows pink background
- [ ] Can add minimum 2 emoji options
- [ ] Preview matches actual question appearance

---

### Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

---

### Mobile Responsiveness

Test on mobile viewport:
- [ ] Emoji buttons wrap properly
- [ ] Yes/No buttons stack on small screens
- [ ] Comment field is fully visible
- [ ] Touch interactions work smoothly

---

### Error Handling

Test edge cases:
- [ ] Create yes_no_comment without comment prompt (should use default)
- [ ] Remove all emoji options except 2 (should prevent removal)
- [ ] Submit survey without required comment (should show validation)
- [ ] Long emoji labels (should wrap properly)

---

### Integration Tests

- [ ] Create survey with all 8 question types
- [ ] Mix old and new question types
- [ ] Save and reload survey (all types preserved)
- [ ] Export survey results with new types
- [ ] Use templates with new types

---

## Quick Demo Survey

**Copy this JSON to quickly test:**

```json
{
  "title": "New Question Types Demo",
  "type": "custom",
  "questions": [
    {
      "id": "q1",
      "text": "How do you feel about your work-life balance?",
      "type": "emoji_scale",
      "required": true,
      "order": 0,
      "emoji_options": [
        { "emoji": "😫", "label": "Terrible", "value": 1 },
        { "emoji": "😟", "label": "Poor", "value": 2 },
        { "emoji": "😐", "label": "Okay", "value": 3 },
        { "emoji": "🙂", "label": "Good", "value": 4 },
        { "emoji": "🤩", "label": "Excellent", "value": 5 }
      ]
    },
    {
      "id": "q2",
      "text": "Would you participate in a company social event?",
      "type": "yes_no_comment",
      "required": true,
      "order": 1,
      "comment_required": true,
      "comment_prompt": "What type of events would you enjoy most?"
    }
  ]
}
```

---

## Success Criteria

✅ **All tests pass if:**
1. Both question types appear in SurveyBuilder
2. Configuration UI works correctly
3. Preview shows accurate rendering
4. Actual survey responses work as expected
5. Data saves to database correctly
6. No console errors appear
7. Mobile and desktop views work
8. All browsers render correctly

---

## Troubleshooting

### Issue: Comment field doesn't appear
**Solution:** Check that question.type === 'yes_no_comment' and a Yes/No option is selected

### Issue: Emojis not displaying
**Solution:** Ensure emoji_options array is populated with valid emoji characters

### Issue: Question type not in dropdown
**Solution:** Check SurveyBuilder.tsx questionTypes array includes new types

### Issue: Response not saving
**Solution:** Verify API endpoint accepts comment_text for yes_no_comment and response_value for emoji_scale

---

## Performance Notes

- **Animation Duration:** 0.3s for smooth transitions
- **Emoji Rendering:** Uses native emoji (no images)
- **State Management:** Local state for comment text
- **Response Updates:** Real-time on selection change

---

**Happy Testing! 🎉**
