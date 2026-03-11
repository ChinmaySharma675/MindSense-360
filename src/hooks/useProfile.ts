import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ user_id: userId, display_name: null })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating profile:', insertError);
          } else {
            setProfile(newProfile);
          }
        } else {
          console.error('Error fetching profile:', error);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: { display_name?: string }) => {
    if (!userId) return { success: false };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update profile',
          variant: 'destructive',
        });
        return { success: false };
      }

      setProfile(data);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false };
    }
  };

  return {
    profile,
    isLoading,
    updateProfile,
    refetch: fetchProfile,
  };
}
