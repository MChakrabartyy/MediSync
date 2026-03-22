# Frontend Development Guidelines

## Overview

This document outlines the frontend development standards, patterns, and best practices for the MediSync application. Following these guidelines ensures consistent, maintainable, and high-quality user interfaces.

## Technology Stack

### Core Technologies
- **React 18** with modern hooks and concurrent features
- **Next.js 14** with App Router for routing and API integration
- **TypeScript 5.4** with strict type checking
- **Tailwind CSS 3.4** for utility-first styling

### Development Tools
- **ESLint** for code linting with Next.js configuration
- **Prettier** for consistent code formatting
- **Vitest** for unit testing with React Testing Library

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Route groups
│   ├── api/                     # API routes
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                   # Reusable components
│   ├── ui/                      # Base UI components
│   ├── forms/                   # Form components
│   ├── layout/                  # Layout components
│   └── providers/               # Context providers
├── lib/                         # Utilities and configurations
│   ├── utils/                   # Helper functions
│   ├── hooks/                   # Custom React hooks
│   ├── constants/               # Application constants
│   └── validations/             # Zod validation schemas
└── types/                       # TypeScript type definitions
```

## Component Architecture

### Component Naming Convention
- Use PascalCase for component names
- Use descriptive, domain-specific names
- Avoid generic names like `Button` or `Card`

```typescript
// ✅ Good
export function PatientReconciliationCard() { ... }
export function MedicationListItem() { ... }

// ❌ Avoid
export function Card() { ... }
export function Item() { ... }
```

### Component File Structure
- One component per file
- Export as default export
- Include TypeScript interfaces/types
- Add JSDoc comments for complex components

```typescript
// components/PatientReconciliationCard.tsx
import { FC } from 'react';

interface PatientReconciliationCardProps {
  patientId: string;
  medications: Medication[];
  onReconcile: (medicationId: string) => void;
}

/**
 * Displays patient medication reconciliation interface
 * Shows conflicts and allows clinician to resolve them
 */
export const PatientReconciliationCard: FC<PatientReconciliationCardProps> = ({
  patientId,
  medications,
  onReconcile,
}) => {
  // Component implementation
};
```

### Component Composition
- Prefer composition over inheritance
- Use render props for flexible APIs
- Implement compound components for related functionality

```typescript
// Compound component pattern
export const ReconciliationForm = ({ children }: { children: ReactNode }) => (
  <form className="reconciliation-form">{children}</form>
);

ReconciliationForm.PatientSelect = ({ onSelect }: { onSelect: (id: string) => void }) => (
  // Implementation
);

ReconciliationForm.MedicationList = ({ medications }: { medications: Medication[] }) => (
  // Implementation
);

// Usage
<ReconciliationForm>
  <ReconciliationForm.PatientSelect onSelect={handlePatientSelect} />
  <ReconciliationForm.MedicationList medications={medications} />
</ReconciliationForm>
```

## State Management

### Local State
- Use `useState` for simple component state
- Use `useReducer` for complex state logic
- Prefer controlled components over uncontrolled

```typescript
// ✅ Good - Controlled component
const [searchTerm, setSearchTerm] = useState('');

<input
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search patients..."
/>

// ✅ Good - useReducer for complex state
const [state, dispatch] = useReducer(reconciliationReducer, initialState);
```

### Global State
- Use React Context for theme, user preferences
- Consider Zustand or Redux Toolkit for complex global state
- Avoid prop drilling with context providers

```typescript
// Context for user preferences
const UserPreferencesContext = createContext<UserPreferences | null>(null);

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState(defaultPreferences);

  return (
    <UserPreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};
```

## Styling Guidelines

### Tailwind CSS Usage
- Use utility-first approach
- Create component-specific classes for repeated patterns
- Follow mobile-first responsive design

```typescript
// ✅ Good - Utility-first with component classes
<div className="patient-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h3 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Content */}
  </div>
</div>

// ✅ Good - Custom component classes in globals.css
.patient-card {
  @apply bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow;
}
```

### CSS Custom Properties
- Use CSS custom properties for theme values
- Define design tokens in globals.css
- Support dark mode with CSS variables

```css
/* globals.css */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}

.dark {
  --color-primary: #60a5fa;
  --color-secondary: #94a3b8;
  /* ... */
}
```

### Responsive Design
- Use Tailwind's responsive prefixes
- Test on multiple screen sizes
- Consider touch interactions for mobile

```typescript
// ✅ Good - Mobile-first responsive design
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid that adapts to screen size */}
</div>
```

## TypeScript Best Practices

### Type Definitions
- Define interfaces for component props
- Use union types for variant props
- Create branded types for domain-specific values

```typescript
// ✅ Good - Well-defined interfaces
interface Patient {
  id: string;
  name: string;
  dateOfBirth: Date;
  medicalRecordNumber: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
}

