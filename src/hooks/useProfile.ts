import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useProfile() {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      ensureProfileExists().then(() => fetchProfile());
    }
  }, [user?.id]);

  // Ensure profile exists for the user
  const ensureProfileExists = async () => {
    if (!user) return;

    try {
      // Check if profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking profile:', error);
        return;
      }

      // If no profile exists, create one
      if (!data) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            mobile_number: user.email?.replace('@poultry.app', '') || user.phone || 'unknown',
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
      }
    } catch (error) {
      console.error('Error in ensureProfileExists:', error);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data && !error) {
      setAvatarUrl(data.avatar_url);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;

    setIsUploading(true);
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('শুধুমাত্র ছবি আপলোড করা যাবে');
        return null;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('ফাইল সাইজ ২MB এর কম হতে হবে');
        return null;
      }

      // Ensure profile exists before uploading
      await ensureProfileExists();

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('ছবি আপলোড করতে সমস্যা হয়েছে');
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        toast.error('প্রোফাইল আপডেট করতে সমস্যা হয়েছে');
        return null;
      }

      setAvatarUrl(publicUrl);
      toast.success('প্রোফাইল ছবি আপডেট হয়েছে');
      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('কিছু ভুল হয়েছে');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!user) return;

    try {
      // Remove from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([`${user.id}/avatar.png`, `${user.id}/avatar.jpg`, `${user.id}/avatar.jpeg`]);

      // Update profile
      await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      setAvatarUrl(null);
      toast.success('প্রোফাইল ছবি মুছে ফেলা হয়েছে');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('কিছু ভুল হয়েছে');
    }
  };

  return {
    avatarUrl,
    isUploading,
    uploadAvatar,
    removeAvatar,
    refetchProfile: fetchProfile,
  };
}
