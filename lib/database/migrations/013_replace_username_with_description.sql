-- Migration: Replace username with description
-- This migration removes the username field and adds a description field

-- 1. Drop username-related indexes and constraints
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_username_lower;

-- 2. Drop the username column
ALTER TABLE users DROP COLUMN IF EXISTS username;

-- 3. Add description column
ALTER TABLE users ADD COLUMN description TEXT;

-- 4. Create index for description searches (if needed in future)
CREATE INDEX idx_users_description ON users USING GIN (to_tsvector('english', description));

-- 5. Update any existing RLS policies that referenced username
-- (The existing policies should still work as they don't depend on username)

-- 6. Grant permissions (already granted in previous migrations)
-- No additional permissions needed
