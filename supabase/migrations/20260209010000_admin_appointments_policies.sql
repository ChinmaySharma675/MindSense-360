-- Grant admins permission to view appointment requests with user profiles
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ozlmduqomteomyirbwgc/sql/new

-- First, make yourself an admin (replace with your user ID from auth.users)
-- Get your ID with: SELECT id, email FROM auth.users;

INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Add policy to allow admins to read ALL appointment requests
CREATE POLICY "Admins can read all appointment requests" 
ON appointment_requests 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Add policy to allow admins to update appointment requests (accept/reject)
CREATE POLICY "Admins can update appointment requests" 
ON appointment_requests 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to view user profiles (for email)
CREATE POLICY "Admins can read all profiles" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);
