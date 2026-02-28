# API Documentation
## Table of Contents

- [API Documentation](#api-documentation)
  - [Overview](#overview)
  - [Base URL](#base-url)
  - [Authentication](#authentication)
  - [Endpoints](#endpoints)
  - [Error Responses](#error-responses)
  - [Rate Limiting](#rate-limiting)
  - [Data Models](#data-models)

## Overview

This document describes the REST API endpoints for the Task Manager application.

.

## Base URL

- Development: `http://localhost:3001/api`
- Production: `https://taskmanager-backend-deployment.onrender.com/api`

## Authentication

All protected endpoints require a valid Supabase JWT token in the Authorization header:
```
Authorization: Bearer <supabase-jwt-token>
```

The JWT token is obtained through Supabase authentication and contains the user's ID in the `sub` claim.

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (201):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com"
  }
}
```

**Error Responses:**
- `400`: Missing email or password, invalid email format, password too short (< 6 characters)
- `500`: Internal server error

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "session": {
    "access_token": "jwt-token-here",
    "refresh_token": "refresh-token-here",
    "expires_in": 3600
  },
  "user": {
    "id": "uuid-here",
    "email": "user@example.com"
  }
}
```

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `500`: Internal server error

### Tasks

All task endpoints require authentication. Tasks are automatically isolated by user - each user can only access their own tasks.

#### GET /tasks
Get all tasks for the authenticated user.

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by task status (`Open`, `In Progress`, `Done`)

**Success Response (200):**
```json
{
  "tasks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "user-uuid-here",
      "title": "Task Title",
      "description": "Task Description",
      "status": "Open",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "due_date": "2024-01-15T00:00:00.000Z",
      "parent_task_id": null,
      "time_tracking": {
        "totalTimeSpent": 0,
        "isActive": false,
        "timeEntries": []
      }
    }
  ]
}
```

**Error Responses:**
- `400`: Invalid status filter
- `401`: Not authenticated
- `500`: Internal server error

#### GET /tasks/:id
Get a specific task by ID.

**Authentication:** Required

**URL Parameters:**
- `id`: Task UUID

**Success Response (200):**
```json
{
  "task": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid-here",
    "title": "Task Title",
    "description": "Task Description",
    "status": "In Progress",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-02T00:00:00.000Z",
    "due_date": null,
    "parent_task_id": null,
    "time_tracking": {
      "totalTimeSpent": 3600000,
      "isActive": true,
      "lastStarted": 1704124800000,
      "timeEntries": [
        {
          "startTime": 1704124800000,
          "endTime": 1704128400000,
          "duration": 3600000
        }
      ]
    }
  }
}
```

**Error Responses:**
- `400`: Invalid task ID format
- `401`: Not authenticated
- `404`: Task not found or doesn't belong to user
- `500`: Internal server error

#### POST /tasks
Create a new task.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Task Title",
  "description": "Task Description",
  "status": "Open",
  "due_date": "2024-01-15T00:00:00.000Z",
  "parent_task_id": null,
  "time_tracking": {
    "totalTimeSpent": 0,
    "isActive": false,
    "timeEntries": []
  }
}
```

**Success Response (201):**
```json
{
  "task": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid-here",
    "title": "Task Title",
    "description": "Task Description",
    "status": "Open",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "due_date": "2024-01-15T00:00:00.000Z",
    "parent_task_id": null,
    "time_tracking": {
      "totalTimeSpent": 0,
      "isActive": false,
      "timeEntries": []
    }
  }
}
```

**Error Responses:**
- `400`: Missing title, invalid status, invalid estimation (must be one of `1,2,3,5,8,13`), parent task not found
- `401`: Not authenticated
- `500`: Internal server error

#### PUT /tasks/:id
Update an existing task.

**Authentication:** Required

**URL Parameters:**
- `id`: Task UUID

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated Description",
  "status": "In Progress",
  "due_date": "2024-02-01T00:00:00.000Z",
  "parent_task_id": "parent-uuid-here",
  "time_tracking": {
    "totalTimeSpent": 7200000,
    "isActive": false,
    "timeEntries": [
      {
        "startTime": 1704124800000,
        "endTime": 1704132000000,
        "duration": 7200000
      }
    ]
  }
}
```

**Success Response (200):**
```json
{
  "task": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid-here",
    "title": "Updated Title",
    "description": "Updated Description",
    "status": "In Progress",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-02T12:00:00.000Z",
    "due_date": "2024-02-01T00:00:00.000Z",
    "parent_task_id": "parent-uuid-here",
    "time_tracking": {
      "totalTimeSpent": 7200000,
      "isActive": false,
      "timeEntries": [
        {
          "startTime": 1704124800000,
          "endTime": 1704132000000,
          "duration": 7200000
        }
      ]
    }
  }
}
```

**Error Responses:**
- `400`: No fields to update, invalid status, invalid estimation (must be one of `1,2,3,5,8,13`), task cannot be its own parent, invalid task ID
- `401`: Not authenticated
- `404`: Task not found or doesn't belong to user
- `500`: Internal server error

#### DELETE /tasks/:id
Delete a task. Only the task owner can delete it.

**Authentication:** Required

**URL Parameters:**
- `id`: Task UUID

**Success Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

**Error Responses:**
- `400`: Invalid task ID format
- `401`: Not authenticated
- `404`: Task not found or doesn't belong to user
- `500`: Internal server error

**Note:** Frontend handles cascade deletion of subtasks. Backend only deletes the specified task.

### Security & User Isolation

**Important:** All task operations are automatically scoped to the authenticated user:
- Users can only see, create, update, and delete their own tasks
- The JWT token's `sub` claim is used to identify the user
- Attempting to access another user's tasks returns a 404 error
- No cross-user data leakage is possible

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
