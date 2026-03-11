import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Moon, Monitor, Footprints } from 'lucide-react';

interface BehavioralFormProps {
  onSuccess: (score: number) => void;
}

export function BehavioralForm({ onSuccess }: BehavioralFormProps) {
  const [sleepDuration, setSleepDuration] = useState('7');
  const [screenTime, setScreenTime] = useState('4');
  const [physicalActivity, setPhysicalActivity] = useState('5000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-behavior', {
        body: {
          sleep_duration: parseFloat(sleepDuration),
          screen_time: parseFloat(screenTime),
          physical_activity: parseInt(physicalActivity),
        },
      });

      if (error) throw error;

      toast({
        title: 'Data submitted!',
        description: `Behavior score: ${(data.behavior_score * 100).toFixed(0)}%`,
      });

      onSuccess(data.behavior_score);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: error.message || 'Failed to submit behavioral data',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Log Behavioral Data
        </CardTitle>
        <CardDescription>
          Enter your daily metrics for analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sleep" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Sleep Duration (hours)
            </Label>
            <Input
              id="sleep"
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={sleepDuration}
              onChange={(e) => setSleepDuration(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">Optimal: 7-9 hours</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="screen" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Screen Time (hours)
            </Label>
            <Input
              id="screen"
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={screenTime}
              onChange={(e) => setScreenTime(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">Less is better</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="steps" className="flex items-center gap-2">
              <Footprints className="h-4 w-4" />
              Physical Activity (steps)
            </Label>
            <Input
              id="steps"
              type="number"
              min="0"
              max="100000"
              step="100"
              value={physicalActivity}
              onChange={(e) => setPhysicalActivity(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">Goal: 10,000+ steps</p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Analyzing...' : 'Submit Data'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}