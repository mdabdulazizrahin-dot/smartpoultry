-- Ensure RLS is enabled on both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_data ENABLE ROW LEVEL SECURITY;

-- Drop any policies that might allow public/anon access and recreate them as PERMISSIVE
-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own farm data" ON public.farm_data;
DROP POLICY IF EXISTS "Users can insert their own farm data" ON public.farm_data;
DROP POLICY IF EXISTS "Users can update their own farm data" ON public.farm_data;

-- Recreate policies as PERMISSIVE (default) - these will properly restrict access
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own farm data"
ON public.farm_data FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own farm data"
ON public.farm_data FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own farm data"
ON public.farm_data FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);