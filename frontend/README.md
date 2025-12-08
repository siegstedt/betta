# Frontend

The frontend is a Next.js 15 application built with React 19 and TypeScript, providing a comprehensive training and performance analysis platform for cyclists and coaches. It features data visualization, athlete management, and detailed activity analysis.

## Tech Stack

- **Framework**: Next.js 15.4.0 with App Router
- **React**: Version 19.2.0
- **Language**: TypeScript 5.3.3
- **Styling**: Tailwind CSS 3.4.3 with custom design system
- **UI Components**: Radix UI primitives with custom components
- **Charts**: Recharts for data visualization
- **Maps**: React Leaflet for GPS track display
- **Icons**: Lucide React
- **Theming**: next-themes for dark/light mode
- **Date Handling**: date-fns

## Folder Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── activity/[id]/      # Activity detail pages
│   │   ├── athlete/[id]/       # Athlete-specific pages
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # Reusable React components
│   │   ├── ui/                 # Base UI primitives (shadcn/ui style)
│   │   │   ├── index.ts        # Barrel exports for UI components
│   │   │   ├── button.tsx      # Button component with variants
│   │   │   ├── card.tsx        # Card components (Card, CardHeader, etc.)
│   │   │   ├── input.tsx       # Input field component
│   │   │   ├── select.tsx      # Select dropdown component
│   │   │   └── ...             # Other UI primitives
│   │   ├── forms/              # Form-specific components
│   │   │   ├── index.ts        # Barrel exports for form components
│   │   │   ├── form-field.tsx  # Form field wrapper
│   │   │   ├── form-select.tsx # Form select component
│   │   │   └── form-error.tsx  # Form error display
│   │   ├── activity/           # Activity-related components
│   │   │   ├── index.ts        # Barrel exports for activity components
│   │   │   ├── activity-header.tsx    # Activity header with metadata
│   │   │   ├── activity-summary.tsx   # Activity metrics summary
│   │   │   ├── activity-chart.tsx     # Activity data visualization
│   │   │   └── ...             # Other activity components
│   │   ├── charts/             # Chart and visualization components
│   │   │   ├── index.ts        # Barrel exports for chart components
│   │   │   ├── daily-workload-chart.tsx     # Daily training load
│   │   │   ├── weekly-workload-chart.tsx    # Weekly workload trends
│   │   │   ├── ftp-progression-chart.tsx    # FTP progression over time
│   │   │   └── ...             # Other chart components
│   │   ├── layout/             # Layout and navigation components
│   │   │   ├── index.ts        # Barrel exports for layout components
│   │   │   ├── sidebar.tsx     # Navigation sidebar
│   │   │   └── footer.tsx      # Page footer
│   │   ├── index.ts            # Root barrel exports for all components
│   │   └── *.tsx               # Root-level components (error boundary, etc.)
│   └── lib/                    # Utilities and shared code
│       ├── analysis.ts         # Performance calculation functions
│       ├── definitions.ts      # TypeScript type definitions
│       ├── formatters.ts       # Data formatting utilities
│       └── utils.ts            # General utilities
├── .eslintrc.json             # ESLint configuration
├── next.config.mjs            # Next.js configuration
├── package.json               # Dependencies and scripts
├── tailwind.config.ts         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

## Architecture

### App Router Structure

- **Route Groups**: Organized by feature (activity, athlete)
- **Dynamic Routes**: `[id]` parameters for athlete and activity IDs
- **Layouts**: Shared layouts for consistent navigation
- **Server Components**: Used for initial page loads and SEO
- **Client Components**: Used for interactive features with `'use client'` directive

### Component Organization

The component library has been recently refactored for better organization and maintainability:

- **UI Components**: Reusable primitives in `components/ui/` (buttons, inputs, cards, etc.)
- **Form Components**: Form-specific components in `components/forms/` (form fields, validation)
- **Activity Components**: Activity-related components in `components/activity/` (headers, summaries, maps)
- **Chart Components**: Data visualization components in `components/charts/` (workload charts, performance metrics)
- **Layout Components**: Navigation and layout components in `components/layout/` (sidebar, footer)
- **Root Components**: Application-level components in `components/` (error boundaries, providers)
- **Barrel Exports**: Each folder has an `index.ts` for clean imports
- **Logical Grouping**: Components organized by domain (ui, forms, activity, charts, layout)
- **Consistent Naming**: All components follow kebab-case naming convention
- **Composition**: Components composed from smaller, focused pieces
- **Props Interface**: Strong typing with TypeScript interfaces

### Data Flow

- **API Integration**: Direct fetch calls to backend API at `http://localhost:8000`
- **Type Safety**: Shared type definitions between frontend and backend
- **Error Handling**: Consistent error states and user feedback
- **Loading States**: Skeleton loading and progress indicators

## Key Components

### UI Components (`components/ui/`)

