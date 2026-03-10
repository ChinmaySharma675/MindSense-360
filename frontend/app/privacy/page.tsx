'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Toast from '@/components/Toast';

export default function PrivacyPage() {
    const [exporting, setExporting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const router = useRouter();

    const handleExport = async () => {
        setExporting(true);
        try {
            const data = await apiClient.exportData();

            // Create and download JSON file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mindsense-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setToast({ message: 'Data export started successfully', type: 'success' });
        } catch (err) {
            setToast({ message: 'Failed to export data', type: 'error' });
        } finally {
            setExporting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('ARE YOU SURE? This will permanently delete your account and ALL your data. This action cannot be undone.')) {
            return;
        }

        setDeleting(true);
        try {
            await apiClient.deleteAccount();
            apiClient.logout();
            router.push('/login');
        } catch (err) {
            setToast({ message: 'Failed to delete account', type: 'error' });
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Privacy & Data Control</h1>
                        <p className="text-sm text-gray-600">Manage your data and rights</p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">

                {/* Transparency Section */}
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">🔍 How We Handle Your Data</h2>
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl">
                                🎤
                            </div>
                            <div className="ml-4">
                                <h3 className="font-semibold text-gray-900">Voice Privacy</h3>
                                <p className="text-gray-600 text-sm mt-1">
                                    Audio recordings are analyzed in real-time to extract features (pitch, jitter, energy).
                                    The raw audio file is <strong>immediately deleted</strong> after processing and never stored on our servers.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl">
                                ☁️
                            </div>
                            <div className="ml-4">
                                <h3 className="font-semibold text-gray-900">Data Storage</h3>
                                <p className="text-gray-600 text-sm mt-1">
                                    Your behavioral scores and metadata are stored in a secure database.
                                    We use industry-standard encryption for data at rest and in transit.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xl">
                                🤖
                            </div>
                            <div className="ml-4">
                                <h3 className="font-semibold text-gray-900">AI Transparency</h3>
                                <p className="text-gray-600 text-sm mt-1">
                                    Our risk assessment uses deterministic algorithms, not black-box models.
                                    This means we can always explain exactly why a specific risk score was assigned.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Controls */}
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">⚙️ Your Data Controls</h2>

                    <div className="space-y-6">
                        <div className="border-b pb-6">
                            <h3 className="font-medium text-gray-900 mb-2">Export Data</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Download a copy of all personal data we hold about you in JSON format.
                            </p>
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
                            >
                                {exporting ? 'Preparing Download...' : '📥 Download My Data'}
                            </button>
                        </div>

                        <div>
                            <h3 className="font-medium text-red-600 mb-2">Delete Account</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors border border-red-200"
                            >
                                {deleting ? 'Deleting...' : '🗑️ Delete Account & Data'}
                            </button>
                        </div>
                    </div>
                </div>

            </main>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
