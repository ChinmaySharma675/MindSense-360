'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

export default function VoiceRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/wav' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setError('');
        } catch (err) {
            setError('Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    const uploadAudio = async () => {
        if (!audioBlob) return;

        setUploading(true);
        setError('');

        try {
            const file = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
            const response = await apiClient.uploadVoice(file);
            setResult(response);
            setAudioBlob(null);
        } catch (err: any) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Voice Analysis</h2>

            <div className="space-y-6">
                {/* Recording Controls */}
                <div className="flex items-center justify-center space-x-4">
                    {!isRecording ? (
                        <button
                            onClick={startRecording}
                            disabled={uploading}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-full font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                            </svg>
                            <span>Start Recording</span>
                        </button>
                    ) : (
                        <button
                            onClick={stopRecording}
                            className="bg-red-600 text-white px-8 py-4 rounded-full font-medium hover:bg-red-700 transition-colors flex items-center space-x-2 animate-pulse"
                        >
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                            <span>Stop Recording</span>
                        </button>
                    )}
                </div>

                {/* Audio Preview */}
                {audioBlob && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <p className="text-sm text-gray-600 mb-4">Recording ready to upload</p>
                        <audio
                            controls
                            src={URL.createObjectURL(audioBlob)}
                            className="w-full mb-4"
                        />
                        <button
                            onClick={uploadAudio}
                            disabled={uploading}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {uploading ? 'Uploading...' : 'Upload & Analyze'}
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
                        <h3 className="font-semibold text-purple-900 mb-3">Analysis Result</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-700">Voice Score:</span>
                                <span className="font-bold text-purple-600">{result.voice_score.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Stress Label:</span>
                                <span className={`font-bold ${result.stress_label === 'stressed' ? 'text-red-600' : 'text-green-600'}`}>
                                    {result.stress_label.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Speak naturally for 10-15 seconds</li>
                        <li>• Find a quiet environment</li>
                        <li>• Allow microphone access when prompted</li>
                        <li>• Your audio is analyzed and immediately deleted</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
