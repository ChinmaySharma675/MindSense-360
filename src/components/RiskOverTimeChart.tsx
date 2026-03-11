import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { format } from 'date-fns';

interface RiskDataPoint {
  risk_score?: number;
  timestamp: string;
}

interface RiskOverTimeChartProps {
  data: RiskDataPoint[];
  isLoading?: boolean;
}

export function RiskOverTimeChart({ data, isLoading }: RiskOverTimeChartProps) {
  // Process data for chart
  const chartData = data
    .filter(point => point.risk_score !== undefined)
    .slice(-14)
    .map(point => ({
      date: format(new Date(point.timestamp), 'MMM dd'),
      risk: Math.round((point.risk_score || 0) * 100),
      fullDate: point.timestamp
    }));

  // Calculate trend
  const getTrend = () => {
    if (chartData.length < 2) return 'stable';
    const recent = chartData.slice(-3).reduce((sum, d) => sum + d.risk, 0) / 3;
    const previous = chartData.slice(-6, -3).reduce((sum, d) => sum + d.risk, 0) / 3;
    
    if (recent < previous - 5) return 'improving';
    if (recent > previous + 5) return 'worsening';
    return 'stable';
  };

  const trend = getTrend();

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="h-5 w-5 text-success" />;
      case 'worsening':
        return <TrendingUp className="h-5 w-5 text-destructive" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case 'improving':
        return 'Improving - Great progress! 🎉';
      case 'worsening':
        return 'Needs attention - Consider adjusting habits';
      default:
        return 'Stable - Maintaining current level';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Score Over Time</CardTitle>
          <CardDescription>Loading your wellness trend...</CardDescription>
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
          <CardTitle>Risk Score Over Time</CardTitle>
          <CardDescription>Track your mental wellness trend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data yet. Start logging to see your trend!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Risk Score Over Time</CardTitle>
            <CardDescription>Your mental wellness trend (last 14 days)</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className="text-sm font-medium">{getTrendText()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
              label={{ value: 'Risk %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem'
              }}
              formatter={(value: number) => [`${value}%`, 'Risk Score']}
            />
            <Area
              type="monotone"
              dataKey="risk"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#riskGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Risk level indicators */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted-foreground">Low (0-30%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">Medium (31-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">High (61-100%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
