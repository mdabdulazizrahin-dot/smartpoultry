-- Add DELETE policies for both tables
CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own farm data"
ON public.farm_data FOR DELETE
TO authenticated
USING (auth.uid() = user_id);