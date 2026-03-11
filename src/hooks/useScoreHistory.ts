import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, format } from 'date-fns';

interface ScoreHistoryItem {
  date: string;
  behavior?: number;
  voice?: number;
  wearable?: number;
}

export function useScoreHistory(userId: string | undefined) {
  const [history, setHistory] = useState<ScoreHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const sevenDaysAgo = startOfDay(subDays(new Date(), 6));

      // Fetch all data from the last 7 days
      const [behaviorRes, voiceRes, wearableRes] = await Promise.all([
        supabase
          .from('behavior_data')
          .select('behavior_score, recorded_at')
          .eq('user_id', userId)
          .gte('recorded_at', sevenDaysAgo.toISOString())
          .order('recorded_at', { ascending: true }),
        supabase
          .from('voice_scores')
          .select('voice_score, recorded_at')
          .eq('user_id', userId)
          .gte('recorded_at', sevenDaysAgo.toISOString())
          .order('recorded_at', { ascending: true }),
        supabase
          .from('wearable_data')
          .select('wearable_score, recorded_at')
          .eq('user_id', userId)
          .gte('recorded_at', sevenDaysAgo.toISOString())
          .order('recorded_at', { ascending: true }),
      ]);

      // Group by day and take latest score per day
      const groupByDay = <T extends { recorded_at: string }>(
        items: T[] | null,
        scoreKey: keyof T
      ): Map<string, number> => {
        const map = new Map<string, number>();
        if (!items) return map;

        for (const item of items) {
          const day = format(new Date(item.recorded_at), 'yyyy-MM-dd');
          // Latest score for the day wins
          map.set(day, item[scoreKey] as number);
        }
        return map;
      };

      const behaviorByDay = groupByDay(behaviorRes.data, 'behavior_score');
      const voiceByDay = groupByDay(voiceRes.data, 'voice_score');
      const wearableByDay = groupByDay(wearableRes.data, 'wearable_score');

      // Build history for the last 7 days
      const historyData: ScoreHistoryItem[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        historyData.push({
          date,
          behavior: behaviorByDay.get(date),
          voice: voiceByDay.get(date),
          wearable: wearableByDay.get(date),
        });
      }

      setHistory(historyData);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return { history, isLoading, fetchHistory };
}