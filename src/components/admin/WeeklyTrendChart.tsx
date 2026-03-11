import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface WeeklyTrendChartProps {
  data?: Array<{
    date: string;
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    total: number;
  }>;
  isLoading?: boolean;
}

export function WeeklyTrendChart({ data, isLoading }: WeeklyTrendChartProps) {
  const chartData = data?.map((d) => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'EEE'),
  })) ?? [];

  const hasData = chartData.some((d) => d.total > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Weekly Risk Trend
        </CardTitle>
        <CardDescription>
          Risk assessments over the last 7 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <div className="w-full h-32 bg-muted animate-pulse rounded" />
          </div>
        ) : !hasData ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No data for the past week
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="dateLabel" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="LOW"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Low Risk"
                />
                <Line
                  type="monotone"
                  dataKey="MEDIUM"
                  stroke="hsl(var(--warning))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Medium Risk"
                />
                <Line
                  type="monotone"
                  dataKey="HIGH"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="High Risk"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
