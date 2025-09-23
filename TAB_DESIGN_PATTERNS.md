# Tab Design Patterns & Usage Guide

## 🎨 **Enhanced Tabs Pattern**

### **When to Use**
- Primary navigation in dashboard interfaces
- When you need to display contextual information (counts, descriptions)
- For admin-level interfaces with rich data
- When icons help with visual recognition

### **Visual Structure**
```
┌─────────────────────────────────────────────────────────────────┐
│  [🔵] Overview          [🏢] Companies        [💾] System Health │
│      System status           12 organizations      Performance   │
│  ═══════════════                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Code Example**
```tsx
<EnhancedTabsList>
  <EnhancedTabsTrigger
    value="overview"
    icon={<Activity className="h-5 w-5" />}
    description="System status"
  >
    Overview
  </EnhancedTabsTrigger>
  <EnhancedTabsTrigger
    value="companies"
    icon={<Building2 className="h-5 w-5" />}
    description={`${companyCount} organizations`}
  >
    Companies
  </EnhancedTabsTrigger>
</EnhancedTabsList>
```

## 🎯 **Compact Tabs Pattern**

### **When to Use**
- Secondary navigation or sub-sections
- Employee-facing interfaces
- When space is limited
- For simpler, cleaner layouts

### **Visual Structure**
```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │ My Surveys  │ │AI Questions │ │Microclimates│ │ History │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Code Example**
```tsx
<CompactTabsList>
  <CompactTabsTrigger value="surveys">
    My Surveys
  </CompactTabsTrigger>
  <CompactTabsTrigger value="adaptive">
    AI Questionnaires
  </CompactTabsTrigger>
</CompactTabsList>
```

## 🎨 **Visual States**

### **Default State**
- **Background**: Transparent
- **Text**: Gray-600 (`#4B5563`)
- **Icon Background**: Light gray (`#F3F4F6`)
- **Border**: Transparent bottom border

### **Hover State**
- **Background**: Light gray overlay (`#F9FAFB/50`)
- **Text**: Darker gray (`#374151`)
- **Icon Background**: Slightly darker gray (`#E5E7EB`)
- **Transition**: 200ms smooth transition

### **Active State**
- **Background**: Blue gradient (`from-blue-50 to-blue-100/50`)
- **Text**: Blue-600 (`#2563EB`)
- **Icon Background**: Blue-100 (`#DBEAFE`)
- **Border**: Blue-500 bottom border (`#3B82F6`)
- **Indicator**: Animated blue line at bottom

## 🎯 **Icon Color Coding**

### **Dashboard Context Colors**
- **Overview/Activity**: Purple (`#8B5CF6`)
- **Companies/Buildings**: Blue (`#3B82F6`)
- **System/Performance**: Green (`#10B981`)
- **Surveys/Documents**: Orange (`#F59E0B`)
- **Team/Users**: Blue (`#3B82F6`)
- **Insights/AI**: Orange (`#F59E0B`)
- **Actions/Plans**: Red (`#EF4444`)

### **Icon Background Pattern**
```css
/* Light background with matching color */
.icon-container {
  background: {color}-100;  /* e.g., bg-blue-100 */
  color: {color}-600;       /* e.g., text-blue-600 */
}
```

## 📱 **Responsive Behavior**

### **Mobile (< 768px)**
- **Horizontal Scroll**: Tabs scroll horizontally if needed
- **Compact Spacing**: Reduced padding (`px-4 py-3`)
- **Hidden Scrollbar**: `scrollbar-hide` for clean appearance
- **Touch Friendly**: Adequate touch targets (44px minimum)

### **Desktop (≥ 768px)**
- **Full Layout**: All tabs visible if space allows
- **Enhanced Spacing**: Standard padding (`px-6 py-4`)
- **Hover Effects**: Rich hover interactions
- **Descriptions**: Full descriptions visible

## 🔧 **Animation Specifications**

### **Tab Switching Animation**
```css
/* Content fade-in */
.tab-content {
  animation: fade-in 200ms ease-in-out;
}

/* Active indicator slide */
.active-indicator {
  transform: scaleX(1);
  transition: transform 200ms ease-in-out;
}
```

### **Hover Transitions**
```css
.tab-trigger {
  transition: all 200ms ease-in-out;
}

.tab-trigger:hover {
  background-color: rgba(249, 250, 251, 0.5);
  color: #374151;
}
```

## 🎨 **Color Palette Reference**

### **Primary Colors**
- **Blue-50**: `#EFF6FF` (Light background)
- **Blue-100**: `#DBEAFE` (Icon backgrounds)
- **Blue-500**: `#3B82F6` (Active borders)
- **Blue-600**: `#2563EB` (Active text)

### **Gray Scale**
- **Gray-100**: `#F3F4F6` (Default icon backgrounds)
- **Gray-500**: `#6B7280` (Description text)
- **Gray-600**: `#4B5563` (Default text)
- **Gray-900**: `#111827` (Hover text)

## 📏 **Spacing & Sizing**

### **Enhanced Tabs**
- **Padding**: `px-6 py-4` (24px horizontal, 16px vertical)
- **Gap**: `gap-3` (12px between icon and text)
- **Icon Size**: `h-5 w-5` (20px)
- **Icon Padding**: `p-2` (8px)

### **Compact Tabs**
- **Padding**: `px-4 py-2` (16px horizontal, 8px vertical)
- **Border Radius**: `rounded-lg` (8px)
- **Font Size**: `text-sm` (14px)
- **Font Weight**: `font-medium`

## 🚀 **Best Practices**

### **Do's**
✅ Use Enhanced Tabs for admin interfaces with rich data  
✅ Use Compact Tabs for employee interfaces or secondary navigation  
✅ Include dynamic counts in descriptions when relevant  
✅ Use contextual icons that match the content  
✅ Maintain consistent color coding across similar functions  
✅ Test on mobile devices for touch accessibility  

### **Don'ts**
❌ Mix Enhanced and Compact tabs in the same interface  
❌ Use more than 6 tabs in a single tab group  
❌ Override the animation timing without good reason  
❌ Use icons that don't clearly represent the content  
❌ Forget to test keyboard navigation  
❌ Ignore responsive behavior on smaller screens  

## 🔧 **Implementation Checklist**

- [ ] Import the correct tab variant for your use case
- [ ] Add appropriate icons for each tab
- [ ] Include dynamic descriptions/counts where relevant
- [ ] Test responsive behavior on mobile devices
- [ ] Verify keyboard navigation works correctly
- [ ] Check color contrast meets accessibility standards
- [ ] Test smooth animations and transitions
- [ ] Ensure consistent styling with design system

## 📊 **Performance Considerations**

### **Optimization Tips**
- **Lazy Loading**: Load tab content only when needed
- **Memoization**: Use React.memo for tab content components
- **Animation**: Use CSS transforms for better performance
- **Bundle Size**: Import only the tab variant you need

### **Monitoring**
- **Animation Performance**: Monitor frame rates during transitions
- **Bundle Impact**: Check impact on overall bundle size
- **Memory Usage**: Ensure no memory leaks in animations
- **Load Times**: Measure impact on initial page load
