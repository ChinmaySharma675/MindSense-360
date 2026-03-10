'use client';

import { useState } from 'react';
import { apiClient, WearableData } from '@/lib/api';

export default function WearableForm() {
    const [formData, setFormData] = useState<WearableData>({
        heart_rate: 70,
        steps: 8000,
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess(false);

        try {
            await apiClient.submitWearableData(formData);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            alert('Failed to submit wearable data');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Wearable Data</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heart Rate (BPM)
                    </label>
                    <input
                        type="number"
                        min="30"
                        max="220"
                        value={formData.heart_rate}
                        onChange={(e) => setFormData({ ...formData, heart_rate: parseFloat(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">Normal resting: 60-100 BPM</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Daily Steps
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={formData.steps}
                        onChange={(e) => setFormData({ ...formData, steps: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: 7,000-15,000 steps/day</p>
                </div>

                {success && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
                        ✓ Wearable data submitted successfully!
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                    {submitting ? 'Submitting...' : 'Submit Wearable Data'}
                </button>
            </form>
        </div>
    );
}
