# Database Schema Documentation
## Table of Contents

- [Database Schema Documentation](#database-schema-documentation)
  - [Overview](#overview)
  - [Supabase Setup](#supabase-setup)
  - [Tables](#tables)
  - [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
  - [Relationships](#relationships)
  - [Data Migration](#data-migration)

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
| `credits`     | `integer`     | Not Null, Default `5`                              |
| `about`       | `text`        | Nullable                                           |
| `linkedin`    | `text`        | Nullable                                           |

### `public.tasks`

Stores the tasks for each user. Each task is linked to a user and supports hierarchical relationships. Task timing is summarized in `total_time_ms` and detailed sessions are stored in `public.time_entries`.

| Column            | Type          | Constraints                                        |
|-------------------|---------------|----------------------------------------------------|
| `id`              | `bigint`      | Primary Key, generated identity                    |
| `user_id`         | `uuid`        | Not Null, Foreign Key to `auth.users(id)`, On Delete Cascade |
| `title`           | `text`        | Not Null                                           |
| `description`     | `text`        | Nullable                                           |
| `status`          | `text`        | Not Null, Default `'Open'`, CHECK (status IN ('Open', 'In Progress', 'Done')) |
| `parent_id`       | `bigint`      | Nullable, Foreign Key to `public.tasks(id)`, On Delete SET NULL |
| `due_date`        | `date`        | Nullable                                           |
| `total_time_ms`   | `bigint`      | Not Null, Default `0` (persisted total when task is Done) |
| `created_at`      | `timestamptz` | Not Null, Default `now()`                          |
| `updated_at`      | `timestamptz` | Not Null, Default `now()`                          |

### `public.feature_requests`

Stores user feedback, bug reports, and feature requests.

| Column        | Type          | Constraints                                        |
|---------------|---------------|----------------------------------------------------|
| `id`          | `uuid`        | Primary Key, Default `gen_random_uuid()`           |
| `user_id`     | `uuid`        | Nullable, Foreign Key to `auth.users(id)`, On Delete Set Null |
| `description` | `text`        | Not Null                                           |
| `type`        | `text`        | Not Null, CHECK (type IN ('bug', 'help', 'feature')) |
| `priority`    | `text`        | Not Null, Default 'Medium', CHECK (priority IN ('Low', 'Medium', 'High')) |
| `created_at`  | `timestamptz` | Not Null, Default `now()`                          |

### Indexes

For optimal query performance:

```sql
-- Index for querying user's tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);

-- Index for parent-child relationships
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON public.tasks(parent_id);

-- Composite index for filtering by user and status
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
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

### `time_entries` Table Policies

Users can only see and manage their own time entries. Policies assume `time_entries.user_id` is set on insert/update by the backend.

```sql
-- Enable RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY "Users can view own time entries"
  ON public.time_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Insert policy
CREATE POLICY "Users can insert own time entries"
  ON public.time_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update policy (allow closing entries)
CREATE POLICY "Users can update own time entries"
  ON public.time_entries FOR UPDATE
  USING (auth.uid() = user_id);

### `feature_requests` Table Policies

Allows all users (authenticated or anonymous) to submit requests. Only service role/admins (not covered by RLS here) would typically read these.

```sql
-- Enable RLS
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

-- Insert policy (unauthenticated users can also submit)
CREATE POLICY "Anyone can insert feature requests" 
  ON public.feature_requests FOR INSERT 
  WITH CHECK (true);

-- Select policy (only owner can see their own, or restricted)
CREATE POLICY "Users can view own feature requests" 
  ON public.feature_requests FOR SELECT 
  USING (auth.uid() = user_id);
```
```

## Relationships

```
auth.users (1) ----< (N) public.profiles
    |                        (One-to-One)
    |
    +------< (N) public.tasks
    |               |  (One-to-Many)
    |               +-- self-reference (parent_id)
    |                   (Hierarchical structure for subtasks)
    |
    +------< (N) public.time_entries
                    (Detailed timing sessions per task)
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

### Creating core tables

```sql
-- tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Done')),
    parent_id bigint REFERENCES public.tasks(id) ON DELETE SET NULL,
    due_date date,
    total_time_ms bigint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON public.tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);

-- RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- time_entries
CREATE TABLE IF NOT EXISTS public.time_entries (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    task_id bigint NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON public.time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON public.time_entries(start_time);

-- RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- feature_requests
CREATE TABLE IF NOT EXISTS public.feature_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    description text NOT NULL,
    type text NOT NULL CHECK (type IN ('bug', 'help', 'feature')),
    priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for feature_requests
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert feature requests" ON public.feature_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own feature requests" ON public.feature_requests FOR SELECT USING (auth.uid() = user_id);
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
