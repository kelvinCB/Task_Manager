-- Migration: Create task_comments table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id bigint NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  author_name text NOT NULL,
  author_avatar text,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view comments on their own tasks"
  ON public.task_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE public.tasks.id = public.task_comments.task_id
      AND public.tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on their own tasks"
  ON public.task_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.tasks
      WHERE public.tasks.id = public.task_comments.task_id
      AND public.tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own comments"
  ON public.task_comments
  FOR DELETE
  USING (
    auth.uid() = user_id
  );
