import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, RefreshCw, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskResult {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  scores: {
    behavior_score: number | null;
    voice_score: number | null;
    wearable_score: number | null;
  };
  contributing_factors: string[];
  recommendations: string[];
  confidence: number;
}

interface RiskCardProps {
  onUpdate?: (result: RiskResult) => void;
}

export function RiskCard({ onUpdate }: RiskCardProps) {
  const [result, setResult] = useState<RiskResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const calculateRisk = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predict-risk');

      if (error) throw error;

      setResult(data);
      onUpdate?.(data);

      toast({
        title: 'Risk calculated',
        description: `Your current risk level is ${data.risk_level}`,
      });
    } catch (error: any) {
      console.error('Error calculating risk:', error);
      toast({
        variant: 'destructive',
        title: 'Calculation failed',
        description: error.message || 'Failed to calculate risk level',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'HIGH':
        return <AlertTriangle className="h-6 w-6" />;
      case 'MEDIUM':
        return <AlertCircle className="h-6 w-6" />;
      case 'LOW':
        return <CheckCircle className="h-6 w-6" />;
      default:
        return <TrendingUp className="h-6 w-6" />;
    }
  };

  const getRiskStyles = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'MEDIUM':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'LOW':
        return 'bg-success/10 text-success border-success/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Risk Assessment
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={calculateRisk}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            {isLoading ? 'Calculating...' : 'Calculate'}
          </Button>
        </CardTitle>
        <CardDescription>
          Combines all your metrics into an overall risk assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {result ? (
          <>
            {/* Risk Level Display */}
            <div className={cn(
              "flex items-center gap-4 p-4 rounded-lg border-2",
              getRiskStyles(result.risk_level)
            )}>
              {getRiskIcon(result.risk_level)}
              <div>
                <div className="text-2xl font-bold">{result.risk_level} RISK</div>
                <div className="text-sm opacity-80">
                  Confidence: {Math.round(result.confidence * 100)}% (based on {
                    [result.scores.behavior_score, result.scores.voice_score, result.scores.wearable_score]
                      .filter(s => s !== null).length
                  }/3 data sources)
                </div>
              </div>
            </div>

            {/* Contributing Factors */}
            {result.contributing_factors.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  Contributing Factors
                </h4>
                <ul className="space-y-1">
                  {result.contributing_factors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-warning">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">
                Recommendations
              </h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm bg-accent/50 p-2 rounded">
                    <span className="text-primary">💡</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Behavioral</div>
                <div className="font-mono font-bold">
                  {result.scores.behavior_score !== null 
                    ? `${Math.round(result.scores.behavior_score * 100)}%` 
                    : '--'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Voice</div>
                <div className="font-mono font-bold">
                  {result.scores.voice_score !== null 
                    ? `${Math.round(result.scores.voice_score * 100)}%` 
                    : '--'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Wearable</div>
                <div className="font-mono font-bold">
                  {result.scores.wearable_score !== null 
                    ? `${Math.round(result.scores.wearable_score * 100)}%` 
                    : '--'}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Click "Calculate" to analyze your risk level</p>
            <p className="text-sm mt-1">
              Log behavioral, voice, and wearable data first for best results
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}