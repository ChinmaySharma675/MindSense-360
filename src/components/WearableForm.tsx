import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Footprints } from 'lucide-react';

interface WearableFormProps {
  onSuccess: (score: number) => void;
}

export function WearableForm({ onSuccess }: WearableFormProps) {
  const [heartRate, setHeartRate] = useState('72');
  const [steps, setSteps] = useState('5000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-wearable', {
        body: {
          heart_rate: parseInt(heartRate),
          steps: parseInt(steps),
        },
      });

      if (error) throw error;

      toast({
        title: 'Data submitted!',
        description: `Wearable score: ${(data.wearable_score * 100).toFixed(0)}%`,
      });

      onSuccess(data.wearable_score);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: error.message || 'Failed to submit wearable data',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-primary" />
          Log Wearable Data
        </CardTitle>
        <CardDescription>
          Enter data from your fitness tracker
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heartRate" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Resting Heart Rate (bpm)
            </Label>
            <Input
              id="heartRate"
              type="number"
              min="30"
              max="220"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">Optimal: 60-80 bpm</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wearableSteps" className="flex items-center gap-2">
              <Footprints className="h-4 w-4" />
              Daily Steps
            </Label>
            <Input
              id="wearableSteps"
              type="number"
              min="0"
              max="100000"
              step="100"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
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