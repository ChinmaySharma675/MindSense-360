-- Create appointment requests table
CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  consecutive_days INTEGER NOT NULL DEFAULT 0,
  doctor_notes TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own appointment requests
CREATE POLICY "Users can view own appointments"
  ON public.appointment_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own appointment requests
CREATE POLICY "Users can create appointments"
  ON public.appointment_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own appointment requests (e.g., cancel)
CREATE POLICY "Users can update own appointments"
  ON public.appointment_requests
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_appointment_requests_user_id ON public.appointment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_status ON public.appointment_requests(status);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_created_at ON public.appointment_requests(created_at DESC);
