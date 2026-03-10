'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import AdminCharts from '@/components/AdminCharts';

interface AnalyticsData {
    overview: {
        total_users: number;
        risk_distribution: Record<string, number>;
    };
    trends: Array<{
        date: string;
        avg_behavior_score: number;
        avg_voice_score: number;
        avg_wearable_score: number;
    }>;
}

export default function AdminDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // In a real app, verify admin role here
        if (!apiClient.isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const [overview, trends] = await Promise.all([
                apiClient.getAdminOverview(),
                apiClient.getAdminTrends(7)
            ]);
            setData({ overview, trends });
        } catch (err) {
            console.error('Failed to load analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">Loading analytics...</div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-sm text-gray-600">Population Health Analytics</p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        ← Back to User Dashboard
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">Total Users</div>
                        <div className="text-3xl font-bold text-gray-900">{data.overview.total_users}</div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-l-4 border-l-red-500">
                        <div className="text-sm text-gray-500 mb-1">High Risk Users</div>
                        <div className="text-3xl font-bold text-red-600">
                            {data.overview.risk_distribution['HIGH'] || 0}
                        </div>
                        <div className="text-xs text-red-400 mt-1">Requires attention</div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-l-4 border-l-yellow-500">
                        <div className="text-sm text-gray-500 mb-1">Medium Risk Users</div>
                        <div className="text-3xl font-bold text-yellow-600">
                            {data.overview.risk_distribution['MEDIUM'] || 0}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-l-4 border-l-green-500">
                        <div className="text-sm text-gray-500 mb-1">Low Risk Users</div>
                        <div className="text-3xl font-bold text-green-600">
                            {data.overview.risk_distribution['LOW'] || 0}
                        </div>
                    </div>
                </div>

                {/* Interactive Charts */}
                <AdminCharts
                    data={{
                        riskDistribution: data.overview.risk_distribution,
                        trends: data.trends
                    }}
                />

            </main>
        </div>
    );
}
