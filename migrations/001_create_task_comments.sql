-- Migration: Create task_comments table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id bigint NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  author_name text NOT NULL,
  author_avatar text,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at timestamp with time zone DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.task_comments
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id
  ON public.task_comments(task_id);

CREATE INDEX IF NOT EXISTS idx_task_comments_user_id
  ON public.task_comments(user_id);

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

CREATE OR REPLACE FUNCTION public.set_task_comments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_comments_updated_at ON public.task_comments;
CREATE TRIGGER trg_task_comments_updated_at
BEFORE UPDATE ON public.task_comments
FOR EACH ROW
EXECUTE FUNCTION public.set_task_comments_updated_at();
