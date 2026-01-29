-- =====================================================
-- Migration: Create unified videos table
-- Description: Consolidates products, saved_videos, and video_generations
--              into a single videos table with Row Level Security
-- =====================================================

-- Drop old tables if they exist (optional - uncomment if you want to clean up)
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS saved_videos CASCADE;
-- DROP TABLE IF EXISTS video_generations CASCADE;

-- Create the unified videos table
CREATE TABLE IF NOT EXISTS videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Product info (formerly in products table)
    product_image_url TEXT,
    product_name TEXT,
    
    -- Video generation tracking (formerly in video_generations table)
    status TEXT DEFAULT 'pending',
    total_scenes INTEGER DEFAULT 1,
    current_scene INTEGER DEFAULT 0,
    videourls_scenes TEXT[],
    frame_extraction_request_id TEXT,
    combine_video_request_id TEXT,
    
    -- Final video info (formerly in saved_videos / video_generations)
    final_video_url TEXT,
    thumbnail_url TEXT,
    title TEXT,
    duration INTEGER DEFAULT 0,
    
    -- Generation metadata
    avatar_url TEXT,
    script TEXT,
    aspect_ratio TEXT DEFAULT '9:16',
    language TEXT DEFAULT 'bg',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own videos
CREATE POLICY "Users can view their own videos"
    ON videos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos"
    ON videos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
    ON videos FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
    ON videos FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS videos_user_id_idx ON videos(user_id);
CREATE INDEX IF NOT EXISTS videos_status_idx ON videos(status);
CREATE INDEX IF NOT EXISTS videos_created_at_idx ON videos(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for authenticated users
GRANT ALL ON videos TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
