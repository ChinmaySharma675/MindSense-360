import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Heart, Footprints, RefreshCw, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Minus, Moon } from 'lucide-react';

interface HeartRateData {
  average: number;
  resting: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  hourlyData: { hour: number; bpm: number }[];
}

interface SleepData {
  totalMinutes: number;
  deepSleepMinutes: number;
  lightSleepMinutes: number;
  remSleepMinutes: number;
  awakeMinutes: number;
  sleepScore: number;
  bedTime: string;
  wakeTime: string;
  trend: 'up' | 'down' | 'stable';
}

interface GoogleFitData {
  steps: number;
  calories: number;
  heartRate: HeartRateData | null;
  sleep: SleepData | null;
  lastSynced: Date;
}

interface GoogleFitSyncProps {
  onDataFetched?: (calories: number, steps: number) => void;
}

export function GoogleFitSync({ onDataFetched }: GoogleFitSyncProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [fitData, setFitData] = useState<GoogleFitData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkGoogleFitConnection();
  }, []);

  const checkGoogleFitConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.provider_token) {
        setIsConnected(true);
        // Auto-sync on mount if connected
        await syncGoogleFitData(session.provider_token);
      }
    } catch (error) {
      console.error('Error checking Google Fit connection:', error);
    }
  };

  const syncGoogleFitData = async (accessToken?: string) => {
    setIsSyncing(true);

    try {
      // Get access token
      const { data: { session } } = await supabase.auth.getSession();
      const token = accessToken || session?.provider_token;

      console.log('Session info:', {
        hasSession: !!session,
        hasToken: !!token,
        provider: session?.user?.app_metadata?.provider
      });

      if (!token) {
        throw new Error('Not connected to Google. Please sign in with Google.');
      }

      // Calculate date range (today only - midnight to current time)
      const endTime = new Date();
      const startTime = new Date();
      startTime.setHours(0, 0, 0, 0); // Start of today (midnight 00:00)
      
      // Set end time to end of day (23:59:59.999)
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      console.log('Fetching today\'s steps data from Google Fit...', {
        start: startTime.toISOString(),
        end: endOfDay.toISOString()
      });
      
      // Fetch steps data from Google Fit (without specific dataSourceId to work with any source)
      const stepsResponse = await fetch(
        'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aggregateBy: [{
              dataTypeName: 'com.google.step_count.delta'
              // Removed dataSourceId to allow any steps data source
            }],
            bucketByTime: { durationMillis: 3600000 }, // 1 hour buckets for better resolution
            startTimeMillis: startTime.getTime(),
            endTimeMillis: endOfDay.getTime()
          })
        }
      );

      console.log('Steps API response status:', stepsResponse.status);

      if (!stepsResponse.ok) {
        const errorData = await stepsResponse.json().catch(() => ({}));
        console.error('Steps API error:', errorData);
        
        // Provide helpful error message based on status
        if (stepsResponse.status === 403) {
          if (errorData.error?.message?.includes('not enabled')) {
            throw new Error('Google Fitness API is not enabled. Please enable it in Google Cloud Console: APIs & Services → Library → Search "Fitness API" → Enable');
          } else if (errorData.error?.message?.includes('datasource not found')) {
            console.warn('No steps data found - user may not have Google Fit installed or no steps recorded');
            // Don't throw, continue with 0 steps
          } else {
            throw new Error('Access denied. Make sure you granted Fitness permissions during sign-in.');
          }
        } else {
          throw new Error(errorData.error?.message || `Failed to fetch steps data (${stepsResponse.status})`);
        }
      }

      const stepsData = await stepsResponse.json();
      console.log('Steps data received:', stepsData);
      
      // Sum up all step values from all buckets
      let steps = 0;
      if (stepsData.bucket) {
        for (const bucket of stepsData.bucket) {
          if (bucket.dataset?.[0]?.point) {
            for (const point of bucket.dataset[0].point) {
              steps += point.value?.[0]?.intVal || 0;
            }
          }
        }
      }
      console.log('Total steps today:', steps);

      console.log('Fetching today\'s heart rate data from Google Fit...');
      
      // Fetch heart rate data from Google Fit with smaller buckets for more detail
      const heartRateResponse = await fetch(
        'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aggregateBy: [{
              dataTypeName: 'com.google.heart_rate.bpm'
            }],
            bucketByTime: { durationMillis: 900000 }, // 15 minute buckets for more granular data
            startTimeMillis: startTime.getTime(),
            endTimeMillis: endOfDay.getTime()
          })
        }
      );

      let heartRateData: HeartRateData | null = null;
      if (heartRateResponse.ok) {
        const hrData = await heartRateResponse.json();
        console.log('Heart rate data received:', hrData);
        console.log('Number of buckets:', hrData.bucket?.length);
        
        const heartRates: number[] = [];
        const hourlyData: { hour: number; bpm: number }[] = [];
        
        if (hrData.bucket) {
          console.log('Processing', hrData.bucket.length, 'time buckets');
          for (const bucket of hrData.bucket) {
            if (bucket.dataset?.[0]?.point) {
              console.log('Bucket has', bucket.dataset[0].point.length, 'data points');
              for (const point of bucket.dataset[0].point) {
                const bpm = point.value?.[0]?.fpVal;
                console.log('Heart rate reading:', bpm);
                if (bpm && bpm > 30 && bpm < 200) { // Valid heart rate range
                  heartRates.push(bpm);
                  const bucketTime = new Date(parseInt(bucket.startTimeMillis));
                  hourlyData.push({ hour: bucketTime.getHours(), bpm: Math.round(bpm) });
                }
              }
            }
          }
        }
        
        console.log('Total heart rate readings collected:', heartRates.length);
        console.log('All heart rates:', heartRates);
        
        if (heartRates.length > 0) {
          const average = Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length);
          const min = Math.round(Math.min(...heartRates));
          const max = Math.round(Math.max(...heartRates));
          const resting = Math.round(Math.min(...heartRates)); // Lowest recorded is resting
          
          // Calculate trend by comparing with estimated baseline
          let trend: 'up' | 'down' | 'stable' = 'stable';
          const normalRestingHR = 65; // Average resting HR
          if (resting > normalRestingHR + 5) trend = 'up';
          else if (resting < normalRestingHR - 5) trend = 'down';
          
          heartRateData = {
            average,
            resting,
            min,
            max,
            trend,
            hourlyData
          };
          
          console.log('Heart rate stats:', heartRateData);
        } else {
          console.log('No heart rate readings found in the data');
        }
      } else {
        const errorData = await heartRateResponse.json().catch(() => ({}));
        console.warn('Heart rate data not available:', heartRateResponse.status, errorData);
        if (heartRateResponse.status === 403) {
          console.warn('Heart rate permission not granted. User needs to reconnect Google Fit with heart rate permissions.');
        }
      }

      console.log('Fetching today\'s calories data from Google Fit...');
      
      // Fetch calories/energy data from Google Fit
      const caloriesResponse = await fetch(
        'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aggregateBy: [{
              dataTypeName: 'com.google.calories.expended'
            }],
            bucketByTime: { durationMillis: 3600000 }, // 1 hour buckets
            startTimeMillis: startTime.getTime(),
            endTimeMillis: endOfDay.getTime()
          })
        }
      );

      console.log('Calories API response status:', caloriesResponse.status);

      let calories = 0; // Start with 0 for today
      if (caloriesResponse.ok) {
        const caloriesData = await caloriesResponse.json();
        console.log('Calories data received:', caloriesData);
        
        // Sum up all calories values from all buckets (today only)
        let totalCalories = 0;
        if (caloriesData.bucket) {
          for (const bucket of caloriesData.bucket) {
            if (bucket.dataset?.[0]?.point) {
              for (const point of bucket.dataset[0].point) {
                const value = point.value?.[0]?.fpVal;
                if (value && value > 0) {
                  totalCalories += value;
                }
              }
            }
          }
        }
        
        if (totalCalories > 0) {
          calories = Math.round(totalCalories);
        }
        console.log('Total calories today:', calories);
      } else {
        const errorData = await caloriesResponse.json().catch(() => ({}));
        console.warn('Calories API error (using default):', errorData);
      }

      console.log('Fetching sleep data from Google Fit (last 24 hours)...');
      
      // Fetch sleep data from Google Fit - look at last 24-48 hours since sleep often starts previous night
      const sleepStartTime = new Date(startTime);
      sleepStartTime.setDate(sleepStartTime.getDate() - 1); // Go back 1 day to catch last night's sleep
      
      const sleepResponse = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${sleepStartTime.toISOString()}&endTime=${endOfDay.toISOString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let sleepData: SleepData | null = null;
      if (sleepResponse.ok) {
        const sleepSessionsData = await sleepResponse.json();
        console.log('Sleep sessions data received:', sleepSessionsData);
        console.log('Total sessions found:', sleepSessionsData.session?.length || 0);
        
        // Filter for recent sleep sessions (activity type 72 = sleep)
        // Look for sleep that ended today or started yesterday night
        const recentSleepSessions = sleepSessionsData.session?.filter((session: any) => {
          const sessionEnd = new Date(parseInt(session.startTimeMillis));
          const sessionStart = new Date(parseInt(session.endTimeMillis));  
          const isToday = sessionEnd >= startTime || sessionStart >= sleepStartTime;
          console.log('Session:', session.activityType, 'Start:', sessionStart, 'End:', sessionEnd, 'IsToday:', isToday);
          return session.activityType === 72 && isToday;
        }) || [];
        
        console.log('Recent sleep sessions filtered:', recentSleepSessions.length);
        
        if (recentSleepSessions.length > 0) {
          // Get the most recent/longest sleep session
          const mainSleepSession = recentSleepSessions.reduce((prev: any, curr: any) => {
            const prevDuration = parseInt(prev.endTimeMillis) - parseInt(prev.startTimeMillis);
            const currDuration = parseInt(curr.endTimeMillis) - parseInt(curr.startTimeMillis);
            return currDuration > prevDuration ? curr : prev;
          });
          
          const sleepStart = new Date(parseInt(mainSleepSession.startTimeMillis));
          const sleepEnd = new Date(parseInt(mainSleepSession.endTimeMillis));
          const totalMinutes = Math.round((sleepEnd.getTime() - sleepStart.getTime()) / 60000);
          
          // Fetch detailed sleep segments for stages
          const segmentsResponse = await fetch(
            `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                aggregateBy: [{
                  dataTypeName: 'com.google.sleep.segment'
                }],
                startTimeMillis: parseInt(mainSleepSession.startTimeMillis),
                endTimeMillis: parseInt(mainSleepSession.endTimeMillis)
              })
            }
          );
          
          let deepSleepMinutes = 0;
          let lightSleepMinutes = 0;
          let remSleepMinutes = 0;
          let awakeMinutes = 0;
          
          if (segmentsResponse.ok) {
            const segmentsData = await segmentsResponse.json();
            console.log('Sleep segments data:', segmentsData);
            
            // Process sleep stages (Google Fit sleep segment types)
            // 1 = awake, 2 = sleep (light), 3 = out of bed, 4 = light sleep, 5 = deep sleep, 6 = REM
            if (segmentsData.bucket?.[0]?.dataset?.[0]?.point) {
              for (const point of segmentsData.bucket[0].dataset[0].point) {
                const sleepType = point.value?.[0]?.intVal;
                const segmentStart = parseInt(point.startTimeNanos) / 1000000;
                const segmentEnd = parseInt(point.endTimeNanos) / 1000000;
                const durationMin = Math.round((segmentEnd - segmentStart) / 60000);
                
                if (sleepType === 5) deepSleepMinutes += durationMin;
                else if (sleepType === 4 || sleepType === 2) lightSleepMinutes += durationMin;
                else if (sleepType === 6) remSleepMinutes += durationMin;
                else if (sleepType === 1) awakeMinutes += durationMin;
              }
            }
          }
          
          // If no stage data, estimate based on typical sleep patterns
          if (deepSleepMinutes === 0 && lightSleepMinutes === 0 && remSleepMinutes === 0) {
            deepSleepMinutes = Math.round(totalMinutes * 0.20); // ~20% deep
            remSleepMinutes = Math.round(totalMinutes * 0.25);   // ~25% REM
            lightSleepMinutes = Math.round(totalMinutes * 0.50); // ~50% light
            awakeMinutes = Math.round(totalMinutes * 0.05);      // ~5% awake
          }
          
          // Calculate sleep score (0-100)
          const targetSleep = 480; // 8 hours
          const durationScore = Math.min(100, (totalMinutes / targetSleep) * 100);
          const deepSleepScore = Math.min(100, (deepSleepMinutes / (totalMinutes * 0.2)) * 100);
          const sleepScore = Math.round((durationScore * 0.6 + deepSleepScore * 0.4));
          
          // Calculate trend
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (totalMinutes >= 420) trend = 'up'; // 7+ hours = good
          else if (totalMinutes < 360) trend = 'down'; // < 6 hours = poor
          
          sleepData = {
            totalMinutes,
            deepSleepMinutes,
            lightSleepMinutes,
            remSleepMinutes,
            awakeMinutes,
            sleepScore,
            bedTime: sleepStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            wakeTime: sleepEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            trend
          };
          
          console.log('Sleep data processed:', sleepData);
        } else {
          console.log('No sleep sessions found in last 24 hours');
        }
      } else {
        const errorData = await sleepResponse.json().catch(() => ({}));
        console.warn('Sleep data not available:', sleepResponse.status, errorData);
        if (sleepResponse.status === 403) {
          console.warn('Sleep permission not granted. User needs to reconnect Google Fit with sleep permissions.');
        }
      }

      // Update state
      const newData: GoogleFitData = {
        steps,
        calories,
        heartRate: heartRateData,
        sleep: sleepData,
        lastSynced: new Date()
      };
      
      console.log('Synced data:', newData);
      
      setFitData(newData);
      setIsConnected(true);

      // Submit to backend
      if (onDataFetched) {
        onDataFetched(calories, steps);
      }

      // Also submit to wearable endpoint
      console.log('Submitting to backend...');
      const submitResult = await supabase.functions.invoke('submit-wearable', {
        body: {
          heart_rate: heartRateData?.average || Math.round(72 + (calories - 2000) / 50), // Use real HR data or estimate
          steps: steps,
        },
      });
      
      if (submitResult.error) {
        console.error('Backend submission error:', submitResult.error);
      } else {
        console.log('Backend submission success:', submitResult.data);
      }

      const syncParts = [`${steps.toLocaleString()} steps`, `${calories} cal`];
      if (heartRateData) syncParts.push(`${heartRateData.average} bpm`);
      if (sleepData) syncParts.push(`${Math.round(sleepData.totalMinutes / 60)}h sleep`);
      
      toast({
        title: 'Google Fit synced!',
        description: `Today: ${syncParts.join(', ')}`,
      });

    } catch (error: any) {
      console.error('Google Fit sync error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      let errorMessage = 'Failed to sync with Google Fit';
      let errorDetails = error.message || '';
      
      if (error.message?.includes('Not connected')) {
        errorMessage = 'Please sign in with Google to use this feature';
        setIsConnected(false);
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage = 'Google access expired. Please sign in again.';
        errorDetails = 'Your Google Fit access token has expired. Please log out and sign in with Google again.';
        setIsConnected(false);
      } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        errorMessage = 'Google Fit permissions required';
        errorDetails = 'Please ensure you granted access to Google Fit data during sign-in. You may need to revoke access in your Google account and sign in again.';
      } else if (error.message?.includes('404')) {
        errorMessage = 'Google Fit API not found';
        errorDetails = 'Make sure the Fitness API is enabled in your Google Cloud project.';
      } else {
        errorDetails = error.message || 'An unknown error occurred';
      }

      toast({
        variant: 'destructive',
        title: 'Sync failed',
        description: `${errorMessage}: ${errorDetails}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.sleep.read',
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent', // Force consent screen to show all permissions
        },
      },
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Connection failed',
        description: error.message,
      });
    }
  };

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Google Fit Integration
          </CardTitle>
          {isConnected && (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          Automatically sync real health data from Google Fit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center py-6 space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Connect your Google account to automatically track:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>📊 Daily step count (resets at midnight)</li>
                <li>🔥 Daily calories burned</li>
                <li>❤️ Heart rate trends & stress indicators</li>
                <li>😴 Sleep tracking with stages & quality</li>
                <li>🏃 Today's activity levels</li>
              </ul>
            </div>
            <Button onClick={handleConnectGoogle} className="w-full">
              <Activity className="h-4 w-4 mr-2" />
              Connect Google Fit
            </Button>
          </div>
        ) : (
          <>
            {/* Current Data */}
            {fitData && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/50">
                    <Activity className="h-5 w-5 text-destructive" />
                    <div>
                      <div className="text-xs text-muted-foreground">Calories Today</div>
                      <div className="font-mono font-bold">{fitData.calories.toLocaleString()} cal</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/50">
                    <Footprints className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Steps Today</div>
                      <div className="font-mono font-bold">{fitData.steps.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Heart Rate Data */}
                {fitData.heartRate ? (
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Heart className="h-4 w-4 text-red-500" />
                      Heart Rate Trends
                      {fitData.heartRate.trend === 'up' && <TrendingUp className="h-4 w-4 text-orange-500" />}
                      {fitData.heartRate.trend === 'down' && <TrendingDown className="h-4 w-4 text-green-500" />}
                      {fitData.heartRate.trend === 'stable' && <Minus className="h-4 w-4 text-blue-500" />}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="text-xs text-muted-foreground">Avg HR</div>
                        <div className="font-mono font-bold text-red-600">{fitData.heartRate.average} <span className="text-xs">bpm</span></div>
                      </div>
                      <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="text-xs text-muted-foreground">Resting</div>
                        <div className="font-mono font-bold text-green-600">{fitData.heartRate.resting} <span className="text-xs">bpm</span></div>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="text-xs text-muted-foreground">Range</div>
                        <div className="font-mono font-bold text-blue-600 text-sm">{fitData.heartRate.min}-{fitData.heartRate.max}</div>
                      </div>
                    </div>

                    {/* Heart Rate Graph */}
                    {fitData.heartRate.hourlyData.length > 0 && (
                      <div className="p-3 rounded-lg bg-accent/30 border border-accent">
                        <div className="text-xs text-muted-foreground mb-2">24-Hour Heart Rate Pattern</div>
                        <div className="flex items-end gap-0.5 h-16">
                          {Array.from({ length: 24 }, (_, i) => {
                            const hourData = fitData.heartRate!.hourlyData.find(d => d.hour === i);
                            const bpm = hourData?.bpm || 0;
                            const height = bpm > 0 ? ((bpm - 40) / 120) * 100 : 0; // Scale 40-160 bpm to 0-100%
                            
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center">
                                <div 
                                  className="w-full bg-gradient-to-t from-red-500 to-red-300 rounded-t transition-all"
                                  style={{ height: `${Math.max(height, 2)}%` }}
                                  title={`${i}:00 - ${bpm > 0 ? bpm + ' bpm' : 'No data'}`}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                          <span>0h</span>
                          <span>6h</span>
                          <span>12h</span>
                          <span>18h</span>
                          <span>24h</span>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded flex items-start gap-2">
                      <span>💡</span>
                      <div>
                        <strong>Stress Indicator:</strong> Elevated resting HR ({fitData.heartRate.resting} bpm) may indicate stress, anxiety, or overtraining.
                        {fitData.heartRate.trend === 'up' && ' Your trend is slightly elevated.'}
                        {fitData.heartRate.trend === 'down' && ' Your trend shows good recovery.'}
                        {fitData.heartRate.trend === 'stable' && ' Your trend is stable.'}
                      </div>
                    </div>
                    
                    {/* Limited data warning */}
                    {fitData.heartRate.min === fitData.heartRate.max && (
                      <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded flex items-start gap-2">
                        <span>⚠️</span>
                        <div>
                          <strong>Limited data detected:</strong> Only one heart rate reading found. Make sure HealthSync is actively syncing Samsung Health data to Google Fit. Open Google Fit app to verify heart rate data is showing there.
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Heart className="h-4 w-4 text-red-500" />
                      Heart Rate Trends
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30 text-center">
                      <Heart className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-1 font-semibold">No heart rate data available</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Heart rate data will appear once synced from your wearable device.
                      </p>
                      <p className="text-xs text-orange-600 font-medium">
                        ⚠️ 403 Permission Error: Click the button below to disconnect and reconnect with heart rate permissions.
                      </p>
                      <Button 
                        onClick={() => {
                          window.open('https://myaccount.google.com/permissions', '_blank');
                          toast({
                            title: 'Revoke Access',
                            description: 'Remove MindSense/your app from Google permissions, then reconnect here.',
                          });
                        }}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        Open Google Permissions
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sleep Data */}
                {fitData.sleep ? (
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Moon className="h-4 w-4 text-indigo-500" />
                      Sleep Tracking
                      {fitData.sleep.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {fitData.sleep.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                      {fitData.sleep.trend === 'stable' && <Minus className="h-4 w-4 text-blue-500" />}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        <div className="text-xs text-muted-foreground">Duration</div>
                        <div className="font-mono font-bold text-indigo-600">{Math.floor(fitData.sleep.totalMinutes / 60)}h {fitData.sleep.totalMinutes % 60}m</div>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="text-xs text-muted-foreground">Quality</div>
                        <div className="font-mono font-bold text-purple-600">{fitData.sleep.sleepScore}<span className="text-xs">/100</span></div>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="text-xs text-muted-foreground">Deep Sleep</div>
                        <div className="font-mono font-bold text-blue-600">{fitData.sleep.deepSleepMinutes}m</div>
                      </div>
                    </div>

                    {/* Sleep Stages Visualization */}
                    <div className="p-3 rounded-lg bg-accent/30 border border-accent">
                      <div className="text-xs text-muted-foreground mb-2">Sleep Stages Breakdown</div>
                      <div className="flex h-8 rounded overflow-hidden">
                        {fitData.sleep.deepSleepMinutes > 0 && (
                          <div 
                            className="bg-indigo-600 flex items-center justify-center text-[10px] text-white font-semibold"
                            style={{ width: `${(fitData.sleep.deepSleepMinutes / fitData.sleep.totalMinutes) * 100}%` }}
                            title={`Deep: ${fitData.sleep.deepSleepMinutes}m`}
                          >
                            {Math.round((fitData.sleep.deepSleepMinutes / fitData.sleep.totalMinutes) * 100) > 10 && 'Deep'}
                          </div>
                        )}
                        {fitData.sleep.remSleepMinutes > 0 && (
                          <div 
                            className="bg-purple-500 flex items-center justify-center text-[10px] text-white font-semibold"
                            style={{ width: `${(fitData.sleep.remSleepMinutes / fitData.sleep.totalMinutes) * 100}%` }}
                            title={`REM: ${fitData.sleep.remSleepMinutes}m`}
                          >
                            {Math.round((fitData.sleep.remSleepMinutes / fitData.sleep.totalMinutes) * 100) > 10 && 'REM'}
                          </div>
                        )}
                        {fitData.sleep.lightSleepMinutes > 0 && (
                          <div 
                            className="bg-blue-400 flex items-center justify-center text-[10px] text-white font-semibold"
                            style={{ width: `${(fitData.sleep.lightSleepMinutes / fitData.sleep.totalMinutes) * 100}%` }}
                            title={`Light: ${fitData.sleep.lightSleepMinutes}m`}
                          >
                            {Math.round((fitData.sleep.lightSleepMinutes / fitData.sleep.totalMinutes) * 100) > 15 && 'Light'}
                          </div>
                        )}
                        {fitData.sleep.awakeMinutes > 0 && (
                          <div 
                            className="bg-orange-400 flex items-center justify-center text-[10px] text-white font-semibold"
                            style={{ width: `${(fitData.sleep.awakeMinutes / fitData.sleep.totalMinutes) * 100}%` }}
                            title={`Awake: ${fitData.sleep.awakeMinutes}m`}
                          >
                            {Math.round((fitData.sleep.awakeMinutes / fitData.sleep.totalMinutes) * 100) > 8 && 'Awake'}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                        <span>🛏️ {fitData.sleep.bedTime}</span>
                        <span>⏰ {fitData.sleep.wakeTime}</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded flex items-start gap-2">
                      <span>😴</span>
                      <div>
                        <strong>Sleep Analysis:</strong>
                        {fitData.sleep.totalMinutes >= 420 ? (' Good sleep duration (7+ hours).') : fitData.sleep.totalMinutes < 360 ? (' ⚠️ Insufficient sleep (<6 hours) - may increase stress and anxiety.') : (' Moderate sleep duration.')}
                        {fitData.sleep.sleepScore >= 80 ? ' High quality sleep!' : fitData.sleep.sleepScore < 60 ? ' Sleep quality needs improvement.' : ' Average sleep quality.'}
                      </div>
                    </div>

                    {/* Poor sleep warning */}
                    {fitData.sleep.totalMinutes < 360 && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded flex items-start gap-2">
                        <span>⚠️</span>
                        <div>
                          <strong>Sleep Alert:</strong> Less than 6 hours of sleep detected. Poor sleep is strongly linked to increased stress, anxiety, and depression risk.
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Moon className="h-4 w-4 text-indigo-500" />
                      Sleep Tracking
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30 text-center">
                      <Moon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">No sleep data available</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Sleep data will appear after you sleep with your watch. Make sure Samsung Health sleep tracking is enabled.
                      </p>
                      <p className="text-xs text-orange-600 font-medium">
                        💡 If Google Fit shows sleep data but app doesn't: Click "Reconnect" to grant sleep permissions.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Sync Button */}
            <div className="flex gap-2">
              <Button
                onClick={() => syncGoogleFitData()}
                disabled={isSyncing}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              
              <Button
                onClick={handleConnectGoogle}
                variant="outline"
                className="flex-1"
                title="Reconnect to update permissions"
              >
                <Activity className="h-4 w-4 mr-2" />
                Reconnect
              </Button>
            </div>

            {fitData && (
              <p className="text-xs text-muted-foreground text-center">
                Last synced: {fitData.lastSynced.toLocaleTimeString()}
              </p>
            )}

            {/* Info */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
              ✅ <strong>Daily tracking:</strong> Syncs steps, calories, heart rate trends, and sleep data from today (00:00 to 23:59). All data from Samsung Health via HealthSync watch. Resets daily at midnight.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
