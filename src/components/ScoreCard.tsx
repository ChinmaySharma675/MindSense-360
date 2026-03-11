import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ScoreCardProps {
  title: string;
  score: number | null;
  icon: React.ReactNode;
  description?: string;
}

export function ScoreCard({ title, score, icon, description }: ScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score <= 0.33) return 'text-success';
    if (score <= 0.66) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score <= 0.33) return 'Low Risk';
    if (score <= 0.66) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4">
          {score !== null ? (
            <>
              <div className={cn("text-4xl font-bold", getScoreColor(score))}>
                {(score * 100).toFixed(0)}%
              </div>
              <p className={cn("text-sm font-medium mt-1", getScoreColor(score))}>
                {getScoreLabel(score)}
              </p>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-muted-foreground">--</div>
              <p className="text-sm text-muted-foreground mt-1">No data</p>
            </>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground text-center">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}