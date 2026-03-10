'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ChartData {
    riskDistribution: Record<string, number>;
    trends: Array<{
        date: string;
        avg_behavior_score: number;
        avg_voice_score: number;
        avg_wearable_score: number;
    }>;
}

export default function AdminCharts({ data }: { data: ChartData }) {
    // Pie Chart Data - Risk Distribution
    const pieChartData = useMemo(() => {
        const labels = Object.keys(data.riskDistribution);
        const values = Object.values(data.riskDistribution);

        return [
            {
                values: values,
                labels: labels,
                type: 'pie' as const,
                marker: {
                    colors: labels.map(label => {
                        switch (label) {
                            case 'HIGH': return '#EF4444'; // red-500
                            case 'MEDIUM': return '#F59E0B'; // yellow-500
                            case 'LOW': return '#10B981'; // green-500
                            default: return '#9CA3AF'; // gray-400
                        }
                    })
                },
                textinfo: 'label+percent' as const,
                hoverinfo: 'label+value+percent' as const,
                hole: 0.4
            }
        ];
    }, [data.riskDistribution]);

    // Line Chart Data - Assessment Trends
    const lineChartData = useMemo(() => {
        return [
            {
                x: data.trends.map(t => t.date),
                y: data.trends.map(t => t.avg_behavior_score),
                type: 'scatter' as const,
                mode: 'lines+markers' as const,
                name: 'Avg Behavioral',
                line: { color: '#3B82F6' } // blue-500
            },
            {
                x: data.trends.map(t => t.date),
                y: data.trends.map(t => t.avg_voice_score),
                type: 'scatter' as const,
                mode: 'lines+markers' as const,
                name: 'Avg Voice',
                line: { color: '#8B5CF6' } // purple-500
            },
            {
                x: data.trends.map(t => t.date),
                y: data.trends.map(t => t.avg_wearable_score),
                type: 'scatter' as const,
                mode: 'lines+markers' as const,
                name: 'Avg Wearable',
                line: { color: '#10B981' } // green-500
            }
        ];
    }, [data.trends]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Risk Distribution */}
            <div className="bg-white p-6 rounded-2xl shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Current Risk Distribution</h3>
                <div className="h-[400px] w-full">
                    <Plot
                        data={pieChartData}
                        layout={{
                            autosize: true,
                            showlegend: true,
                            margin: { t: 0, b: 0, l: 0, r: 0 },
                            legend: { orientation: 'h', y: -0.1 }
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ displayModeBar: false }}
                    />
                </div>
            </div>

            {/* Population Trends */}
            <div className="bg-white p-6 rounded-2xl shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-4">7-Day Population Trends</h3>
                <div className="h-[400px] w-full">
                    <Plot
                        data={lineChartData}
                        layout={{
                            autosize: true,
                            showlegend: true,
                            margin: { t: 20, b: 40, l: 40, r: 20 },
                            legend: { orientation: 'h', y: 1.1 },
                            xaxis: { title: { text: 'Date' } },
                            yaxis: { title: { text: 'Average Score' }, range: [0, 1] }
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ displayModeBar: false }}
                    />
                </div>
            </div>
        </div>
    );
}
