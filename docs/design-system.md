# Design System

## Overview

The Skeptical Control design system is built with React, TypeScript, and Tailwind CSS. It provides a consistent, premium visual experience inspired by Linear, Vercel, and modern developer platforms.

## Theme

### Dark Theme (Default)

The dark theme uses deep grays and accent colors for a sophisticated, professional appearance.

- **Background**: `#0a0a0b` (primary), `#111113` (secondary), `#18181b` (tertiary)
- **Surface**: `#1c1c1f` (primary), `#27272a` (secondary)
- **Border**: `#27272a` (primary), `#3f3f46` (secondary)
- **Text**: `#fafafa` (primary), `#a1a1aa` (secondary), `#71717a` (tertiary)
- **Accent**: `#6366f1` (primary), `#4f46e5` (hover), `#8b5cf6` (secondary)

### Light Theme

The light theme uses clean whites and subtle grays for a bright, modern appearance.

- **Background**: `#ffffff` (primary)
- **Surface**: `#f4f4f5` (primary)
- **Border**: `#e4e4e7` (primary)
- **Text**: `#09090b` (primary), `#71717a` (secondary)
- **Accent**: Same as dark theme

## Typography

- **Font Family**: Inter, system-ui, sans-serif
- **Font Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Font Sizes**: sm (14px), base (16px), lg (18px), xl (20px), 2xl (24px)

## Spacing

Consistent spacing scale using Tailwind's default values:
- `xs`: 0.5rem (8px)
- `sm`: 0.75rem (12px)
- `md`: 1rem (16px)
- `lg`: 1.5rem (24px)
- `xl`: 2rem (32px)
- `2xl`: 3rem (48px)

## Components

### Sidebar

Fixed-width navigation sidebar with collapsible sections.

**Props:**
- None (uses current route for active state)

**Usage:**
```tsx
import Sidebar from './components/Sidebar';

function Layout() {
  return (
    <div className="flex">
      <Sidebar />
      {/* Main content */}
    </div>
  );
}
```

### TopNavigation

Top navigation bar with user menu, theme toggle, and logout.

**Props:**
- None (uses AuthContext and ThemeContext)

**Usage:**
```tsx
import TopNavigation from './components/TopNavigation';

function Layout() {
  return (
    <div>
      <TopNavigation />
      {/* Main content */}
    </div>
  );
}
```

### MetricCard

Display statistics with trend indicators.

**Props:**
```tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}
```

**Usage:**
```tsx
import MetricCard from './components/MetricCard';
import { FolderOpen } from 'lucide-react';

<MetricCard
  title="Total Projects"
  value={42}
  icon={FolderOpen}
  trend={{ value: 12, isPositive: true }}
/>
```

### StatusIndicator

Visual status badges for entities.

**Props:**
```tsx
interface StatusIndicatorProps {
  status: 'running' | 'stopped' | 'error' | 'pending' | 'uploaded';
  className?: string;
}
```

**Usage:**
```tsx
import StatusIndicator from './components/StatusIndicator';

<StatusIndicator status="running" />
```

### EmptyState

Empty data illustrations and messaging.

**Props:**
```tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}
```

**Usage:**
```tsx
import EmptyState from './components/EmptyState';
import { FolderOpen } from 'lucide-react';

<EmptyState
  icon={FolderOpen}
  title="No projects yet"
  description="Upload your first project to get started"
  action={{
    label: 'Upload Project',
    onClick: () => navigate('/projects/upload'),
  }}
/>
```

### LoadingSkeleton

Skeleton loading states for content placeholders.

**Props:**
```tsx
interface LoadingSkeletonProps {
  className?: string;
}
```

**Usage:**
```tsx
import LoadingSkeleton from './components/LoadingSkeleton';

<LoadingSkeleton className="h-16 w-full" />
```

## Utility Functions

### cn()

Merge Tailwind CSS classes with conflict resolution.

```tsx
import { cn } from './lib/utils';

const className = cn('px-4 py-2', isActive && 'bg-accent-primary', className);
```

## Color Palette

### Status Colors

- **Running**: Green (`bg-green-500`, `text-green-500`)
- **Stopped**: Gray (`bg-gray-500`, `text-gray-500`)
- **Error**: Red (`bg-red-500`, `text-red-500`)
- **Pending**: Yellow (`bg-yellow-500`, `text-yellow-500`)
- **Uploaded**: Blue (`bg-blue-500`, `text-blue-500`)

### Accent Colors

- **Primary**: Indigo (`#6366f1`)
- **Primary Hover**: Darker Indigo (`#4f46e5`)
- **Secondary**: Violet (`#8b5cf6`)

## Icons

Icons are provided by Lucide React.

```tsx
import { Activity, FolderOpen, Settings, LogOut } from 'lucide-react';
```

## Responsive Design

The design system uses Tailwind's responsive utilities:

- Mobile: `default` (no prefix)
- Tablet: `md:` prefix
- Desktop: `lg:` prefix

Example:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Responsive grid */}
</div>
```

## Animation

Animations use Framer Motion for smooth transitions.

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.2 }}
>
  {/* Content */}
</motion.div>
```

## Accessibility

- All interactive elements have proper focus states
- Color contrast ratios meet WCAG AA standards
- Semantic HTML elements are used
- ARIA labels are provided where necessary