- **Button**: Customizable button with variants (default, destructive, outline, ghost, link)
- **Card**: Card container with header, content, footer, and title components
- **Input**: Text input field component
- **Select**: Dropdown select component with custom trigger and content
- **Label**: Form label component
- **Textarea**: Multi-line text input
- **DataTable**: Sortable, filterable data table with pagination
- **TableCard**: Table wrapper with card styling
- **LoadingSpinner**: Loading indicator with size variants
- **ErrorMessage**: Error display with retry functionality
- **ThemeToggle**: Dark/light mode switcher

### Form Components (`components/forms/`)

- **FormField**: Form field wrapper with label, children, and error display
- **FormSelect**: Select dropdown for forms with validation
- **FormError**: Error message display for form validation

### Activity Components (`components/activity/`)

- **ActivityHeader**: Activity header with sport icon, athlete info, and menu
- **ActivitySummary**: Key activity metrics overview (time, distance, elevation, etc.)
- **ActivityChart**: Interactive time-series chart with multiple data series
- **ActivityEffort**: Activity effort analysis with workload charts
- **ActivityEquipment**: Equipment used in the activity
- **ActivityMap**: GPS track visualization with Leaflet
- **ActivityMenu**: Activity action menu (edit, delete, etc.)
- **ActivitySidebar**: Activity navigation sidebar

### Chart Components (`components/charts/`)

- **DailyWorkloadChart**: Daily training load visualization
- **WeeklyWorkloadChart**: Weekly workload trends with rolling averages
- **FtpProgressionChart**: FTP progression over time
- **MmpCurveChart**: Mean Maximal Power curve
- **PerformanceManagementChart**: PMC chart showing CTL/ATL/TSB trends
- **WeightTrendChart**: Weight progression over time
- **ZoneCharts**: Power and heart rate zone analysis
- **PowerAnalysis**: Power distribution and MMP analysis

### Layout Components (`components/layout/`)

- **Sidebar**: Navigation sidebar with athlete info and menu items
- **Footer**: Page footer with links and information

### Root Components (`components/`)

- **ErrorBoundary**: Error boundary for graceful error handling
- **RpeSelector**: Perceived exertion rating selector
- **GearSelect**: Equipment selection component
- **LapsTable**: Lap-by-lap activity breakdown
- **BestEffortsTable**: Best power efforts across intervals
- **MetricGauge**: Visual gauges for fitness metrics
- **ThemeProvider**: Theme provider for dark/light mode

## Development Guidelines

### Getting Started

```bash
cd frontend
npm install

# Copy environment file for local development
cp .env.example .env.local

# Edit .env.local if needed (defaults should work)
npm run dev
```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier
- `npm run typecheck`: Run TypeScript type checking

### Coding Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **React Hooks**: Rules of Hooks strictly followed
- **Component Naming**: PascalCase for components, camelCase for instances
- **File Naming**: kebab-case for all component files (React/Next.js convention)
- **Folder Naming**: kebab-case for component folders
- **Imports**: Absolute imports with `@/` alias, barrel exports for clean imports
- **Styling**: Tailwind CSS classes, responsive design
- **Accessibility**: Semantic HTML, ARIA labels where needed

### Component Patterns

- **Props**: Strongly typed interfaces
- **Default Props**: Sensible defaults for optional props
- **Error Boundaries**: Graceful error handling
- **Loading States**: Consistent loading UI patterns
- **Memoization**: `useMemo` for expensive calculations

### State Management

- **Local State**: `useState` for component-specific state
- **Server State**: Direct API calls, no global state management
- **URL State**: Query parameters for filters and navigation
- **Form State**: Controlled components with validation

### API Integration

- **Base URL**: Configurable via `NEXT_PUBLIC_API_URL` environment variable
  - Default: `http://localhost:8000` (development)
  - Docker: `http://backend:8000` (server-side rendering)
- **Error Handling**: Try/catch with user-friendly messages
- **Loading States**: Loading indicators during API calls
- **Type Safety**: API responses typed with shared definitions

### Styling Guidelines

- **Design System**: Custom CSS variables for colors and spacing
- **Dark Mode**: Full dark/light theme support
- **Responsive**: Mobile-first responsive design
- **Animation**: Tailwind CSS animations for interactions
- **Consistency**: Reuse of design tokens across components

### Performance Considerations

- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image component (when needed)
- **Bundle Analysis**: Monitor bundle size
- **Memoization**: Prevent unnecessary re-renders
- **Lazy Loading**: Dynamic imports for heavy components

### Testing Strategy

- **Unit Tests**: Component logic and utilities
- **Integration Tests**: API integration and user flows
- **E2E Tests**: Critical user journeys
- **Visual Regression**: UI consistency across changes

### Environment Variables

The application uses the following environment variables:

- `NEXT_PUBLIC_API_URL`: Backend API URL
  - Development: `http://localhost:8000`
  - Docker: `http://backend:8000` (automatically set)
  - Production: Your deployed backend URL

Environment files:

- `.env.example`: Template file
- `.env.local`: Local development (ignored by git)
- `.env.production`: Production overrides

### Deployment

- **Build**: `npm run build` creates optimized production build
- **Docker**: Containerized deployment with multi-stage build
- **Environment**: Environment variables for API URLs
- **CDN**: Static assets served from CDN for performance
