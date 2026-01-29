-- Migration to add needed columns for multi-scene
ALTER TABLE videos ADD COLUMN IF NOT EXISTS videourls_scenes TEXT[];
ALTER TABLE videos ADD COLUMN IF NOT EXISTS requestid_combinevideo TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS frame_extraction_request_id TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS synced_scene_urls TEXT[];
ALTER TABLE videos ADD COLUMN IF NOT EXISTS sync_task_ids TEXT[];
ALTER TABLE videos ADD COLUMN IF NOT EXISTS current_lip_sync_scene INTEGER DEFAULT 1;
