# Deployment Guide
## Table of Contents

- [Deployment Guide](#deployment-guide)
  - [Overview](#overview)
  - [Fullstack Deployment (Vercel)](#fullstack-deployment-vercel)
- [Critical for both Frontend and Backend](#critical-for-both-frontend-and-backend)
- [AI Features](#ai-features)
- [Note: VITE_BACKEND_URL and VITE_API_BASE_URL are NO LONGER NEEDED.](#note-vite-backend-url-and-vite-api-base-url-are-no-longer-needed)
- [The app uses relative paths (/api/...) which Vercel routes inevitably.](#the-app-uses-relative-paths-api-which-vercel-routes-inevitably)
  - [Backend Architecture](#backend-architecture)
  - [Environment Management](#environment-management)
  - [SSL/TLS Configuration](#ssl-tls-configuration)
  - [Monitoring and Logging](#monitoring-and-logging)
  - [Backup Strategy](#backup-strategy)
  - [Security Checklist](#security-checklist)
  - [Rollback Procedures](#rollback-procedures)
  - [Performance Optimization](#performance-optimization)
  - [Troubleshooting](#troubleshooting)
- [Check deployment logs](#check-deployment-logs)
- [Test API endpoints](#test-api-endpoints)
- [Check database connectivity](#check-database-connectivity)
- [Use Supabase dashboard SQL editor](#use-supabase-dashboard-sql-editor)

## Overview

This guide covers deploying the Task Manager application to production environments.

## Fullstack Deployment (Vercel)

The application is deployed as a unified fullstack application on Vercel. Code from `src/` is served as the frontend, and code from `backend/` is served as Serverless Functions under `/api`.

### 1. Connect Repository
- Login to Vercel dashboard
- Import your GitHub repository
- Select the Task Manager project
- **Root Directory**: Leave as `./`
- **Framework Preset**: Vite

### 2. Environment Variables
Set the following **REQUIRED** environment variables in Vercel. You can use the same `VITE_` prefixed variables for both frontend and backend logic.

```bash
# Critical for both Frontend and Backend
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_KEY=your-supabase-anon-key

# AI Features
VITE_OPENAI_API_KEY=your-openai-api-key
VITE_OPENAI_MODEL=gpt-5-nano-2025-08-07
VITE_OPENAI_BASE_URL=https://api.openai.com/v1

# Note: VITE_BACKEND_URL and VITE_API_BASE_URL are NO LONGER NEEDED.
# The app uses relative paths (/api/...) which Vercel routes inevitably.
```

### 3. Build Settings (Standard)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Deploy
- Vercel will automatically deploy both frontend and serverless functions on every push to main.


## Backend Architecture
The backend is no longer a separate service. It resides in `backend/` but is deployed transactionally with the frontend.
- `api/index.js`: The entry point for Vercel Serverless Functions.
- `vercel.json`: Handles routing rewrites to direct `/api/*` traffic to the backend.

No separate backend deployment (Heroku/Railway/Render) is required.


### Initial Setup

1. **Create Supabase Project:**
   - Go to supabase.com
   - Create new project
   - Note down URL and anon key

2. **Database Schema:**
   Run the following SQL in Supabase SQL Editor:
   
   ```sql
   -- Create users table (if not using Supabase Auth)
   CREATE TABLE users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     name VARCHAR(255) NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Create tasks table
   CREATE TABLE tasks (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     description TEXT,
     status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Done')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     due_date TIMESTAMP WITH TIME ZONE,
     parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     total_time_spent INTEGER DEFAULT 0,
     is_timer_active BOOLEAN DEFAULT FALSE,
     last_started BIGINT
   );
   
   -- Create time_entries table
   CREATE TABLE time_entries (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
     start_time BIGINT NOT NULL,
     end_time BIGINT,
     duration INTEGER,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Create indexes for performance
   CREATE INDEX idx_tasks_user_id ON tasks(user_id);
   CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
   CREATE INDEX idx_tasks_status ON tasks(status);
   CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
   ```

3. **Row Level Security (RLS):**
   ```sql
   -- Enable RLS
   ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
   ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
   
   -- Create policies
   CREATE POLICY "Users can view own tasks" ON tasks
     FOR SELECT USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can insert own tasks" ON tasks
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   
   CREATE POLICY "Users can update own tasks" ON tasks
     FOR UPDATE USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can delete own tasks" ON tasks
     FOR DELETE USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can view own time entries" ON time_entries
     FOR SELECT USING (auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id));
   
   CREATE POLICY "Users can insert own time entries" ON time_entries
     FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM tasks WHERE id = task_id));
   ```

## Environment Management

### Development Environment
- Use `localhost` for all services
- Load environment from `.env.local`

### Staging Environment
- Deploy to separate Vercel/Netlify project
- Use staging Supabase project
- Environment variables prefixed with `STAGING_`

### Production Environment
- Production domains
- Production Supabase project
- Enhanced security settings

## SSL/TLS Configuration

### Frontend
- Vercel/Netlify automatically provide SSL certificates
- Ensure all API calls use HTTPS

### Backend
- If using custom domain, configure SSL certificate
- For Heroku, SSL is provided automatically
- Redirect HTTP to HTTPS

## Monitoring and Logging

### Frontend
- Use Vercel Analytics or similar
- Set up error tracking (Sentry recommended)

### Backend
- Use structured logging
- Set up health check endpoints
- Monitor API response times

### Database
- Use Supabase built-in monitoring
- Set up alerts for high CPU/memory usage

## Backup Strategy

### Database
- Supabase provides automatic backups
- Consider additional backup to external storage for critical data

### Code
- Git repository serves as code backup
- Tag releases for easy rollback

## Security Checklist

- [ ] All environment variables are set securely
- [ ] API endpoints are protected with authentication
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] RLS policies are in place for database
- [ ] Sensitive data is encrypted
- [ ] Regular security updates are applied

## Rollback Procedures

### Frontend
1. Revert to previous deployment in Vercel/Netlify dashboard
2. Or deploy specific git commit/tag

### Backend
1. For Heroku: `heroku rollback`
2. For Railway: Deploy previous git commit

### Database
1. Use Supabase restore functionality
2. Or run rollback migrations if needed

## Performance Optimization

### Frontend
- Enable compression in deployment platform
- Use CDN for static assets
- Implement code splitting
- Optimize images and assets

### Backend
- Enable gzip compression
- Use database connection pooling
- Implement caching where appropriate
- Monitor and optimize slow queries

## Troubleshooting

### Common Issues

1. **🚨 BLANK PAGE ISSUE (Most Common):**
   **Symptoms:** App loads but shows blank white page
   **Cause:** Missing Supabase environment variables
   **Solution:** 
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `SUPABASE_URL` and `SUPABASE_KEY`
   - Redeploy the application
   - **Verify:** Check browser console for "Supabase client not initialized" errors

2. **Build Failures:**
   - Check environment variables are set
   - Verify all dependencies are in package.json
   - Check build logs for specific errors

3. **Authentication Issues:**
   - Verify Supabase credentials are correct
   - Check RLS policies in Supabase dashboard
   - Test authentication in local environment first

4. **App Loads but No Functionality:**
   - Verify all required environment variables are set
   - Check browser console for JavaScript errors
   - Ensure Supabase database schema is properly set up

### Debug Commands

```bash
# Check deployment logs
vercel logs your-project-name

# Test API endpoints
curl -X GET https://your-api-url.com/health

# Check database connectivity
# Use Supabase dashboard SQL editor
```
