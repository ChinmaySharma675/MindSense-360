import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Radio, Activity, Heart, Footprints, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WearableSimulatorProps {
  onDataSubmit?: (score: number) => void;
}

export function WearableSimulator({ onDataSubmit }: WearableSimulatorProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamInterval, setStreamInterval] = useState(10); // seconds
  const [currentData, setCurrentData] = useState({
    heartRate: 72,
    steps: 0,
  });
  const [submissionCount, setSubmissionCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Generate realistic simulated data
  const generateData = useCallback(() => {
    // Simulate heart rate with some variation (60-100 normal range)
    const baseHeartRate = 72;
    const variation = Math.sin(Date.now() / 10000) * 15; // Slow wave
    const noise = (Math.random() - 0.5) * 10; // Random noise
    const heartRate = Math.round(Math.max(55, Math.min(120, baseHeartRate + variation + noise)));

    // Simulate step accumulation (0-200 steps per interval)
    const stepIncrement = Math.floor(Math.random() * 50) + (isStreaming ? 10 : 0);

    return {
      heartRate,
      steps: currentData.steps + stepIncrement,
    };
  }, [currentData.steps, isStreaming]);

  // Submit data to backend
  const submitData = useCallback(async (data: { heartRate: number; steps: number }) => {
    try {
      const response = await supabase.functions.invoke('submit-wearable', {
        body: {
          heart_rate: data.heartRate,
          steps: data.steps,
        },
      });

      if (response.error) throw response.error;

      setSubmissionCount((prev) => prev + 1);
      onDataSubmit?.(response.data.wearable_score);
    } catch (error: any) {
      console.error('Simulator submit error:', error);
      toast({
        variant: 'destructive',
        title: 'Stream error',
        description: 'Failed to submit simulated data',
      });
    }
  }, [onDataSubmit, toast]);

  // Stream effect
  useEffect(() => {
    if (isStreaming) {
      // Immediate first submission
      const data = generateData();
      setCurrentData(data);
      submitData(data);

      // Set up interval
      intervalRef.current = setInterval(() => {
        const newData = generateData();
        setCurrentData(newData);
        submitData(newData);
      }, streamInterval * 1000);

      toast({
        title: 'Streaming started',
        description: `Simulating wearable data every ${streamInterval}s`,
      });
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isStreaming, streamInterval, generateData, submitData, toast]);

  // Update current data preview in real-time when streaming
  useEffect(() => {
    if (!isStreaming) return;

    const preview = setInterval(() => {
      setCurrentData((prev) => ({
        ...prev,
        heartRate: Math.round(
          72 + Math.sin(Date.now() / 10000) * 15 + (Math.random() - 0.5) * 10
        ),
      }));
    }, 1000);

    return () => clearInterval(preview);
  }, [isStreaming]);

  return (
    <Card className="border-dashed border-2 border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className={cn(
            "h-5 w-5",
            isStreaming && "text-success animate-pulse"
          )} />
          Wearable Simulator
        </CardTitle>
        <CardDescription>
          Simulate real-time sensor data for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stream toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              id="stream-toggle"
              checked={isStreaming}
              onCheckedChange={setIsStreaming}
            />
            <Label htmlFor="stream-toggle">
              {isStreaming ? 'Streaming Active' : 'Start Streaming'}
            </Label>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            {submissionCount} submissions
          </div>
        </div>

        {/* Current readings */}
        <div className="grid grid-cols-2 gap-3">
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-lg bg-accent/50 transition-all",
            isStreaming && "animate-pulse-soft"
          )}>
            <Heart className="h-5 w-5 text-destructive" />
            <div>
              <div className="text-xs text-muted-foreground">Heart Rate</div>
              <div className="font-mono font-bold">{currentData.heartRate} bpm</div>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-lg bg-accent/50 transition-all",
            isStreaming && "animate-pulse-soft"
          )}>
            <Footprints className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Total Steps</div>
              <div className="font-mono font-bold">{currentData.steps.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Interval selector */}
        <div className="flex items-center gap-2">
          <Label className="text-sm">Update every:</Label>
          <div className="flex gap-1">
            {[5, 10, 30].map((sec) => (
              <Button
                key={sec}
                size="sm"
                variant={streamInterval === sec ? 'default' : 'outline'}
                className="h-7 px-2 text-xs"
                onClick={() => setStreamInterval(sec)}
                disabled={isStreaming}
              >
                {sec}s
              </Button>
            ))}
          </div>
        </div>

        {/* Activity indicator */}
        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-success">
            <Activity className="h-3 w-3 animate-pulse" />
            Live data streaming to dashboard...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
