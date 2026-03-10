'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface RiskHistoryItem {
    date: string;
    risk: string;
    behavior_score: number | null;
    voice_score: number | null;
    wearable_score: number | null;
    confidence: number;
}

interface RiskChartProps {
    className?: string;
}

export default function RiskChart({ className }: RiskChartProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await apiClient.getRiskHistory(7);
            setHistory(data.history || []);
        } catch (err) {
            console.error('Failed to load history:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'HIGH': return 'bg-red-500';
            case 'MEDIUM': return 'bg-yellow-500';
            case 'LOW': return 'bg-green-500';
            default: return 'bg-gray-300';
        }
    };

    const getRiskHeight = (risk: string) => {
        switch (risk) {
            case 'HIGH': return 'h-32';
            case 'MEDIUM': return 'h-20';
            case 'LOW': return 'h-10';
            default: return 'h-4';
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-gray-600">Loading history...</div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Risk History</h2>
                <p className="text-gray-600">No historical data available yet. Submit data daily to see trends.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">7-Day Risk History</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-xs text-yellow-800 flex items-center max-w-sm">
                    <span className="text-yellow-600 mr-2 text-lg">⚠️</span>
                    <span>
                        <strong>Ethical Disclaimer:</strong> MindSense is an AI-assisted monitoring tool,
                        not a medical device. This analysis is deterministic and based on your inputs.
                        Consult a professional for diagnosis.
                    </span>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end justify-between h-48 mb-8">
                {history.map((item, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 mx-1">
                        <div className={`w-full ${getRiskColor(item.risk)} ${getRiskHeight(item.risk)} rounded-t-lg transition-all hover:opacity-80 cursor-pointer`}
                            title={`${item.risk} - Confidence: ${(item.confidence * 100).toFixed(0)}%`}>
                        </div>
                        <div className="text-xs text-gray-600 mt-2 text-center">
                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex justify-center space-x-6 text-sm">
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                    <span className="text-gray-700">Low Risk</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                    <span className="text-gray-700">Medium Risk</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                    <span className="text-gray-700">High Risk</span>
                </div>
            </div>

            {/* Score Trends */}
            <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Avg Behavioral</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {(history.reduce((sum, item) => sum + (item.behavior_score || 0), 0) / history.filter(item => item.behavior_score !== null).length || 0).toFixed(2)}
                    </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Avg Voice</div>
                    <div className="text-2xl font-bold text-purple-600">
                        {(history.reduce((sum, item) => sum + (item.voice_score || 0), 0) / history.filter(item => item.voice_score !== null).length || 0).toFixed(2)}
                    </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Avg Wearable</div>
                    <div className="text-2xl font-bold text-green-600">
                        {(history.reduce((sum, item) => sum + (item.wearable_score || 0), 0) / history.filter(item => item.wearable_score !== null).length || 0).toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    );
}
