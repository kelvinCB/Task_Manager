# API Documentation

## Overview

This document describes the REST API endpoints for the Task Manager application.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-api-domain.com/api`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

#### POST /auth/google
Login with Google OAuth.

#### POST /auth/github
Login with GitHub OAuth.

### Tasks

#### GET /tasks
Get all tasks for the authenticated user.

**Query Parameters:**
- `status`: Filter by task status (Open, In Progress, Done)
- `search`: Search in title and description
- `page`: Page number for pagination
- `limit`: Number of items per page

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-id",
      "title": "Task Title",
      "description": "Task Description",
      "status": "Open",
      "createdAt": "2024-01-01T00:00:00Z",
      "dueDate": "2024-01-15T00:00:00Z",
      "parentId": null,
      "childIds": [],
      "timeTracking": {
        "totalTimeSpent": 0,
        "isActive": false,
        "timeEntries": []
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### POST /tasks
Create a new task.

**Request Body:**
```json
{
  "title": "Task Title",
  "description": "Task Description",
  "status": "Open",
  "dueDate": "2024-01-15T00:00:00Z",
  "parentId": null
}
```

#### PUT /tasks/:id
Update an existing task.

#### DELETE /tasks/:id
Delete a task and all its subtasks.

#### POST /tasks/:id/start-timer
Start the timer for a task.

#### POST /tasks/:id/pause-timer
Pause the timer for a task.

### Time Tracking

#### GET /time-stats
Get time statistics for the authenticated user.

**Query Parameters:**
- `period`: Time period (day, week, month, year, custom)
- `startDate`: Start date for custom period
- `endDate`: End date for custom period

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request data",
  "details": "Specific error details"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API requests are limited to:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Data Models

### Task
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Done';
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  parentId?: string;
  childIds: string[];
  userId: string;
  timeTracking: {
    totalTimeSpent: number;
    isActive: boolean;
    lastStarted?: number;
    timeEntries: TimeEntry[];
  };
}
```

### TimeEntry
```typescript
interface TimeEntry {
  startTime: number;
  endTime?: number;
  duration?: number;
}
```

### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```
