import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface ScoreHistoryItem {
  date: string;
  behavior?: number;
  voice?: number;
  wearable?: number;
}

interface TrendChartProps {
  data: ScoreHistoryItem[];
  isLoading?: boolean;
}

export function TrendChart({ data, isLoading }: TrendChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      date: format(new Date(item.date), 'MMM d'),
      behavior: item.behavior !== undefined ? Math.round(item.behavior * 100) : undefined,
      voice: item.voice !== undefined ? Math.round(item.voice * 100) : undefined,
      wearable: item.wearable !== undefined ? Math.round(item.wearable * 100) : undefined,
    }));
  }, [data]);

  const hasData = chartData.length > 0 && chartData.some(
    (d) => d.behavior !== undefined || d.voice !== undefined || d.wearable !== undefined
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Weekly Trend
        </CardTitle>
        <CardDescription>
          Your mental wellness scores over the past 7 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading trends...</div>
          </div>
        ) : !hasData ? (
          <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-4 opacity-30" />
            <p>No historical data yet</p>
            <p className="text-sm mt-1">Log data over multiple days to see trends</p>
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  className="text-muted-foreground"
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`${value}%`, '']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="behavior" 
                  name="Behavioral"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  connectNulls
                />
                <Line 
                  type="monotone" 
                  dataKey="voice" 
                  name="Voice"
                  stroke="hsl(var(--warning))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--warning))' }}
                  connectNulls
                />
                <Line 
                  type="monotone" 
                  dataKey="wearable" 
                  name="Wearable"
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--destructive))' }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}