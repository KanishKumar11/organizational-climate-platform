# UI Component Library

This directory contains the comprehensive UI component library for the Organizational Climate Platform, built with shadcn/ui, Tailwind CSS, and Framer Motion for animations.

## 🎯 Design Principles

- **Accessibility First**: All components follow WCAG 2.1 AA standards
- **Consistent Design**: Unified design system with CSS variables
- **Smooth Animations**: Framer Motion for delightful user experiences
- **Type Safety**: Full TypeScript support with proper interfaces
- **Responsive**: Mobile-first responsive design
- **Themeable**: Support for light/dark themes and custom branding

## 📦 Component Categories

### Core Components

- **Button**: Primary interaction element with multiple variants
- **Card**: Container component for content grouping
- **Input**: Form input with validation states
- **Label**: Accessible form labels
- **Textarea**: Multi-line text input
- **Badge**: Status and category indicators

### Form Components

- **Checkbox**: Boolean selection input
- **RadioGroup**: Single selection from multiple options
- **Select**: Dropdown selection component
- **Switch**: Toggle component for settings
- **Form**: Complete form wrapper with validation

### Enhanced Form Fields

- **TextField**: Input with integrated label, description, and error handling
- **TextareaField**: Textarea with integrated label and validation
- **SelectField**: Select with integrated label and options
- **CheckboxField**: Checkbox with integrated label
- **RadioField**: Radio group with integrated label
- **SwitchField**: Switch with integrated label and description

### Layout Components

- **Separator**: Visual content divider
- **Skeleton**: Loading state placeholders
- **DashboardGrid**: Responsive grid system for dashboards
- **Navbar**: Page navigation with breadcrumbs

### Navigation Components

- **NavigationMenu**: Main navigation component
- **DropdownMenu**: Context menus and actions
- **Breadcrumb**: Hierarchical navigation
- **Sidebar**: Application sidebar navigation

### Overlay Components

- **Dialog**: Modal dialogs and confirmations
- **Sheet**: Slide-out panels
- **Alert**: Important messages and notifications
- **Tooltip**: Contextual help and information

### Progress Components

- **Progress**: Linear progress indicators
- **StepProgress**: Multi-step process visualization
- **CircularProgress**: Circular progress indicators

### Loading Components

- **Loading**: Spinner with optional text
- **LoadingSkeleton**: Content placeholders
- **DashboardLoading**: Dashboard-specific loading states
- **SurveyLoading**: Survey-specific loading states
- **TableLoading**: Table loading states

## 🎨 Theming

The component library uses CSS variables for theming, defined in `globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... more variables */
}
```

### Color Palette

- **Primary**: Main brand color for actions and highlights
- **Secondary**: Supporting color for less prominent elements
- **Destructive**: Error states and dangerous actions
- **Muted**: Subtle backgrounds and disabled states
- **Accent**: Hover states and interactive elements

## ♿ Accessibility Features

### Keyboard Navigation

- Full keyboard support for all interactive elements
- Focus management with visible focus indicators
- Arrow key navigation for menus and lists
- Escape key handling for overlays

### Screen Reader Support

- Proper ARIA labels and descriptions
- Live regions for dynamic content updates
- Semantic HTML structure
- Alternative text for visual elements

### Color and Contrast

- WCAG 2.1 AA compliant color contrasts
- High contrast mode support
- Color-blind friendly palette
- No color-only information conveyance

### Motion and Animation

- Respects `prefers-reduced-motion` setting
- Smooth, purposeful animations
- No auto-playing animations
- Optional animation controls

## 🚀 Usage Examples

### Basic Button

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="md">
  Click me
</Button>;
```

### Form Field with Validation

```tsx
import { TextField } from '@/components/ui/FormField';

<TextField
  label="Email Address"
  type="email"
  required
  description="We'll never share your email"
  error={errors.email}
  value={email}
  onChange={setEmail}
