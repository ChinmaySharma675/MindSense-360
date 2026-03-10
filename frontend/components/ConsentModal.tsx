'use client';

import { useState, useEffect } from 'react';

interface ConsentModalProps {
    onAccept: () => void;
    isOpen: boolean;
}

export default function ConsentModal({ onAccept, isOpen }: ConsentModalProps) {
    const [showDetails, setShowDetails] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    🔐 Data Privacy Consent
                </h2>

                <p className="text-gray-600 mb-4">
                    MindSense analyzes your behavioral, voice, and wearable data to provide mental health insights.
                    Your privacy is our priority.
                </p>

                <div className="bg-blue-50 p-4 rounded-xl mb-6">
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-start">
                            <span className="mr-2">🎤</span>
                            <span>Voice audio is analyzed instantly and <strong>never stored</strong>.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">🛡️</span>
                            <span>All data is encrypted and you can <strong>delete it anytime</strong>.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">⚕️</span>
                            <span>This is <strong>not a medical diagnosis</strong> tool.</span>
                        </li>
                    </ul>
                </div>

                {showDetails && (
                    <div className="mb-6 text-xs text-gray-500 space-y-2 border-t pt-4">
                        <p>
                            <strong>Data Collection:</strong> We collect sleep patterns, screen time, physical activity, interactions,
                            voice features (pitch, tone), and step counts.
                        </p>
                        <p>
                            <strong>Purpose:</strong> To estimate stress levels and provide wellness recommendations.
                        </p>
                        <p>
                            <strong>Rights:</strong> You have the right to access, rectify, and erase your data at any time via the Privacy Dashboard.
                        </p>
                    </div>
                )}

                <div className="flex flex-col space-y-3">
                    <button
                        onClick={onAccept}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                    >
                        I Understand & Agree
                    </button>

                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-gray-500 text-sm hover:text-gray-700 underline"
                    >
                        {showDetails ? 'Hide Details' : 'Learn More'}
                    </button>
                </div>
            </div>
        </div>
    );
}
