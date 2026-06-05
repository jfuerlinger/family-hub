import { apiClient } from './client';
export async function register(request) {
    const response = await apiClient.post('/auth/register', request);
    return response.data;
}
export async function login(request) {
    const response = await apiClient.post('/auth/login', request);
    return response.data;
}
export async function changePassword(request) {
    const response = await apiClient.post('/auth/change-password', request);
    return response.data;
}
