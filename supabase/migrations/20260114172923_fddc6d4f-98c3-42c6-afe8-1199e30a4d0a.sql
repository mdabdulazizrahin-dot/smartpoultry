-- Create profiles table for user authentication with mobile number
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mobile_number TEXT NOT NULL,
  farm_name TEXT DEFAULT 'Bye Bye Poultry Farm',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create farm_data table to store all farm data for backup
CREATE TABLE public.farm_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_expenses JSONB DEFAULT '[]'::jsonb,
  egg_sales JSONB DEFAULT '[]'::jsonb,
  medicine_schedules JSONB DEFAULT '[]'::jsonb,
  dealers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on farm_data
ALTER TABLE public.farm_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for farm_data
CREATE POLICY "Users can view their own farm data" 
  ON public.farm_data FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own farm data" 
  ON public.farm_data FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own farm data" 
  ON public.farm_data FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farm_data_updated_at
  BEFORE UPDATE ON public.farm_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();