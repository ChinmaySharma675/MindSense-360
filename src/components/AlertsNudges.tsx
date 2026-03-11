import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, X, TrendingUp, Moon, Footprints, Heart, Activity, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NudgeData {
  behavior_score?: number;
  voice_score?: number;
  wearable_score?: number;
  risk_score?: number;
  timestamp: string;
}

interface Nudge {
  id: string;
  type: 'lifestyle' | 'positive' | 'suggestion';
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: string;
}

interface AlertsNudgesProps {
  recentData: NudgeData[];
}

export function AlertsNudges({ recentData }: AlertsNudgesProps) {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateNudges();
  }, [recentData]);

  const generateNudges = () => {
    const newNudges: Nudge[] = [];
    
    if (!recentData || recentData.length === 0) return;

    const latest = recentData[recentData.length - 1];
    const recent3Days = recentData.slice(-3);

    // High behavior score (bad habits)
    if (latest.behavior_score && latest.behavior_score > 0.6) {
      newNudges.push({
        id: 'behavior-high',
        type: 'lifestyle',
        icon: <Moon className="h-4 w-4" />,
        title: 'Sleep Pattern Irregular',
        message: 'Your behavioral data shows irregular patterns. Try maintaining a consistent sleep schedule.',
        action: 'Set bedtime reminder'
      });
    }

    // Low step count pattern
    const avgWearable = recent3Days
      .filter(d => d.wearable_score !== undefined)
      .reduce((sum, d) => sum + (d.wearable_score || 0), 0) / recent3Days.length;
    
    if (avgWearable > 0.5) {
      newNudges.push({
        id: 'steps-low',
        type: 'suggestion',
        icon: <Footprints className="h-4 w-4" />,
        title: 'Low Activity This Week',
        message: 'Try taking a short 10-minute walk. Even small movements help!',
        action: 'Start walking'
      });
    }

    // High voice stress
    if (latest.voice_score && latest.voice_score > 0.6) {
      newNudges.push({
        id: 'voice-stress',
        type: 'lifestyle',
        icon: <Heart className="h-4 w-4" />,
        title: 'Elevated Stress Detected',
        message: 'Your voice analysis shows elevated stress. Consider taking a few deep breaths.',
        action: 'Try breathing exercise'
      });
    }

    // Risk trending up
    if (recentData.length >= 3) {
      const recentRisk = recent3Days.map(d => d.risk_score || 0);
      const isIncreasing = recentRisk[2] > recentRisk[0] + 0.1;
      
      if (isIncreasing) {
        newNudges.push({
          id: 'risk-increasing',
          type: 'lifestyle',
          icon: <TrendingUp className="h-4 w-4 text-warning" />,
          title: 'Risk Trend Rising',
          message: 'Your wellness score is trending up. Consider reviewing your recent activities.',
          action: 'View insights'
        });
      }
    }

    // Positive reinforcement
    if (latest.risk_score && latest.risk_score < 0.3) {
      newNudges.push({
        id: 'positive-low-risk',
        type: 'positive',
        icon: <Sparkles className="h-4 w-4 text-success" />,
        title: 'Great Job! 🎉',
        message: 'Your wellness indicators look good. Keep up these healthy habits!',
      });
    }

    // Consistent good behavior
    const allBehaviorGood = recent3Days.every(d => (d.behavior_score || 1) < 0.4);
    if (allBehaviorGood && recent3Days.length >= 3) {
      newNudges.push({
        id: 'positive-streak',
        type: 'positive',
        icon: <Activity className="h-4 w-4 text-success" />,
        title: 'Consistency Streak! ⭐',
        message: 'You\'ve maintained healthy behaviors for 3 days. Excellent progress!',
      });
    }

    // Filter out dismissed nudges
    const filteredNudges = newNudges.filter(n => !dismissedNudges.has(n.id));
    setNudges(filteredNudges);
  };

  const dismissNudge = (id: string) => {
    setDismissedNudges(prev => new Set([...prev, id]));
    setNudges(nudges.filter(n => n.id !== id));
  };

  if (nudges.length === 0) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-5 w-5 text-primary" />
          🔔 Alerts & Nudges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {nudges.map((nudge) => (
            <div
              key={nudge.id}
              className={`p-3 rounded-lg border ${
                nudge.type === 'positive' 
                  ? 'bg-success/5 border-success/20' 
                  : nudge.type === 'lifestyle'
                  ? 'bg-warning/5 border-warning/20'
                  : 'bg-primary/5 border-primary/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-full ${
                    nudge.type === 'positive' 
                      ? 'bg-success/10' 
                      : nudge.type === 'lifestyle'
                      ? 'bg-warning/10'
                      : 'bg-primary/10'
                  }`}>
                    {nudge.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{nudge.title}</h4>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                      >
                        {nudge.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {nudge.message}
                    </p>
                    {nudge.action && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs"
                      >
                        {nudge.action} →
                      </Button>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => dismissNudge(nudge.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          💡 These are lifestyle suggestions, not medical advice
        </p>
      </CardContent>
    </Card>
  );
}
