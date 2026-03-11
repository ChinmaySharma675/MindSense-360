import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface LatestScores {
  behavior: number | null;
  voice: number | null;
  wearable: number | null;
}

interface UseRealtimeScoresOptions {
  userId: string | undefined;
  onScoreUpdate?: (type: 'behavior' | 'voice' | 'wearable', score: number) => void;
}

export function useRealtimeScores({ userId, onScoreUpdate }: UseRealtimeScoresOptions) {
  const [scores, setScores] = useState<LatestScores>({
    behavior: null,
    voice: null,
    wearable: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial scores
  const fetchLatestScores = useCallback(async () => {
    if (!userId) return;

    try {
      const [behaviorRes, wearableRes, voiceRes] = await Promise.all([
        supabase
          .from('behavior_data')
          .select('behavior_score')
          .eq('user_id', userId)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('wearable_data')
          .select('wearable_score')
          .eq('user_id', userId)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('voice_scores')
          .select('voice_score')
          .eq('user_id', userId)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      setScores({
        behavior: behaviorRes.data?.behavior_score ?? null,
        voice: voiceRes.data?.voice_score ?? null,
        wearable: wearableRes.data?.wearable_score ?? null,
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    fetchLatestScores();

    // Create a single channel for all tables
    const channel: RealtimeChannel = supabase
      .channel(`scores-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'behavior_data',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const score = payload.new.behavior_score;
          if (score !== null) {
            setScores((prev) => ({ ...prev, behavior: score }));
            setLastUpdate(new Date());
            onScoreUpdate?.('behavior', score);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voice_scores',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const score = payload.new.voice_score;
          if (score !== null) {
            setScores((prev) => ({ ...prev, voice: score }));
            setLastUpdate(new Date());
            onScoreUpdate?.('voice', score);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wearable_data',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const score = payload.new.wearable_score;
          if (score !== null) {
            setScores((prev) => ({ ...prev, wearable: score }));
            setLastUpdate(new Date());
            onScoreUpdate?.('wearable', score);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchLatestScores, onScoreUpdate]);

  return {
    scores,
    isLoading,
    lastUpdate,
    isConnected,
    refresh: fetchLatestScores,
  };
}
