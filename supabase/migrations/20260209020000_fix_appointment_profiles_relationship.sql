-- Add foreign key relationship between appointment_requests and profiles
-- This allows Supabase to join the tables properly

ALTER TABLE appointment_requests 
ADD CONSTRAINT appointment_requests_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;
