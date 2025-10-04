# Database Schema Documentation

## Overview

This document outlines the database schema for the Task Manager application, built on Supabase (PostgreSQL).

## Supabase Setup

- Follow instructions in [Setup Guide](./Setup_Guide.md) for initial Supabase setup.

## Tables

### `auth.users` (Provided by Supabase)

This table is automatically created and managed by Supabase Authentication. We do not create it ourselves, but we link to it from our other tables.

- **id**: `uuid`, Primary Key - The unique identifier for each user.
- **email**: `text`
- ... and other metadata columns managed by Supabase.

### `public.profiles`

Extends user information beyond what Supabase Auth provides. Each profile is linked to a user.

| Column        | Type        | Constraints                                        |
|---------------|-------------|----------------------------------------------------|
| `id`          | `uuid`      | Primary Key, Foreign Key to `auth.users(id)`, On Delete Cascade |
| `username`    | `text`      | Not Null, Unique, Check length >= 3 AND <= 50    |
| `display_name`| `text`      | Nullable                                           |
| `avatar_url`  | `text`      | Nullable                                           |
| `created_at`  | `timestamptz` | Not Null, Default `now()`                          |
| `updated_at`  | `timestamptz` | Not Null, Default `now()`                          |

### `public.tasks`

Stores the tasks for each user. Each task is linked to a user and supports hierarchical relationships.

| Column            | Type        | Constraints                                        |
|-------------------|-------------|----------------------------------------------------|
| `id`              | `uuid`      | Primary Key, Default `gen_random_uuid()`           |
| `user_id`         | `uuid`      | Not Null, Foreign Key to `auth.users(id)`, On Delete Cascade |
| `title`           | `text`      | Not Null                                           |
| `description`     | `text`      | Not Null, Default `''`                             |
| `status`          | `text`      | Not Null, Default `'Open'`, Check (status IN ('Open', 'In Progress', 'Done')) |
| `parent_task_id`  | `uuid`      | Nullable, Foreign Key to `public.tasks(id)`, On Delete Set Null |
| `due_date`        | `timestamptz` | Nullable                                           |
| `time_tracking`   | `jsonb`     | Nullable, Stores time tracking data                |
| `created_at`      | `timestamptz` | Not Null, Default `now()`                          |
| `updated_at`      | `timestamptz` | Not Null, Default `now()`                          |

#### time_tracking JSONB Structure

```json
{
  "totalTimeSpent": 0,
  "isActive": false,
  "lastStarted": 1704124800000,
  "timeEntries": [
    {
      "startTime": 1704124800000,
      "endTime": 1704128400000,
      "duration": 3600000
    }
  ]
}
```

**Fields:**
- `totalTimeSpent`: Total time in milliseconds
- `isActive`: Whether timer is currently running
- `lastStarted`: Timestamp when timer was last started (optional)
- `timeEntries`: Array of time tracking sessions

### Indexes

For optimal query performance:

```sql
-- Index for querying user's tasks
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);

-- Index for parent-child relationships
CREATE INDEX idx_tasks_parent_task_id ON public.tasks(parent_task_id);

-- Composite index for filtering by user and status
CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);
```

## Row Level Security (RLS) Policies

RLS is enabled for all tables in the `public` schema to ensure users can only access their own data.

### `profiles` Table Policies

Users can perform `SELECT`, `INSERT`, `UPDATE` only on rows where `profiles.id` matches their own session `auth.uid()`.

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

-- Insert policy
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Update policy
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);
```

### `tasks` Table Policies

Users can perform `SELECT`, `INSERT`, `UPDATE`, `DELETE` only on rows where `tasks.user_id` matches their own session `auth.uid()`.

```sql
-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY "Users can view own tasks" 
  ON public.tasks FOR SELECT 
  USING (auth.uid() = user_id);

-- Insert policy
CREATE POLICY "Users can insert own tasks" 
  ON public.tasks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Update policy
CREATE POLICY "Users can update own tasks" 
  ON public.tasks FOR UPDATE 
  USING (auth.uid() = user_id);

-- Delete policy
CREATE POLICY "Users can delete own tasks" 
  ON public.tasks FOR DELETE 
  USING (auth.uid() = user_id);
```

**Note:** Backend API implements additional user isolation at the application level through JWT validation.

## Relationships

```
auth.users (1) ----< (N) public.profiles
    |                        (One-to-One)
    |
    +------< (N) public.tasks
                    |  (One-to-Many)
                    |
                    +-- self-reference (parent_task_id)
                        (Hierarchical structure for subtasks)
```

### Detailed Relationships

1. **Users to Profiles**: One-to-one
   - Each user has exactly one profile
   - `profiles.id` → `auth.users.id`
   - Cascade delete when user is deleted

2. **Users to Tasks**: One-to-many
   - A user can have many tasks
   - `tasks.user_id` → `auth.users.id`
   - Cascade delete when user is deleted
   - All tasks are automatically isolated by `user_id`

3. **Tasks to Tasks (Hierarchical)**: Self-referencing
   - A task can have many subtasks
   - `tasks.parent_task_id` → `tasks.id`
   - Set null when parent task is deleted
   - Allows unlimited nesting depth
   - Frontend computes `childIds` and `depth` properties

## Data Migration

### Creating the tasks table

```sql
CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Done')),
    parent_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
    due_date timestamptz,
    time_tracking jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_parent_task_id ON public.tasks(parent_task_id);
CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (see Row Level Security section above)
```

### Automatic updated_at trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON public.tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

---

Complete this document with any changes in schema as the project develops, keeping consistency with the [Backend Guide](./BACKEND_GUIDE.md).
