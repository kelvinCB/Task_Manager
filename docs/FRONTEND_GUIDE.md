# Frontend Development Guide

## Overview

This guide provides comprehensive documentation for frontend development in the Kolium application using React, TypeScript, Vite, and Tailwind CSS.

## Table of Contents

- [Frontend Development Guide](#frontend-development-guide)
  - [Overview](#overview)
  - [Architecture Overview](#architecture-overview)
  - [Project Structure](#project-structure)
  - [Authentication Integration](#authentication-integration)
  - [Component Development](#component-development)
  - [State Management](#state-management)
  - [API Integration](#api-integration)
  - [Internationalization (i18n)](#internationalization-i18n)
  - [Styling Guidelines](#styling-guidelines)
  - [Performance Optimization](#performance-optimization)
  - [Accessibility Standards](#accessibility-standards)
  - [Error Handling](#error-handling)
  - [API Integration](#api-integration)
  - [Testing Guidelines](#testing-guidelines)
  - [Build and Deployment](#build-and-deployment)
- [Analyze bundle size](#analyze-bundle-size)
- [Performance auditing](#performance-auditing)
  - [Future Enhancements](#future-enhancements)
  - [Troubleshooting](#troubleshooting)
- [Clear node modules and reinstall](#clear-node-modules-and-reinstall)
- [Clear Vite cache](#clear-vite-cache)
- [Check TypeScript compilation](#check-typescript-compilation)
- [Purge and rebuild Tailwind](#purge-and-rebuild-tailwind)
- [Check for conflicting styles](#check-for-conflicting-styles)
- [Check browser dev tools for specificity issues](#check-browser-dev-tools-for-specificity-issues)

## Architecture Overview

### Tech Stack
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: React Hooks + Custom Hooks
- **Authentication**: Supabase Auth with React Context
- **Backend Integration**: Supabase client + REST API
- **Testing**: Vitest + React Testing Library + jsdom
- **Icons**: Lucide React for consistent iconography

### Design Principles
- **Component-based architecture** with reusable components
- **Custom hooks** for business logic separation
- **TypeScript-first** development for type safety
- **Responsive design** with mobile-first approach
- **Accessibility** as a core requirement
- **Performance optimization** built-in from the start

---

## Project Structure

### Current Directory Structure
```
src/
├── components/           # Reusable UI components
│   ├── TaskBoard.tsx    # Kanban board view
│   ├── TaskTree.tsx     # Hierarchical tree view
│   ├── TaskForm.tsx     # Task creation/editing form
│   ├── TaskItem.tsx     # Individual task component
│   ├── TaskTimer.tsx    # Time tracking component
│   ├── TaskStats.tsx    # Statistics component
│   ├── TimeStatsView.tsx # Time analytics view
│   ├── ProgressIcon.tsx # Custom progress icon
│   └── AIIcon.tsx       # AI integration icon
├── components/
│   └── features/        # Feature-specific components
│       ├── auth/        # Authentication components
│       │   ├── AuthForm.tsx # Reusable auth form
│       │   └── LoginButton.tsx # Login button component
│       └── account/      # Account-related components
│           └── AccountMenu.tsx # Unified account menu component
├── contexts/            # React contexts
│   ├── ThemeContext.tsx # Theme management
│   └── AuthContext.tsx  # Authentication context
├── hooks/               # Custom hooks
│   ├── useTasks.ts      # Main task management hook (API + localStorage)
│   └── useUserProfile.ts # User profile management hook
├── lib/                 # Third-party integrations
│   └── supabaseClient.ts # Supabase client setup
├── pages/               # Page-level components
│   ├── LoginPage.tsx    # Login page
│   └── RegisterPage.tsx # Registration page
├── services/            # External service integrations
│   ├── openaiService.ts # OpenAI API integration
│   └── taskService.ts   # Task API service layer
├── types/               # TypeScript type definitions
│   └── Task.ts          # Task-related types
├── utils/               # Utility functions
│   └── taskUtils.ts     # Task manipulation utilities
├── test/                # Test files (mirrors src structure)
│   ├── components/      # Component tests
│   ├── hooks/           # Hook tests
│   ├── services/        # Service tests
│   └── utils/           # Utility tests
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── vite-env.d.ts        # Vite type definitions
```

## Authentication Integration

### Overview
The authentication system uses **Supabase Auth** for secure user management with React Context for state management.

### Key Components

#### 1. Login and Registration Pages

**Login Page** (`src/pages/LoginPage.tsx`)
- Modern interface based on Scale's design system
- Gradient background with indigo/blue/purple colors
- Animated Kolium logo in header
- Visual social login buttons (Google and GitHub)
- Input fields with integrated icons
- "Don't remember your password?" link for password recovery
- "Sign up" link for user registration
- Loading, error and success states management
- Responsive design with mobile and desktop layouts
- Dark mode support with appropriate color gradients
- Comprehensive test coverage with 7 tests

**Registration Page** (`src/pages/RegisterPage.tsx`)
- Consistent design matching login page
- Form validation and error handling
- Email and password validation
- Animated logo and social registration options
- Success confirmation with navigation
- Dark mode support and responsive design
- Comprehensive test coverage with 8 tests

#### 2. AuthContext (`src/contexts/AuthContext.tsx`)
```typescript
// Provides authentication state and methods
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  // ... authentication logic
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### 2. Supabase Client (`src/lib/supabaseClient.ts`)
```typescript
// Configured Supabase client for authentication
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_KEY
);

export default supabase;
```

#### 3. Authentication Components

**AuthForm Component** (`src/components/features/auth/AuthForm.tsx`)
- Reusable form for both login and registration
- Includes email/password validation
- Loading states and error handling
- Responsive design with Tailwind CSS


- Success feedback and error handling

### Authentication Flow

1. **User Registration:**
   ```typescript
   const { error } = await supabase.auth.signUp({
     email,
     password,
   });
   ```

2. **User Login:**
   ```typescript
   const { error } = await supabase.auth.signInWithPassword({
     email,
     password,
   });
   ```

3. **Session Management:**
   ```typescript
   useEffect(() => {
     const { data: authListener } = supabase.auth.onAuthStateChange(
       (event, session) => {
         setSession(session);
         setUser(session?.user ?? null);
       }
     );
     return () => authListener.subscription.unsubscribe();
   }, []);
   ```

### Router Integration

```typescript
// App.tsx routing with authentication
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}
```

### Environment Variables
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_SUPABASE_KEY
```

### Security Features
- **Email validation** with regex patterns
- **Password strength** requirements
- **Session management** with automatic token refresh
- **Error handling** with user-friendly messages
- **Input sanitization** and validation

### Recommended Future Structure
```
src/
├── components/
│   ├── ui/              # Basic UI components (buttons, inputs, etc.)
│   ├── features/        # Feature-specific components
│   │   ├── tasks/       # Task-related components
│   │   ├── auth/        # Authentication components
│   │   └── dashboard/   # Dashboard components
│   └── layout/          # Layout components (header, sidebar, etc.)
├── pages/               # Page-level components
├── hooks/               # Custom hooks
├── contexts/            # React contexts
├── lib/                 # Third-party integrations
├── services/            # API and external services
├── utils/               # Utility functions
├── types/               # TypeScript definitions
├── constants/           # Application constants
└── assets/              # Static assets
```

---

## Component Development

### Component Architecture

#### Component Types
1. **UI Components**: Basic, reusable components (buttons, inputs, modals)
2. **Feature Components**: Business logic components (TaskForm, TaskBoard)
3. **Layout Components**: Page structure components (Header, Sidebar)
4. **Page Components**: Top-level route components

#### Component Structure Template
```typescript
// ComponentName.tsx
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ComponentNameProps {
  // Define props with proper types
  title: string;
  isActive?: boolean;
  onAction?: (id: string) => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  isActive = false,
  onAction
}) => {
  const { theme } = useTheme();

  return (
    <div className={`component-base ${theme === 'dark' ? 'dark-styles' : 'light-styles'}`}>
      {/* Component content */}
    </div>
  );
};
```

#### Component Best Practices
- **TypeScript interfaces** for all props
- **Default props** using ES6 default parameters
- **Descriptive prop names** that indicate purpose
- **Consistent export patterns** (named exports preferred)
- **Theme support** for all visual components
- **Responsive design** considerations

### Existing Components

#### TaskBoard Component
- **Purpose**: Kanban-style task management
- **Features**: Drag & drop, status columns, task cards
- **Props**: `tasks`, `onStatusChange`, `onEdit`, `onDelete`, `onCreateTask`

#### TaskTree Component
- **Purpose**: Hierarchical task visualization
- **Features**: Expandable nodes, nested tasks, indentation
- **Props**: `nodes`, `expandedNodes`, `onToggleExpand`, `onStatusChange`

#### TaskForm Component
- **Purpose**: Task creation and editing
- **Features**: Form validation, AI integration, modal display
- **Props**: `task`, `parentId`, `isOpen`, `onClose`, `onSubmit`

#### TaskTimer Component
- **Purpose**: Time tracking functionality
- **Features**: Start/pause timer, elapsed time display, notifications
- **Props**: `taskId`, `isActive`, `elapsedTime`, `onStart`, `onPause`

#### AccountMenu Component
- **Purpose**: Unified account and task management menu
- **Features**: Login/logout toggle, export/import functionality, responsive design with compact mode for mobile
- **Props**: `onExport`, `onImport`, `compact`
- **Integration**: Uses AuthContext for authentication state and ThemeContext for styling

---

## State Management

### Current State Architecture

#### Local State with useState
```typescript
// Simple component state
const [isLoading, setIsLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
```

#### Custom Hooks for Complex State
```typescript
// useTasks hook example
export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>({});
  
  // Complex state logic
  const createTask = useCallback((taskData) => {
    // Implementation
  }, []);
  
  return {
    tasks,
    filter,
    createTask,
    // ... other methods
  };
};
```

#### Context for Global State
```typescript
// ThemeContext example
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
```

### State Management Best Practices

#### When to Use Each Pattern
- **useState**: Simple component-local state
- **useReducer**: Complex state with multiple actions
- **Custom Hooks**: Reusable stateful logic
- **Context**: Global state (theme, auth, etc.)
- **Local Storage**: Persistent client-side data
- **API Integration**: Server-synced state via taskService

#### State Structure Guidelines
- **Normalize data** to avoid deep nesting
- **Separate concerns** (UI state vs. data state)
- **Use TypeScript** for state shape definitions
- **Immutable updates** for all state changes

---

## API Integration

### Overview

The frontend integrates with the backend API through a service layer pattern, providing automatic fallback to localStorage when offline or unauthenticated.

### Task Service Layer

#### TaskService Class (`src/services/taskService.ts`)

Centralized service for all task-related API operations:

```typescript
import { taskService } from '../services/taskService';

// Get all tasks
const response = await taskService.getTasks();
if (response.data) {
  setTasks(response.data);
} else {
  console.error(response.error);
}

// Create task
const newTask = await taskService.createTask({
  title: 'New Task',
  description: 'Description',
  status: 'Open',
  timeTracking: { totalTimeSpent: 0, isActive: false, timeEntries: [] }
});

// Update task
const updated = await taskService.updateTask(taskId, { title: 'Updated' });

// Delete task
const result = await taskService.deleteTask(taskId);
```

#### Key Features

1. **JWT Authentication**: Automatic token extraction from Supabase session
2. **Error Handling**: Consistent error response format
3. **Type Safety**: Full TypeScript support with interfaces
4. **Data Transformation**: Automatic conversion between frontend/backend formats

#### Response Format

```typescript
interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
```

### useTasks Hook Integration

#### Hybrid Architecture

The `useTasks` hook intelligently switches between API and localStorage:

```typescript
export const useTasks = (options = { useApi: true }) => {
  const [useApi, setUseApi] = useState(options.useApi !== false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Automatic API detection on mount
  useEffect(() => {
    const loadTasks = async () => {
      const isAuth = await taskService.isAuthenticated();
      if (isAuth) {
        const response = await taskService.getTasks();
        if (response.data) {
          setTasks(response.data);
        } else {
          setUseApi(false); // Fallback to localStorage
        }
      } else {
        setUseApi(false);
      }
    };
    loadTasks();
  }, []);
};
```

#### Auth State Synchronization

```typescript
// Listen for auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    setUseApi(true);
    // Reload from API
  } else if (event === 'SIGNED_OUT') {
    setUseApi(false);
    // Switch to localStorage
  }
});
```

#### Exposed State

```typescript
const {
  tasks,          // Current tasks array
  isLoading,      // Loading state
  apiError,       // API error message
  useApi,         // Current mode (API vs localStorage)
  createTask,     // Async CRUD operations
  updateTask,
  deleteTask
} = useTasks();
```

### Backend API Endpoints

#### Base URL Configuration

```typescript
// Development
const baseUrl = 'http://localhost:3001/api';

// Production (from .env)
const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
```

#### Available Endpoints

- `GET /api/tasks` - Get all user tasks (with optional status filter)
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

**Note:** All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Error Handling Pattern

```typescript
// Service layer handles errors gracefully
try {
  const response = await taskService.createTask(taskData);
  if (response.error) {
    // API error (validation, auth, etc.)
    setApiError(response.error);
    // Fall back to localStorage
  } else if (response.data) {
    // Success - update state
    setTasks(prev => [...prev, response.data!]);
  }
} catch (error) {
  // Network error
  console.error('Network error:', error);
  setUseApi(false);
}
```

### Testing API Integration

```typescript
// Tests disable API mode
const { result } = renderHook(() => 
  useTasks({ useApi: false, useDefaultTasks: false })
);

// All operations use localStorage in test environment
act(() => {
  result.current.createTask({ title: 'Test Task' });
});
```


---

## Internationalization (i18n)

### Overview
The application uses `react-i18next` for internationalization, supporting English (en) and Spanish (es). Code-splitting is supported, but currently, standard JSON files are laid out for simplicity.

### Structure
Translations are stored in `src/locales/`:
- `en.json`: English strings
- `es.json`: Spanish strings

Configuration is located in `src/i18n.ts`.

### Usage
Use the `useTranslation` hook in components:

```typescript
import { useTranslation } from 'react-i18next';

export const MyComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('app.title')}</h1>;
};
```

### Components
- **LanguageToggle**: A UI component (`src/components/ui/LanguageToggle.tsx`) allows users to switch languages instantly. It persists the preference using `i18next` language detection or storage.

---

## Styling Guidelines

### Tailwind CSS Architecture

#### Utility-First Approach
```tsx
// Good: Utility classes
<button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
  Click me
</button>

// Avoid: Custom CSS classes when utilities suffice
<button className="custom-button">
  Click me
</button>
```

#### Component Variants Pattern
```tsx
// Button variant system
const buttonVariants = {
  primary: 'bg-blue-500 hover:bg-blue-600 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  danger: 'bg-red-500 hover:bg-red-600 text-white'
};

interface ButtonProps {
  variant?: keyof typeof buttonVariants;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children 
}) => {
  return (
    <button className={`px-4 py-2 rounded-lg ${buttonVariants[variant]}`}>
      {children}
    </button>
  );
};
```

### Theme System

#### Current Implementation
```typescript
// Theme context usage
const { theme } = useTheme();

// Conditional styling
<div className={`
  p-4 rounded-lg border transition-colors duration-200
  ${theme === 'dark' 
    ? 'bg-gray-800 border-gray-700 text-gray-100' 
    : 'bg-white border-gray-200 text-gray-900'
  }
`}>
```

#### Recommended Improvements
```typescript
// Theme-aware utility functions
const getThemeClasses = (theme: Theme) => ({
  card: theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
  text: theme === 'dark' ? 'text-gray-100' : 'text-gray-900',
  button: theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
});
```

### Responsive Design

#### Breakpoint Strategy
```typescript
// Tailwind breakpoints
const breakpoints = {
  sm: '640px',   // Small devices
  md: '768px',   // Medium devices
  lg: '1024px',  // Large devices
  xl: '1280px',  // Extra large devices
  '2xl': '1536px' // 2X large devices
};
```

#### Mobile-First Approach
```tsx
// Mobile-first responsive classes
<div className="
  w-full p-4
  sm:w-1/2 sm:p-6
  md:w-1/3 md:p-8
  lg:w-1/4
">
  Content
</div>
```

---

## Performance Optimization

### React Performance

#### Component Optimization
```typescript
// React.memo for expensive components
export const ExpensiveComponent = React.memo<Props>(({ data }) => {
  return <div>{/* Complex rendering */}</div>;
});

// useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// useCallback for stable function references
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);
```

#### List Optimization
```typescript
// Virtual scrolling for large lists (future implementation)
import { FixedSizeList as List } from 'react-window';

const VirtualTaskList = ({ tasks }) => (
  <List
    height={600}
    itemCount={tasks.length}
    itemSize={80}
    itemData={tasks}
  >
    {TaskItem}
  </List>
);
```

### Bundle Optimization

#### Code Splitting
```typescript
// Route-based code splitting
const TaskBoard = lazy(() => import('./components/TaskBoard'));
const TaskTree = lazy(() => import('./components/TaskTree'));

// Component-based code splitting
const HeavyComponent = lazy(() => 
  import('./components/HeavyComponent').then(module => ({
    default: module.HeavyComponent
  }))
);
```

#### Tree Shaking
```typescript
// Good: Named imports for tree shaking
import { format, addDays } from 'date-fns';

// Avoid: Default imports that include entire library
import * as dateFns from 'date-fns';
```

### Image and Asset Optimization

#### Image Loading
```tsx
// Lazy loading images
<img 
  src={imageSrc}
  loading="lazy"
  alt="Description"
  className="w-full h-auto"
/>

// Responsive images
<img 
  srcSet="
    image-320w.jpg 320w,
    image-640w.jpg 640w,
    image-1280w.jpg 1280w
  "
  sizes="(max-width: 320px) 280px, (max-width: 640px) 600px, 1200px"
  src="image-1280w.jpg"
  alt="Description"
/>
```

---

## Accessibility Standards

### ARIA and Semantic HTML

#### Semantic Structure
```tsx
// Good: Semantic HTML elements
<main>
  <section aria-labelledby="tasks-heading">
    <h2 id="tasks-heading">Task Management</h2>
    <article>
      <h3>Individual Task</h3>
      <p>Task description</p>
    </article>
  </section>
</main>
```

#### ARIA Labels and Roles
```tsx
// Button with descriptive label
<button 
  aria-label="Delete task: Complete project documentation"
  onClick={() => onDelete(task.id)}
>
  <TrashIcon />
</button>

// Interactive elements with proper roles
<div 
  role="button"
  tabIndex={0}
  aria-pressed={isActive}
  onKeyDown={handleKeyDown}
  onClick={handleClick}
>
  Custom Button
</div>
```

### Keyboard Navigation

#### Focus Management
```typescript
// Focus management in modals
useEffect(() => {
  if (isOpen) {
    const firstFocusableElement = modalRef.current?.querySelector(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusableElement?.focus();
  }
}, [isOpen]);

// Keyboard event handling
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleClick();
  }
};
```

### Color and Contrast

#### Theme-Aware Contrast
```typescript
// Ensure sufficient contrast in both themes
const getContrastColors = (theme: Theme) => ({
  primary: theme === 'dark' 
    ? 'text-blue-300 hover:text-blue-200' // Lighter for dark theme
    : 'text-blue-600 hover:text-blue-700', // Darker for light theme
  danger: theme === 'dark'
    ? 'text-red-300 hover:text-red-200'
    : 'text-red-600 hover:text-red-700'
});
```

---

## Error Handling

### Error Boundaries

#### React Error Boundary
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught error:', error, errorInfo);
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### Async Error Handling

#### API Error Handling
```typescript
// Custom hook for API calls with error handling
const useApiCall = <T>(apiFunction: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  return { data, loading, error, execute };
};
```

### User-Friendly Error Messages

#### Error Display Components
```tsx
interface ErrorMessageProps {
  error: string | null;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  error, 
  onRetry 
}) => {
  if (!error) return null;

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-800 text-sm">{error}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
```

---

## API Integration

### Service Layer Architecture

#### API Service Structure
```typescript
// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
```

#### Task Service Implementation
```typescript
// Task-specific API methods
export class TaskService {
  static async getTasks(filters?: TaskFilter): Promise<Task[]> {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.search) queryParams.append('search', filters.search);

    return apiClient.request<Task[]>(`/tasks?${queryParams}`);
  }

  static async createTask(taskData: CreateTaskRequest): Promise<Task> {
    return apiClient.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  static async updateTask(id: string, updates: UpdateTaskRequest): Promise<Task> {
    return apiClient.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  static async deleteTask(id: string): Promise<void> {
    return apiClient.request<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }
}
```

### React Query Integration (Future)

#### Query Hook Pattern
```typescript
// Future implementation with React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useTasks = (filters?: TaskFilter) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => TaskService.getTasks(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: TaskService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
```

---

## Testing Guidelines

### Component Testing

#### Testing Best Practices
- **Test user behavior** rather than implementation details
- **Use accessible queries** (getByRole, getByLabelText)
- **Mock external dependencies** (APIs, services)
- **Test different states** (loading, error, success)

#### Example Component Test
```typescript
// TaskForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskForm } from '../TaskForm';
import { ThemeProvider } from '../../contexts/ThemeContext';

const renderWithTheme = (component: ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('TaskForm', () => {
  it('should create a new task when form is submitted', async () => {
    const mockOnSubmit = jest.fn();
    
    renderWithTheme(
      <TaskForm 
        isOpen={true}
        onClose={jest.fn()}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/task title/i), {
      target: { value: 'New Task' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task'
        })
      );
    });
  });
});
```

### Hook Testing

#### Custom Hook Testing
```typescript
// useTasks.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useTasks } from '../useTasks';

describe('useTasks', () => {
  it('should create a new task', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.createTask({
        title: 'Test Task',
        description: 'Test Description',
        status: 'Open'
      });
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Test Task');
  });
});
```

---

## Build and Deployment

### Vite Configuration

#### Development Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
});
```

#### Environment Variables
```typescript
// Environment variable handling
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly OPENAI_API_KEY: string;
  readonly VITE_OPENAI_MODEL: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Production Optimization

#### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Performance auditing
npm install -g lighthouse
lighthouse https://your-domain.com
```

#### Performance Monitoring
```typescript
// Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric: any) => {
  // Send metrics to analytics service
  console.log(metric);
};

// Measure Core Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

## Future Enhancements

### Planned Improvements

#### State Management Evolution
- [ ] Migrate to React Query for server state
- [ ] Implement optimistic updates
- [ ] Add offline support with service workers
- [ ] Implement real-time updates with WebSockets

#### Component Library
- [ ] Extract common components to shared library
- [ ] Implement design system tokens
- [ ] Add Storybook for component documentation
- [ ] Create automated visual regression testing

#### Performance Enhancements
- [ ] Implement virtual scrolling for large lists
- [ ] Add progressive web app (PWA) features
- [ ] Implement code splitting at component level
- [ ] Add preloading strategies for critical resources

#### Developer Experience
- [ ] Add Hot Module Replacement (HMR) for styles
- [ ] Implement automatic component generation scripts
- [ ] Add bundle size monitoring in CI/CD
- [ ] Create component usage analytics

---

## Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
npx vite --force

# Check TypeScript compilation
npx tsc --noEmit
```

#### Performance Issues
```typescript
// Debug re-renders
import { useWhyDidYouUpdate } from 'use-why-did-you-update';

const MyComponent = ({ prop1, prop2 }) => {
  useWhyDidYouUpdate('MyComponent', { prop1, prop2 });
  return <div>Component content</div>;
};
```

#### Styling Issues
```bash
# Purge and rebuild Tailwind
npx tailwindcss build -i ./src/input.css -o ./dist/output.css --purge

# Check for conflicting styles
npm run build
# Check browser dev tools for specificity issues
```

---

**References:**
- [Testing Guide](../public/docs/TESTING_GUIDE.md) for detailed testing strategies
- [Performance Guide](./PERFORMANCE_GUIDE.md) for optimization techniques
- [AI Integration](./AI_INTEGRATION.md) for AI feature implementation
- [Backend Guide](./BACKEND_GUIDE.md) for API integration patterns

**Next Steps for Implementation:**
1. Implement component library structure
2. Add React Query for server state management
3. Create automated testing for accessibility
4. Set up performance monitoring
5. Implement progressive web app features
