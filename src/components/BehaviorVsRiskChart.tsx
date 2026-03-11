import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface DataPoint {
  behavior_score?: number;
  risk_score?: number;
  timestamp: string;
}

interface BehaviorVsRiskChartProps {
  data: DataPoint[];
  isLoading?: boolean;
}

export function BehaviorVsRiskChart({ data, isLoading }: BehaviorVsRiskChartProps) {
  // Process data for chart
  const chartData = data.slice(-10).map(point => ({
    date: format(new Date(point.timestamp), 'MMM dd'),
    behavior: point.behavior_score ? Math.round((1 - point.behavior_score) * 100) : null, // Invert: lower score = better behavior
    risk: point.risk_score ? Math.round(point.risk_score * 100) : null,
  })).filter(d => d.behavior !== null || d.risk !== null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Behavior vs Risk Correlation</CardTitle>
          <CardDescription>Loading correlation analysis...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Behavior vs Risk Correlation</CardTitle>
          <CardDescription>See how your behaviors affect your risk</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data yet. Log behavioral data to see correlation!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Behavior vs Risk Correlation</CardTitle>
        <CardDescription>How your daily habits impact your mental wellness</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              domain={[0, 100]}
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              label={{ value: 'Score %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem'
              }}
              formatter={(value: number, name: string) => [
                `${value}%`, 
                name === 'behavior' ? 'Healthy Behavior' : 'Risk Level'
              ]}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => value === 'behavior' ? 'Healthy Behavior' : 'Risk Level'}
            />
            <Line
              type="monotone"
              dataKey="behavior"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              name="behavior"
            />
            <Line
              type="monotone"
              dataKey="risk"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 4 }}
              name="risk"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Insight */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
          <p className="font-medium mb-1">💡 Understanding the Chart:</p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4">
            <li>• <span className="text-success">Green line</span> = Healthy behaviors (higher is better)</li>
            <li>• <span className="text-destructive">Red line</span> = Risk level (lower is better)</li>
            <li>• When green goes up and red goes down = Good correlation!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
