-- Add recovery_pin column to public.profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS recovery_pin TEXT;

-- Create extension pgcrypto if not already exists (for password hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Secure RPC function: Reset password using 4-digit PIN
CREATE OR REPLACE FUNCTION public.reset_password_with_pin(
  p_mobile TEXT,
  p_pin TEXT,
  p_new_password TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_stored_pin TEXT;
  v_clean_mobile TEXT;
BEGIN
  v_clean_mobile := regexp_replace(p_mobile, '[^0-9]', '', 'g');

  IF length(v_clean_mobile) < 11 THEN
    RETURN jsonb_build_object('success', false, 'message', 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন');
  END IF;

  IF length(p_new_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'message', 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
  END IF;

  -- Match user from profiles by mobile number
  SELECT user_id, recovery_pin INTO v_user_id, v_stored_pin
  FROM public.profiles
  WHERE regexp_replace(mobile_number, '[^0-9]', '', 'g') = v_clean_mobile
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'এই মোবাইল নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি');
  END IF;

  IF v_stored_pin IS NULL OR trim(v_stored_pin) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'এই অ্যাকাউন্টে কোনো রিকভারি পিন সেট করা নেই। এআই সহকারীর সাহায্য নিন।');
  END IF;

  IF trim(v_stored_pin) != trim(p_pin) THEN
    RETURN jsonb_build_object('success', false, 'message', '৪ ডিজিটের গোপন রিকভারি পিন সঠিক নয়');
  END IF;

  -- Update encrypted password in auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Secure RPC function: Verify farmer identity via Farm Name and reset password
CREATE OR REPLACE FUNCTION public.verify_and_reset_via_ai(
  p_mobile TEXT,
  p_farm_name TEXT,
  p_new_password TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_farm_name TEXT;
  v_clean_mobile TEXT;
  v_clean_input_farm TEXT;
  v_clean_stored_farm TEXT;
BEGIN
  v_clean_mobile := regexp_replace(p_mobile, '[^0-9]', '', 'g');

  IF length(v_clean_mobile) < 11 THEN
    RETURN jsonb_build_object('success', false, 'message', 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন');
  END IF;

  IF length(p_new_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'message', 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
  END IF;

  SELECT user_id, farm_name INTO v_user_id, v_farm_name
  FROM public.profiles
  WHERE regexp_replace(mobile_number, '[^0-9]', '', 'g') = v_clean_mobile
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'এই মোবাইল নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি');
  END IF;

  v_clean_input_farm := lower(trim(p_farm_name));
  v_clean_stored_farm := lower(trim(coalesce(v_farm_name, '')));

  -- If farm name is not set or doesn't match
  IF v_clean_stored_farm = '' OR v_clean_input_farm != v_clean_stored_farm THEN
    RETURN jsonb_build_object('success', false, 'message', 'নিবন্ধিত খামারের নাম মেলেনি! দয়া করে সঠিক নাম দিন');
  END IF;

  -- Update password
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'অভিনন্দন! আপনার পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to all client roles
GRANT EXECUTE ON FUNCTION public.reset_password_with_pin(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_and_reset_via_ai(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
