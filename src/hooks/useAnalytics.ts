import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';

export interface AnalyticsDataPoint {
  behavior_score?: number;
  voice_score?: number;
  wearable_score?: number;
  risk_score?: number;
  timestamp: string;
}

export function useAnalytics(userId: string | undefined) {
  const [data, setData] = useState<AnalyticsDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const fourteenDaysAgo = subDays(new Date(), 14).toISOString();

      // Fetch all score data from the last 14 days
      const [behaviorRes, voiceRes, wearableRes, riskRes] = await Promise.all([
        supabase
          .from('behavior_data')
          .select('behavior_score, recorded_at')
          .eq('user_id', userId)
          .gte('recorded_at', fourteenDaysAgo)
          .order('recorded_at', { ascending: true }),
        supabase
          .from('voice_scores')
          .select('voice_score, recorded_at')
          .eq('user_id', userId)
          .gte('recorded_at', fourteenDaysAgo)
          .order('recorded_at', { ascending: true }),
        supabase
          .from('wearable_data')
          .select('wearable_score, recorded_at')
          .eq('user_id', userId)
          .gte('recorded_at', fourteenDaysAgo)
          .order('recorded_at', { ascending: true }),
        supabase
          .from('risk_results')
          .select('behavior_score, voice_score, wearable_score, calculated_at')
          .eq('user_id', userId)
          .gte('calculated_at', fourteenDaysAgo)
          .order('calculated_at', { ascending: true }),
      ]);

      // Merge all data points by timestamp
      const dataMap = new Map<string, AnalyticsDataPoint>();

      // Add behavior data
      behaviorRes.data?.forEach((item) => {
        const key = item.recorded_at;
        const existing = dataMap.get(key) || { timestamp: item.recorded_at };
        dataMap.set(key, { ...existing, behavior_score: item.behavior_score });
      });

      // Add voice data
      voiceRes.data?.forEach((item) => {
        const key = item.recorded_at;
        const existing = dataMap.get(key) || { timestamp: item.recorded_at };
        dataMap.set(key, { ...existing, voice_score: item.voice_score });
      });

      // Add wearable data
      wearableRes.data?.forEach((item) => {
        const key = item.recorded_at;
        const existing = dataMap.get(key) || { timestamp: item.recorded_at };
        dataMap.set(key, { ...existing, wearable_score: item.wearable_score });
      });

      // Add risk scores (calculate combined score from individual scores)
      riskRes.data?.forEach((item) => {
        const key = item.calculated_at;
        const existing = dataMap.get(key) || { timestamp: item.calculated_at };
        
        // Calculate combined risk score from the three scores (average)
        const scores = [
          item.behavior_score,
          item.voice_score,
          item.wearable_score
        ].filter(s => s !== null && s !== undefined) as number[];
        
        const combined_risk = scores.length > 0 
          ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
          : undefined;
        
        dataMap.set(key, { 
          ...existing, 
          risk_score: combined_risk,
          behavior_score: item.behavior_score || existing.behavior_score,
          voice_score: item.voice_score || existing.voice_score,
          wearable_score: item.wearable_score || existing.wearable_score
        });
      });

      // Convert map to sorted array
      const analyticsData = Array.from(dataMap.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setData(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return { data, isLoading, fetchAnalytics };
}
