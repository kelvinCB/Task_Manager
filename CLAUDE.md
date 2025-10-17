# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm run dev` - Start development server (localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Testing
- `npm run test` - Run unit tests with Vitest
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:headed` - Run e2e tests in headed mode
- `npm run test:e2e:debug` - Debug e2e tests

### Code Quality
- `npm run lint` - Run ESLint
- `npm run validate:commit` - Validate commit messages
- `npm run validate:branch` - Validate branch names

## Architecture Overview

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Router** for navigation
- **Vitest** for unit testing
- **Playwright** for e2e testing

### Backend Integration
- **Supabase** client for database operations
- **Express.js** backend API (in `/backend` folder)
- API proxy configured for `/api` routes to `localhost:3001`

### Key Components Architecture

**Core Data Management:**
- `useTasks` hook: Central state management for all task operations
- `Task` type: Hierarchical structure with time tracking capabilities
- `TaskNode` type: Tree representation with parent-child relationships
- LocalStorage persistence with automatic data migration

**Component Structure:**
- `App.tsx`: Main application with routing (login/register/main app)
- `TaskBoard`: Kanban-style task management
- `TaskTree`: Hierarchical tree view
- `TaskForm`: Task creation/editing modal
- `TimeStatsView`: Time tracking analytics
- `TaskTimer`: Individual task time tracking

**State Management:**
- Tasks stored in localStorage with automatic serialization
- Hierarchical task relationships maintained via `parentId`/`childIds`
- Filter system for search and status filtering
- Theme context for dark/light mode

### Authentication Flow
- React Router handles `/login` and `/register` routes
- Supabase integration for user authentication
- AuthContext provides authentication state

### Time Tracking System
- Each task has embedded time tracking with `timeEntries` array
- Real-time timer functionality with start/pause/stop
- Time statistics aggregation across different periods
- CSV export/import preserves all time tracking data

### Data Persistence
- Primary storage: localStorage for client-side persistence
- Export/Import: CSV format with full task hierarchy and time data
- Supabase integration: Database persistence for authenticated users

### Testing Strategy
- Unit tests: Components, hooks, and utilities
- E2E tests: Full user workflows with Playwright
- Test data: Separate test utilities to avoid localStorage conflicts
- Coverage reporting with v8 provider

## Development Notes

### Task Hierarchy Rules
- Tasks can have unlimited depth via `parentId` relationships
- Completed parent tasks cannot have new subtasks added
- Task completion is blocked if incomplete subtasks exist
- Tree expansion state persisted in localStorage

### AI Integration
- OpenAI service for task description generation
- Configurable via environment variables (`OPENAI_API_KEY`)
- Supports multiple OpenAI models including O4 series

### Mobile Responsiveness
- Three-level mobile header design
- Responsive task layouts with Tailwind breakpoints
- Touch-friendly interactions for mobile devices

### Performance Considerations
- Lucide React icons excluded from optimization
- Lazy loading and code splitting where appropriate
- Efficient tree rendering with expansion state management