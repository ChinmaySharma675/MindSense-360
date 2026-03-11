import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface RiskDistributionChartProps {
  data?: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
  isLoading?: boolean;
}

const COLORS = {
  LOW: 'hsl(var(--success))',
  MEDIUM: 'hsl(var(--warning))',
  HIGH: 'hsl(var(--destructive))',
};

export function RiskDistributionChart({ data, isLoading }: RiskDistributionChartProps) {
  const chartData = data
    ? [
        { name: 'Low Risk', value: data.LOW, color: COLORS.LOW },
        { name: 'Medium Risk', value: data.MEDIUM, color: COLORS.MEDIUM },
        { name: 'High Risk', value: data.HIGH, color: COLORS.HIGH },
      ].filter((d) => d.value > 0)
    : [];

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Risk Distribution
        </CardTitle>
        <CardDescription>
          Current risk levels across all users
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <div className="h-32 w-32 rounded-full border-4 border-muted animate-pulse" />
          </div>
        ) : total === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No risk assessments yet
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => 
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
