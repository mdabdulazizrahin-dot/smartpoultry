-- Add flock_info column to farm_data table
ALTER TABLE public.farm_data 
ADD COLUMN IF NOT EXISTS flock_info JSONB DEFAULT '{"arrivalDate": "", "initialCount": 0, "mortalityRecords": []}'::jsonb;