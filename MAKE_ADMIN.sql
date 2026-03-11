-- Run this SQL in Supabase SQL Editor to make yourself an admin
-- Go to: https://supabase.com/dashboard/project/ozlmduqomteomyirbwgc/sql/new

-- Replace YOUR_USER_ID with your actual user ID
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- To find your user ID, run this first:
-- SELECT id, email FROM auth.users;
-- Copy your user ID and replace YOUR_USER_ID_HERE above
