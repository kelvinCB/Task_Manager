-- Ensure time_entries table and policies exist
BEGIN;

CREATE TABLE IF NOT EXISTS public.time_entries (
  id bigserial PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  start_time timestamptz NOT NULL,
  end_time timestamptz NULL,
  task_id bigint NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL
);

-- Useful index
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON public.time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON public.time_entries(start_time);

-- Basic check
ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS time_entries_time_check;
ALTER TABLE public.time_entries ADD CONSTRAINT time_entries_time_check CHECK (end_time IS NULL OR end_time >= start_time);

-- Enable RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='time_entries' AND policyname='Users can view own time entries'
  ) THEN
    CREATE POLICY "Users can view own time entries" ON public.time_entries
      FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='time_entries' AND policyname='Users can insert own time entries'
  ) THEN
    CREATE POLICY "Users can insert own time entries" ON public.time_entries
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='time_entries' AND policyname='Users can update own time entries'
  ) THEN
    CREATE POLICY "Users can update own time entries" ON public.time_entries
      FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

COMMIT;

