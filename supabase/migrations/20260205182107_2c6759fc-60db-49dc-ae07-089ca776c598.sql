-- Create enum for risk levels
CREATE TYPE public.risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- Users/profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Behavioral data table
CREATE TABLE public.behavior_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sleep_duration NUMERIC(4,2) NOT NULL, -- hours
  screen_time NUMERIC(5,2) NOT NULL, -- hours
  physical_activity INTEGER NOT NULL, -- steps
  behavior_score NUMERIC(3,2), -- 0-1 normalized
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Voice scores table
CREATE TABLE public.voice_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  voice_score NUMERIC(3,2) NOT NULL, -- 0-1 normalized
  emotion_label TEXT, -- e.g., 'stressed', 'neutral'
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Wearable data table
CREATE TABLE public.wearable_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  heart_rate INTEGER,
  steps INTEGER,
  wearable_score NUMERIC(3,2), -- 0-1 normalized
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Risk results table
CREATE TABLE public.risk_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  risk_level risk_level NOT NULL,
  behavior_score NUMERIC(3,2),
  voice_score NUMERIC(3,2),
  wearable_score NUMERIC(3,2),
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wearable_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_results ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Behavior data policies
CREATE POLICY "Users can view their own behavior data" ON public.behavior_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own behavior data" ON public.behavior_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Voice scores policies
CREATE POLICY "Users can view their own voice scores" ON public.voice_scores
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own voice scores" ON public.voice_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Wearable data policies
CREATE POLICY "Users can view their own wearable data" ON public.wearable_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wearable data" ON public.wearable_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Risk results policies
CREATE POLICY "Users can view their own risk results" ON public.risk_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own risk results" ON public.risk_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();