// ✅ Good - Union types for variants
type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant: ButtonVariant;
  size: ButtonSize;
  children: ReactNode;
  onClick: () => void;
}
```

### Generic Components
- Use generics for flexible, reusable components
- Constrain generics appropriately
- Provide default type parameters

```typescript
// ✅ Good - Generic data table component
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
}: DataTableProps<T>) {
  // Implementation
}
```

## Performance Optimization

### React Performance
- Use `React.memo` for expensive components
- Implement proper key props in lists
- Use `useMemo` and `useCallback` appropriately

```typescript
// ✅ Good - Memoized expensive component
const MedicationList = React.memo(({ medications }: { medications: Medication[] }) => {
  return (
    <ul>
      {medications.map((med) => (
        <li key={med.id}>{med.name}</li>
      ))}
    </ul>
  );
});
```

### Bundle Optimization
- Use dynamic imports for code splitting
- Implement lazy loading for routes
- Optimize images and assets

```typescript
// ✅ Good - Code splitting with dynamic imports
const ReconciliationPage = lazy(() => import('../pages/ReconciliationPage'));

// ✅ Good - Route-based code splitting (Next.js automatic)
```

## Testing Guidelines

### Unit Testing
- Test component behavior, not implementation
- Use React Testing Library for user-centric tests
- Mock external dependencies

```typescript
// ✅ Good - User-centric testing
test('displays patient medications', async () => {
  render(<PatientMedications patientId="123" />);

  await waitFor(() => {
    expect(screen.getByText('Lisinopril 10mg')).toBeInTheDocument();
  });
});
```

### Test Organization
- Group tests by component/feature
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

```typescript
// tests/components/PatientReconciliationCard.test.tsx
describe('PatientReconciliationCard', () => {
  describe('when medications conflict', () => {
    it('displays conflict warning', () => {
      // Test implementation
    });

    it('allows clinician to resolve conflict', () => {
      // Test implementation
    });
  });
});
```

## Accessibility Guidelines

### Semantic HTML
- Use appropriate HTML elements
- Provide meaningful alt text for images
- Use heading hierarchy properly

```typescript
// ✅ Good - Semantic HTML
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/dashboard">Dashboard</a></li>
      <li><a href="/patients">Patients</a></li>
    </ul>
  </nav>
</header>

<main>
  <h1>Patient Reconciliation</h1>
  <section aria-labelledby="medication-list">
    <h2 id="medication-list">Current Medications</h2>
    {/* Content */}
  </section>
</main>
```

### Keyboard Navigation
- Ensure all interactive elements are keyboard accessible
- Provide visible focus indicators
- Implement proper tab order

```css
/* ✅ Good - Visible focus indicators */
button:focus-visible,
input:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

### Screen Reader Support
- Use ARIA labels where needed
- Provide screen reader announcements for dynamic content
- Test with screen readers

## Error Handling

### User-Friendly Errors
- Display clear, actionable error messages
- Provide recovery options when possible
- Log errors for debugging

```typescript
// ✅ Good - User-friendly error handling
const [error, setError] = useState<string | null>(null);

if (error) {
  return (
    <div role="alert" className="error-message">
      <h3>Unable to load patient data</h3>
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>
        Try Again
      </button>
    </div>
  );
}
```

### Error Boundaries
- Implement error boundaries for graceful failure
- Provide fallback UI for crashed components
- Log errors to monitoring service

```typescript
// ✅ Good - Error boundary component
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error('Error boundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

## Code Quality Standards

### Code Formatting
- Use Prettier for consistent formatting
- Configure ESLint rules appropriately
- Follow TypeScript strict mode

### Code Reviews
- Require code reviews for all changes
- Use checklists for common issues
- Focus on functionality, performance, and maintainability

### Documentation
- Document complex business logic
- Provide usage examples for components
- Keep README and docs up-to-date

## Development Workflow

### Git Workflow
- Use feature branches for development
- Write descriptive commit messages
- Squash commits before merging

### Code Review Process
1. Create pull request with description
2. Automated tests must pass
3. Code review by at least one team member
4. Address review feedback
5. Merge to main branch

### Deployment Process
1. Automated testing on push to main
2. Build verification
3. Automated deployment to staging
4. Manual approval for production
5. Post-deployment monitoring

## Browser Support

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Progressive Enhancement
- Core functionality works without JavaScript
- Enhanced experience with JavaScript enabled
- Graceful degradation for older browsers

## Performance Budget

### Bundle Size
- Initial bundle: <200KB gzipped
- Vendor bundle: <150KB gzipped
- Total JavaScript: <500KB gzipped

### Runtime Performance
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- First Input Delay: <100ms
- Cumulative Layout Shift: <0.1

## Security Considerations

### Frontend Security
- Sanitize user inputs
- Use Content Security Policy
- Implement proper authentication flows
- Avoid storing sensitive data in localStorage

### API Security
- Use HTTPS for all API calls
- Implement proper error handling
- Validate API responses
- Handle authentication tokens securely

## Future Enhancements

### Planned Improvements
- Implement design system with Storybook
- Add end-to-end testing with Playwright
- Implement internationalization (i18n)
- Add progressive web app (PWA) features
- Implement advanced caching strategies

### Technology Upgrades
- Migrate to React Server Components where beneficial
- Implement React Query for server state management
- Add Framer Motion for animations
- Implement advanced form handling with React Hook Form

This document will be updated as the project evolves and new patterns emerge.