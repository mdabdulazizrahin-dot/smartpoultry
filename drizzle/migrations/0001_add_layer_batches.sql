ALTER TABLE public.farm_data
  ADD COLUMN IF NOT EXISTS layer_batches jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS active_layer_batch_id text;