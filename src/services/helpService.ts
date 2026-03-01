import { API_BASE_URL } from '../utils/apiConfig';

const API_URL = `${API_BASE_URL}/api`;

interface FeatureRequestInput {
    description: string;
    type: 'bug' | 'help' | 'feature';
    priority: 'Low' | 'Medium' | 'High';
}

export const helpService = {
    submitRequest: async (input: FeatureRequestInput, token?: string) => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/feature-requests`, {
            method: 'POST',
            headers,
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit request');
        }

        return response.json();
    },

    getMyRequests: async (token: string) => {
        const response = await fetch(`${API_URL}/feature-requests/my`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch requests');
        }

        return response.json();
    },
};
