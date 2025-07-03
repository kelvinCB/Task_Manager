# Database Schema Documentation

## Overview

This guide documents the database schema for Task Manager, including table structures and relationships.

## Supabase Setup

- Follow instructions in [Setup Guide](./Setup_Guide.md) for initial Supabase setup.

## Table Structures

### Users
- **id**: UUID, primary key
- **email**: STRING, unique, not null
- **name**: STRING
- **created_at**: TIMESTAMP

### Tasks
- **id**: UUID, primary key
- **title**: STRING, not null
- **description**: TEXT
- **status**: ENUM ('Open', 'In Progress', 'Done')

### Time Entries
- **id**: UUID, primary key
- **task_id**: UUID, foreign key
- **start_time**: BIGINT

## Relationships

- One-to-many between `Users` and `Tasks`
- One-to-many between `Tasks` and `Time Entries`

## Indexes

- **tasks_user_id**: Index on `Tasks.user_id`
- **time_entries_task_id**: Index on `Time Entries.task_id`

## Placeholder Sections

- [ ] Advanced Indexes
- [ ] Optimizations

---

Complete this document with any changes in schema as the project develops, keeping consistency with the [Backend Guide](./BACKEND_GUIDE.md).
