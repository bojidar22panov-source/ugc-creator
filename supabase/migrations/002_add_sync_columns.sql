-- Add columns for Sync.so lip sync tracking
-- Run this migration in Supabase SQL Editor

-- Add sync_task_ids array to store lip sync task IDs for each scene
ALTER TABLE videos ADD COLUMN IF NOT EXISTS sync_task_ids TEXT[];

-- Add synced_scene_urls array to store lip-synced video URLs for each scene
ALTER TABLE videos ADD COLUMN IF NOT EXISTS synced_scene_urls TEXT[];

-- Add avatar_id to track which avatar was used (for voice selection)
ALTER TABLE videos ADD COLUMN IF NOT EXISTS avatar_id TEXT;

-- Add current_lip_sync_scene to track which scene is being lip synced
ALTER TABLE videos ADD COLUMN IF NOT EXISTS current_lip_sync_scene INTEGER DEFAULT 0;
