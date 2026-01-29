-- Add columns for persistence of task state
ALTER TABLE videos ADD COLUMN IF NOT EXISTS current_task_id TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS scene_scripts TEXT[];
