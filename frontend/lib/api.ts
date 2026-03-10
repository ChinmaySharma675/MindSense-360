const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface AuthTokens {
    access_token: string;
    token_type: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    created_at: string;
}

export interface BehavioralData {
    sleep_hours: number;
    screen_time_hours: number;
    physical_activity_minutes: number;
}

export interface WearableData {
    heart_rate: number;
    steps: number;
}

export interface RiskPrediction {
    risk: string;
    behavior_score: number | null;
    voice_score: number | null;
    wearable_score: number | null;
    explanation: string;
    confidence: number;
    recommendation: string | null;
}

class APIClient {
    private getAuthHeader(): HeadersInit {
        const token = localStorage.getItem('access_token');
        if (!token) {
            return {};
        }
        return {
            'Authorization': `Bearer ${token}`
        };
    }

    async register(username: string, email: string, password: string): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }

        return response.json();
    }

    async login(username: string, password: string): Promise<AuthTokens> {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const tokens = await response.json();
        localStorage.setItem('access_token', tokens.access_token);
        return tokens;
    }

    async submitBehavioralData(data: BehavioralData): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/behavioral/submit_behavior`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to submit behavioral data');
        }

        return response.json();
    }

    async submitWearableData(data: WearableData): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/wearable/submit_wearable`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to submit wearable data');
        }

        return response.json();
    }

    async uploadVoice(audioFile: File): Promise<any> {
        const formData = new FormData();
        formData.append('audio_file', audioFile);

        const response = await fetch(`${API_BASE_URL}/voice/upload_voice`, {
            method: 'POST',
            headers: {
                ...this.getAuthHeader(),
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload voice');
        }

        return response.json();
    }

    async getRiskPrediction(): Promise<RiskPrediction> {
        const response = await fetch(`${API_BASE_URL}/risk/predict_risk`, {
            headers: {
                ...this.getAuthHeader(),
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get risk prediction');
        }

        return response.json();
    }

    async getRiskHistory(days: number = 7): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/risk/risk_history?days=${days}`, {
            headers: {
                ...this.getAuthHeader(),
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get risk history');
        }

        return response.json();
    }

    async getAdminOverview(): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/analytics/overview`, {
            headers: {
                ...this.getAuthHeader(),
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get admin overview');
        }

        return response.json();
    }

    async getAdminTrends(days: number = 7): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/analytics/trends?days=${days}`, {
            headers: {
                ...this.getAuthHeader(),
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get admin trends');
        }

        return response.json();
    }

    logout() {
        localStorage.removeItem('access_token');
    }

    async exportData(): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/auth/export`, {
            headers: {
                ...this.getAuthHeader(),
            },
        });

        if (!response.ok) {
            throw new Error('Failed to export data');
        }

        return response.json();
    }

    async deleteAccount(): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'DELETE',
            headers: {
                ...this.getAuthHeader(),
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete account');
        }
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('access_token');
    }
}

export const apiClient = new APIClient();
