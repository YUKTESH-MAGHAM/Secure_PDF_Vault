-- ==============================================================================
-- SECURE PDF VAULT - COMPLETE DATABASE SCHEMA INITIALIZATION
-- Run this entire script in your new Supabase Project's SQL Editor.
-- ==============================================================================

-- 1. Create Custom Auth Users Table (Admin & App Users)
CREATE TABLE IF NOT EXISTS vault_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  pending_message text DEFAULT NULL,
  storage_limit_mb integer DEFAULT 50,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create Base Files Table (with all appended columns)
CREATE TABLE IF NOT EXISTS files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_id text UNIQUE NOT NULL,
  secret_key text NOT NULL,
  file_url text NOT NULL,
  expires_at timestamp with time zone,
  user_id uuid REFERENCES vault_users(id),
  uploader_email text,
  file_size bigint DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Create Downloads Tracking Table
CREATE TABLE IF NOT EXISTS downloads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  accessed_at timestamp with time zone DEFAULT now()
);

-- 4. Create Admin Inbox Table
CREATE TABLE IF NOT EXISTS admin_inbox (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES vault_users(id) NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Create Guest Users Tracking Table (Optional but kept for backwards compatibility)
CREATE TABLE IF NOT EXISTS guest_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamp with time zone DEFAULT now()
);

-- ==============================================================================
-- FIX FOR REGISTRATION / UPLOAD (Row Level Security)
-- Since the Node backend uses the Supabase ANON_KEY and handles API validation 
-- manually, we must disable RLS on these tables so backend inserts succeed.
-- ==============================================================================

ALTER TABLE vault_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_inbox DISABLE ROW LEVEL SECURITY;
ALTER TABLE downloads DISABLE ROW LEVEL SECURITY;
ALTER TABLE guest_users DISABLE ROW LEVEL SECURITY;

-- If disabling RLS isn't enough, add an explicit generic policy to permit all operations 
DROP POLICY IF EXISTS "Allow all operations" ON vault_users;
CREATE POLICY "Allow all operations" ON vault_users FOR ALL USING (true) WITH CHECK (true);
