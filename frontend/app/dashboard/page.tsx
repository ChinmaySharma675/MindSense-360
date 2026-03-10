'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, RiskPrediction, BehavioralData } from '@/lib/api';
import VoiceRecorder from '@/components/VoiceRecorder';
import WearableForm from '@/components/WearableForm';
import RiskChart from '@/components/RiskChart';
import LiveIndicator from '@/components/LiveIndicator';
import Toast from '@/components/Toast';
import { usePolling } from '@/hooks/usePolling';

type TabType = 'overview' | 'behavioral' | 'voice' | 'wearable' | 'history';

export default function DashboardPage() {
    const [risk, setRisk] = useState<RiskPrediction | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [formData, setFormData] = useState<BehavioralData>({
        sleep_hours: 7,
        screen_time_hours: 4,
        physical_activity_minutes: 30,
    });
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const router = useRouter();

    const { isPolling, setIsPolling, lastUpdated } = usePolling(
        async () => {
            if (!loading) {
                await loadRiskData(true); // Silent refresh
            }
        },
        { interval: 30000, enabled: true }
    );

    useEffect(() => {
        if (!apiClient.isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadRiskData();
    }, []);

    const loadRiskData = async (silent = false) => {
        try {
            const data = await apiClient.getRiskPrediction();
            setRisk(data);
        } catch (err) {
            console.error('Failed to load risk data:', err);
            if (!silent) {
                setToast({ message: 'Failed to load risk data', type: 'error' });
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const handleSubmitBehavioral = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiClient.submitBehavioralData(formData);
            await loadRiskData();
            setActiveTab('overview');
            setToast({ message: 'Behavioral data submitted successfully!', type: 'success' });
        } catch (err) {
            setToast({ message: 'Failed to submit data', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        apiClient.logout();
        router.push('/login');
    };

    const getRiskColor = (riskLevel: string) => {
        switch (riskLevel) {
            case 'HIGH': return 'bg-red-100 text-red-800 border-red-300';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'LOW': return 'bg-green-100 text-green-800 border-green-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const tabs = [
        { id: 'overview' as TabType, name: 'Overview', icon: '📊' },
        { id: 'behavioral' as TabType, name: 'Behavioral', icon: '😴' },
        { id: 'voice' as TabType, name: 'Voice', icon: '🎤' },
        { id: 'wearable' as TabType, name: 'Wearable', icon: '⌚' },
        { id: 'history' as TabType, name: 'History', icon: '📈' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            MindSense
                        </h1>
                        <p className="text-sm text-gray-600">Mental Health Monitoring</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm p-2 mb-6">
                    <div className="flex space-x-2 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Risk Status Card */}
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Current Risk Assessment</h2>

                            {risk ? (
                                <>
                                    <div className={`inline-block px-8 py-4 rounded-2xl text-3xl font-bold border-2 ${getRiskColor(risk.risk)} shadow-lg`}>
                                        {risk.risk} RISK
                                    </div>

                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                                            <div className="text-sm text-gray-600 mb-2">Behavioral Score</div>
                                            <div className="text-3xl font-bold text-blue-600">
                                                {risk.behavior_score !== null ? risk.behavior_score.toFixed(2) : 'N/A'}
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                                            <div className="text-sm text-gray-600 mb-2">Voice Score</div>
                                            <div className="text-3xl font-bold text-purple-600">
                                                {risk.voice_score !== null ? risk.voice_score.toFixed(2) : 'N/A'}
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                                            <div className="text-sm text-gray-600 mb-2">Wearable Score</div>
                                            <div className="text-3xl font-bold text-green-600">
                                                {risk.wearable_score !== null ? risk.wearable_score.toFixed(2) : 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-6 bg-gray-50 rounded-xl">
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                            <span className="text-xl mr-2">💡</span>
                                            Explanation
                                        </h3>
                                        <p className="text-gray-700 leading-relaxed">{risk.explanation}</p>
                                    </div>

                                    {risk.recommendation && (
                                        <div className="mt-4 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                                            <h3 className="font-semibold text-indigo-900 mb-3 flex items-center">
                                                <span className="text-xl mr-2">🎯</span>
                                                Recommendation
                                            </h3>
                                            <p className="text-indigo-700 leading-relaxed">{risk.recommendation}</p>
                                        </div>
                                    )}

                                    <div className="mt-6 flex items-center justify-between text-sm">
                                        <span className="text-gray-500">
                                            Confidence: <span className="font-bold text-gray-700">{(risk.confidence * 100).toFixed(0)}%</span>
                                        </span>
                                        <button
                                            onClick={() => loadRiskData()}
                                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                                        >
                                            🔄 Refresh
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📊</div>
                                    <p className="text-gray-600 text-lg mb-6">No risk data available yet</p>
                                    <p className="text-gray-500">Submit your behavioral, voice, or wearable data to get started</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'behavioral' && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Behavioral Data</h2>
                        <form onSubmit={handleSubmitBehavioral} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sleep Hours (0-24)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="24"
                                    step="0.5"
                                    value={formData.sleep_hours}
                                    onChange={(e) => setFormData({ ...formData, sleep_hours: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Recommended: 7-9 hours</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Screen Time Hours (0-24)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="24"
                                    step="0.5"
                                    value={formData.screen_time_hours}
                                    onChange={(e) => setFormData({ ...formData, screen_time_hours: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Recommended: Less than 6 hours</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Physical Activity (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formData.physical_activity_minutes}
                                    onChange={(e) => setFormData({ ...formData, physical_activity_minutes: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Recommended: 30-120 minutes/day</p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit Behavioral Data'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'voice' && <VoiceRecorder />}

                {activeTab === 'wearable' && <WearableForm />}

                {activeTab === 'history' && <RiskChart />}
            </main>
        </div>
    );
}