/>;
```

### Dashboard Grid Layout

```tsx
import { DashboardGrid, GridItem } from '@/components/layout/DashboardGrid';
import { Card } from '@/components/ui/card';

<DashboardGrid columns={3} gap="md">
  <GridItem span={1}>
    <Card>KPI Card 1</Card>
  </GridItem>
  <GridItem span={2}>
    <Card>Chart Component</Card>
  </GridItem>
</DashboardGrid>;
```

### Loading States

```tsx
import { Loading, LoadingSkeleton } from '@/components/ui/Loading';

// Simple spinner
<Loading size="md" text="Loading data..." />

// Content placeholder
<LoadingSkeleton variant="card" count={3} />
```

### Progress Indicators

```tsx
import { Progress, StepProgress } from '@/components/ui/Progress';

// Linear progress
<Progress value={75} max={100} showLabel />

// Step progress
<StepProgress
  steps={[
    { id: '1', label: 'Setup', status: 'completed' },
    { id: '2', label: 'Configure', status: 'current' },
    { id: '3', label: 'Deploy', status: 'pending' }
  ]}
/>
```

## 🎭 Animation Guidelines

### Entrance Animations

- **fadeIn**: Gentle opacity transition (0.3s)
- **slideUp**: Content sliding from bottom (0.3s)
- **scaleIn**: Gentle scale transition (0.2s)

### Interactive Animations

- **Hover**: Subtle color and scale changes
- **Focus**: Clear focus ring animations
- **Press**: Brief scale-down feedback

### Loading Animations

- **Spinner**: Smooth rotation
- **Shimmer**: Content loading placeholder
- **Pulse**: Breathing effect for emphasis

## 📱 Responsive Design

### Breakpoints

- **sm**: 640px and up
- **md**: 768px and up
- **lg**: 1024px and up
- **xl**: 1280px and up
- **2xl**: 1536px and up

### Grid System

- Mobile-first approach
- Flexible column layouts
- Responsive spacing and sizing
- Touch-friendly interactive elements

## 🔧 Customization

### CSS Variables

Override theme variables in your CSS:

```css
:root {
  --primary: 210 100% 50%; /* Custom blue */
  --radius: 0.75rem; /* Larger border radius */
}
```

### Component Variants

Extend existing variants or create new ones:

```tsx
const buttonVariants = cva(baseStyles, {
  variants: {
    variant: {
      // ... existing variants
      custom: 'bg-purple-600 text-white hover:bg-purple-700',
    },
  },
});
```

### Animation Customization

Modify animation durations and easing:

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5, ease: 'easeOut' }}
>
  Content
</motion.div>
```

## 🧪 Testing

### Accessibility Testing

```tsx
import { checkAccessibility } from '@/lib/accessibility';

// Test component accessibility
const issues = checkAccessibility(componentElement);
console.log('Accessibility issues:', issues);
```

### Visual Testing

- Storybook integration for component showcase
- Visual regression testing
- Cross-browser compatibility testing

## 📚 Best Practices

### Component Usage

1. Always use semantic HTML elements
2. Provide proper labels and descriptions
3. Handle loading and error states
4. Test with keyboard navigation
5. Verify screen reader compatibility

### Performance

1. Use lazy loading for heavy components
2. Optimize animations for 60fps
3. Minimize re-renders with proper memoization
4. Use skeleton loading for better perceived performance

### Maintenance

1. Keep components focused and single-purpose
2. Document props and usage examples
3. Write comprehensive tests
4. Follow consistent naming conventions
5. Regular accessibility audits

## 🔗 Related Files

- `@/lib/utils.ts` - Utility functions including `cn()` for class merging
- `@/lib/theme.ts` - Theme configuration and design tokens
- `@/lib/accessibility.ts` - Accessibility utilities and testing helpers
- `@/app/globals.css` - Global styles and CSS variables
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - shadcn/ui configuration
