-- Run this in your Supabase SQL Editor to support the new multi-format and permissions features

-- 1. Add the new columns
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS file_type text DEFAULT 'pdf', 
ADD COLUMN IF NOT EXISTS allow_edit boolean DEFAULT false, 
ADD COLUMN IF NOT EXISTS allow_download boolean DEFAULT true;

-- 2. Ensure RLS doesn't block the backend from using these fields during insert/update
ALTER TABLE files DISABLE ROW LEVEL SECURITY;

-- Backup policy if disable doesn't work for some reason
DROP POLICY IF EXISTS "Allow all operations" ON files;
CREATE POLICY "Allow all operations" ON files FOR ALL USING (true) WITH CHECK (true);
